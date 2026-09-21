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
        resp = json.loads(await ws.recv())
        if resp.get("id") == msg_id:
            return resp.get("result", {})

async def capture_screen(ws, filename, msg_id):
    res = await cdp_send(ws, "Page.captureScreenshot", {"format": "png"}, msg_id)
    b64 = res.get("data", "")
    if b64:
        with open(filename, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"[OK] Saved screenshot: {filename}")

async def run_suite():
    print("[*] Starting Clean Automated Test Suite for Notifications & Settings...")
    user_data = os.path.abspath("./scratch_chrome_full_test")
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

            # =================================================================
            # SECTION 1: TEACHER PORTAL NOTIFICATIONS & SETTINGS
            # =================================================================
            print("\n=================================================================")
            print("[TEST 1] TEACHER PORTAL (Prof. Robert Miller, ID: 1)")
            print("=================================================================")

            # Setup user session
            await eval_js("""
                localStorage.setItem('school_mgmt_user', JSON.stringify({
                    id: 4,
                    username: 'robert.miller',
                    role: 'teacher',
                    teacher_id: 1,
                    first_name: 'Robert',
                    last_name: 'Miller',
                    email: 'robert.miller@school.edu',
                    status: 'active',
                    portal_access: true
                }));
            """)
            msg_id += 1
            await cdp_send(ws, "Page.navigate", {"url": "http://localhost:5173/"}, msg_id)
            await asyncio.sleep(3)

            # Check Portal Header
            teacher_portal_title = await eval_js("document.querySelector('.portal-title')?.innerText")
            teacher_name = await eval_js("document.querySelector('.user-fullname')?.innerText")
            has_bell = await eval_js("!!document.querySelector('.notification-bell-btn')")
            unread_count_initial = int(await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'"))
            has_settings_btn = await eval_js("!!document.querySelector('.portal-settings-btn')")

            print(f"Portal Title: {teacher_portal_title}")
            print(f"Teacher Name: {teacher_name}")
            print(f"Notification Bell Icon Present: {has_bell}")
            print(f"Settings Button Present: {has_settings_btn}")
            print(f"Initial Unread Notifications Count: {unread_count_initial}")

            assert has_bell, "Teacher notification bell icon must be present"
            assert has_settings_btn, "Teacher settings button must be present"
            assert unread_count_initial > 0, "Teacher should have unread notifications from DB"

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_portal.png", msg_id)

            # Open notification bell dropdown
            print("\n-> Opening Notification Bell Dropdown...")
            await eval_js("document.querySelector('.notification-bell-btn')?.click()")
            await asyncio.sleep(1)

            notif_items_count = int(await eval_js("document.querySelectorAll('.notification-dropdown .notif-item').length"))
            top_title = await eval_js("document.querySelector('.notification-dropdown .notif-item .notif-item-title')?.innerText")
            top_time = await eval_js("document.querySelector('.notification-dropdown .notif-item .notif-time')?.innerText")

            print(f"Unread items displayed in dropdown: {notif_items_count}")
            print(f"Top-most (Newest) Notification: '{top_title}' ({top_time})")
            assert notif_items_count == unread_count_initial, "Dropdown should only list unread notifications"

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_dropdown_open.png", msg_id)

            # Mark top notification as read
            print(f"\n-> Marking top notification '{top_title}' as Read...")
            await eval_js("document.querySelector('.notification-dropdown .notif-single-read-btn')?.click()")
            await asyncio.sleep(1)

            updated_dropdown_count = int(await eval_js("document.querySelectorAll('.notification-dropdown .notif-item').length"))
            updated_badge_count = int(await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'"))
            new_top_title = await eval_js("document.querySelector('.notification-dropdown .notif-item .notif-item-title')?.innerText")

            print(f"Dropdown items after Mark-as-Read: {updated_dropdown_count} (Reduced by 1)")
            print(f"Updated Bell Badge Count: {updated_badge_count}")
            print(f"New Top Notification in queue: '{new_top_title}'")

            assert updated_dropdown_count == notif_items_count - 1, "Item must be immediately removed from active dropdown"
            assert updated_badge_count == unread_count_initial - 1, "Badge count must decrement"

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_dropdown_after_read.png", msg_id)

            # Open Settings Modal -> Notification History
            print("\n-> Opening Settings Modal from Header...")
            await eval_js("document.querySelector('.notification-bell-btn')?.click()") # close dropdown
            await asyncio.sleep(0.5)
            await eval_js("document.querySelector('.portal-settings-btn')?.click()")
            await asyncio.sleep(1)

            modal_open = await eval_js("!!document.querySelector('.settings-modal-container')")
            modal_title = await eval_js("document.querySelector('.settings-header-title h3')?.innerText")
            total_history_cards = int(await eval_js("document.querySelectorAll('.history-card').length"))
            read_history_cards = int(await eval_js("document.querySelectorAll('.history-card.is-read').length"))
            unread_history_cards = int(await eval_js("document.querySelectorAll('.history-card.is-unread').length"))

            print(f"Settings Modal Open: {modal_open} ('{modal_title}')")
            print(f"Total Notifications in History: {total_history_cards}")
            print(f"Read Notifications in History: {read_history_cards}")
            print(f"Unread Notifications in History: {unread_history_cards}")

            assert modal_open, "Settings modal must open"
            assert total_history_cards == notif_items_count, "All notifications (both read and unread) must be in history"
            assert read_history_cards >= 1, "The marked notification must appear in history as Read"

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_teacher_settings_history.png", msg_id)

            # Filter by Read in Settings
            print("\n-> Filtering Notification History by 'Read'...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.filter-pill-btn'));
                    const readBtn = btns.find(b => b.innerText.includes('Read'));
                    if (readBtn) readBtn.click();
                })()
            """)
            await asyncio.sleep(0.8)

            filtered_read_cards = int(await eval_js("document.querySelectorAll('.history-card').length"))
            print(f"Filtered Read Cards: {filtered_read_cards}")
            assert filtered_read_cards == read_history_cards, "Filter pills should correctly isolate read notifications"

            # Toggle Mark as Unread in Settings (Restores back to dropdown)
            print("\n-> Toggling 'Mark as Unread' on the card in Settings...")
            await eval_js("document.querySelector('.history-card .history-action-toggle')?.click()")
            await asyncio.sleep(1)

            # Close Settings Modal
            await eval_js("document.querySelector('.modal-close-btn')?.click()")
            await asyncio.sleep(1)

            restored_badge_count = int(await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'"))
            print(f"Restored Bell Badge Count: {restored_badge_count}")
            assert restored_badge_count == unread_count_initial, "Marking as unread must restore notification to active count"

            # =================================================================
            # SECTION 2: STUDENT PORTAL NOTIFICATIONS & SETTINGS
            # =================================================================
            print("\n=================================================================")
            print("[TEST 2] STUDENT PORTAL (Aarav Sharma, ID: 1)")
            print("=================================================================")

            # Switch session to Student
            await eval_js("""
                localStorage.setItem('school_mgmt_user', JSON.stringify({
                    id: 1,
                    username: 'aarav.sharma',
                    role: 'student',
                    student_id: 1,
                    first_name: 'Aarav',
                    last_name: 'Sharma',
                    email: 'aarav.sharma@school.edu',
                    status: 'active',
                    portal_access: true
                }));
            """)
            msg_id += 1
            await cdp_send(ws, "Page.navigate", {"url": "http://localhost:5173/"}, msg_id)
            await asyncio.sleep(3)

            student_portal_title = await eval_js("document.querySelector('.portal-title')?.innerText")
            student_name = await eval_js("document.querySelector('.user-fullname')?.innerText")
            student_unread_count = int(await eval_js("document.querySelector('.notification-bell-btn .notification-badge-count')?.innerText || '0'"))
            print(f"Student Portal: {student_portal_title} ({student_name})")
            print(f"Student Initial Unread Alerts: {student_unread_count}")
            assert student_unread_count > 0, "Student should have unread remarks/grades/leaves"

            # Open Student Bell
            await eval_js("document.querySelector('.notification-bell-btn')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_notifications_open.png", msg_id)

            # Open Student Settings -> Notification History
            await eval_js("document.querySelector('.notification-bell-btn')?.click()") # close
            await asyncio.sleep(0.5)
            await eval_js("document.querySelector('.portal-settings-btn')?.click()")
            await asyncio.sleep(1)

            student_modal_open = await eval_js("!!document.querySelector('.settings-modal-container')")
            student_history_count = int(await eval_js("document.querySelectorAll('.history-card').length"))
            print(f"Student Settings Modal Open: {student_modal_open} (Total History: {student_history_count})")
            assert student_modal_open, "Student settings modal must open"

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_student_settings_history.png", msg_id)

            # =================================================================
            # SECTION 3: ADMINISTRATOR PORTAL NOTIFICATIONS & SETTINGS
            # =================================================================
            print("\n=================================================================")
            print("[TEST 3] ADMINISTRATOR PORTAL (Master Administrator)")
            print("=================================================================")

            # Switch session to Admin
            await eval_js("document.querySelector('.modal-close-btn')?.click()")
            await asyncio.sleep(0.5)

            await eval_js("""
                localStorage.setItem('school_mgmt_user', JSON.stringify({
                    id: 2,
                    username: 'admin',
                    role: 'admin',
                    name: 'Master Administrator',
                    email: 'admin@school.edu',
                    status: 'active',
                    portal_access: true
                }));
            """)
            msg_id += 1
            await cdp_send(ws, "Page.navigate", {"url": "http://localhost:5173/"}, msg_id)
            await asyncio.sleep(3)

            admin_badge = int(await eval_js("document.querySelector('.admin-notification-bell .notification-badge-count')?.innerText || '0'"))
            print(f"Admin Unread Alerts Badge: {admin_badge}")

            # Open Admin Alerts Drawer
            await eval_js("document.querySelector('.admin-notification-bell')?.click()")
            await asyncio.sleep(1)
            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_admin_notifications_open.png", msg_id)

            # Open Admin Settings -> Notification History
            await eval_js("document.querySelector('.admin-notification-bell')?.click()") # close
            await asyncio.sleep(0.5)
            await eval_js("document.querySelector('.btn-settings-header')?.click()")
            await asyncio.sleep(1)

            admin_modal_open = await eval_js("!!document.querySelector('.settings-modal-container')")
            admin_history_count = int(await eval_js("document.querySelectorAll('.history-card').length"))
            print(f"Admin Settings Modal Open: {admin_modal_open} (Total History: {admin_history_count})")
            assert admin_modal_open, "Admin settings modal must open"

            msg_id += 1
            await capture_screen(ws, "b:\\school management-anti\\chrome_admin_settings_history.png", msg_id)

            print("\n=================================================================")
            print("[SUCCESS] ALL NOTIFICATION & SETTINGS TESTS COMPLETED WITH 100% SUCCESS!")
            print("=================================================================")

    finally:
        proc.kill()
        print("[*] Headless Chrome terminated cleanly.")

if __name__ == '__main__':
    asyncio.run(run_suite())
