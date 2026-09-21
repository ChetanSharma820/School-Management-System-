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
    user_data = os.path.abspath("./scratch_chrome_profile_notifs")
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

            # Login as Teacher
            print("[1] Logging in as Teacher...")
            await eval_js("""
                (() => {
                    function setVal(el, val) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    const tabs = document.querySelectorAll('.role-tab');
                    for (const t of tabs) {
                        if (t.innerText.includes('Teacher')) t.click();
                    }
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        setVal(inputs[0], 'robert.miller');
                        setVal(inputs[1], 'robert.miller@123');
                        setTimeout(() => {
                            const btn = document.querySelector('.login-submit-btn');
                            if (btn) btn.click();
                        }, 200);
                    }
                })()
            """)
            await asyncio.sleep(3)

            # Check if settings button exists
            has_btn = await eval_js("!!document.querySelector('.portal-settings-btn')")
            print("Settings button in DOM:", has_btn)

            # Click settings button and inspect DOM
            res = await eval_js("""
                (() => {
                    const btn = document.querySelector('.portal-settings-btn');
                    if (btn) {
                        btn.click();
                        return 'button clicked';
                    }
                    return 'button not found';
                })()
            """)
            print("Click result:", res)
            await asyncio.sleep(1)

            dom_check = await eval_js("""
                (() => {
                    const overlay = document.querySelector('.modal-overlay');
                    const modal = document.querySelector('.settings-modal-container');
                    const cards = document.querySelectorAll('.settings-history-list .history-card');
                    return {
                        overlayExists: !!overlay,
                        modalExists: !!modal,
                        cardsCount: cards.length,
                        firstCardTitle: cards.length > 0 ? cards[0].querySelector('.history-title')?.innerText : 'NONE'
                    };
                })()
            """)
            print("DOM Check:", json.dumps(dom_check, indent=2))

    finally:
        proc.kill()

if __name__ == '__main__':
    asyncio.run(run())
