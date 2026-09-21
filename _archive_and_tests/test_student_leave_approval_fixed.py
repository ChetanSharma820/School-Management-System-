import subprocess, time, urllib.request, json, asyncio, base64, os, websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9240

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
    user_data = os.path.abspath('./scratch_chrome_test_leave_approval')
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

            # Navigate to Student Leaves & Disputes
            nav_js = """
                (() => {
                    const items = Array.from(document.querySelectorAll('.nav-btn, button'));
                    const target = items.find(el => el.textContent.includes('Student Leaves & Disputes'));
                    if (target) { target.click(); return 'clicked student governance'; }
                    return 'not found';
                })()
            """
            print('[+] Nav:', await eval_js(ws, nav_js, 11))
            await asyncio.sleep(2)

            # Click Approve on a pending leave
            approve_js = """
                (() => {
                    const rows = Array.from(document.querySelectorAll('tbody tr'));
                    for (const row of rows) {
                        const appBtn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.trim() === 'Approve');
                        if (appBtn) {
                            appBtn.click();
                            return 'clicked quick approve on pending student leave';
                        }
                    }
                    return 'no pending leave row with approve button';
                })()
            """
            print('[+] Approve Result:', await eval_js(ws, approve_js, 12))
            await asyncio.sleep(3)

            await capture_screen(ws, 'admin_student_leave_approved_success.png', 13)
            print('[+] Test completed and screenshot captured!')

    finally:
        proc.terminate()

asyncio.run(main())
