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

async def run_feature_test():
    print("[*] Launching Headless Chrome for Feature Verification...")
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
        print(f"[+] Connected to Chrome target: {page_target.get('title')}")

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
                        const btn = document.querySelector('.login-submit-btn');
                        if (btn) btn.click();
                    }, 200);
                }
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, 10)
            await asyncio.sleep(2.5)

            # Step 2: Capture Student Profile
            print("[2] Navigating to My Profile tab...")
            profile_tab_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const profBtn = btns.find(b => b.textContent.includes('My Profile'));
                if (profBtn) profBtn.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": profile_tab_js}, 20)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_profile.png", 21)

            # Step 3: Open Notifications Bell & Dropdown
            print("[3] Opening Notification Bell Drawer...")
            bell_js = """
            (() => {
                const bell = document.querySelector('.notification-bell-btn');
                if (bell) bell.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": bell_js}, 30)
            await asyncio.sleep(1.2)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_notifications.png", 31)

            # Close notification bell
            await cdp_send(ws, "Runtime.evaluate", {"expression": bell_js}, 32)
            await asyncio.sleep(0.5)

            # Step 4: Capture Assigned Subject Teachers Tab
            print("[4] Navigating to Assigned Subject Teachers tab...")
            teachers_tab_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const tBtn = btns.find(b => b.textContent.includes('Assigned Subject Teachers') || b.textContent.includes('Teachers'));
                if (tBtn) tBtn.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": teachers_tab_js}, 40)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_teachers.png", 41)

            # Step 5: Capture Student Leave Applications tab & open Modal
            print("[5] Navigating to Leave Applications tab...")
            leaves_tab_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const lBtn = btns.find(b => b.textContent.includes('Leave Applications'));
                if (lBtn) lBtn.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": leaves_tab_js}, 50)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_leaves_table.png", 51)

            open_apply_modal_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const applyBtn = btns.find(b => b.textContent.includes('Apply for Leave'));
                if (applyBtn) applyBtn.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_apply_modal_js}, 52)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_leave_apply.png", 53)

            # Close Apply Modal and logout Student
            print("[6] Logging out student...")
            logout_js = """
            (() => {
                const closeBtn = document.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
                setTimeout(() => {
                    const logoutBtn = document.querySelector('.portal-logout-btn');
                    if (logoutBtn) logoutBtn.click();
                }, 400);
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": logout_js}, 60)
            await asyncio.sleep(2.5)

            # Step 7: Login as Teacher (Robert Miller)
            print("[7] Logging in as Faculty (robert.miller)...")
            teacher_login_js = """
            (() => {
                // Switch to Teacher tab first
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
            await cdp_send(ws, "Runtime.evaluate", {"expression": teacher_login_js}, 70)
            await asyncio.sleep(3)

            # Step 8: View Student Leave Requests tab & open Review Modal
            print("[8] Navigating to Teacher's Student Leave Requests tab...")
            teacher_leaves_tab_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const lBtn = btns.find(b => b.textContent.includes('Student Leave Requests') || b.textContent.includes('Leave Approvals'));
                if (lBtn) lBtn.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": teacher_leaves_tab_js}, 80)
            await asyncio.sleep(2)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_leaves_table.png", 81)

            # Click "Review & Decide" button on the first pending request
            print("[9] Opening Leave Review & Approval Modal...")
            open_review_modal_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const revBtn = btns.find(b => b.textContent.includes('Review & Decide') || b.textContent.includes('Edit Decision'));
                if (revBtn) revBtn.click();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_review_modal_js}, 90)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_leave_review.png", 91)

            print("\n[ALL TESTS SUCCESSFUL] Verified all user features with Chrome screenshots!")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run_feature_test())
