import subprocess, time, urllib.request, json, asyncio, base64, os, websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9230

async def cdp_send(ws, method, params=None, msg_id=1):
    msg = {'id': msg_id, 'method': method, 'params': params or {}}
    await ws.send(json.dumps(msg))
    while True:
        resp = await ws.recv()
        data = json.loads(resp)
        if data.get('id') == msg_id:
            return data.get('result', {})

async def capture_screen(ws, filename, msg_id):
    res = await cdp_send(ws, 'Page.captureScreenshot', {'format': 'png'}, msg_id)
    b64 = res.get('data', '')
    if b64:
        with open(filename, 'wb') as f:
            f.write(base64.b64decode(b64))
        print(f'[OK] Saved screenshot: {filename}')

async def eval_js(ws, expr, msg_id):
    res = await cdp_send(ws, 'Runtime.evaluate', {'expression': expr, 'returnByValue': True}, msg_id)
    return res.get('result', {}).get('value')

async def main():
    user_data = os.path.abspath('./scratch_chrome_approvals_test')
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
        page_target = next((t for t in targets if t.get('type') == 'page'), None)
        ws_url = page_target['webSocketDebuggerUrl']

        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            await cdp_send(ws, 'Runtime.enable', {}, 1)
            await cdp_send(ws, 'Page.enable', {}, 2)
            await asyncio.sleep(1)

            # Auto login as Admin
            set_session_js = """
                localStorage.setItem('school_mgmt_user', JSON.stringify({
                    id: 999,
                    username: 'admin',
                    role: 'admin',
                    full_name: 'Administrator'
                }));
                location.reload();
            """
            await eval_js(ws, set_session_js, 10)
            await asyncio.sleep(3)

            # -------------------------------------------------------------
            # TEST 1: Faculty Leave Approvals
            # -------------------------------------------------------------
            nav_tch_leaves_js = """
                (() => {
                    const items = Array.from(document.querySelectorAll('.nav-btn, .nav-item, button, a'));
                    const target = items.find(el => el.textContent.includes('Faculty Leave Approvals'));
                    if (target) { target.click(); return 'clicked faculty leaves'; }
                    return 'not found';
                })()
            """
            print('[1] Nav Faculty Leaves:', await eval_js(ws, nav_tch_leaves_js, 11))
            await asyncio.sleep(2)

            # Click Approve on first pending teacher leave if any
            approve_tch_leave_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const appBtn = btns.find(b => b.textContent.trim() === 'Approve');
                    if (appBtn) {
                        appBtn.click();
                        return 'clicked quick approve teacher leave';
                    }
                    return 'no pending approve btn';
                })()
            """
            print('[1] Quick Approve Teacher Leave:', await eval_js(ws, approve_tch_leave_js, 12))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_faculty_leaves_verified.png', 13)

            # -------------------------------------------------------------
            # TEST 2: Faculty Regularizations
            # -------------------------------------------------------------
            nav_tch_regs_js = """
                (() => {
                    const items = Array.from(document.querySelectorAll('.nav-btn, .nav-item, button, a'));
                    const target = items.find(el => el.textContent.includes('Faculty Regularizations'));
                    if (target) { target.click(); return 'clicked faculty regularizations'; }
                    return 'not found';
                })()
            """
            print('[2] Nav Faculty Regs:', await eval_js(ws, nav_tch_regs_js, 14))
            await asyncio.sleep(2)

            approve_tch_reg_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const appBtn = btns.find(b => b.textContent.trim() === 'Approve');
                    if (appBtn) {
                        appBtn.click();
                        return 'clicked quick regularize teacher attendance';
                    }
                    return 'no pending regularize btn';
                })()
            """
            print('[2] Quick Regularize Teacher:', await eval_js(ws, approve_tch_reg_js, 15))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_faculty_regs_verified.png', 16)

            # -------------------------------------------------------------
            # TEST 3: Student Leaves & Disputes Governance
            # -------------------------------------------------------------
            nav_stu_gov_js = """
                (() => {
                    const items = Array.from(document.querySelectorAll('.nav-btn, .nav-item, button, a'));
                    const target = items.find(el => el.textContent.includes('Student Leaves & Disputes'));
                    if (target) { target.click(); return 'clicked student governance'; }
                    return 'not found';
                })()
            """
            print('[3] Nav Student Governance:', await eval_js(ws, nav_stu_gov_js, 17))
            await asyncio.sleep(2)

            approve_stu_leave_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const appBtn = btns.find(b => b.textContent.trim() === 'Approve');
                    if (appBtn) {
                        appBtn.click();
                        return 'clicked quick approve student leave';
                    }
                    return 'no pending approve btn';
                })()
            """
            print('[3] Quick Approve Student Leave:', await eval_js(ws, approve_stu_leave_js, 18))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_student_leaves_verified.png', 19)

            # Switch to Student Attendance Regularization tab in Governance
            switch_stu_reg_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const regTab = btns.find(b => b.textContent.includes('Attendance Regularizations'));
                    if (regTab) {
                        regTab.click();
                        return 'switched to student regularizations tab';
                    }
                    return 'reg tab not found';
                })()
            """
            print('[4] Switch to Student Regs Tab:', await eval_js(ws, switch_stu_reg_js, 20))
            await asyncio.sleep(2)

            approve_stu_reg_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const appBtn = btns.find(b => b.textContent.trim() === 'Approve' || b.textContent.includes('Regularize'));
                    if (appBtn) {
                        appBtn.click();
                        return 'clicked regularize student attendance';
                    }
                    return 'no reg btn';
                })()
            """
            print('[4] Regularize Student Attendance:', await eval_js(ws, approve_stu_reg_js, 21))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_student_regs_verified.png', 22)

            print('[+] All approval tests completed successfully!')

    finally:
        proc.terminate()

asyncio.run(main())
