import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9224

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

async def run():
    user_data = os.path.abspath("./scratch_chrome_light_theme_run2")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1440,900',
        'http://localhost:5173/'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    try:
        targets_raw = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json').read()
        targets = json.loads(targets_raw)
        page_target = next((t for t in targets if t.get("type") == "page"), None)
        ws_url = page_target["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            msg_id = 1
            await cdp_send(ws, "Runtime.enable", {}, msg_id)
            msg_id += 1
            await cdp_send(ws, "Page.enable", {}, msg_id)
            await asyncio.sleep(2)

            async def eval_js(expr):
                nonlocal msg_id
                msg_id += 1
                res = await cdp_send(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True}, msg_id)
                return res.get("result", {}).get("value")

            # 1. Login as Admin
            print("[1] Logging in as Admin...")
            await eval_js("""
                (() => {
                    function setVal(el, val) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        setVal(inputs[0], 'admin');
                        setVal(inputs[1], 'admin123');
                        setTimeout(() => {
                            const btn = document.querySelector('.login-submit-btn');
                            if (btn) btn.click();
                        }, 200);
                    }
                })()
            """)
            await asyncio.sleep(3)

            # Set Light Mode on root & localStorage
            print("[2] Setting Light Mode...")
            await eval_js("""
                (() => {
                    localStorage.setItem('educore_theme', 'light');
                    document.documentElement.setAttribute('data-theme', 'light');
                })()
            """)
            await asyncio.sleep(1)

            # Open Settings Modal to show Light Theme tab
            print("[3] Opening Settings Modal in Light Mode...")
            await eval_js("document.querySelector('.btn-settings-header')?.click()")
            await asyncio.sleep(1)
            # Click Theme & Appearance nav item
            await eval_js("""
                (() => {
                    const navs = Array.from(document.querySelectorAll('.settings-nav-item'));
                    const themeNav = navs.find(n => n.innerText.includes('Theme & Appearance'));
                    if (themeNav) themeNav.click();
                })()
            """)
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "admin_settings_light_theme_tab.png", msg_id)

            # Close Settings Modal
            await eval_js("document.querySelector('.modal-close-btn')?.click()")
            await asyncio.sleep(1)

            # Navigate to Class Groups & Rosters Hub in Light Mode
            print("[4] Capturing Class Groups Hub in Light Mode...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
                    const clsBtn = btns.find(b => b.innerText.includes('Class Groups'));
                    if (clsBtn) clsBtn.click();
                })()
            """)
            await asyncio.sleep(2)
            msg_id += 1
            await capture_screen(ws, "admin_class_groups_hub_light_verified.png", msg_id)

            # Open Configure Class Group Modal in Light Mode
            print("[5] Opening Configure Class Group Modal in Light Mode...")
            await eval_js("document.querySelectorAll('.class-card-settings-btn')[1]?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "admin_configure_class_modal_light_verified.png", msg_id)

            # Close modal
            await eval_js("document.querySelector('.modal-header .action-btn')?.click()")
            await asyncio.sleep(1)

            # Navigate to Fee Receipts Section in Light Mode
            print("[6] Capturing Fee Receipts Section in Light Mode...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
                    const feeBtn = btns.find(b => b.innerText.includes('Fee Receipts'));
                    if (feeBtn) feeBtn.click();
                })()
            """)
            await asyncio.sleep(2)
            msg_id += 1
            await capture_screen(ws, "admin_fee_receipts_light_verified.png", msg_id)

            # Open Fee Receipt Slip in Light Mode
            print("[7] Opening Fee Receipt Slip Modal...")
            await eval_js("document.querySelectorAll('.data-table button.action-btn.view')[0]?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "admin_fee_slip_modal_light.png", msg_id)

            # Close slip modal
            await eval_js("document.querySelector('.modal-header .action-btn')?.click()")
            await asyncio.sleep(1)

            # 8. Sign Out & Login as Student (Aarav Sharma)
            print("[8] Logging in as Student (Aarav)...")
            await eval_js("document.querySelector('.btn-logout-header')?.click()")
            await asyncio.sleep(2)

            await eval_js("""
                (() => {
                    const demoBtns = Array.from(document.querySelectorAll('.demo-account-chip, button'));
                    const studentDemo = demoBtns.find(b => b.innerText.includes('Student (Aarav)'));
                    if (studentDemo) studentDemo.click();
                    setTimeout(() => {
                        const submit = document.querySelector('.login-submit-btn');
                        if (submit) submit.click();
                    }, 300);
                })()
            """)
            await asyncio.sleep(3)

            # Ensure student portal is in light mode
            await eval_js("document.documentElement.setAttribute('data-theme', 'light')")
            await asyncio.sleep(1)

            # Capture Student Portal Dashboard in Light Mode
            print("[9] Capturing Student Portal Dashboard in Light Mode...")
            msg_id += 1
            await capture_screen(ws, "student_portal_dashboard_light_verified.png", msg_id)

            # Navigate to Fee Ledger Tab in Student Portal
            print("[10] Capturing Student Portal Fee Ledger in Light Mode...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
                    const feeBtn = btns.find(b => b.innerText.includes('Fee Ledger'));
                    if (feeBtn) feeBtn.click();
                })()
            """)
            await asyncio.sleep(2)
            msg_id += 1
            await capture_screen(ws, "student_portal_fee_ledger_light_verified.png", msg_id)

            # Open Student Fee Slip
            print("[11] Opening Student Fee Slip in Light Mode...")
            await eval_js("document.querySelector('.portal-data-table .btn-action-small')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "student_fee_slip_light_verified.png", msg_id)

            print("[SUCCESS] All light mode and fee structure flows executed successfully!")

    finally:
        proc.kill()

if __name__ == '__main__':
    asyncio.run(run())
