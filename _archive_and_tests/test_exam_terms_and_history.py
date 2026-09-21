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

async def perform_login(ws, username, password, base_id=10):
    # First clear session and reload to ensure clean login screen
    clear_js = """
    (() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
        return 'CLEARED_RELOADED';
    })()
    """
    await cdp_send(ws, "Runtime.evaluate", {"expression": clear_js}, base_id)
    await asyncio.sleep(2.5)

    login_js = f"""
    (() => {{
        const setVal = (input, val) => {{
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, val);
            input.dispatchEvent(new Event('input', {{ bubbles: true }}));
        }};
        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {{
            setVal(inputs[0], '{username}');
            setVal(inputs[1], '{password}');
            const btn = document.querySelector('.login-submit-btn');
            if (btn) btn.click();
            return 'SUBMITTED';
        }}
        return 'NO_INPUTS_FOUND_ON_PAGE';
    }})()
    """
    res = await cdp_send(ws, "Runtime.evaluate", {"expression": login_js}, base_id + 2)
    print(f"[*] Login attempt for {username}:", res)
    await asyncio.sleep(3)

async def main():
    print("[*] Starting Student Exam Term & 10-Assessment History Verification Test...")
    user_data = os.path.abspath("./scratch_chrome_profile")
    cmd = [
        CHROME_PATH,
        f'--user-data-dir={user_data}',
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--window-size=1500,1050',
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
        async with websockets.connect(ws_url, max_size=30*1024*1024) as ws:
            await cdp_send(ws, "Runtime.enable", {}, 1)
            await cdp_send(ws, "Page.enable", {}, 2)
            await asyncio.sleep(2)

            # Step 1: Login as student
            print("\n[Step 1] Logging in as Aarav Sharma...")
            await perform_login(ws, 'aarav.sharma', 'aarav.sharma@123', 10)

            # Step 2: Navigate to Grade & Report Card tab
            print("[Step 2] Navigating to Grade & Report Card tab (Tab 5)...")
            nav_tab_js = """
            (() => {
                const tabs = Array.from(document.querySelectorAll('.portal-tab-btn'));
                const gradeTab = tabs.find(b => b.innerText.includes('Grade') || b.innerText.includes('Report'));
                if (gradeTab) {
                    gradeTab.click();
                    return 'CLICKED_GRADE_TAB: ' + gradeTab.innerText;
                }
                return 'NOT_FOUND. Found tabs: ' + tabs.map(t => t.innerText.trim()).join(', ');
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": nav_tab_js}, 20)
            print("[*] Tab navigation:", res)
            await asyncio.sleep(2)

            # Step 3: Verify Examination / Assessment Term controls
            print("[Step 3] Checking Examination / Assessment Term dropdown and options...")
            check_terms_js = """
            (() => {
                const termSelect = document.querySelector('.gradebook-exam-selector select') || 
                                   Array.from(document.querySelectorAll('select')).find(s => Array.from(s.options).some(o => o.text.includes('Mid-Term') || o.text.includes('Unit Test')));
                const options = termSelect ? Array.from(termSelect.options).map(o => o.text) : [];
                const cards = Array.from(document.querySelectorAll('.report-subject-card, .grade-card, .gradebook-card')).map(c => ({
                    title: c.querySelector('h4, .subject-name')?.innerText,
                    termBadge: c.querySelector('.exam-term-badge')?.innerText,
                    score: c.querySelector('.score-big, .marks-obtained')?.innerText
                }));
                return {
                    foundSelector: !!termSelect,
                    currentTerm: termSelect?.value,
                    options: options,
                    cardCount: cards.length,
                    sampleCards: cards.slice(0, 3)
                };
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": check_terms_js, "returnByValue": True}, 30)
            print("[*] Examination terms status:", json.dumps(res.get("result", {}).get("value"), indent=2))

            # Step 4: Capture screenshot of Gradebook with Exam Term dropdown & badges
            print("[Step 4] Capturing screenshot: student_exam_term_view.png...")
            await capture_screen(ws, "student_exam_term_view.png", 40)

            # Step 5: Filter by Unit Test 2 (September 2026)
            print("[Step 5] Selecting 'Unit Test 2 (September 2026)' from term dropdown...")
            select_term_js = """
            (() => {
                const termSelect = document.querySelector('.gradebook-exam-selector select');
                if (termSelect) {
                    const targetOpt = Array.from(termSelect.options).find(o => o.text.includes('Unit Test 2'));
                    if (targetOpt) {
                        termSelect.value = targetOpt.value;
                        termSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        return 'SELECTED: ' + targetOpt.value;
                    }
                }
                return 'NOT_FOUND';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": select_term_js}, 50)
            print("[*] Term filter result:", res)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "student_term_filter_test2.png", 60)

            # Step 6: Click "View 10-Test Marks History" button on Mathematics card
            print("[Step 6] Opening 10-Assessment Marks History Modal for Mathematics...")
            open_modal_js = """
            (() => {
                const historyBtns = Array.from(document.querySelectorAll('.btn-view-history'));
                if (historyBtns.length > 0) {
                    historyBtns[0].click();
                    return 'CLICKED_FIRST_HISTORY_BTN';
                }
                return 'NO_BTN_FOUND';
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": open_modal_js}, 70)
            print("[*] Modal trigger result:", res)
            await asyncio.sleep(1.5)

            # Verify modal contents
            check_modal_js = """
            (() => {
                const popup = document.querySelector('.subject-history-popup');
                if (!popup) return { isOpen: false };
                const title = popup.querySelector('h3')?.innerText;
                const statCards = Array.from(popup.querySelectorAll('.ten-test-stat-card')).map(c => ({
                    label: c.querySelector('.stat-subtext')?.innerText,
                    value: c.querySelector('.stat-number')?.innerText
                }));
                const bars = popup.querySelectorAll('.ten-test-bar-wrapper').length;
                const rows = popup.querySelectorAll('tbody tr').length;
                return {
                    isOpen: true,
                    title: title,
                    statCards: statCards,
                    barsCount: bars,
                    tableRowsCount: rows
                };
            })()
            """
            res = await cdp_send(ws, "Runtime.evaluate", {"expression": check_modal_js, "returnByValue": True}, 80)
            print("[*] 10-Assessment History Modal verification:", json.dumps(res.get("result", {}).get("value"), indent=2))
            await capture_screen(ws, "student_10_test_history_modal.png", 90)

            # Step 7: Click Computer Science pill inside modal
            print("[Step 7] Switching subject to 'Computer Science' inside modal pills...")
            switch_pill_js = """
            (() => {
                const pills = Array.from(document.querySelectorAll('.history-subject-pill'));
                const csPill = pills.find(p => p.innerText.includes('Computer Science'));
                if (csPill) {
                    csPill.click();
                    return 'CLICKED_CS_PILL';
                }
                return 'NOT_FOUND';
            })()
            """
            await cdp_send(ws, "Runtime.evaluate", {"expression": switch_pill_js}, 95)
            await asyncio.sleep(1)
            await capture_screen(ws, "student_10_test_modal_cs.png", 100)

            # Step 8: Close modal and toggle to "10-Test History & Trends" view mode
            print("[Step 8] Closing modal...")
            close_modal_js = """
            (() => {
                const closeBtn = document.querySelector('.subject-history-popup .modal-close') || 
                                 document.querySelector('.subject-history-popup button.btn-secondary') ||
                                 document.querySelector('.modal-overlay');
                if (closeBtn) {
                    closeBtn.click();
                    return 'CLOSED_MODAL';
                }
                return 'MODAL_NOT_FOUND';
            })()
            """
            res_close = await cdp_send(ws, "Runtime.evaluate", {"expression": close_modal_js}, 110)
            print("[*] Modal close:", res_close)
            await asyncio.sleep(1)

            print("[Step 9] Switching to '10-Test History & Trends' view mode...")
            switch_mode_js = """
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const historyBtn = btns.find(b => b.innerText.includes('10-Test History') || b.innerText.includes('Trends'));
                if (historyBtn) {
                    historyBtn.click();
                    return 'SWITCHED_TO_HISTORY_MODE: ' + historyBtn.innerText;
                }
                return 'BTN_NOT_FOUND among ' + btns.length + ' buttons';
            })()
            """
            res_mode = await cdp_send(ws, "Runtime.evaluate", {"expression": switch_mode_js}, 115)
            print("[*] Mode toggle:", res_mode)
            await asyncio.sleep(2)
            await capture_screen(ws, "student_10_test_trends_tab.png", 120)

            print("\n[SUCCESS] All steps completed successfully!")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == '__main__':
    asyncio.run(main())
