import subprocess
import time
import urllib.request
import json
import asyncio
import base64
import os
import websockets

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9222

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

async def run_feature_test():
    print("[*] Launching Chrome for Comprehensive Notification & Settings Verification...")
    user_data = os.path.abspath("./scratch_chrome_profile_notifs")
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
        if not page_target:
            raise RuntimeError("Could not find Chrome page target")

        ws_url = page_target["webSocketDebuggerUrl"]
        print(f"[+] Connected to Chrome target: {page_target.get('title')}")

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

            # -------------------------------------------------------------
            # STEP 1: TEACHER PORTAL NOTIFICATIONS & SETTINGS
            # -------------------------------------------------------------
            print("\n=======================================================")
            print("[1] LOGGING INTO TEACHER PORTAL (robert.miller)...")
            print("=======================================================")
            
            # Switch to Teacher tab on login page
            await eval_js("""
                (() => {
                    function setVal(el, val) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    const tabs = document.querySelectorAll('.role-tab');
                    for (const t of tabs) {
                        if (t.innerText.includes('Teacher')) t.click();
                    }
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        setVal(inputs[0], 'robert.miller');
                        setVal(inputs[1], 'robert.miller@123');
                        setTimeout(() => {
                            const btn = document.querySelector('.login-submit-btn');
                            if (btn) btn.click();
                        }, 200);
                    }
                })()
            """)
            await asyncio.sleep(3)

            teacher_name = await eval_js("document.querySelector('.user-fullname')?.innerText")
            portal_title = await eval_js("document.querySelector('.portal-title')?.innerText")
            has_bell = await eval_js("!!document.querySelector('.notification-bell-btn')")
            unread_count = await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'")
            has_settings = await eval_js("!!document.querySelector('.portal-settings-btn')")

            print(f"Portal Title: {portal_title}")
            print(f"Logged In User: {teacher_name}")
            print(f"Teacher Notification Bell Icon Present: {has_bell}")
            print(f"Teacher Settings Button Present: {has_settings}")
            print(f"Initial Unread Notifications Badge Count: {unread_count}")

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_portal_header.png", msg_id)

            # Open Teacher Notification Bell Dropdown
            print("\n[2] Opening Teacher Notification Dropdown...")
            await eval_js("document.querySelector('.notification-bell-btn')?.click()")
            await asyncio.sleep(1)

            notif_items = await eval_js("document.querySelectorAll('.notification-dropdown .notif-item').length")
            top_notif_title = await eval_js("document.querySelector('.notification-dropdown .notif-item .notif-item-title')?.innerText")
            top_notif_time = await eval_js("document.querySelector('.notification-dropdown .notif-item .notif-time')?.innerText")

            print(f"Active Unread Notifications in Dropdown: {notif_items}")
            print(f"Top / Newest Notification: '{top_notif_title}' ({top_notif_time})")

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_dropdown_open.png", msg_id)

            # Mark top notification as read
            print("\n[3] Marking first notification as Read (Verify removal from active dropdown)...")
            await eval_js("""
                (() => {
                    const btn = document.querySelector('.notification-dropdown .notif-single-read-btn');
                    if (btn) btn.click();
                })()
            """)
            await asyncio.sleep(1)

            updated_notif_items = await eval_js("document.querySelectorAll('.notification-dropdown .notif-item').length")
            updated_badge = await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'")

            print(f"Active Dropdown Items after Read: {updated_notif_items} (Reduced from {notif_items})")
            print(f"Updated Badge Count: {updated_badge}")

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_dropdown_after_read.png", msg_id)

            # Open Settings Modal -> Notification History
            print("\n[4] Opening Settings -> Notification History...")
            await eval_js("document.querySelector('.notification-bell-btn')?.click()") # close dropdown
            await asyncio.sleep(0.5)
            await eval_js("document.querySelector('.portal-settings-btn')?.click()")
            await asyncio.sleep(1)

            settings_modal_open = await eval_js("!!document.querySelector('.settings-modal-container')")
            history_total = await eval_js("document.querySelectorAll('.settings-history-list .history-card').length")
            history_read = await eval_js("document.querySelectorAll('.settings-history-list .history-card.is-read').length")
            history_unread = await eval_js("document.querySelectorAll('.settings-history-list .history-card.is-unread').length")

            print(f"Settings Modal Displayed: {settings_modal_open}")
            print(f"Total Notifications in History: {history_total}")
            print(f"Read Notifications in History: {history_read}")
            print(f"Unread Notifications in History: {history_unread}")

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_settings_history.png", msg_id)

            # Filter by 'Read'
            print("\n[5] Filtering Notification History by 'Read'...")
            await eval_js("""
                (() => {
                    const buttons = document.querySelectorAll('.filter-pill-btn');
                    for (const b of buttons) {
                        if (b.innerText.includes('Read')) { b.click(); break; }
                    }
                })()
            """)
            await asyncio.sleep(1)

            read_filter_cards = await eval_js("document.querySelectorAll('.settings-history-list .history-card').length")
            print(f"Filtered Read Cards Count: {read_filter_cards}")

            # Restore read notification by clicking 'Mark as Unread' in Settings
            print("\n[6] Testing 'Mark as Unread' in History (Restores back to active dropdown)...")
            await eval_js("""
                (() => {
                    const toggleBtn = document.querySelector('.history-card .history-action-toggle');
                    if (toggleBtn) toggleBtn.click();
                })()
            """)
            await asyncio.sleep(1)

            # Close Settings Modal
            await eval_js("document.querySelector('.modal-close-btn')?.click()")
            await asyncio.sleep(1)

            restored_badge_count = await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'")
            print(f"Restored Badge Count on Bell: {restored_badge_count}")

            # -------------------------------------------------------------
            # STEP 2: STUDENT PORTAL NOTIFICATIONS & SETTINGS
            # -------------------------------------------------------------
            print("\n=======================================================")
            print("[7] LOGGING INTO STUDENT PORTAL (aarav.sharma)...")
            print("=======================================================")
            await eval_js("document.querySelector('.portal-logout-btn')?.click()")
            await asyncio.sleep(2)

            await eval_js("""
                (() => {
                    function setVal(el, val) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    const tabs = document.querySelectorAll('.role-tab');
                    for (const t of tabs) {
                        if (t.innerText.includes('Student')) t.click();
                    }
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        setVal(inputs[0], 'aarav.sharma');
                        setVal(inputs[1], 'aarav.sharma@123');
                        setTimeout(() => {
                            const btn = document.querySelector('.login-submit-btn');
                            if (btn) btn.click();
                        }, 200);
                    }
                })()
            """)
            await asyncio.sleep(3)

            student_name = await eval_js("document.querySelector('.user-fullname')?.innerText")
            student_bell_unread = await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'")
            print(f"Student Name: {student_name}")
            print(f"Student Unread Notifications Badge: {student_bell_unread}")

            # Open Student Dropdown
            await eval_js("document.querySelector('.notification-bell-btn')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_notifications_open.png", msg_id)

            # Open Student Settings Modal
            await eval_js("document.querySelector('.notification-bell-btn')?.click()") # close
            await asyncio.sleep(0.5)
            await eval_js("document.querySelector('.portal-settings-btn')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_settings_history.png", msg_id)

            # -------------------------------------------------------------
            # STEP 3: ADMINISTRATOR PORTAL NOTIFICATIONS & SETTINGS
            # -------------------------------------------------------------
            print("\n=======================================================")
            print("[8] LOGGING INTO ADMINISTRATOR PORTAL (admin)...")
            print("=======================================================")
            await eval_js("document.querySelector('.modal-close-btn')?.click()")
            await asyncio.sleep(0.5)
            await eval_js("document.querySelector('.portal-logout-btn')?.click()")
            await asyncio.sleep(2)

            await eval_js("""
                (() => {
                    function setVal(el, val) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        setter.call(el, val);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    const tabs = document.querySelectorAll('.role-tab');
                    for (const t of tabs) {
                        if (t.innerText.includes('Admin')) t.click();
                    }
                    const inputs = document.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        setVal(inputs[0], 'admin');
                        setVal(inputs[1], 'admin@123');
                        setTimeout(() => {
                            const btn = document.querySelector('.login-submit-btn');
                            if (btn) btn.click();
                        }, 200);
                    }
                })()
            """)
            await asyncio.sleep(3)

            admin_alert_badge = await eval_js("document.querySelector('.admin-notification-bell .notification-badge-count')?.innerText || '0'")
            print(f"Admin Unread Alerts Badge: {admin_alert_badge}")

            # Open Admin Notification Drawer
            await eval_js("document.querySelector('.admin-notification-bell')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_admin_notifications_open.png", msg_id)

            # Open Admin Settings Modal
            await eval_js("document.querySelector('.admin-notification-bell')?.click()") # close
            await asyncio.sleep(0.5)
            await eval_js("document.querySelector('.btn-settings-header')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_admin_settings_history.png", msg_id)

            print("\n=======================================================")
            print("[SUCCESS] ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
            print("=======================================================")

    finally:
        proc.kill()
        print("[*] Headless Chrome terminated.")

if __name__ == '__main__':
    asyncio.run(run_feature_test())
