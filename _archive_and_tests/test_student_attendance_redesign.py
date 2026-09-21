import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9225

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

async def eval_js(ws, expr, msg_id):
    res = await cdp_send(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True}, msg_id)
    return res.get("result", {}).get("value")

async def run_test():
    print("[*] Launching Chrome for Attendance Calendar Verification...")
    user_data = os.path.abspath("./scratch_chrome_att_test3")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1440,1100',
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
        print(f"[+] Connected to Chrome: {page_target.get('title')}")

        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(2)

            # Step 1: Login as Student
            print("[1] Logging in as Student (aarav.sharma)...")
            login_js = """
            (() => {
                function setVal(el, val) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const inputs = document.querySelectorAll('input');
                if (inputs.length >= 2) {
                    setVal(inputs[0], 'aarav.sharma');
                    setVal(inputs[1], 'aarav.sharma@123');
                    setTimeout(() => {
                        const btn = document.querySelector('.login-submit-btn') || document.querySelector('button[type="submit"]');
                        if (btn) btn.click();
                    }, 200);
                }
            })()
            """
            await eval_js(ws, login_js, 10)
            await asyncio.sleep(3)

            # Step 2: Navigate to Attendance Tab
            print("[2] Navigating to Attendance tab...")
            tab_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn, button'));
                const attBtn = btns.find(b => b.textContent.includes('Attendance') || b.textContent.includes('Attendance & Dispute'));
                if (attBtn) {
                    attBtn.click();
                    return true;
                }
                return false;
            })()
            """
            await eval_js(ws, tab_js, 20)
            await asyncio.sleep(2.5)

            # Capture Screenshot 1: Clean Calendar & Summary
            await capture_screen(ws, "student_attendance_clean_overview.png", 30)

            # Step 3: Select Date 15 Sep 2026 (Dispute / Absent)
            print("[3] Clicking on Absent Date 15 Sep 2026...")
            click_day_js = """
            (() => {
                const cells = Array.from(document.querySelectorAll('.calendar-date-cell'));
                const cell15 = cells.find(c => {
                    const text = c.textContent.trim();
                    return text.startsWith('15') || text.includes('15');
                });
                if (cell15) {
                    cell15.click();
                    return true;
                }
                return false;
            })()
            """
            await eval_js(ws, click_day_js, 40)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "student_attendance_clean_selected_day.png", 50)

            # Step 4: Scroll down slightly to capture Detailed Table & Overview
            await eval_js(ws, "window.scrollTo(0, 420);", 55)
            await asyncio.sleep(1)
            await capture_screen(ws, "student_attendance_clean_table_view.png", 56)

            # Step 5: Open Regularization Modal
            print("[4] Clicking Request Regularization Button...")
            open_modal_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const regBtn = btns.find(b => b.textContent.includes('Request Regularization'));
                if (regBtn) {
                    regBtn.click();
                    return true;
                }
                return false;
            })()
            """
            await eval_js(ws, open_modal_js, 60)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "student_attendance_clean_modal.png", 70)

            print("[*] All visual tests completed successfully!")

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(run_test())
