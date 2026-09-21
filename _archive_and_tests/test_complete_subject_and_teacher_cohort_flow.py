import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9233

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
        print(f"[OK] Saved screenshot: {filename}", flush=True)

async def evaluate_js(ws, expr, msg_id):
    return await cdp_send(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True}, msg_id)

async def perform_login(ws, username, password, base_id=100):
    print(f"[*] Logging in as {username}...", flush=True)
    await cdp_send(ws, "Runtime.evaluate", {"expression": "localStorage.clear();"}, base_id)
    await cdp_send(ws, "Page.navigate", {"url": "http://localhost:5173/"}, base_id + 1)
    await asyncio.sleep(2.5)
    
    login_js = f"""
    (() => {{
        function setVal(el, val) {{
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, val);
            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            el.dispatchEvent(new Event('change', {{ bubbles: true }}));
        }}
        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {{
            setVal(inputs[0], '{username}');
            setVal(inputs[1], '{password}');
            const btn = document.querySelector('button[type="submit"], .login-submit-btn');
            if (btn) btn.click();
            return 'SUBMITTED';
        }}
        return 'NO_INPUTS';
    }})()
    """
    res = await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, base_id + 2)
    print(f"[*] Login attempt for {username}:", res, flush=True)
    await asyncio.sleep(2.5)

async def run_suite():
    print("[*] Launching Google Chrome in headless debugging mode for Complete Flow...", flush=True)
    user_data = os.path.abspath(f"./scratch_chrome_cohort_flow_{int(time.time())}")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1440,960',
        'http://localhost:5173/'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3.5)

    try:
        targets_raw = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json').read()
        targets = json.loads(targets_raw)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            raise RuntimeError("Could not locate Chrome page target")

        ws_url = page_target["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(1)

            # ==========================================
            # 1. ADMIN PORTAL: Class Groups & Assign Subjects
            # ==========================================
            print("[1] Logging in as Admin...", flush=True)
            await perform_login(ws, 'admin', 'admin123', base_id=10)

            # Navigate to Class Groups Hub
            await evaluate_js(ws, """
            (() => {
                const btns = Array.from(document.querySelectorAll('.nav-btn'));
                const classBtn = btns.find(b => b.textContent.includes('Class Groups') || b.textContent.includes('Rosters'));
                if (classBtn) classBtn.click();
            })()
            """, 20)
            await asyncio.sleep(2)
            await capture_screen(ws, "flow_01_admin_class_groups_hub.png", 21)

            # Open Manage Subjects Modal on Class 10 - Section A
            await evaluate_js(ws, """
            (() => {
                const subBtns = document.querySelectorAll('.class-card-settings-btn');
                if (subBtns.length > 0) subBtns[0].click();
            })()
            """, 30)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "flow_02_admin_manage_subjects_modal.png", 31)

            # Close Modal
            await evaluate_js(ws, """
            (() => {
                const closeBtn = document.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
            })()
            """, 40)
            await asyncio.sleep(1)

            # ==========================================
            # 2. TEACHER PORTAL: Class Cohort Card & Notifications
            # ==========================================
            print("[2] Logging in as Teacher (robert.miller)...", flush=True)
            await perform_login(ws, 'robert.miller', 'admin123', base_id=50)

            await capture_screen(ws, "flow_03_teacher_portal_dashboard.png", 51)

            # Open Notification Bell Dropdown in Teacher Portal
            await evaluate_js(ws, """
            (() => {
                const bell = document.querySelector('.notification-bell-btn, .notif-bell-btn');
                if (bell) bell.click();
            })()
            """, 60)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "flow_04_teacher_notification_drawer_assigned_subject.png", 61)

            # Close dropdown and switch to "Assigned Students Directory" tab
            await evaluate_js(ws, """
            (() => {
                const bell = document.querySelector('.notification-bell-btn, .notif-bell-btn');
                if (bell) bell.click();
                const navBtns = Array.from(document.querySelectorAll('.teacher-nav-btn, .nav-btn'));
                const stuTab = navBtns.find(b => b.textContent.includes('Assigned Students') || b.textContent.includes('Student Directory'));
                if (stuTab) stuTab.click();
            })()
            """, 70)
            await asyncio.sleep(1.5)

            # Scroll into view of the Class Group Cohort Card
            await evaluate_js(ws, """
            (() => {
                const heroCard = document.querySelector('.teacher-cohort-hero-card');
                if (heroCard) heroCard.scrollIntoView({ behavior: 'instant', block: 'center' });
            })()
            """, 80)
            await asyncio.sleep(1)
            await capture_screen(ws, "flow_05_teacher_portal_cohort_card_homeroom.png", 81)

            # Switch to another cohort pill (e.g. All Students)
            await evaluate_js(ws, """
            (() => {
                const pills = document.querySelectorAll('.teacher-cohort-pill-btn');
                if (pills.length > 0) {
                    pills[0].click();
                }
            })()
            """, 90)
            await asyncio.sleep(1)
            await capture_screen(ws, "flow_06_teacher_portal_cohort_all_students.png", 91)

            # Switch to Light Theme in Teacher Portal
            await evaluate_js(ws, """
            (() => {
                document.documentElement.setAttribute('data-theme', 'light');
                const pills = document.querySelectorAll('.teacher-cohort-pill-btn');
                if (pills.length > 1) {
                    pills[1].click();
                }
            })()
            """, 100)
            await asyncio.sleep(1)
            await capture_screen(ws, "flow_07_teacher_portal_cohort_card_light_theme.png", 101)

            # ==========================================
            # 3. STUDENT PORTAL: Timetable & Subject Teachers
            # ==========================================
            print("[3] Logging in as Student (aarav.sharma)...", flush=True)
            await perform_login(ws, 'aarav.sharma', 'admin123', base_id=110)

            # Open Notification Bell Dropdown in Student Portal
            await evaluate_js(ws, """
            (() => {
                const bell = document.querySelector('.notification-bell-btn, .notif-bell-btn');
                if (bell) bell.click();
            })()
            """, 120)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "flow_08_student_portal_notifications.png", 121)

            # Navigate to Class Timetable tab
            await evaluate_js(ws, """
            (() => {
                const bell = document.querySelector('.notification-bell-btn, .notif-bell-btn');
                if (bell) bell.click();
                const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
                const ttTab = navBtns.find(b => b.textContent.includes('Class Timetable') || b.textContent.includes('Timetable'));
                if (ttTab) ttTab.click();
            })()
            """, 130)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "flow_09_student_portal_timetable_subjects.png", 131)

            # Navigate to Subject Faculty tab
            await evaluate_js(ws, """
            (() => {
                const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
                const facTab = navBtns.find(b => b.textContent.includes('Subject Faculty') || b.textContent.includes('Faculty'));
                if (facTab) facTab.click();
            })()
            """, 140)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "flow_10_student_portal_subject_faculty.png", 141)

            print("[SUCCESS] All flow screenshots successfully captured!", flush=True)

    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(run_suite())
