import os
from PIL import Image, ImageDraw, ImageFont

# Ensure artifact output directory exists
OUT_DIR = r"C:\Users\bhuvn\.gemini\antigravity-ide\brain\a44e506e-693a-40ce-8d02-a99ca51b35ba"
os.makedirs(OUT_DIR, exist_ok=True)

WIDTH = 1600
HEIGHT = 1000

def get_font(size, bold=False):
    fonts = ["segoeuib.ttf" if bold else "segoeui.ttf", "arialbd.ttf" if bold else "arial.ttf"]
    for f in fonts:
        try:
            return ImageFont.truetype(f, size)
        except:
            pass
    return ImageFont.load_default()

# -------------------------------------------------------------
# IMAGE 1: Teacher Self-Service Leaves & Attendance Disputes
# -------------------------------------------------------------
img1 = Image.new('RGB', (WIDTH, HEIGHT), color='#0B1120')
d1 = ImageDraw.Draw(img1)

# Header
d1.rectangle([(0, 0), (WIDTH, 70)], fill='#0F172A', outline='#1E293B')
d1.text((30, 20), "Greenwood High • Faculty Academic Workspace", fill='#F8FAFC', font=get_font(20, True))
d1.text((WIDTH - 380, 24), "Prof. Robert Miller • TCH-001 • Senior Faculty", fill='#38BDF8', font=get_font(14))

# Tab strip
tabs = [("My Profile", False), ("Student Directory", False), ("Gradebook & Marks", False), 
        ("My Attendance & Timecard", True), ("My Leaves & Applications", False), ("My Salary & Pay-Slips", False)]
tx = 30
for tname, active in tabs:
    tw = len(tname) * 9 + 30
    if active:
        d1.rounded_rectangle([(tx, 90), (tx + tw, 126)], radius=6, fill='#0284C7')
        d1.text((tx + 15, 98), tname, fill='#FFFFFF', font=get_font(13, True))
    else:
        d1.rounded_rectangle([(tx, 90), (tx + tw, 126)], radius=6, fill='#1E293B', outline='#334155')
        d1.text((tx + 15, 98), tname, fill='#94A3B8', font=get_font(13))
    tx += tw + 12

# Terminal Card
d1.rounded_rectangle([(30, 145), (WIDTH - 30, 310)], radius=12, fill='#1E293B', outline='#334155')
d1.text((50, 165), "Faculty Self-Attendance Terminal & Timecard Ledger", fill='#F8FAFC', font=get_font(18, True))
d1.text((50, 192), "Daily biometric punch logging and monthly working hours tracking (September 2026)", fill='#94A3B8', font=get_font(13))

# Clock widget
d1.rounded_rectangle([(50, 225), (320, 290)], radius=8, fill='#0F172A', outline='#334155')
d1.text((70, 235), "08:15:32 AM", fill='#34D399', font=get_font(22, True))
d1.text((70, 265), "Shift Active • Punched in at 08:12 AM", fill='#94A3B8', font=get_font(12))

# Punch Out & Dispute Button
d1.rounded_rectangle([(340, 235), (510, 280)], radius=8, fill='#EF4444')
d1.text((365, 248), "Punch Out (End Shift)", fill='#FFFFFF', font=get_font(13, True))

d1.rounded_rectangle([(WIDTH - 280, 165), (WIDTH - 50, 205)], radius=8, fill='#0284C7')
d1.text((WIDTH - 260, 177), "+ Request Regularization", fill='#FFFFFF', font=get_font(13, True))

# Section Title: My Submitted Attendance Regularization Requests
d1.text((30, 340), "My Attendance Regularization Requests (Submitted to School Administration)", fill='#F8FAFC', font=get_font(17, True))
d1.text((30, 368), "Track status and administrative approvals on your submitted attendance dispute requests", fill='#94A3B8', font=get_font(13))

# Table
d1.rounded_rectangle([(30, 400), (WIDTH - 30, 560)], radius=10, fill='#1E293B', outline='#334155')
d1.rectangle([(30, 400), (WIDTH - 30, 440)], fill='#0F172A')

headers = ["Dispute Date", "Original Status", "Requested Status", "Discrepancy Category", "Teacher Justification", "Admin Decision", "Admin Remarks"]
xs = [50, 180, 310, 470, 720, 1150, 1340]
for h, x in zip(headers, xs):
    d1.text((x, 412), h, fill='#94A3B8', font=get_font(12, True))

# Row 1
d1.text((50, 455), "2026-09-15", fill='#F8FAFC', font=get_font(13, True))
d1.rounded_rectangle([(180, 452), (275, 476)], radius=4, fill='#7C2D12')
d1.text((192, 456), "Late Arrival", fill='#FDBA74', font=get_font(11, True))
d1.rounded_rectangle([(310, 452), (385, 476)], radius=4, fill='#064E3B')
d1.text((325, 456), "Present", fill='#6EE7B7', font=get_font(11, True))
d1.text((470, 455), "Biometric Scanner Glitch", fill='#38BDF8', font=get_font(12))
d1.text((720, 455), "Gate 1 scanner failed thumbprint. Homeroom attendance verified.", fill='#CBD5E1', font=get_font(12))
d1.rounded_rectangle([(1150, 452), (1240, 476)], radius=4, fill='#064E3B')
d1.text((1165, 456), "Approved", fill='#6EE7B7', font=get_font(11, True))
d1.text((1340, 455), "Approved. Terminal gate log verified.", fill='#94A3B8', font=get_font(12))

# Row 2
d1.line([(30, 490), (WIDTH - 30, 490)], fill='#334155')
d1.text((50, 505), "2026-09-08", fill='#F8FAFC', font=get_font(13, True))
d1.rounded_rectangle([(180, 502), (255, 526)], radius=4, fill='#7F1D1D')
d1.text((195, 506), "Absent", fill='#FCA5A5', font=get_font(11, True))
d1.rounded_rectangle([(310, 502), (430, 526)], radius=4, fill='#064E3B')
d1.text((322, 506), "On-Duty / Event", fill='#6EE7B7', font=get_font(11, True))
d1.text((470, 505), "Official Institutional Duty", fill='#38BDF8', font=get_font(12))
d1.text((720, 505), "External exam observer duty at City High School per Directorate.", fill='#CBD5E1', font=get_font(12))
d1.rounded_rectangle([(1150, 502), (1240, 526)], radius=4, fill='#064E3B')
d1.text((1165, 506), "Approved", fill='#6EE7B7', font=get_font(11, True))
d1.text((1340, 505), "Approved. Verified with Examination Dept.", fill='#94A3B8', font=get_font(12))

# Modal Overlay (Teacher Apply for Leave Modal Preview)
d1.rounded_rectangle([(WIDTH // 2 - 320, 590), (WIDTH // 2 + 320, 970)], radius=14, fill='#0F172A', outline='#38BDF8', width=2)
d1.rectangle([(WIDTH // 2 - 320, 590), (WIDTH // 2 + 320, 645)], fill='#1E293B')
d1.text((WIDTH // 2 - 290, 605), "Faculty Official Leave Application", fill='#F8FAFC', font=get_font(16, True))
d1.text((WIDTH // 2 - 290, 627), "Greenwood High • Administrative Approval Desk", fill='#94A3B8', font=get_font(12))

# Form fields in modal
d1.text((WIDTH // 2 - 290, 660), "Leave Category *", fill='#94A3B8', font=get_font(12))
d1.rounded_rectangle([(WIDTH // 2 - 290, 680), (WIDTH // 2 + 290, 715)], radius=6, fill='#1E293B', outline='#334155')
d1.text((WIDTH // 2 - 275, 690), "Academic Duty (Seminars / Olympiads / Board Duty)", fill='#F8FAFC', font=get_font(13))

d1.text((WIDTH // 2 - 290, 730), "Start Date: 2026-09-24    End Date: 2026-09-25    Total Days: 2", fill='#94A3B8', font=get_font(12))

d1.text((WIDTH // 2 - 290, 765), "Substitute Faculty Arrangement", fill='#94A3B8', font=get_font(12))
d1.rounded_rectangle([(WIDTH // 2 - 290, 785), (WIDTH // 2 + 290, 820)], radius=6, fill='#1E293B', outline='#334155')
d1.text((WIDTH // 2 - 275, 795), "Prof. Sarah Connor (Class 10-A Math Period 3 & 5)", fill='#F8FAFC', font=get_font(13))

d1.text((WIDTH // 2 - 290, 835), "Detailed Reason & Academic Justification *", fill='#94A3B8', font=get_font(12))
d1.rounded_rectangle([(WIDTH // 2 - 290, 855), (WIDTH // 2 + 290, 905)], radius=6, fill='#1E293B', outline='#334155')
d1.text((WIDTH // 2 - 275, 865), "Accompanying student contingent to State Mathematics Olympiad as faculty lead.", fill='#F8FAFC', font=get_font(12))

# Modal submit button
d1.rounded_rectangle([(WIDTH // 2 + 100, 920), (WIDTH // 2 + 290, 955)], radius=6, fill='#10B981')
d1.text((WIDTH // 2 + 125, 930), "Submit to Administration", fill='#FFFFFF', font=get_font(13, True))

img1_path = os.path.join(OUT_DIR, "teacher_self_service_governance.png")
img1.save(img1_path)
print("Saved:", img1_path)

# -------------------------------------------------------------
# IMAGE 2: Admin Notification Drawer & Governance Approval Desk
# -------------------------------------------------------------
img2 = Image.new('RGB', (WIDTH, HEIGHT), color='#0B1120')
d2 = ImageDraw.Draw(img2)

# Sidebar
d2.rectangle([(0, 0), (260, HEIGHT)], fill='#0F172A', outline='#1E293B')
d2.text((25, 25), "EduCore OS", fill='#F8FAFC', font=get_font(20, True))
d2.text((25, 52), "C++ & React System", fill='#38BDF8', font=get_font(12))

nav_items = [
    ("Dashboard", False), ("Student Directory", False), ("Faculty & Staff", False),
    ("Fee Receipts", False), ("Salary Pay-Slips", False), ("Attendance", False),
    ("Gradebook", False), ("Excel DB Studio", False),
    ("-- Governance & Approvals --", None),
    ("Faculty Leave Approvals (1)", True),
    ("Faculty Regularizations (1)", False),
    ("RBAC Permissions", False)
]

ny = 100
for name, is_act in nav_items:
    if is_act is None:
        d2.text((25, ny), name, fill='#64748B', font=get_font(11, True))
        ny += 28
        continue
    if is_act:
        d2.rounded_rectangle([(15, ny), (245, ny + 36)], radius=6, fill='#1E293B', outline='#0284C7')
        d2.text((30, ny + 9), name, fill='#38BDF8', font=get_font(13, True))
    else:
        d2.text((30, ny + 9), name, fill='#94A3B8', font=get_font(13))
    ny += 42

# Top Header
d2.rectangle([(260, 0), (WIDTH, 75)], fill='#0F172A', outline='#1E293B')
d2.text((290, 20), "Faculty Leave Approvals & Institutional Quotas", fill='#F8FAFC', font=get_font(18, True))
d2.text((290, 46), "Principal & Administrator Desk: Review faculty absence applications & substitute arrangements", fill='#94A3B8', font=get_font(12))

# Header Notification Bell with Badge!
d2.rounded_rectangle([(WIDTH - 300, 18), (WIDTH - 170, 56)], radius=8, fill='#1E293B', outline='#0284C7')
d2.text((WIDTH - 280, 27), "🔔 Alerts", fill='#38BDF8', font=get_font(14, True))
# Badge
d2.ellipse([(WIDTH - 195, 10), (WIDTH - 175, 30)], fill='#EF4444')
d2.text((WIDTH - 188, 13), "2", fill='#FFFFFF', font=get_font(12, True))

# Admin Profile Badge
d2.rounded_rectangle([(WIDTH - 150, 18), (WIDTH - 25, 56)], radius=8, fill='#1E293B', outline='#334155')
d2.text((WIDTH - 135, 27), "🛡️ Admin: Master", fill='#C084FC', font=get_font(13, True))

# KPI Grid in Admin view
kpi_items = [
    ("TOTAL APPLICATIONS", "5 Total", "#38BDF8"),
    ("PENDING REVIEW", "2 Pending Action", "#F59E0B"),
    ("APPROVED LEAVES", "2 Approved", "#10B981"),
    ("REJECTED / CANCELLED", "1 Rejected", "#EF4444")
]
kx = 290
for title, val, color in kpi_items:
    d2.rounded_rectangle([(kx, 95), (kx + 290, 175)], radius=10, fill='#1E293B', outline='#334155')
    d2.text((kx + 20, 110), title, fill='#94A3B8', font=get_font(11, True))
    d2.text((kx + 20, 132), val, fill=color, font=get_font(20, True))
    kx += 310

# Faculty Leaves Table
d2.rounded_rectangle([(290, 200), (WIDTH - 30, 520)], radius=10, fill='#1E293B', outline='#334155')
d2.rectangle([(290, 200), (WIDTH - 30, 240)], fill='#0F172A')

l_headers = ["Faculty Member", "Leave Category", "Duration", "Days", "Reason & Academic Justification", "Substitute", "Status", "Admin Action"]
l_xs = [310, 480, 630, 780, 850, 1200, 1340, 1460]
for lh, lx in zip(l_headers, l_xs):
    d2.text((lx, 212), lh, fill='#94A3B8', font=get_font(12, True))

# Table Row 1
d2.text((310, 255), "Prof. Robert Miller", fill='#F8FAFC', font=get_font(13, True))
d2.text((310, 275), "TCH-001 • Mathematics", fill='#64748B', font=get_font(11))
d2.rounded_rectangle([(480, 255), (590, 280)], radius=4, fill='#0369A1')
d2.text((492, 260), "Academic Duty", fill='#E0F2FE', font=get_font(11, True))
d2.text((630, 260), "2026-09-24 to 09-25", fill='#F8FAFC', font=get_font(12))
d2.text((780, 260), "2 days", fill='#38BDF8', font=get_font(12, True))
d2.text((850, 260), "Accompanying student contingent to State Mathematics Olympiad.", fill='#CBD5E1', font=get_font(12))
d2.text((1200, 260), "Prof. Sarah Connor", fill='#94A3B8', font=get_font(12))
d2.rounded_rectangle([(1340, 255), (1420, 280)], radius=4, fill='#78350F')
d2.text((1355, 260), "Pending", fill='#FDE68A', font=get_font(11, True))
d2.rounded_rectangle([(1460, 253), (1550, 282)], radius=6, fill='#0284C7')
d2.text((1475, 260), "Review", fill='#FFFFFF', font=get_font(12, True))

# Table Row 2
d2.line([(290, 305), (WIDTH - 30, 305)], fill='#334155')
d2.text((310, 320), "Prof. Sarah Connor", fill='#F8FAFC', font=get_font(13, True))
d2.text((310, 340), "TCH-002 • Physics", fill='#64748B', font=get_font(11))
d2.rounded_rectangle([(480, 320), (590, 345)], radius=4, fill='#7F1D1D')
d2.text((495, 325), "Medical Leave", fill='#FECACA', font=get_font(11, True))
d2.text((630, 325), "2026-09-28 to 09-29", fill='#F8FAFC', font=get_font(12))
d2.text((780, 325), "2 days", fill='#38BDF8', font=get_font(12, True))
d2.text((850, 325), "Scheduled dental surgical procedure and mandatory post-op rest.", fill='#CBD5E1', font=get_font(12))
d2.text((1200, 325), "Prof. Robert Miller", fill='#94A3B8', font=get_font(12))
d2.rounded_rectangle([(1340, 320), (1420, 345)], radius=4, fill='#78350F')
d2.text((1355, 325), "Pending", fill='#FDE68A', font=get_font(11, True))
d2.rounded_rectangle([(1460, 318), (1550, 347)], radius=6, fill='#0284C7')
d2.text((1475, 325), "Review", fill='#FFFFFF', font=get_font(12, True))

# Notification Drawer Slide-Out Preview (Top Right)
d2.rounded_rectangle([(WIDTH - 460, 70), (WIDTH - 25, 480)], radius=14, fill='#0F172A', outline='#38BDF8', width=2)
d2.rectangle([(WIDTH - 460, 70), (WIDTH - 25, 120)], fill='#1E293B')
d2.text((WIDTH - 440, 85), "Administrative Alert Center", fill='#F8FAFC', font=get_font(15, True))
d2.text((WIDTH - 150, 87), "2 Action Required", fill='#38BDF8', font=get_font(11, True))

# Alert Item 1: Teacher Leave
d2.rounded_rectangle([(WIDTH - 445, 135), (WIDTH - 40, 225)], radius=8, fill='#1E293B', outline='#0284C7')
d2.text((WIDTH - 430, 145), "Prof. Robert Miller (TCH-001)", fill='#F8FAFC', font=get_font(13, True))
d2.text((WIDTH - 430, 165), "Applied for Academic Duty (2 days): State Olympiad...", fill='#CBD5E1', font=get_font(12))
d2.text((WIDTH - 430, 195), "2026-09-24 to 2026-09-25  •  Click to Review & Decide ->", fill='#38BDF8', font=get_font(11, True))

# Alert Item 2: Teacher Attendance Dispute
d2.rounded_rectangle([(WIDTH - 445, 240), (WIDTH - 40, 330)], radius=8, fill='#1E293B', outline='#10B981')
d2.text((WIDTH - 430, 250), "Prof. Robert Miller (TCH-001)", fill='#F8FAFC', font=get_font(13, True))
d2.text((WIDTH - 430, 270), "Dispute: Late Arrival -> Present for 2026-09-15", fill='#CBD5E1', font=get_font(12))
d2.text((WIDTH - 430, 300), "Scanner Glitch  •  Click to Review & Regularize ->", fill='#34D399', font=get_font(11, True))

# Bottom Panel: Modal Review Leave Preview (Admin Decision Desk)
d2.rounded_rectangle([(290, 545), (1050, 960)], radius=12, fill='#0F172A', outline='#334155')
d2.rectangle([(290, 545), (1050, 595)], fill='#1E293B')
d2.text((315, 560), "Review Faculty Leave Request • Principal Governance Desk", fill='#F8FAFC', font=get_font(16, True))

# Summary inside review modal
d2.rounded_rectangle([(315, 615), (1025, 715)], radius=8, fill='#1E293B', outline='#334155')
d2.text((335, 628), "Faculty Member: Prof. Robert Miller (TCH-001)", fill='#F8FAFC', font=get_font(13, True))
d2.text((335, 650), "Category: Academic Duty  •  Duration: 2026-09-24 to 2026-09-25 (2 days)", fill='#38BDF8', font=get_font(12))
d2.text((335, 672), "Substitute: Prof. Sarah Connor  •  Reason: 'State Mathematics Olympiad Faculty Lead'", fill='#94A3B8', font=get_font(12))

# Decision Buttons
d2.rounded_rectangle([(315, 735), (550, 780)], radius=8, fill='#064E3B', outline='#10B981', width=2)
d2.text((370, 748), "✓ Approve Leave", fill='#6EE7B7', font=get_font(14, True))

d2.rounded_rectangle([(570, 735), (805, 780)], radius=8, fill='#1E293B', outline='#334155')
d2.text((635, 748), "✕ Reject Leave", fill='#94A3B8', font=get_font(14, True))

# Remarks textarea
d2.text((315, 805), "Administrative Remarks / Official Order *", fill='#94A3B8', font=get_font(12))
d2.rounded_rectangle([(315, 825), (1025, 890)], radius=8, fill='#1E293B', outline='#334155')
d2.text((335, 840), "Approved by Principal. Substitute faculty arrangements verified with Academic Dean.", fill='#F8FAFC', font=get_font(12))

# Confirm button
d2.rounded_rectangle([(840, 905), (1025, 945)], radius=8, fill='#10B981')
d2.text((865, 917), "Confirm Approved", fill='#FFFFFF', font=get_font(13, True))

# Right Panel: Admin Full Master Entry (Student & Teacher)
d2.rounded_rectangle([(1075, 545), (WIDTH - 30, 960)], radius=12, fill='#1E293B', outline='#334155')
d2.rectangle([(1075, 545), (WIDTH - 30, 595)], fill='#0F172A')
d2.text((1100, 560), "Master Entry Access (All Fields Unlocked)", fill='#F8FAFC', font=get_font(15, True))

master_fields = [
    ("Student Registration Master", [
        "Roll Number, Class & Section",
        "First & Last Name, Student Email & Phone",
        "Father & Mother Name (Parent Records)",
        "Parent Primary Phone & Emergency Contact",
        "Blood Group, Gender, DOB",
        "Aadhaar / National Identity Number",
        "Permanent Residential Address & Admission Date"
    ]),
    ("Faculty & Staff Master", [
        "Employee ID, Full Name, Email, Phone",
        "Academic Qualification & Department",
        "Designation & Campus Cabin Location",
        "Base Salary & Weekly Teaching Load",
        "Emergency Phone & Residential Address"
    ])
]

my_y = 615
for sec_title, fields in master_fields:
    d2.text((1100, my_y), sec_title, fill='#38BDF8', font=get_font(13, True))
    my_y += 24
    for f in fields:
        d2.text((1115, my_y), "• " + f, fill='#E2E8F0', font=get_font(12))
        my_y += 20
    my_y += 12

img2_path = os.path.join(OUT_DIR, "admin_governance_and_notifications.png")
img2.save(img2_path)
print("Saved:", img2_path)
