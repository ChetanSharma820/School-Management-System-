import urllib.request
import json
import base64
import time
import os

def send_cdp_command(ws_url, method, params={}):
    import websocket
    ws = websocket.create_connection(ws_url, timeout=15)
    msg_id = 1
    req = json.dumps({"id": msg_id, "method": method, "params": params})
    ws.send(req)
    res_raw = ws.recv()
    ws.close()
    return json.loads(res_raw)

def run_browser_script(ws_url, script):
    import websocket
    ws = websocket.create_connection(ws_url, timeout=15)
    req = json.dumps({
        "id": 2,
        "method": "Runtime.evaluate",
        "params": {
            "expression": script,
            "returnByValue": True,
            "awaitPromise": True
        }
    })
    ws.send(req)
    res_raw = ws.recv()
    ws.close()
    return json.loads(res_raw)

def capture_screenshot(ws_url, filename):
    import websocket
    ws = websocket.create_connection(ws_url, timeout=20)
    req = json.dumps({
        "id": 3,
        "method": "Page.captureScreenshot",
        "params": {"format": "png"}
    })
    ws.send(req)
    res_raw = ws.recv()
    ws.close()
    data = json.loads(res_raw)
    if "result" in data and "data" in data["result"]:
        img_bytes = base64.b64decode(data["result"]["data"])
        with open(filename, "wb") as f:
            f.write(img_bytes)
        print(f"Captured {filename} ({len(img_bytes)} bytes)")
        return True
    return False

def main():
    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        tabs = json.loads(req.read().decode("utf-8"))
    except Exception as e:
        print(f"Could not connect to Chrome debugging port 9222: {e}")
        return

    page_tab = next((t for t in tabs if t.get("type") == "page"), None)
    if not page_tab:
        print("No open page tab found.")
        return

    ws_url = page_tab["webSocketDebuggerUrl"]
    print(f"Target WebSocket: {ws_url}")

    # Step 1: Login Screen
    print("--- 1. Testing Login Page Animation ---")
    run_browser_script(ws_url, "window.location.href = 'http://127.0.0.1:5173/'")
    time.sleep(2)
    capture_screenshot(ws_url, "animated_1_login.png")

    # Step 2: Student Portal
    print("--- 2. Testing Student Portal Animated UI ---")
    login_script = """
    (async () => {
        // click Student role tab
        const roleBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Student'));
        if (roleBtns.length > 0) roleBtns[0].click();
        await new Promise(r => setTimeout(r, 400));
        
        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {
            inputs[0].value = 'vasu.pandit';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[1].value = 'vasu.pandit@123';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
        await new Promise(r => setTimeout(r, 400));
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In') || b.textContent.includes('Sign in') || b.textContent.includes('Login'));
        if (submitBtn) submitBtn.click();
    })()
    """
    run_browser_script(ws_url, login_script)
    time.sleep(2.5)
    capture_screenshot(ws_url, "animated_2_student_portal.png")

    # Step 3: Student Timetable Tab
    print("--- 3. Testing Student Timetable Interactive Hover ---")
    tab_script = """
    (() => {
        const tabs = Array.from(document.querySelectorAll('.portal-tab-btn, button'));
        const ttTab = tabs.find(t => t.textContent.includes('Timetable') || t.textContent.includes('Schedule'));
        if (ttTab) ttTab.click();
    })()
    """
    run_browser_script(ws_url, tab_script)
    time.sleep(1.5)
    capture_screenshot(ws_url, "animated_3_student_timetable.png")

    # Step 4: Settings Modal Animation
    print("--- 4. Testing Settings Modal Animated Entrance ---")
    settings_script = """
    (() => {
        const settingsBtn = document.querySelector('.portal-settings-btn, .btn-settings-header');
        if (settingsBtn) settingsBtn.click();
    })()
    """
    run_browser_script(ws_url, settings_script)
    time.sleep(1.5)
    capture_screenshot(ws_url, "animated_4_settings_modal.png")

    # Step 5: Teacher Portal
    print("--- 5. Testing Teacher Portal Animated UI ---")
    teacher_flow = """
    (async () => {
        // close settings modal if open
        const closeBtn = document.querySelector('.settings-modal-header button, .modal-header button');
        if (closeBtn) closeBtn.click();
        await new Promise(r => setTimeout(r, 400));
        
        // logout
        const logoutBtn = document.querySelector('.portal-logout-btn');
        if (logoutBtn) logoutBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        
        // Teacher login
        const roleBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Teacher') || b.textContent.includes('Faculty'));
        if (roleBtns.length > 0) roleBtns[0].click();
        await new Promise(r => setTimeout(r, 400));
        
        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {
            inputs[0].value = 'bhuvnesh.sharma';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[1].value = 'bhuvnesh.sharma@123';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
        await new Promise(r => setTimeout(r, 400));
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In') || b.textContent.includes('Login'));
        if (submitBtn) submitBtn.click();
    })()
    """
    run_browser_script(ws_url, teacher_flow)
    time.sleep(3)
    capture_screenshot(ws_url, "animated_5_teacher_portal.png")

    print("All animated UI tests and captures finished successfully!")

if __name__ == "__main__":
    main()
