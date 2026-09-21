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
    user_data = os.path.abspath("./scratch_chrome_profile_clean")
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
            msg_id += 1
            await cdp_send(ws, "Log.enable", {}, msg_id)
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
                    location.reload();
                })()
            """)
            await asyncio.sleep(3)

            teacher_header = await eval_js("document.querySelector('.portal-title')?.innerText")
            print("Portal Header:", teacher_header)

            unread_badge = await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'")
            print("Unread Badge Count:", unread_badge)

            # Click Settings Button
            print("[2] Clicking Settings Button...")
            click_res = await eval_js("""
                (() => {
                    const btn = document.querySelector('.portal-settings-btn');
                    if (btn) {
                        btn.click();
                        return 'Settings button found and clicked';
                    }
                    return 'Settings button NOT found';
                })()
            """)
            print("Click result:", click_res)
            await asyncio.sleep(1)

            # Inspect Modal
            modal_info = await eval_js("""
                (() => {
                    const overlay = document.querySelector('.modal-overlay');
                    const modal = document.querySelector('.settings-modal-container');
                    const title = document.querySelector('.settings-header-title h3')?.innerText;
                    const tabs = Array.from(document.querySelectorAll('.settings-nav-item span')).map(s => s.innerText);
                    const cards = document.querySelectorAll('.history-card');
                    const firstCardTitle = cards.length > 0 ? cards[0].querySelector('.history-title')?.innerText : 'NONE';
                    const firstCardStatus = cards.length > 0 ? cards[0].querySelector('.history-status-tag')?.innerText : 'NONE';
                    return {
                        overlay: !!overlay,
                        modal: !!modal,
                        title: title,
                        tabs: tabs,
                        cardsCount: cards.length,
                        firstCardTitle: firstCardTitle,
                        firstCardStatus: firstCardStatus
                    };
                })()
            """)
            print("Modal Info:", json.dumps(modal_info, indent=2))

    finally:
        proc.kill()

if __name__ == '__main__':
    asyncio.run(run())
