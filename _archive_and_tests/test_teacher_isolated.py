import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9234
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

async def main():
    print("[*] Launching clean Chrome instance for Teacher Portal on Port 5174...", flush=True)
    user_data = os.path.abspath("./scratch_chrome_teacher_5174")
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

            # Step 1: Switch to Teacher tab, set values, wait 400ms, then click submit
            login_js = """
            (() => {
                const tabs = document.querySelectorAll('.role-tab');
                if (tabs.length >= 2) tabs[1].click();

                const setVal = (el, v) => {
                    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    s.call(el, v);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                };

                const u = document.querySelector('#login-username');
                const p = document.querySelector('#login-password');
                if (u && p) {
                    setVal(u, 'bhuvnesh.sharma');
                    setVal(p, 'bhuvnesh.sharma@123');
                    setTimeout(() => {
                        const btn = document.querySelector('.login-submit-btn');
                        if (btn) btn.click();
                    }, 400);
                    return 'LOGIN_SCHEDULED';
                }
                return 'INPUTS_NOT_FOUND';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, 10)
            print("Login action:", res, flush=True)

            # Wait 5 seconds for TeacherPortal to authenticate, load DB data, and render
            await asyncio.sleep(5.0)

            # Check Teacher Profile text
            check_js = """
            (() => {
                return {
                    textLength: document.body.innerText.length,
                    hasBhuvnesh: document.body.innerText.includes('Bhuvnesh Sharma'),
                    hasGrade8: document.body.innerText.includes('Grade 8 - Section A') || document.body.innerText.includes('Grade 8'),
                    first300: document.body.innerText.slice(0, 300)
                };
            })()
            """
            chk = await cdp_send(ws, "Runtime.evaluate", {"expression": check_js, "returnByValue": True}, 20)
            print("Teacher portal check:", chk.get("result", {}).get("value"), flush=True)

            # Capture Teacher Profile
            await capture_screen(ws, "bhuvnesh_teacher_profile_view.png", 21)

            # Scroll to Homeroom class appointment card
            await cdp_send(ws, "Runtime.evaluate", {"expression": "window.scrollTo(0, 320);"}, 22)
            await asyncio.sleep(1.0)
            await capture_screen(ws, "bhuvnesh_teacher_profile_homeroom_card.png", 23)

            # Navigate to Student Leaves tab
            nav_leaves_js = """
            (() => {
                window.scrollTo(0, 0);
                const tabs = Array.from(document.querySelectorAll('.portal-tab-btn, .nav-item, button'));
                const tab = tabs.find(t => t.textContent.includes('Student Leaves') || t.textContent.includes('Leaves'));
                if (tab) tab.click();
                return 'CLICKED_LEAVES';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": nav_leaves_js}, 30)
            await asyncio.sleep(2.0)
            await capture_screen(ws, "bhuvnesh_teacher_leaves_queue.png", 31)

            # Open review modal
            open_rev_js = """
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review & Action') || b.textContent.includes('Review'));
                if (btn) btn.click();
                return 'OPENED_REV';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": open_rev_js}, 40)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "bhuvnesh_teacher_leave_review_modal.png", 41)

            # Approve leave
            approve_js = """
            (() => {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(textarea, 'Approved by Class Teacher Prof. Bhuvnesh Sharma. Recover well.');
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                }
                setTimeout(() => {
                    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm Decision') || b.textContent.includes('Submit Decision'));
                    if (confirmBtn) confirmBtn.click();
                }, 300);
                return 'APPROVED';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": approve_js}, 50)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "bhuvnesh_teacher_leave_approved.png", 51)

            # Notifications dropdown
            notifs_js = """
            (() => {
                const bell = document.querySelector('.notification-bell-btn');
                if (bell) bell.click();
                return 'CLICKED_BELL';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": notifs_js}, 60)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "bhuvnesh_teacher_notifications_dropdown.png", 61)

            print("[SUCCESS] Teacher Portal UI verification completed on Port 5174!", flush=True)

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(main())
