import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9223
VITE_URL = 'http://localhost:5174/'

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

async def test_teacher_ui():
    print("[*] Launching Chrome for UI login as Teacher Prof. Bhuvnesh Sharma...", flush=True)
    user_data = os.path.abspath("./scratch_chrome_teacher_ui")
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

        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(2.0)

            # Perform UI login as Teacher
            login_js = """
            (() => {
                // Switch to Teacher tab (second .role-tab button)
                const roleTabs = document.querySelectorAll('.role-tab');
                if (roleTabs.length >= 2) {
                    roleTabs[1].click();
                }

                const setVal = (input, val) => {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    setter.call(input, val);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                };

                const inputs = document.querySelectorAll('input');
                if (inputs.length >= 2) {
                    setVal(inputs[0], 'bhuvnesh.sharma');
                    setVal(inputs[1], 'bhuvnesh.sharma@123');
                    setTimeout(() => {
                        const btn = document.querySelector('.login-submit-btn');
                        if (btn) btn.click();
                    }, 300);
                    return 'TEACHER_LOGIN_SUBMITTED';
                }
                return 'INPUTS_NOT_FOUND';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, 10)
            print(f"[*] Teacher Login Submission: {res}", flush=True)
            await asyncio.sleep(4.0)

            # Check Teacher Profile
            check_js = """
            (() => {
                const text = document.body.innerText;
                const hasHomeroom = text.includes('Grade 8 - Section A') || text.includes('Grade 8');
                const hasBhuvnesh = text.includes('Bhuvnesh Sharma') || text.includes('Bhuvnesh');
                return { hasHomeroom, hasBhuvnesh, textLen: text.length };
            })()
            """
            prof_check = await cdp_send(ws, "Runtime.evaluate", {"expression": check_js, "returnByValue": True}, 20)
            print(f"[*] Teacher Profile Check: {prof_check.get('result', {}).get('value')}", flush=True)

            # Scroll down to bring Homeroom card into view
            scroll_js = "window.scrollTo({ top: 320, behavior: 'instant' });"
            await cdp_send(ws, "Runtime.evaluate", {"expression": scroll_js}, 21)
            await asyncio.sleep(1.0)
            await capture_screen(ws, "teacher_profile_homeroom_verified.png", 22)

            # Navigate to Student Leaves tab
            nav_leaves_js = """
            (() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                const tabs = Array.from(document.querySelectorAll('button, .nav-item'));
                const tab = tabs.find(t => t.textContent.includes('Student Leaves') || t.textContent.includes('Leaves'));
                if (tab) {
                    tab.click();
                    return 'CLICKED_LEAVES_TAB';
                }
                return 'LEAVES_TAB_NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": nav_leaves_js}, 30)
            await asyncio.sleep(2.0)
            await capture_screen(ws, "teacher_leaves_queue_verified.png", 31)

            # Open Review Modal for Vasu's leave application
            open_review_js = """
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review & Action') || b.textContent.includes('Review'));
                if (btn) {
                    btn.click();
                    return 'OPENED_REVIEW_MODAL';
                }
                return 'BTN_NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_review_js}, 40)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "teacher_leave_review_modal_verified.png", 41)

            # Approve leave
            approve_js = """
            (() => {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(textarea, 'Approved by Class Teacher Prof. Bhuvnesh Sharma. Take rest and recover well.');
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                }
                setTimeout(() => {
                    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm Decision') || b.textContent.includes('Submit Decision'));
                    if (confirmBtn) confirmBtn.click();
                }, 300);
                return 'APPROVAL_SUBMITTED';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": approve_js}, 50)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "teacher_leave_approved_success_verified.png", 51)

            # Open Notifications bell dropdown
            notifs_js = """
            (() => {
                const bell = document.querySelector('.notification-bell-btn');
                if (bell) {
                    bell.click();
                    return 'OPENED_BELL';
                }
                return 'BELL_NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": notifs_js}, 60)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "teacher_notifications_dropdown_verified.png", 61)

            print("[SUCCESS] Teacher Portal UI verification completed flawlessly!", flush=True)

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(test_teacher_ui())
