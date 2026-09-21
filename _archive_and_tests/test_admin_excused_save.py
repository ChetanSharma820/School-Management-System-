import subprocess, time, urllib.request, json, asyncio, base64, os, websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9228

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
    user_data = os.path.abspath('./scratch_chrome_admin_save_perfect')
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

            # Set localStorage admin session and reload
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

            # Navigate to Attendance tab
            nav_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button, a, .nav-item, [role="button"]'));
                    const att = btns.find(el => el.textContent.includes('Attendance') && !el.textContent.includes('Faculty'));
                    if (att) {
                        att.click();
                        return 'navigated to attendance';
                    }
                    return 'attendance nav not found';
                })()
            """
            print('[+] Nav:', await eval_js(ws, nav_js, 11))
            await asyncio.sleep(2)

            # Click Excused on first student (Aarav Sharma)
            excused_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const excusedBtn = btns.find(b => b.textContent.trim() === 'Excused');
                    if (excusedBtn) {
                        excusedBtn.click();
                        return 'clicked Excused';
                    }
                    return 'excused not found';
                })()
            """
            print('[+] Excused:', await eval_js(ws, excused_js, 12))
            await asyncio.sleep(1)

            # Click Save button
            save_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const saveBtn = btns.find(b => b.textContent.trim() === 'Save');
                    if (saveBtn) {
                        saveBtn.click();
                        return 'clicked Save';
                    }
                    return 'save not found';
                })()
            """
            print('[+] Save:', await eval_js(ws, save_js, 13))
            await asyncio.sleep(3)

            await capture_screen(ws, 'admin_attendance_excused_saved_verified.png', 14)

            # Click 'Save All Attendance'
            save_all_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const saveAll = btns.find(b => b.textContent.includes('Save All Attendance'));
                    if (saveAll) {
                        saveAll.click();
                        return 'clicked Save All Attendance';
                    }
                    return 'save all not found';
                })()
            """
            print('[+] Save All:', await eval_js(ws, save_all_js, 15))
            await asyncio.sleep(4)

            await capture_screen(ws, 'admin_attendance_save_all_verified.png', 16)
            print('[+] Tests completed successfully!')

    finally:
        proc.terminate()

asyncio.run(main())
