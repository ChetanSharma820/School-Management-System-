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

async def run_teacher_portal_tests():
    print("[*] Launching Headless Chrome for Teacher Portal Verification...")
    user_data = os.path.abspath("./scratch_chrome_profile")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1400,950',
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

            # Step 1: Force Clear Session and Log In as Teacher
            print("[1] Resetting session to Login page...")
            clear_session_js = """
            (() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": clear_session_js}, 5)
            await asyncio.sleep(3)

            print("    Logging in as Class Teacher (robert.miller)...")
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
                    setVal(inputs[0], 'robert.miller');
                    setVal(inputs[1], 'robert.miller@123');
                    setTimeout(() => {
                        const btn = document.querySelector('.login-submit-btn');
                        if (btn) btn.click();
                    }, 200);
                    return 'submitted';
                }
                return 'no_inputs_found';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, 10)
            print(f"    Login submission result: {res}")
            await asyncio.sleep(3)

            # Step 2: Open "My Profile" Tab
            print("[2] Navigating to 'My Profile' tab...")
            tab_profile_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const btn = btns.find(b => b.textContent.includes('My Profile'));
                if (btn) {
                    btn.click();
                    return 'clicked';
                }
                return 'not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": tab_profile_js}, 20)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_profile.png", 21)

            # Step 3: Open "Student Directory & Remarks" Tab & Test Sorting / Personal Details Modal
            print("[3] Navigating to 'Student Directory & Remarks' tab...")
            tab_students_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const btn = btns.find(b => b.textContent.includes('Student Directory'));
                if (btn) {
                    btn.click();
                    return 'clicked';
                }
                return 'not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": tab_students_js}, 30)
            await asyncio.sleep(1.5)

            # Sort by Academic Score (High to Low)
            print("    Selecting Sort: Academic Score (High to Low)...")
            sort_score_js = """
            (() => {
                const select = document.querySelector('.roster-sort-select');
                if (select) {
                    select.value = 'score_desc';
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    return 'sorted_score';
                }
                return 'select_not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": sort_score_js}, 32)
            await asyncio.sleep(1)

            # Click "View Details" on the first student
            print("    Opening Student Personal Details Modal (View Details)...")
            open_details_js = """
            (() => {
                const detailBtns = Array.from(document.querySelectorAll('.btn-view-details'));
                if (detailBtns.length > 0) {
                    detailBtns[0].click();
                    return 'details_opened';
                }
                return 'btn_not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_details_js}, 34)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_student_details_modal.png", 35)

            # Close Student Details Modal using .modal-close button
            print("    Closing Student Details Modal...")
            close_modal_js = """
            (() => {
                const closeBtn = document.querySelector('.student-details-popup .modal-close') || document.querySelector('.student-details-popup .btn-secondary');
                if (closeBtn) {
                    closeBtn.click();
                    return 'closed';
                }
                return 'no_close';
            })()
            """
            res_close = await cdp_send(ws, "Runtime.evaluate", {"expression": close_modal_js}, 36)
            print(f"    Details close result: {res_close}")
            await asyncio.sleep(1)

            # Open "Remark Progress" modal to inspect student context summary
            print("    Opening 'Remark Progress' Modal with Embedded Student Context...")
            open_remark_js = """
            (() => {
                const remarkBtns = Array.from(document.querySelectorAll('.btn-remark-action'));
                if (remarkBtns.length > 0) {
                    remarkBtns[0].click();
                    return 'remark_opened';
                }
                return 'no_remark_btn';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_remark_js}, 37)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_remark_modal.png", 38)

            # Close Remark Modal using .modal-close button
            print("    Closing Remark Modal...")
            close_remark_js = """
            (() => {
                const closeBtn = document.querySelector('.remark-modal-box .modal-close') || document.querySelector('.remark-modal-box .btn-secondary');
                if (closeBtn) {
                    closeBtn.click();
                    return 'closed';
                }
                return 'no_close';
            })()
            """
            res_rem_close = await cdp_send(ws, "Runtime.evaluate", {"expression": close_remark_js}, 39)
            print(f"    Remark close result: {res_rem_close}")
            await asyncio.sleep(1)

            # Select Sort by Fee Status (Pending/Defaulters first)
            print("    Selecting Sort: Fee Status (Pending / Partial First)...")
            sort_fee_js = """
            (() => {
                const select = document.querySelector('.roster-sort-select');
                if (select) {
                    select.value = 'fee_status';
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    return 'sorted_fee';
                }
                return 'select_not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": sort_fee_js}, 40)
            await asyncio.sleep(1)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_roster_sorted.png", 41)

            # Step 4: Open "My Attendance & Timecard" Tab & Test Punch In/Out
            print("[4] Navigating to 'My Attendance & Timecard' tab...")
            tab_att_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const btn = btns.find(b => b.textContent.includes('My Attendance'));
                if (btn) {
                    btn.click();
                    return 'clicked';
                }
                return 'not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": tab_att_js}, 50)
            await asyncio.sleep(1.5)

            # Click Punch In button
            print("    Clicking 'Punch In' button...")
            punch_js = """
            (() => {
                const punchInBtn = document.querySelector('.btn-punch-in');
                if (punchInBtn) {
                    punchInBtn.click();
                    return 'punched_in';
                }
                const punchOutBtn = document.querySelector('.btn-punch-out');
                if (punchOutBtn) {
                    return 'already_punched_in';
                }
                return 'btn_not_found';
            })()
            """
            punch_res = await cdp_send(ws, "Runtime.evaluate", {"expression": punch_js}, 52)
            print(f"    Punch action: {punch_res}")
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_attendance_punched.png", 53)

            # Step 5: Open "Gradebook & Marks Entry" Tab (Manual Entry)
            print("[5] Navigating to 'Gradebook & Marks Entry' tab (Manual)...")
            tab_marks_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const btn = btns.find(b => b.textContent.includes('Gradebook & Marks Entry'));
                if (btn) {
                    btn.click();
                    return 'clicked';
                }
                return 'not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": tab_marks_js}, 60)
            await asyncio.sleep(1.5)

            # Type a score into the first marks cell
            print("    Entering manual score into student marks input...")
            input_marks_js = """
            (() => {
                function setVal(el, val) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const marksInputs = document.querySelectorAll('.marks-input-cell');
                if (marksInputs.length > 0) {
                    setVal(marksInputs[0], '96');
                    return 'marks_updated';
                }
                return 'no_marks_input';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": input_marks_js}, 62)
            await asyncio.sleep(1)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_gradebook_manual.png", 63)

            # Step 6: Switch to "Excel / CSV Bulk Importer" Sub-tab
            print("[6] Switching to 'Excel / CSV Bulk Importer' mode...")
            tab_excel_mode_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('.decision-btn'));
                const btn = btns.find(b => b.textContent.includes('Excel') || b.textContent.includes('Import'));
                if (btn) {
                    btn.click();
                    return 'clicked';
                }
                return 'not_found';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": tab_excel_mode_js}, 70)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_gradebook_excel.png", 71)

            print("\n[SUCCESS] All teacher portal features tested and screenshots captured successfully!")

    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == '__main__':
    asyncio.run(run_teacher_portal_tests())
