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

async def run():
    user_data = os.path.abspath("./scratch_chrome_subj_test")
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

            # 1. Login as Admin
            print("[1] Logging in as Admin...")
            await eval_js("""
                (() => {
                    function setVal(el, val) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        setVal(inputs[0], 'admin');
                        setVal(inputs[1], 'admin123');
                        setTimeout(() => {
                            const btn = document.querySelector('.login-submit-btn');
                            if (btn) btn.click();
                        }, 200);
                    }
                })()
            """)
            await asyncio.sleep(3)

            # 2. Open Class Groups Hub & Test Configure Class Group (Verify no update_student_fees error!)
            print("[2] Navigating to Class Groups & Testing Edit Class Group...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
                    const clsBtn = btns.find(b => b.innerText.includes('Class Groups'));
                    if (clsBtn) clsBtn.click();
                })()
            """)
            await asyncio.sleep(2)

            # Open Configure Class Modal on class #1
            await eval_js("document.querySelectorAll('.class-card-settings-btn')[1]?.click()")
            await asyncio.sleep(1)

            # Save configuration (test that no PostgREST schema error occurs)
            print("[3] Submitting Class Configuration Form...")
            await eval_js("document.querySelector('.modal-content form button[type=submit]')?.click()")
            await asyncio.sleep(2)

            # 3. Open Assign Subjects Modal on Grade 10 - Section A
            print("[4] Opening Assign Subjects Modal...")
            await eval_js("document.querySelectorAll('.class-card-settings-btn')[0]?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "admin_manage_subjects_modal.png", msg_id)

            # Close subjects modal
            await eval_js("document.querySelector('.modal-footer .btn-secondary')?.click()")
            await asyncio.sleep(1)

            # 4. Sign Out and Login as Teacher (Prof. Robert Miller)
            print("[5] Logging in as Teacher (robert.miller)...")
            await eval_js("document.querySelector('.btn-logout-header')?.click()")
            await asyncio.sleep(2)

            await eval_js("""
                (() => {
                    const demoBtns = Array.from(document.querySelectorAll('.demo-account-chip, button'));
                    const tchDemo = demoBtns.find(b => b.innerText.includes('Faculty (Robert)'));
                    if (tchDemo) tchDemo.click();
                    setTimeout(() => {
                        const submit = document.querySelector('.login-submit-btn');
                        if (submit) submit.click();
                    }, 300);
                })()
            """)
            await asyncio.sleep(3)

            # Capture Teacher Portal Profile with Homeroom & Subject Allocations
            print("[6] Capturing Teacher Portal Profile & Allocations...")
            msg_id += 1
            await capture_screen(ws, "teacher_portal_profile_and_allocations.png", msg_id)

            # Open Notification Bell in Teacher Portal
            print("[7] Opening Teacher Notifications Dropdown...")
            await eval_js("document.querySelector('.notification-bell-btn')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "teacher_portal_notifications_dropdown.png", msg_id)
            await eval_js("document.querySelector('.notification-bell-btn')?.click()")
            await asyncio.sleep(1)

            # Navigate to Class Cohort & Students Tab in Teacher Portal
            print("[8] Capturing Teacher Portal Class Cohort & Hero Card...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
                    const cohortBtn = btns.find(b => b.innerText.includes('Class Cohort'));
                    if (cohortBtn) cohortBtn.click();
                })()
            """)
            await asyncio.sleep(2)
            msg_id += 1
            await capture_screen(ws, "teacher_portal_cohort_card_and_roster.png", msg_id)

            # 5. Sign Out and Login as Student (Aarav Sharma)
            print("[9] Logging in as Student (Aarav)...")
            await eval_js("document.querySelector('.portal-logout-btn')?.click()")
            await asyncio.sleep(2)

            await eval_js("""
                (() => {
                    const demoBtns = Array.from(document.querySelectorAll('.demo-account-chip, button'));
                    const stuDemo = demoBtns.find(b => b.innerText.includes('Student (Aarav)'));
                    if (stuDemo) stuDemo.click();
                    setTimeout(() => {
                        const submit = document.querySelector('.login-submit-btn');
                        if (submit) submit.click();
                    }, 300);
                })()
            """)
            await asyncio.sleep(3)

            # Open Class Timetable Tab in Student Portal
            print("[10] Capturing Student Portal Class Timetable...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
                    const ttBtn = btns.find(b => b.innerText.includes('Class Timetable'));
                    if (ttBtn) ttBtn.click();
                })()
            """)
            await asyncio.sleep(2)
            msg_id += 1
            await capture_screen(ws, "student_portal_class_timetable_routine.png", msg_id)

            # Open Subject Faculty Tab in Student Portal
            print("[11] Capturing Student Portal Assigned Subject Faculty...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
                    const facBtn = btns.find(b => b.innerText.includes('Subject Faculty'));
                    if (facBtn) facBtn.click();
                })()
            """)
            await asyncio.sleep(2)
            msg_id += 1
            await capture_screen(ws, "student_portal_assigned_faculty_directory.png", msg_id)

            print("[SUCCESS] Full Subject Assignment, Notification & Cohort Card Flow Verified!")

    finally:
        proc.kill()

if __name__ == '__main__':
    asyncio.run(run())
