import subprocess
import time
import urllib.request
import json
import asyncio
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9231
VITE_URL = 'http://localhost:5173/'

async def main():
    user_data = os.path.abspath("./scratch_chrome_error_check")
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
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
            await ws.send(json.dumps({"id": 3, "method": "Console.enable"}))

            # Set teacher in localStorage
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
            window.location.reload();
            """
            await ws.send(json.dumps({"id": 10, "method": "Runtime.evaluate", "params": {"expression": set_js}}))

            start_t = time.time()
            while time.time() - start_t < 6.0:
                try:
                    resp = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    d = json.loads(resp)
                    if d.get("method") == "Runtime.exceptionThrown":
                        print("EXCEPTION THROWN:", json.dumps(d.get("params", {}), indent=2), flush=True)
                    elif d.get("method") == "Console.messageAdded":
                        print("CONSOLE MSG:", d.get("params", {}).get("message", {}).get("text"), flush=True)
                except asyncio.TimeoutError:
                    pass

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(main())
