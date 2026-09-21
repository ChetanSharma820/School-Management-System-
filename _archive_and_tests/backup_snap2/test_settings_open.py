import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9222

async def cdp_send(ws, method, params=None, msg_id=1):
    msg = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(msg))
    while True:
        resp = await ws.recv()
        data = json.loads(resp)
        if data.get("id") == msg_id:
            return data.get("result", {})

async def capture_screen(ws, filename, msg_id):
    res = await cdp_send(ws, "Page.captureScreenshot", {"format": "png"}, msg_id)
    b64 = res.get("data", "")
    if b64:
        with open(filename, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"[OK] Saved screenshot: {filename}")

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
            print("[1] Logging in as Teacher (robert.miller)...")
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

            # Check Teacher Portal Header
            print("Teacher title:", await eval_js("document.querySelector('.portal-title')?.innerText"))
            print("Unread count:", await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText"))

            # Open notification bell
            await eval_js("document.querySelector('.notification-bell-btn')?.click()")
            await asyncio.sleep(1)

            # Click Notification History link in dropdown footer
            print("[2] Clicking 'Notification History & Settings' in dropdown footer...")
            await eval_js("document.querySelector('.notif-footer-link')?.click()")
            await asyncio.sleep(1.5)

            modal_open = await eval_js("!!document.querySelector('.settings-modal-container')")
            print("Settings Modal Open:", modal_open)

            history_total = await eval_js("document.querySelectorAll('.settings-history-list .history-card').length")
            print("Total notifications in history list:", history_total)

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_settings_history_captured.png", msg_id)

    finally:
        proc.kill()

if __name__ == '__main__':
    asyncio.run(run())
