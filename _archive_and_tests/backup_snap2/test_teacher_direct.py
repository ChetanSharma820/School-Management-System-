import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9225
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

async def test_teacher():
    print("[*] Launching Chrome directly into Teacher Portal...", flush=True)
    user_data = os.path.abspath("./scratch_chrome_teacher_direct")
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
            await asyncio.sleep(1.0)

            # Set teacher session
            set_js = """
            localStorage.setItem('school_mgmt_user', JSON.stringify({
                id: 658,
                username: 'bhuvnesh.sharma',
                role: 'teacher',
                teacher_id: 4,
                email: '22egjcs054@gitjaipur.com',
                name: 'Prof. Bhuvnesh Sharma',
                first_name: 'Bhuvnesh',
                last_name: 'Sharma'
            }));
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": set_js}, 10)
            
            # Navigate cleanly to VITE_URL
            await cdp_send(ws, "Page.navigate", {"url": VITE_URL}, 11)
            await asyncio.sleep(4.0)

            # Check profile
            check_js = """
            (() => {
                const text = document.body.innerText;
                const hasHomeroom = text.includes('Grade 8 - Section A') || text.includes('Grade 8');
                const hasBhuvnesh = text.includes('Bhuvnesh');
                return { hasHomeroom, hasBhuvnesh, length: text.length, title: document.title, snippet: text.slice(0, 300) };
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": check_js, "returnByValue": True}, 20)
            print(f"Teacher Profile Check: {res.get('result', {}).get('value')}", flush=True)

            # Scroll to Homeroom class appointment card
            scroll_js = "window.scrollTo(0, 350);"
            await cdp_send(ws, "Runtime.evaluate", {"expression": scroll_js}, 21)
            await asyncio.sleep(1.0)
            await capture_screen(ws, "teacher_direct_profile.png", 22)

            # Navigate to student leaves tab
            nav_leaves_js = """
            (() => {
                window.scrollTo(0, 0);
                const tabs = Array.from(document.querySelectorAll('button, .nav-item'));
                const tab = tabs.find(t => t.textContent.includes('Student Leaves') || t.textContent.includes('Leaves'));
                if (tab) tab.click();
                return 'CLICKED_LEAVES';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": nav_leaves_js}, 30)
            await asyncio.sleep(2.0)
            await capture_screen(ws, "teacher_direct_leaves.png", 31)

            # Open Review Modal for Vasu's leave
            review_js = """
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review & Action') || b.textContent.includes('Review'));
                if (btn) btn.click();
                return 'OPENED_REVIEW';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": review_js}, 40)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "teacher_direct_review_modal.png", 41)

            # Approve leave
            approve_js = """
            (() => {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(textarea, 'Approved by Class Teacher Prof. Bhuvnesh Sharma. Please submit medical certificate.');
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
            await capture_screen(ws, "teacher_direct_approved.png", 51)

            # Open Notification dropdown
            notifs_js = """
            (() => {
                const bell = document.querySelector('.notification-bell-btn');
                if (bell) bell.click();
                return 'CLICKED_BELL';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": notifs_js}, 60)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "teacher_direct_notifs.png", 61)

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(test_teacher())
