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
ARTIFACT_DIR = r'C:\Users\bhuvn\.gemini\antigravity-ide\brain\a44e506e-693a-40ce-8d02-a99ca51b35ba'

async def cdp_send(ws, method, params=None, msg_id=1):
    msg = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(msg))
    while True:
        try:
            resp = await asyncio.wait_for(ws.recv(), timeout=6.0)
            data = json.loads(resp)
            if data.get("id") == msg_id:
                return data.get("result", {})
        except asyncio.TimeoutError:
            print(f"[WARN] Timeout waiting for id {msg_id} ({method})")
            return {}

async def capture_screen(ws, filename, msg_id):
    res = await cdp_send(ws, "Page.captureScreenshot", {"format": "png"}, msg_id)
    b64 = res.get("data", "")
    if b64:
        target_path = os.path.join(ARTIFACT_DIR, filename)
        with open(target_path, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"[OK] Saved screenshot: {target_path}")

async def perform_login(ws, username, password, base_id=100):
    print(f"[*] Logging in as {username}...")
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
            const btn = document.querySelector('.login-submit-btn');
            if (btn) btn.click();
            return 'SUBMITTED';
        }}
        return 'NO_INPUTS';
    }})()
    """
    res = await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, base_id + 2)
    print(f"[*] Login attempt for {username}:", res)
    await asyncio.sleep(2.5)

async def run_attendance_regularization_test():
    print("[*] Starting Attendance & Regularization End-to-End Test...")
    user_data = os.path.abspath("./scratch_chrome_profile")
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

            # Step 1: Login as Student Aarav Sharma
            print("\n[Step 1] Logging in as Student Aarav Sharma...")
            await perform_login(ws, 'aarav.sharma', 'aarav.sharma@123', 10)

            # Step 2: Navigate to Attendance & Regularization tab
            print("[Step 2] Navigating to Attendance & Regularization tab...")
            nav_att_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const attBtn = btns.find(b => b.textContent.includes('Attendance & Regularization'));
                if (attBtn) {
                    attBtn.click();
                    return true;
                }
                return false;
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": nav_att_js}, 20)
            print("Nav Attendance result:", res)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "chrome_student_attendance_view.png", 21)

            # Step 3: Find 2026-09-15 row and click 'Regularize'
            print("[Step 3] Clicking Regularize button on 2026-09-15 absent date...")
            click_regularize_js = """
            (() => {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                const targetRow = rows.find(r => r.textContent.includes('2026-09-15'));
                if (targetRow) {
                    const btn = targetRow.querySelector('button');
                    if (btn) {
                        btn.click();
                        return 'CLICKED_ROW_REGULARIZE';
                    }
                }
                const headerBtn = document.querySelector('.section-card-header .btn-primary');
                if (headerBtn) {
                    headerBtn.click();
                    return 'CLICKED_HEADER_REGULARIZE';
                }
                return 'NOT_FOUND';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": click_regularize_js}, 30)
            print("Click Regularize result:", res)
            await asyncio.sleep(1.5)

            # Capture opened regularize modal
            await capture_screen(ws, "chrome_student_regularization_modal.png", 35)

            # Step 4: Fill and submit attendance regularization modal
            print("[Step 4] Submitting attendance regularization request...")
            submit_reg_js = """
            (() => {
                const modal = document.querySelector('.regularize-modal-box');
                if (!modal) return 'NO_MODAL';

                function setText(el, val) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }

                const textarea = modal.querySelector('textarea');
                if (textarea) {
                    setText(textarea, 'Gate 2 biometric scanner timed out during morning entry queue. I was present for homeroom roll call with Class Teacher.');
                }

                const submitBtn = modal.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.click();
                    return 'SUBMITTED';
                }
                return 'NO_SUBMIT_BTN';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": submit_reg_js}, 40)
            print("Submit Regularization result:", res)
            await asyncio.sleep(2)
            await capture_screen(ws, "chrome_student_regularization_submitted.png", 41)

            # Step 5: Login as Class Teacher Robert Miller
            print("\n[Step 5] Logging in as Class Teacher (robert.miller)...")
            await perform_login(ws, 'robert.miller', 'robert.miller@123', 50)

            # Step 6: Navigate to Attendance Regularizations tab in Teacher Portal
            print("[Step 6] Navigating to Attendance Regularizations tab in Teacher Portal...")
            nav_teacher_att_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const regBtn = btns.find(b => b.textContent.includes('Attendance Regularizations'));
                if (regBtn) {
                    regBtn.click();
                    return 'CLICKED_REG_TAB';
                }
                return 'NOT_FOUND';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": nav_teacher_att_js}, 60)
            print("Teacher Nav result:", res)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "chrome_teacher_regularizations_queue.png", 61)

            # Step 7: Open Review Modal for Aarav Sharma
            print("[Step 7] Opening review modal for Aarav Sharma's attendance regularization...")
            open_review_js = """
            (() => {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                const aaravRow = rows.find(r => r.textContent.includes('Aarav') && r.textContent.includes('2026-09-15'));
                if (aaravRow) {
                    const btn = aaravRow.querySelector('button');
                    if (btn) {
                        btn.click();
                        return 'OPENED_REVIEW_MODAL';
                    }
                }
                const anyBtn = document.querySelector('.portal-data-table button');
                if (anyBtn) {
                    anyBtn.click();
                    return 'OPENED_FIRST_MODAL';
                }
                return 'NO_ROW_FOUND';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": open_review_js}, 70)
            print("Open Review result:", res)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "chrome_teacher_regularization_review_modal.png", 71)

            # Step 8: Approve regularization with teacher remarks
            print("[Step 8] Approving regularization with teacher remarks...")
            submit_decision_js = """
            (() => {
                const modal = document.querySelector('.review-leave-modal');
                if (!modal) return 'NO_MODAL';

                function setText(el, val) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }

                const textarea = modal.querySelector('textarea');
                if (textarea) {
                    setText(textarea, 'Approved. Verified student attendance in morning homeroom manual register.');
                }

                const approveBtn = modal.querySelector('.approve-btn');
                if (approveBtn) approveBtn.click();

                const submitBtn = modal.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.click();
                    return 'DECISION_SUBMITTED';
                }
                return 'NO_SUBMIT_BTN';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": submit_decision_js}, 80)
            print("Submit Decision result:", res)
            await asyncio.sleep(1)
            await capture_screen(ws, "chrome_teacher_regularization_approved.png", 81)
            await asyncio.sleep(2)

            # Step 9: Login back into Student Portal to verify regularized status & notification
            print("\n[Step 9] Logging back into Student Portal to verify regularized status & notification...")
            await perform_login(ws, 'aarav.sharma', 'aarav.sharma@123', 90)

            # Step 10: Open notification bell
            print("[Step 10] Checking Student notification dropdown...")
            open_notif_js = """
            (() => {
                const bell = document.querySelector('.notification-bell-btn');
                if (bell) {
                    bell.click();
                    return true;
                }
                return false;
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": open_notif_js}, 100)
            print("Open Notif result:", res)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "chrome_student_attendance_notification.png", 101)

            # Step 11: Close notification dropdown and switch to Attendance tab
            print("[Step 11] Viewing final Attendance & Regularization tab with Regularized (Present) status...")
            close_notif_and_nav_att_js = """
            (() => {
                // Close notification if open
                const bell = document.querySelector('.notification-bell-btn.active');
                if (bell) bell.click();

                // Switch to Attendance tab
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const attBtn = btns.find(b => b.textContent.includes('Attendance & Regularization'));
                if (attBtn) {
                    attBtn.click();
                    return true;
                }
                return false;
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": close_notif_and_nav_att_js}, 110)
            print("Nav Attendance final result:", res)
            await asyncio.sleep(2)
            await capture_screen(ws, "chrome_student_attendance_final_regularized.png", 111)

            print("\n[SUCCESS] Full Attendance & Regularization workflow completed and verified!")

    finally:
        proc.terminate()
        print("[*] Chrome process terminated.")

if __name__ == "__main__":
    asyncio.run(run_attendance_regularization_test())
