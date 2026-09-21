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
        print(f"[OK] Saved screenshot: {filename}")

async def evaluate_js(ws, expr, msg_id):
    return await cdp_send(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True}, msg_id)

async def run_suite():
    print("[*] Launching Google Chrome in headless debugging mode...")
    user_data = os.path.abspath("./scratch_chrome_class_profile")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1440,920',
        'http://localhost:5173/'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    try:
        targets_raw = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json').read()
        targets = json.loads(targets_raw)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        if not page_target:
            raise RuntimeError("Could not locate Chrome page target")

        ws_url = page_target["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(1.5)

            # Ensure Dark mode
            await evaluate_js(ws, """
            (() => {
                document.documentElement.removeAttribute('data-theme');
                const btns = Array.from(document.querySelectorAll('.nav-btn'));
                const classBtn = btns.find(b => b.textContent.includes('Class Groups') || b.textContent.includes('Rosters'));
                if (classBtn) classBtn.click();
            })()
            """, 10)
            await asyncio.sleep(1.5)

            # Scroll to Roster section
            await evaluate_js(ws, """
            (() => {
                const roster = document.querySelector('.class-roster-section-container');
                if (roster) roster.scrollIntoView({ behavior: 'instant', block: 'start' });
            })()
            """, 20)
            await asyncio.sleep(1)
            await capture_screen(ws, "class_group_07_roster_dark.png", 30)

            # Check 2 students in the roster table to show floating batch action bar
            await evaluate_js(ws, """
            (() => {
                const checkboxes = document.querySelectorAll('.data-table tbody input[type="checkbox"]');
                if (checkboxes.length >= 2) {
                    checkboxes[0].click();
                    checkboxes[1].click();
                }
            })()
            """, 40)
            await asyncio.sleep(1)
            await capture_screen(ws, "class_group_08_batch_transfer_bar.png", 50)

            # Open "Create New Class Group" Modal
            await evaluate_js(ws, """
            (() => {
                const addBtn = document.querySelector('.create-class-btn');
                if (addBtn) addBtn.click();
            })()
            """, 60)
            await asyncio.sleep(1)
            await capture_screen(ws, "class_group_09_add_modal.png", 70)

            # Close add modal & open Quick Transfer Student modal
            await evaluate_js(ws, """
            (() => {
                const closeBtn = document.querySelector('.modal-header .action-btn');
                if (closeBtn) closeBtn.click();
                setTimeout(() => {
                    const moveBtn = document.querySelector('.action-btn.transfer');
                    if (moveBtn) moveBtn.click();
                }, 300);
            })()
            """, 80)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "class_group_10_quick_transfer_modal.png", 90)

            print("[SUCCESS] All detailed roster and modal screenshots captured!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_suite())
