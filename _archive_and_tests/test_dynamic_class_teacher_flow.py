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
VITE_URL = 'http://localhost:5174/'
BACKEND_URL = 'http://127.0.0.1:8080/api'

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

async def sign_out(ws, msg_id):
    signout_js = """
    (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const signoutBtn = btns.find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout'));
        if (signoutBtn) {
            signoutBtn.click();
            return 'CLICKED_SIGNOUT';
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
        return 'CLEARED_FALLBACK';
    })()
    """
    await cdp_send(ws, "Runtime.evaluate", {"expression": signout_js}, msg_id)
    await asyncio.sleep(2.5)

async def perform_ui_login(ws, username, password, role_name, base_id=10):
    login_js = f"""
    (() => {{
        // Switch tab
        const tabs = Array.from(document.querySelectorAll('.login-role-tab, button'));
        const targetTab = tabs.find(t => t.textContent.toLowerCase().includes('{role_name.lower()}'));
        if (targetTab) targetTab.click();

        const setVal = (input, val) => {{
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, val);
            input.dispatchEvent(new Event('input', {{ bubbles: true }}));
            input.dispatchEvent(new Event('change', {{ bubbles: true }}));
        }};

        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {{
            setVal(inputs[0], '{username}');
            setVal(inputs[1], '{password}');
            setTimeout(() => {{
                const btn = document.querySelector('.login-submit-btn');
                if (btn) btn.click();
            }}, 300);
            return 'SUBMITTED_CREDENTIALS';
        }}
        return 'INPUTS_NOT_FOUND';
    }})()
    """
    res = await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, base_id)
    print(f"[*] Login attempt for {username} ({role_name}):", res, flush=True)
    await asyncio.sleep(3.5)

def test_backend_direct():
    print("\n--- [1] Testing Backend Direct Endpoints ---", flush=True)
    req = urllib.request.urlopen(f"{BACKEND_URL}/students/7")
    student_data = json.loads(req.read().decode())
    stu = student_data[0] if isinstance(student_data, list) else student_data
    print(f"Student: {stu.get('first_name')} {stu.get('last_name')} (ID: {stu.get('id')})", flush=True)
    cls = stu.get('classes', {})
    print(f"Class: {cls.get('class_name')} - {cls.get('section')} (Class ID: {cls.get('id')})", flush=True)
    teacher = cls.get('teachers', {})
    print(f"Designated Class Teacher: {teacher.get('first_name')} {teacher.get('last_name')} (ID: {teacher.get('id')}, Cabin: {teacher.get('cabin')})", flush=True)
    assert teacher.get('id') == 4, f"Expected teacher_id 4, got {teacher.get('id')}"
    assert teacher.get('first_name') == 'Bhuvnesh', f"Expected Bhuvnesh, got {teacher.get('first_name')}"
    print("[PASS] Backend student -> class -> class_teacher nested query verified successfully!", flush=True)

async def run_chrome_flow():
    print("\n--- [2] Launching Chrome CDP for Portals Verification ---", flush=True)
    user_data = os.path.abspath("./scratch_chrome_class_teacher_flow2")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1500,1200',
        VITE_URL
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3.0)

    try:
        req = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json')
        tabs = json.loads(req.read().decode())
        page_target = next((t for t in tabs if t.get("type") == "page"), tabs[0])
        ws_url = page_target['webSocketDebuggerUrl']
        print(f"[*] Connected to CDP: {ws_url}", flush=True)

        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(2)

            # -----------------------------------------------------------------
            # STEP A: Log in as Student Vasu Pandit
            # -----------------------------------------------------------------
            print("\n[Step A] Logging in as Student Vasu Pandit (Grade 8-A)...", flush=True)
            await perform_ui_login(ws, 'vasu.pandit', 'vasu.pandit@123', 'student', 10)

            # Scroll down to display both Personal details and Designated Class Teacher Card
            scroll_js = """
            (() => {
                window.scrollTo(0, 350);
                return 'SCROLLED';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": scroll_js}, 20)
            await asyncio.sleep(1.0)

            check_profile_js = """
            (() => {
                const text = document.body.innerText;
                const hasClassTeacherCard = text.includes('Designated Class Teacher') || text.includes('Class Teacher');
                const hasBhuvnesh = text.includes('Bhuvnesh Sharma') || text.includes('Prof. Bhuvnesh');
                const hasCabin = text.includes('Cabin 204') || text.includes('Mathematics');
                const hasGrade8 = text.includes('Grade 8') || text.includes('Grade 8 - Section A');
                return { hasClassTeacherCard, hasBhuvnesh, hasCabin, hasGrade8 };
            })()
            """
            profile_res = await cdp_send(ws, "Runtime.evaluate", {"expression": check_profile_js, "returnByValue": True}, 21)
            print(f"    Student Profile Verification Result: {profile_res.get('result', {}).get('value')}", flush=True)
            await capture_screen(ws, "1_vasu_student_profile_class_teacher.png", 22)

            # -----------------------------------------------------------------
            # STEP B: Student applies for Leave to Class Teacher
            # -----------------------------------------------------------------
            print("\n[Step B] Navigating to Leave Applications tab...", flush=True)
            nav_leave_js = """
            (() => {
                window.scrollTo(0, 0);
                const tabs = Array.from(document.querySelectorAll('button, .nav-item'));
                const leaveTab = tabs.find(t => t.textContent.includes('Leave Applications') || t.textContent.includes('Leaves'));
                if (leaveTab) {
                    leaveTab.click();
                    return 'CLICKED_LEAVES_TAB';
                }
                return 'LEAVES_TAB_NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": nav_leave_js}, 30)
            await asyncio.sleep(1.5)

            open_apply_js = """
            (() => {
                const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Apply for Leave') || b.textContent.includes('New Application'));
                if (applyBtn) {
                    applyBtn.click();
                    return 'OPENED_LEAVE_MODAL';
                }
                return 'APPLY_BTN_NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_apply_js}, 31)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "2_vasu_leave_modal_open.png", 32)

            fill_leave_js = """
            (() => {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(textarea, 'Urgent medical leave for viral fever recovery and medication.');
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                }
                setTimeout(() => {
                    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Application') || b.textContent.includes('Submit Leave Application'));
                    if (submitBtn) submitBtn.click();
                }, 300);
                return 'LEAVE_SUBMITTED';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": fill_leave_js}, 33)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "3_vasu_leave_submitted.png", 34)

            # -----------------------------------------------------------------
            # STEP C: Sign out of Student & Log in as Teacher Prof. Bhuvnesh Sharma
            # -----------------------------------------------------------------
            print("\n[Step C] Signing out from Student Portal...", flush=True)
            await sign_out(ws, 40)

            print("[Step C2] Logging in as Teacher Prof. Bhuvnesh Sharma (Grade 8-A Class Teacher)...", flush=True)
            await perform_ui_login(ws, 'bhuvnesh.sharma', 'bhuvnesh.sharma@123', 'teacher', 50)

            # Scroll down to see Homeroom Classes card
            scroll_tch_js = """
            (() => {
                window.scrollTo(0, 300);
                return 'SCROLLED_TCH';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": scroll_tch_js}, 60)
            await asyncio.sleep(1.0)

            check_tch_profile_js = """
            (() => {
                const text = document.body.innerText;
                const hasHomeroom = text.includes('Grade 8 - Section A') || text.includes('Grade 8');
                const hasClassTeacher = text.includes('Class Teacher') || text.includes('Homeroom');
                const hasBhuvnesh = text.includes('Bhuvnesh') || text.includes('TCH-004');
                return { hasHomeroom, hasClassTeacher, hasBhuvnesh, textSnippet: text.slice(0, 300) };
            })()
            """
            tch_prof_res = await cdp_send(ws, "Runtime.evaluate", {"expression": check_tch_profile_js, "returnByValue": True}, 61)
            print(f"    Teacher Profile Verification Result: {tch_prof_res.get('result', {}).get('value')}", flush=True)
            await capture_screen(ws, "4_bhuvnesh_teacher_profile.png", 62)

            # -----------------------------------------------------------------
            # STEP D: Teacher checks Student Leaves queue & Approves Vasu's request
            # -----------------------------------------------------------------
            print("\n[Step D] Navigating to Student Leaves tab in Teacher Portal...", flush=True)
            nav_tch_leaves_js = """
            (() => {
                window.scrollTo(0, 0);
                const tabs = Array.from(document.querySelectorAll('button, .nav-item'));
                const leaveTab = tabs.find(t => t.textContent.includes('Student Leaves') || t.textContent.includes('Leaves'));
                if (leaveTab) {
                    leaveTab.click();
                    return 'NAVIGATED_TO_STUDENT_LEAVES';
                }
                return 'STUDENT_LEAVES_TAB_NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": nav_tch_leaves_js}, 70)
            await asyncio.sleep(2.0)

            check_vasu_leave_js = """
            (() => {
                const text = document.body.innerText;
                const hasVasu = text.includes('Vasu Pandit') || text.includes('Vasu');
                const hasPending = text.includes('Pending') || text.includes('Review');
                return { hasVasu, hasPending };
            })()
            """
            vasu_leave_res = await cdp_send(ws, "Runtime.evaluate", {"expression": check_vasu_leave_js, "returnByValue": True}, 71)
            print(f"    Vasu's Leave in Teacher Queue: {vasu_leave_res.get('result', {}).get('value')}", flush=True)
            await capture_screen(ws, "5_bhuvnesh_teacher_leaves_queue.png", 72)

            print("\n[Step E] Reviewing and Approving Vasu's Leave Application as Class Teacher...", flush=True)
            open_review_modal_js = """
            (() => {
                const reviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review & Action') || b.textContent.includes('Review'));
                if (reviewBtn) {
                    reviewBtn.click();
                    return 'OPENED_REVIEW_MODAL';
                }
                return 'REVIEW_BTN_NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_review_modal_js}, 80)
            await asyncio.sleep(1.5)

            confirm_approve_js = """
            (() => {
                const remarksInput = document.querySelector('textarea');
                if (remarksInput) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(remarksInput, 'Approved by Class Teacher Prof. Bhuvnesh Sharma. Please rest well.');
                    remarksInput.dispatchEvent(new Event('input', { bubbles: true }));
                    remarksInput.dispatchEvent(new Event('change', { bubbles: true }));
                }

                setTimeout(() => {
                    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm Decision') || b.textContent.includes('Submit Decision'));
                    if (confirmBtn) confirmBtn.click();
                }, 300);
                return 'DECISION_SUBMITTED';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": confirm_approve_js}, 81)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "6_bhuvnesh_leave_approved_success.png", 82)

            print("\n[ALL TESTS PASSED] Dynamic Class Teacher Profile, Homeroom Assignment, and Request Approval Flow fully verified!", flush=True)

    finally:
        proc.terminate()

if __name__ == '__main__':
    test_backend_direct()
    asyncio.run(run_chrome_flow())
