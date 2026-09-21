import subprocess
import time
import urllib.request
import json
import asyncio
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9222

async def cdp_send(ws, method, params=None, msg_id=1):
    msg = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(msg))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == msg_id:
            return resp.get("result", {})

async def run():
    user_data = os.path.abspath("./scratch_chrome_profile_click_test")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1440,900',
        'http://localhost:5173/'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    try:
        targets_raw = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json').read()
        targets = json.loads(targets_raw)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        ws_url = page_target["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            msg_id = 1
            await cdp_send(ws, "Runtime.enable", {}, msg_id)
            msg_id += 1
            await cdp_send(ws, "Page.enable", {}, msg_id)
            await asyncio.sleep(2)

            async def eval_js(expr):
                nonlocal msg_id
                msg_id += 1
                res = await cdp_send(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True}, msg_id)
                return res.get("result", {}).get("value")

            # Set user as Teacher and reload
            print("[1] Setting user to Teacher Robert Miller...")
            await eval_js("""
                (() => {
                    localStorage.setItem('school_mgmt_user', JSON.stringify({
                        id: 4,
                        username: 'robert.miller',
                        role: 'teacher',
                        teacher_id: 1,
                        first_name: 'Robert',
                        last_name: 'Miller',
                        email: 'robert.miller@school.edu',
                        status: 'active',
                        portal_access: true
                    }));
                    location.href = 'http://localhost:5173/';
                })()
            """)
            await asyncio.sleep(4)

            page_state = await eval_js("""
                (() => {
                    return {
                        url: location.href,
                        hasTeacherPortal: !!document.querySelector('.portal-container'),
                        hasAdminPortal: !!document.querySelector('.app-container'),
                        hasLogin: !!document.querySelector('.login-page-container'),
                        portalTitle: document.querySelector('.portal-title')?.innerText || document.querySelector('h1')?.innerText,
                        buttons: Array.from(document.querySelectorAll('button')).map(b => b.className + ': ' + b.innerText.trim()).slice(0, 10)
                    };
                })()
            """)
            print("Page State:", json.dumps(page_state, indent=2))

            # Test clicking via mouse click coordinate using Input.dispatchMouseEvent
            rect = await eval_js("""
                (() => {
                    const btn = document.querySelector('.portal-settings-btn');
                    if (!btn) return null;
                    const r = btn.getBoundingClientRect();
                    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                })()
            """)
            print("Settings button coordinates:", rect)

            if rect:
                msg_id += 1
                await cdp_send(ws, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": rect["x"], "y": rect["y"], "button": "left", "clickCount": 1}, msg_id)
                msg_id += 1
                await cdp_send(ws, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": rect["x"], "y": rect["y"], "button": "left", "clickCount": 1}, msg_id)
                await asyncio.sleep(1.5)

            modal_check = await eval_js("""
                (() => {
                    const modal = document.querySelector('.settings-modal-container');
                    const title = document.querySelector('.settings-header-title h3')?.innerText;
                    const cards = document.querySelectorAll('.history-card');
                    return {
                        hasModal: !!modal,
                        title: title,
                        cardsCount: cards.length
                    };
                })()
            """)
            print("Modal Check after Input.dispatchMouseEvent:", json.dumps(modal_check, indent=2))

    finally:
        proc.kill()

if __name__ == '__main__':
    asyncio.run(run())
