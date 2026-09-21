import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9226
VITE_URL = 'http://localhost:5174/'

async def run_debug():
    user_data = os.path.abspath("./scratch_chrome_debug")
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
        ws_url = tabs[0]['webSocketDebuggerUrl']

        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            msg_id = 1
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
            await ws.send(json.dumps({"id": 3, "method": "Log.enable"}))
            await asyncio.sleep(2.0)

            # Set teacher session in localStorage
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
            await ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": set_js}}))
            await asyncio.sleep(0.5)

            # Navigate page
            await ws.send(json.dumps({"id": 11, "method": "Page.navigate", "params": {"url": VITE_URL}}))
            
            # Listen to incoming messages for 5 seconds
            start_t = time.time()
            while time.time() - start_t < 5.0:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    d = json.loads(msg)
                    if d.get("method") == "Runtime.exceptionThrown":
                        print("EXCEPTION:", d, flush=True)
                    elif d.get("method") == "Log.entryAdded":
                        print("LOG:", d, flush=True)
                except asyncio.TimeoutError:
                    pass

            # Inspect DOM
            inspect_js = """
            (() => {
                return {
                    title: document.title,
                    bodyLength: document.body.innerHTML.length,
                    bodyText: document.body.innerText.slice(0, 1000)
                };
            })()
            """
            await ws.send(json.dumps({"id": 20, "method": "Runtime.evaluate", "params": {"expression": inspect_js, "returnByValue": True}}))
            while True:
                msg = await ws.recv()
                d = json.loads(msg)
                if d.get("id") == 20:
                    print("INSPECT RESULT:", d.get("result", {}).get("result", {}).get("value"), flush=True)
                    break

            # Capture screenshot
            await ws.send(json.dumps({"id": 30, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
            while True:
                msg = await ws.recv()
                d = json.loads(msg)
                if d.get("id") == 30:
                    b64 = d.get("result", {}).get("data", "")
                    if b64:
                        with open("debug_teacher_portal.png", "wb") as f:
                            f.write(base64.b64decode(b64))
                        print("[OK] Saved debug_teacher_portal.png", flush=True)
                    break

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(run_debug())
