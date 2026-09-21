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

async def run_teacher_table_capture():
    print("[*] Capturing Teacher Leave Table...")
    user_data = os.path.abspath("./scratch_chrome_profile")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1400,900',
        'http://localhost:5173/'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    try:
        targets_raw = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json').read()
        targets = json.loads(targets_raw)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            raise RuntimeError("Could not find Chrome page target")

        ws_url = page_target["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(2)

            # Login as Teacher
            teacher_login_js = """
            (() => {
                const tabBtns = Array.from(document.querySelectorAll('.role-tab-btn, button'));
                const teacherTab = tabBtns.find(b => b.textContent.includes('Teacher'));
                if (teacherTab) teacherTab.click();

                function setVal(el, val) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }

                setTimeout(() => {
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        setVal(inputs[0], 'robert.miller');
                        setVal(inputs[1], 'robert.miller@123');
                        setTimeout(() => {
                            const btn = document.querySelector('.login-submit-btn');
                            if (btn) btn.click();
                        }, 250);
                    }
                }, 400);
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": teacher_login_js}, 10)
            await asyncio.sleep(3)

            # Click Leaves tab
            leaves_tab_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const lBtn = btns.find(b => b.textContent.includes('Student Leave Requests') || b.textContent.includes('Leave Approvals'));
                if (lBtn) lBtn.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": leaves_tab_js}, 20)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_leaves_table.png", 21)

            # Also click Student Leave tab in student portal table for Student Portal
            print("[OK] Finished Teacher Leave Table Capture!")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run_teacher_table_capture())
