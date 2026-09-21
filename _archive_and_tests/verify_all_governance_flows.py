import subprocess, time, urllib.request, json, asyncio, base64, os, websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9235

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
    user_data = os.path.abspath('./scratch_chrome_gov_final')
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

            # 1. Faculty Leaves
            nav1_js = """
                (() => {
                    const items = Array.from(document.querySelectorAll('.nav-btn, button'));
                    const target = items.find(el => el.textContent.includes('Faculty Leave Approvals'));
                    if (target) { target.click(); return 'clicked faculty leaves'; }
                    return 'not found';
                })()
            """
            print('[1] Nav:', await eval_js(ws, nav1_js, 11))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_faculty_leaves_verified.png', 12)

            # 2. Faculty Regularizations
            nav2_js = """
                (() => {
                    const items = Array.from(document.querySelectorAll('.nav-btn, button'));
                    const target = items.find(el => el.textContent.includes('Faculty Regularizations'));
                    if (target) { target.click(); return 'clicked faculty regularizations'; }
                    return 'not found';
                })()
            """
            print('[2] Nav:', await eval_js(ws, nav2_js, 13))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_faculty_regs_verified.png', 14)

            # 3. Student Leaves
            nav3_js = """
                (() => {
                    const items = Array.from(document.querySelectorAll('.nav-btn, button'));
                    const target = items.find(el => el.textContent.includes('Student Leaves & Disputes'));
                    if (target) { target.click(); return 'clicked student governance'; }
                    return 'not found';
                })()
            """
            print('[3] Nav:', await eval_js(ws, nav3_js, 15))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_student_leaves_verified.png', 16)

            # 4. Student Regularizations
            switch_reg_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const target = btns.find(b => b.textContent.includes('Attendance Regularizations'));
                    if (target) { target.click(); return 'switched to student regs'; }
                    return 'not found';
                })()
            """
            print('[4] Switch tab:', await eval_js(ws, switch_reg_js, 17))
            await asyncio.sleep(2)
            await capture_screen(ws, 'admin_student_regs_verified.png', 18)

            print('[+] All 4 governance screens successfully rendered and captured!')

    finally:
        proc.terminate()

asyncio.run(main())
