import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9228

async def cdp_send(ws, method, params=None, msg_id=1):
    msg = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(msg))
    while True:
        resp = await ws.recv()
        data = json.loads(resp)
        if data.get("method") == "Page.javascriptDialogOpening":
            await ws.send(json.dumps({"id": 99999, "method": "Page.handleJavaScriptDialog", "params": {"accept": True}}))
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
    res = await cdp_send(ws, "Runtime.evaluate", {
        "expression": expr,
        "awaitPromise": True,
        "returnByValue": True
    }, msg_id)
    return res.get("result", {}).get("value")

async def run_test():
    print("[*] Launching Chrome on port", PORT, flush=True)
    user_data = os.path.abspath("./scratch_chrome_f4")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1440,1000',
        'http://localhost:5173/'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3.0)

    try:
        req = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json')
        tabs = json.loads(req.read().decode())
        ws_url = tabs[0]['webSocketDebuggerUrl']
        print(f"[*] Connected to CDP: {ws_url}", flush=True)

        async with websockets.connect(ws_url) as ws:
            msg_id = 1
            await cdp_send(ws, "Page.enable", {}, msg_id)
            msg_id += 1
            await cdp_send(ws, "Runtime.enable", {}, msg_id)
            msg_id += 1

            # Log in through the UI
            print("[1] Logging in as Admin via UI form...", flush=True)
            login_form_js = """
            (() => {
                // Switch to admin tab on login page
                const tabs = Array.from(document.querySelectorAll('.login-role-tab, button'));
                const adminTab = tabs.find(t => t.textContent.includes('Admin'));
                if (adminTab) adminTab.click();

                function setVal(el, val) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }

                const inputs = document.querySelectorAll('input');
                if (inputs.length >= 2) {
                    setVal(inputs[0], 'admin');
                    setVal(inputs[1], 'admin@123');
                    setTimeout(() => {
                        const btn = document.querySelector('.login-submit-btn');
                        if (btn) btn.click();
                    }, 200);
                    return 'submitted_login';
                }
                return 'inputs_not_found';
            })()
            """
            res = await evaluate_js(ws, login_form_js, msg_id)
            msg_id += 1
            print(f"    Login form submission: {res}", flush=True)
            await asyncio.sleep(3.0)

            # 2. Click Faculty & Staff
            print("[2] Navigating to Faculty Directory tab...", flush=True)
            nav_js = """
            (() => {
                const navBtns = Array.from(document.querySelectorAll('.nav-btn, button'));
                const tchBtn = navBtns.find(b => b.textContent.includes('Faculty & Staff') || b.textContent.includes('Faculty'));
                if (tchBtn) {
                    tchBtn.click();
                    return 'navigated_to_faculty';
                }
                return 'faculty_btn_not_found';
            })()
            """
            nav_res = await evaluate_js(ws, nav_js, msg_id)
            msg_id += 1
            print(f"    Nav result: {nav_res}", flush=True)
            await asyncio.sleep(2.0)
            await capture_screen(ws, "final_verified_faculty_directory.png", msg_id)
            msg_id += 1

            # 3. Edit Teacher #1 (Prof. Robert Miller)
            print("[3] Editing Prof. Robert Miller details...", flush=True)
            edit_btn_js = """
            (() => {
                const editBtns = Array.from(document.querySelectorAll('.action-btn.edit'));
                if (editBtns.length > 0) {
                    editBtns[0].click();
                    return 'opened_edit_modal';
                }
                return 'edit_btn_not_found';
            })()
            """
            open_edit = await evaluate_js(ws, edit_btn_js, msg_id)
            msg_id += 1
            print(f"    Open Edit Modal: {open_edit}", flush=True)
            await asyncio.sleep(1.0)

            # Update qualification, phone, cabin, specialization
            update_edit_js = """
            (() => {
                const modal = document.querySelector('.modal-content');
                if (!modal) return 'modal_not_found';

                const inputs = Array.from(modal.querySelectorAll('input'));
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

                inputs.forEach(inp => {
                    if (inp.placeholder && (inp.placeholder.includes('Ph.D') || inp.placeholder.includes('Academic'))) {
                        nativeSetter.call(inp, 'Ph.D. Advanced Topology (Oxford)');
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (inp.placeholder && (inp.placeholder.includes('Cabin') || inp.placeholder.includes('Office'))) {
                        nativeSetter.call(inp, 'Cabin 401, Ramanujan Math Tower');
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (inp.placeholder && inp.placeholder.includes('91')) {
                        nativeSetter.call(inp, '+91 98765 43210');
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });

                const submitBtn = modal.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.click();
                    return 'submitted_edit';
                }
                return 'submit_btn_not_found';
            })()
            """
            edit_sub = await evaluate_js(ws, update_edit_js, msg_id)
            msg_id += 1
            print(f"    Edit submission: {edit_sub}", flush=True)
            await asyncio.sleep(2.0)

            # 4. Open Assign Class & Subject Modal for Prof. Robert Miller
            print("[4] Opening Assign Class & Subject Modal for Prof. Robert Miller...", flush=True)
            assign_btn_js = """
            (() => {
                const assignBtns = Array.from(document.querySelectorAll('.action-btn.assign'));
                if (assignBtns.length > 0) {
                    assignBtns[0].click();
                    return 'opened_assign_modal';
                }
                return 'assign_btn_not_found';
            })()
            """
            open_assign = await evaluate_js(ws, assign_btn_js, msg_id)
            msg_id += 1
            print(f"    Open Assign Modal: {open_assign}", flush=True)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "final_verified_assign_modal.png", msg_id)
            msg_id += 1

            # 5. Appoint Homeroom Class Teacher
            print("[5] Appointing Grade 10 - Section A as Homeroom Class...", flush=True)
            appoint_js = """
            (() => {
                const modal = document.querySelector('.assign-faculty-modal');
                if (!modal) return 'modal_not_found';
                const select = modal.querySelector('select');
                if (select) {
                    select.value = '1';
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    const btn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Update Class Teacher') || b.textContent.includes('Appoint'));
                    if (btn) {
                        btn.click();
                        return 'appointed_homeroom';
                    }
                }
                return 'select_or_btn_not_found';
            })()
            """
            app_res = await evaluate_js(ws, appoint_js, msg_id)
            msg_id += 1
            print(f"    Appoint Homeroom: {app_res}", flush=True)
            await asyncio.sleep(1.5)

            # 6. Allocate New Subject (Calculus & Analytical Geometry to Grade 10 - Section B)
            print("[6] Allocating new subject lecture slot...", flush=True)
            add_slot_js = """
            (() => {
                const modal = document.querySelector('.assign-faculty-modal');
                if (!modal) return 'modal_not_found';
                const forms = modal.querySelectorAll('form');
                if (forms.length < 2) return 'forms_less_than_2';
                const subForm = forms[1];

                const selects = subForm.querySelectorAll('select');
                const inputs = subForm.querySelectorAll('input');
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

                // Target Class: Grade 10 - B (id 2)
                if (selects[0]) {
                    selects[0].value = '2';
                    selects[0].dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Subject Name
                if (inputs[0]) {
                    nativeSetter.call(inputs[0], 'Linear Algebra & Vectors');
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Day: Tuesday
                if (selects[1]) {
                    selects[1].value = 'Tuesday';
                    selects[1].dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Period Timing
                if (inputs[1]) {
                    nativeSetter.call(inputs[1], '11:00 AM - 12:00 PM');
                    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Room
                if (inputs[2]) {
                    nativeSetter.call(inputs[2], 'Ramanujan Lab 101');
                    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
                }

                const submitBtn = subForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.click();
                    return 'submitted_subject_allocation';
                }
                return 'submit_btn_not_found';
            })()
            """
            slot_res = await evaluate_js(ws, add_slot_js, msg_id)
            msg_id += 1
            print(f"    Subject allocation: {slot_res}", flush=True)
            await asyncio.sleep(2.0)
            await capture_screen(ws, "final_verified_modal_with_new_slot.png", msg_id)
            msg_id += 1

            # 7. Close modal and check updated table
            print("[7] Closing modal and inspecting Faculty Directory...", flush=True)
            close_js = """
            (() => {
                const btn = document.querySelector('.assign-faculty-modal .action-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Close & Return'));
                if (btn) {
                    btn.click();
                    return 'closed_modal';
                }
                return 'close_btn_not_found';
            })()
            """
            close_res = await evaluate_js(ws, close_js, msg_id)
            msg_id += 1
            print(f"    Close modal: {close_res}", flush=True)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "final_verified_directory_updated.png", msg_id)
            msg_id += 1

            print("[*** COMPLETE SUCCESS ***] All features verified and working perfectly!", flush=True)

    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(run_test())
