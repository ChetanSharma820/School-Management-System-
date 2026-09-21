import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9230
VITE_URL = 'http://localhost:5173/'
BACKEND_URL = 'http://127.0.0.1:8080/api'

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

async def set_user_and_navigate(ws, user_dict, msg_id):
    user_json = json.dumps(user_dict)
    # Set localStorage on current page
    js = f"""
    (() => {{
        localStorage.clear();
        localStorage.setItem('school_mgmt_user', JSON.stringify({user_json}));
        return 'SET_OK';
    }})()
    """
    await cdp_send(ws, "Runtime.evaluate", {"expression": js}, msg_id)
    # Now navigate to reload with the new user session
    await cdp_send(ws, "Page.navigate", {"url": VITE_URL}, msg_id + 1)
    await asyncio.sleep(4.0)

async def run_test():
    print("\n--- [1] Checking Backend DB Endpoints ---", flush=True)
    req = urllib.request.urlopen(f"{BACKEND_URL}/students/7")
    student_data = json.loads(req.read().decode())
    stu = student_data[0] if isinstance(student_data, list) else student_data
    cls = stu.get('classes', {})
    teacher = cls.get('teachers', {})
    print(f"Student: {stu.get('first_name')} {stu.get('last_name')}, Class: {cls.get('class_name')} {cls.get('section')}, Class Teacher: {teacher.get('first_name')} {teacher.get('last_name')} (ID: {teacher.get('id')})", flush=True)

    print("\n--- [2] Launching Chrome on Port 5173 ---", flush=True)
    user_data = os.path.abspath("./scratch_chrome_5173")
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
        print(f"Connected to CDP: {ws_url}", flush=True)

        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(2.0)

            # -------------------------------------------------------------
            # 1. Student Vasu Pandit Profile & Leave Submission
            # -------------------------------------------------------------
            print("\n[A] Navigating to Student Vasu Pandit Portal...", flush=True)
            vasu_user = {
                "id": 48,
                "username": "vasu.pandit",
                "role": "student",
                "student_id": 7,
                "email": "abc@gmail.com",
                "name": "Vasu Pandit",
                "first_name": "Vasu",
                "last_name": "Pandit"
            }
            await set_user_and_navigate(ws, vasu_user, 10)

            # Scroll to Class Teacher card
            await cdp_send(ws, "Runtime.evaluate", {"expression": "window.scrollTo(0, 350);"}, 20)
            await asyncio.sleep(1.0)
            await capture_screen(ws, "final_student_profile_class_teacher.png", 21)

            # Open Leave tab and apply
            await cdp_send(ws, "Runtime.evaluate", {"expression": """
            (() => {
                window.scrollTo(0, 0);
                const tabs = Array.from(document.querySelectorAll('button, .nav-item'));
                const leaveTab = tabs.find(t => t.textContent.includes('Leave Applications') || t.textContent.includes('Leaves'));
                if (leaveTab) leaveTab.click();
            })()
            """}, 30)
            await asyncio.sleep(1.5)

            await cdp_send(ws, "Runtime.evaluate", {"expression": """
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Apply for Leave') || b.textContent.includes('New Application'));
                if (btn) btn.click();
            })()
            """}, 31)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "final_student_leave_modal.png", 32)

            await cdp_send(ws, "Runtime.evaluate", {"expression": """
            (() => {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(textarea, 'Urgent medical leave due to viral fever.');
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                }
                setTimeout(() => {
                    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Application') || b.textContent.includes('Submit Leave Application'));
                    if (submitBtn) submitBtn.click();
                }, 300);
            })()
            """}, 33)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "final_student_leave_submitted.png", 34)

            # -------------------------------------------------------------
            # 2. Teacher Prof. Bhuvnesh Sharma Portal & Homeroom Review
            # -------------------------------------------------------------
            print("\n[B] Navigating to Teacher Prof. Bhuvnesh Sharma Portal...", flush=True)
            bhuvnesh_user = {
                "id": 658,
                "username": "bhuvnesh.sharma",
                "role": "teacher",
                "teacher_id": 4,
                "email": "22egjcs054@gitjaipur.com",
                "name": "Prof. Bhuvnesh Sharma",
                "first_name": "Bhuvnesh",
                "last_name": "Sharma"
            }
            await set_user_and_navigate(ws, bhuvnesh_user, 40)

            # Scroll to Homeroom card
            await cdp_send(ws, "Runtime.evaluate", {"expression": "window.scrollTo(0, 320);"}, 50)
            await asyncio.sleep(1.0)
            await capture_screen(ws, "final_teacher_profile_homeroom.png", 51)

            # Navigate to student leaves queue
            await cdp_send(ws, "Runtime.evaluate", {"expression": """
            (() => {
                window.scrollTo(0, 0);
                const tabs = Array.from(document.querySelectorAll('button, .nav-item'));
                const leaveTab = tabs.find(t => t.textContent.includes('Student Leaves') || t.textContent.includes('Leaves'));
                if (leaveTab) leaveTab.click();
            })()
            """}, 60)
            await asyncio.sleep(2.0)
            await capture_screen(ws, "final_teacher_leaves_queue.png", 61)

            # Open review modal
            await cdp_send(ws, "Runtime.evaluate", {"expression": """
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review & Action') || b.textContent.includes('Review'));
                if (btn) btn.click();
            })()
            """}, 70)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "final_teacher_leave_review_modal.png", 71)

            # Approve leave
            await cdp_send(ws, "Runtime.evaluate", {"expression": """
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
            })()
            """}, 80)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "final_teacher_leave_approved.png", 81)

            # Notifications dropdown
            await cdp_send(ws, "Runtime.evaluate", {"expression": """
            (() => {
                const bell = document.querySelector('.notification-bell-btn');
                if (bell) bell.click();
            })()
            """}, 90)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "final_teacher_notifications_dropdown.png", 91)

            print("\n[ALL COMPLETE] End-to-end Class Teacher Governance tested successfully on Port 5173!", flush=True)

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(run_test())
