import os
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1680
img = Image.new('RGB', (WIDTH, HEIGHT), color='#0B1120')
draw = ImageDraw.Draw(img)

try:
    font_title = ImageFont.truetype('seguiemj.ttf', 30)
except:
    try:
        font_title = ImageFont.truetype('arialbd.ttf', 28)
    except:
        font_title = ImageFont.load_default()

try:
    font_sub = ImageFont.truetype('segoeui.ttf', 16)
    font_h2 = ImageFont.truetype('segoeuib.ttf', 18)
    font_th = ImageFont.truetype('segoeuib.ttf', 13)
    font_body = ImageFont.truetype('segoeui.ttf', 12)
    font_body_bold = ImageFont.truetype('segoeuib.ttf', 12)
    font_small = ImageFont.truetype('segoeui.ttf', 11)
except:
    font_sub = font_title
    font_h2 = font_title
    font_th = font_title
    font_body = font_title
    font_body_bold = font_title
    font_small = font_title

# 1. Header Banner
draw.rectangle([(30, 25), (WIDTH - 30, 110)], fill='#0F172A', outline='#1E293B', width=1)
draw.rectangle([(30, 25), (WIDTH - 30, 28)], fill='#38BDF8')
draw.text((WIDTH // 2, 55), 'EduCore OS - Milestone 3 Architecture & Feature Snapshot (SNAP3)', fill='#FFFFFF', font=font_title, anchor='mm')
draw.text((WIDTH // 2, 88), 'Class Groups & Cohorts Hub | Curriculum Subject Timetable Engine | Streamlined Dashboard | Live Supabase REST', fill='#94A3B8', font=font_sub, anchor='mm')

# 2. KPI Cards
kpis = [
    ('UNIFIED PORTALS', 'Admin + Teacher + Student', '#0EA5E9'),
    ('AUTH & SSO', 'Universal Single Sign-On', '#10B981'),
    ('CLASS TEACHER FLOW', 'Leave & Dispute Routing', '#8B5CF6'),
    ('GRADEBOOK & 10-TESTS', 'Batch Import + Chart Trends', '#F59E0B'),
    ('ANIMATION SYSTEM', '60fps Spring & Micro-Interactions', '#EC4899'),
    ('SYSTEM BACKUP STATE', 'SNAP3 VERIFIED & ARCHIVED', '#34D399')
]

card_w = (WIDTH - 60 - (len(kpis) - 1) * 16) // len(kpis)
card_y = 125
for i, (label, val, accent) in enumerate(kpis):
    cx = 30 + i * (card_w + 16)
    draw.rectangle([(cx, card_y), (cx + card_w, card_y + 68)], fill='#1E293B', outline='#334155', width=1)
    draw.rectangle([(cx, card_y), (cx + card_w, card_y + 4)], fill=accent)
    draw.text((cx + card_w // 2, card_y + 22), label, fill='#94A3B8', font=font_small, anchor='mm')
    draw.text((cx + card_w // 2, card_y + 46), val, fill='#FFFFFF', font=font_body_bold, anchor='mm')

# Section 1: Unified Architecture & Portal Layout Matrix
s1_y = 210
draw.text((30, s1_y), '1. Unified Architecture & Portal Layout Matrix', fill='#38BDF8', font=font_h2)

cols1 = [
    ('Portal View', 180),
    ('Navigation Structure', 270),
    ('Header & Notification Actions', 440),
    ('Top KPI Overview Cards', 440),
    ('Core Functionalities & Scope', 560)
]

th_y = s1_y + 30
cur_x = 30
for title, w in cols1:
    draw.rectangle([(cur_x, th_y), (cur_x + w, th_y + 28)], fill='#0369A1', outline='#0EA5E9', width=1)
    draw.text((cur_x + 10, th_y + 8), title, fill='#FFFFFF', font=font_th)
    cur_x += w

matrix_data = [
    ('Universal Login (SSO)\n(role: auto-routed)',
     '• Single unified card\n• Password eye toggle\n• 1-tap demo pills',
     '• EduCore OS Brand Badge\n• Real-time error alerts & autofill confirmation\n• Clean single-field authentication',
     '• Student Quick Demo\n• Faculty Quick Demo\n• Master Admin Quick Demo',
     '• Unified authentication endpoint validating user role automatically\n• Seamless automatic routing to appropriate portal view\n• Floating neon ambient glow orbs & particles'),

    ('Student Portal\n(role: student)',
     'Left Sidebar:\n• Academics & Records\n• Requests & Services\n• Class & Homeroom badge',
     '• Dynamic page title & subtitle\n• Notification bell with unread dropdown\n• Settings Modal trigger & Roll No chip\n• Sign Out action button',
     '• Fee Balance Due (Paid summary)\n• Current Academic Score (% & Grade)\n• Overall Attendance (Verified sessions)\n• Class Teacher (Assigned mentor)',
     '• Student Profile & Class Teacher details\n• Live weekly timetable & room allocations\n• Gradebook & 10-Assessment history bar chart\n• Leave application routed to Class Teacher\n• Attendance dispute regularization queue\n• Fee ledger & official GST receipt slips'),

    ('Faculty Portal\n(role: teacher)',
     'Left Sidebar:\n• Faculty Workspace\n• Approvals & Leaves\n• Employee ID badge',
     '• Dynamic page title & subtitle\n• Notification bell with unread counter\n• Settings Modal trigger & Faculty tag\n• Sign Out action button',
     '• Monthly Hours Logged (Biometric)\n• Attendance Disputes (Pending claims)\n• Student Leave Approvals (Pending)\n• Monthly Compensation (Net payout)',
     '• Profile & Homeroom class allocations\n• Weekly schedule & period allocations\n• Student directory with personal profile inspector\n• Biometric punch timecard & logged hours\n• Manual scoring & Excel batch import\n• Student leave & regularization dispute approval\n• Salary pay-slips & student evaluation remarks'),

    ('Admin Master Console\n(role: admin)',
     'Left Sidebar:\n• Management directory\n• Academic operations\n• System status monitor',
     '• Dynamic page title & subtitle\n• Admin notification center drawer\n• Settings Modal trigger & Master badge\n• Sign Out action button',
     '• Total Enrolled Students\n• Total Faculty & Staff\n• Total Fees Collected\n• Teacher Payroll Disbursed',
     '• Institutional student & teacher CRUD directory\n• Fee collection, installment ledger & receipt generation\n• Teacher payroll calculation, allowances & disbursement\n• RBAC permission control & faculty homeroom assignment\n• Excel Database Studio bulk import/export')
]

row_y = th_y + 28
for r_idx, row in enumerate(matrix_data):
    row_h = 105
    cur_x = 30
    bg = '#1E293B' if r_idx % 2 == 0 else '#0F172A'
    for c_idx, (text, (_, w)) in enumerate(zip(row, cols1)):
        draw.rectangle([(cur_x, row_y), (cur_x + w, row_y + row_h)], fill=bg, outline='#334155', width=1)
        lines = text.split('\n')
        line_y = row_y + 8
        for line in lines:
            f = font_body_bold if c_idx == 0 else font_body
            color = '#F1F5F9' if c_idx == 0 else ('#38BDF8' if c_idx == 2 else ('#34D399' if c_idx == 3 else '#CBD5E1'))
            draw.text((cur_x + 10, line_y), line, fill=color, font=f)
            line_y += 16
        cur_x += w
    row_y += row_h

# Section 2: Dynamic Animation & UX System
s2_y = row_y + 20
draw.text((30, s2_y), '2. Dynamic Animation & Micro-Interactions Suite', fill='#EC4899', font=font_h2)

cols2 = [
    ('Component', 220),
    ('Animation / Transition Trigger', 340),
    ('Keyframe & Physics Mechanism', 620),
    ('User Experience Enhancement', 710)
]

th2_y = s2_y + 30
cur_x = 30
for title, w in cols2:
    draw.rectangle([(cur_x, th2_y), (cur_x + w, th2_y + 28)], fill='#9D174D', outline='#EC4899', width=1)
    draw.text((cur_x + 10, th2_y + 8), title, fill='#FFFFFF', font=font_th)
    cur_x += w

anim_data = [
    ('Login Ambient Motion', 'Continuous background animation', 'Floating neon orbs (glowOrbFloat 1-3) & drifting particle mesh (p1-p5)', 'High-end glassmorphism depth, futuristic ambient illumination without performance lag.'),
    ('KPI Metric Cards', 'Hover & page load', '3D spring lift translateY(-6px) scale(1.02) + colored glow shadow + icon rotate(8deg)', 'Tactile interactivity, making critical institutional metrics pop immediately.'),
    ('Sidebar Navigation', 'Hover & tab selection', 'Slide-right translateX(6px) + icon bounce + active neon glowing left border', 'Crystal-clear active state recognition and responsive drawer feedback.'),
    ('Data Table Rows', 'Row hover & data render', 'Staggered row entrance + smooth hover scale + left cyan accent highlight', 'Enhanced scannability for student records, timetable entries, and payroll ledgers.'),
    ('Notification Bell', 'Unread alerts present', 'Gentle bell swing rotation (bellSwing) + pulse-badge breathing count', 'High-visibility cue alerting faculty and students to pending leave decisions and notes.')
]

row2_y = th2_y + 28
for r_idx, row in enumerate(anim_data):
    row_h = 48
    cur_x = 30
    bg = '#1E293B' if r_idx % 2 == 0 else '#0F172A'
    for c_idx, (text, (_, w)) in enumerate(zip(row, cols2)):
        draw.rectangle([(cur_x, row2_y), (cur_x + w, row2_y + row_h)], fill=bg, outline='#334155', width=1)
        lines = text.split('\n')
        line_y = row2_y + 8
        for line in lines:
            f = font_body_bold if c_idx in [0, 1] else font_body
            color = '#F1F5F9' if c_idx == 0 else '#CBD5E1'
            draw.text((cur_x + 10, line_y), line, fill=color, font=f)
            line_y += 16
        cur_x += w
    row2_y += row_h

# Section 3: Backup & Verification Checklist
s3_y = row2_y + 20
draw.text((30, s3_y), '3. Backup Manifest & Milestone Verification (SNAP3)', fill='#10B981', font=font_h2)

cols3 = [
    ('Target Layer', 180),
    ('File / Component', 340),
    ('Validation Status', 220),
    ('Backup Verification Details', 1150)
]

th3_y = s3_y + 30
cur_x = 30
for title, w in cols3:
    draw.rectangle([(cur_x, th3_y), (cur_x + w, th3_y + 28)], fill='#065F46', outline='#10B981', width=1)
    draw.text((cur_x + 10, th3_y + 8), title, fill='#FFFFFF', font=font_th)
    cur_x += w

backup_data = [
    ('Universal Login', 'frontend/src/Login.jsx', '100% Verified', 'Role tabs removed, SSO form active with password toggle and instant demo pills.'),
    ('Student Portal', 'frontend/src/StudentPortal.jsx', '100% Verified', 'Admin-style sidebar + top header + 4 KPI cards + 8 feature views + Class Teacher routing.'),
    ('Teacher Portal', 'frontend/src/TeacherPortal.jsx', '100% Verified', 'Admin-style sidebar + top header + 4 KPI cards + 9 feature views + Homeroom leave approval.'),
    ('Design System', 'frontend/src/index.css', '100% Verified', 'Comprehensive keyframe library, spring hover physics, table highlights & glassmorphism.'),
    ('Production Build', 'Vite Production Bundle', '0 Errors / 1.26s', 'Clean production build with zero compilation or syntax warnings.'),
    ('Archive Snapshot', 'backup_snap3 / snap3.zip', 'Archived', 'Full standalone code snapshot with all source code, models, and assets.')
]

row3_y = th3_y + 28
for r_idx, row in enumerate(backup_data):
    row_h = 32
    cur_x = 30
    bg = '#1E293B' if r_idx % 2 == 0 else '#0F172A'
    for c_idx, (text, (_, w)) in enumerate(zip(row, cols3)):
        draw.rectangle([(cur_x, row3_y), (cur_x + w, row3_y + row_h)], fill=bg, outline='#334155', width=1)
        f = font_body_bold if c_idx in [0, 2] else font_body
        color = '#FBBF24' if c_idx == 0 else ('#10B981' if c_idx == 2 else '#CBD5E1')
        draw.text((cur_x + 10, row3_y + 8), text, fill=color, font=f)
        cur_x += w
    row3_y += row_h

draw.text((WIDTH - 40, HEIGHT - 20), 'EduCore OS - Milestone 3 Architecture & Backup Snapshot | Greenwood International Academy', fill='#64748B', font=font_small, anchor='rm')

out_root = 'snap3.png'
out_checklist = 'checklist/snap3.png'
out_artifact = 'C:/Users/bhuvn/.gemini/antigravity-ide/brain/a44e506e-693a-40ce-8d02-a99ca51b35ba/snap3.png'

img.save(out_root)
img.save(out_checklist)
try:
    img.save(out_artifact)
except:
    pass

print('SNAP3 generated successfully!')
