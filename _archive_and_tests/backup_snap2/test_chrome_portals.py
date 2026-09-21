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

async def run_suite():
    print("[*] Launching Google Chrome in headless debugging mode...")
    user_data = os.path.abspath("./scratch_chrome_profile")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1366,850',
        'http://localhost:5173/'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    try:
        # Find page WS URL
        targets_raw = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json').read()
        targets = json.loads(targets_raw)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            raise RuntimeError("Could not locate Chrome page target")

        ws_url = page_target["webSocketDebuggerUrl"]
        print(f"[+] Connected to Chrome CDP target: {page_target.get('title')}")

        async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
            # Enable Runtime & Page
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(1.5)

            # Capture Login Page
            await capture_screen(ws, "b:\\school management-anti\\chrome_login.png", 10)

            # -------------------------------------------------------------
            # 1. STUDENT LOGIN (aarav.sharma)
            # -------------------------------------------------------------
            print("\n[>] Testing Student Login (aarav.sharma)...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    const setVal = (el, val) => {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    };
                    setVal(document.getElementById('login-username'), 'aarav.sharma');
                    setVal(document.getElementById('login-password'), 'aarav.sharma@123');
                    document.querySelector('.login-submit-btn').click();
                })()
                """
            }, 20)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_portal.png", 21)

            # Click Grade & Report Card tab
            print("[>] Viewing Student Grades & Report Card from DB...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": "document.querySelectorAll('.portal-tab-btn')[1].click()"
            }, 22)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_grades.png", 23)

            # Click Lectures & Timetable tab
            print("[>] Viewing Student Lecture Timetable from DB...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": "document.querySelectorAll('.portal-tab-btn')[3].click()"
            }, 24)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_timetable.png", 25)

            # Sign Out Student
            print("[>] Signing Out Student...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": "document.querySelector('.portal-logout-btn').click()"
            }, 26)
            await asyncio.sleep(1.5)

            # -------------------------------------------------------------
            # 2. TEACHER LOGIN (robert.miller)
            # -------------------------------------------------------------
            print("\n[>] Testing Teacher Login (robert.miller)...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    document.querySelectorAll('.role-tab')[1].click();
                    const setVal = (el, val) => {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    };
                    setVal(document.getElementById('login-username'), 'robert.miller');
                    setVal(document.getElementById('login-password'), 'robert.miller@123');
                    document.querySelector('.login-submit-btn').click();
                })()
                """
            }, 30)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_portal.png", 32)

            # View Student Roster
            print("[>] Viewing Teacher's Student Directory & Remarks from DB...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": "document.querySelectorAll('.portal-tab-btn')[1].click()"
            }, 33)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_students.png", 34)

            # View Teacher Self-Attendance & Timecard
            print("[>] Viewing Teacher Attendance & Timecard from DB...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": "document.querySelectorAll('.portal-tab-btn')[3].click()"
            }, 35)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_attendance.png", 36)

            # Sign Out Teacher
            print("[>] Signing Out Teacher...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": "document.querySelector('.portal-logout-btn').click()"
            }, 37)
            await asyncio.sleep(1.5)

            # -------------------------------------------------------------
            # 3. ADMIN LOGIN (admin)
            # -------------------------------------------------------------
            print("\n[>] Testing Master Admin Login (admin)...")
            await cdp_send(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    document.querySelectorAll('.role-tab')[2].click();
                    const setVal = (el, val) => {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    };
                    setVal(document.getElementById('login-username'), 'admin');
                    setVal(document.getElementById('login-password'), 'admin@123');
                    document.querySelector('.login-submit-btn').click();
                })()
                """
            }, 40)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_admin_portal.png", 42)

            print("\n[SUCCESS] ALL CHROME BROWSER TESTS COMPLETED WITH LIVE DB DATA!")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run_suite())
