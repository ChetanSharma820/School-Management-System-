import urllib.request
import json

HISTORICAL_ASSESSMENTS = [
    # Mathematics (Total 10)
    {"student_id": 1, "exam_name": "Unit Test 2 (September 2026)", "subject": "Mathematics", "marks_obtained": 96, "total_marks": 100, "grade": "O", "remarks": "Mastery in differential calculus and algebraic geometry."},
    {"student_id": 1, "exam_name": "Unit Test 1 (August 2026)", "subject": "Mathematics", "marks_obtained": 91, "total_marks": 100, "grade": "O", "remarks": "Outstanding precision in trigonometric proofs."},
    {"student_id": 1, "exam_name": "Monthly Assessment 3 (July 2026)", "subject": "Mathematics", "marks_obtained": 88, "total_marks": 100, "grade": "A+", "remarks": "Strong problem solving in polynomial equations."},
    {"student_id": 1, "exam_name": "Monthly Assessment 2 (June 2026)", "subject": "Mathematics", "marks_obtained": 92, "total_marks": 100, "grade": "O", "remarks": "Excellent analytical clarity in coordinate geometry."},
    {"student_id": 1, "exam_name": "Monthly Assessment 1 (May 2026)", "subject": "Mathematics", "marks_obtained": 85, "total_marks": 100, "grade": "A+", "remarks": "Good comprehension of linear functions."},
    {"student_id": 1, "exam_name": "Diagnostic Aptitude Test (April 2026)", "subject": "Mathematics", "marks_obtained": 82, "total_marks": 100, "grade": "A+", "remarks": "Solid logical and quantitative reasoning foundations."},
    {"student_id": 1, "exam_name": "Annual Final Exam 2026", "subject": "Mathematics", "marks_obtained": 89, "total_marks": 100, "grade": "A+", "remarks": "High distinction across all term modules."},
    {"student_id": 1, "exam_name": "Pre-Board Examination 2026", "subject": "Mathematics", "marks_obtained": 86, "total_marks": 100, "grade": "A+", "remarks": "Very good time management during mock board exam."},
    {"student_id": 1, "exam_name": "Periodic Assessment 3 (January 2026)", "subject": "Mathematics", "marks_obtained": 80, "total_marks": 100, "grade": "A", "remarks": "Consistent effort and accurate computations."},

    # Physics (Total 10)
    {"student_id": 1, "exam_name": "Unit Test 2 (September 2026)", "subject": "Physics", "marks_obtained": 92, "total_marks": 100, "grade": "O", "remarks": "Flawless numerical derivation in electrostatics."},
    {"student_id": 1, "exam_name": "Unit Test 1 (August 2026)", "subject": "Physics", "marks_obtained": 88, "total_marks": 100, "grade": "A+", "remarks": "Accurate vector diagrams and ray optics analysis."},
    {"student_id": 1, "exam_name": "Monthly Assessment 3 (July 2026)", "subject": "Physics", "marks_obtained": 85, "total_marks": 100, "grade": "A+", "remarks": "Excellent performance in thermodynamics quiz."},
    {"student_id": 1, "exam_name": "Monthly Assessment 2 (June 2026)", "subject": "Physics", "marks_obtained": 90, "total_marks": 100, "grade": "O", "remarks": "Thorough understanding of kinematic equations."},
    {"student_id": 1, "exam_name": "Monthly Assessment 1 (May 2026)", "subject": "Physics", "marks_obtained": 82, "total_marks": 100, "grade": "A+", "remarks": "Good grasp of Newton laws and friction coefficients."},
    {"student_id": 1, "exam_name": "Diagnostic Aptitude Test (April 2026)", "subject": "Physics", "marks_obtained": 78, "total_marks": 100, "grade": "A", "remarks": "Satisfactory physical concept visualization."},
    {"student_id": 1, "exam_name": "Annual Final Exam 2026", "subject": "Physics", "marks_obtained": 86, "total_marks": 100, "grade": "A+", "remarks": "Strong performance in both theory and practical viva."},
    {"student_id": 1, "exam_name": "Pre-Board Examination 2026", "subject": "Physics", "marks_obtained": 84, "total_marks": 100, "grade": "A", "remarks": "Good accuracy in circuit analysis problems."},
    {"student_id": 1, "exam_name": "Periodic Assessment 3 (January 2026)", "subject": "Physics", "marks_obtained": 79, "total_marks": 100, "grade": "A", "remarks": "Well-organized answers in magnetism unit."},

    # Chemistry (Total 10)
    {"student_id": 1, "exam_name": "Unit Test 2 (September 2026)", "subject": "Chemistry", "marks_obtained": 88, "total_marks": 100, "grade": "A+", "remarks": "Sound understanding of coordination compounds."},
    {"student_id": 1, "exam_name": "Unit Test 1 (August 2026)", "subject": "Chemistry", "marks_obtained": 86, "total_marks": 100, "grade": "A+", "remarks": "Clear stoichiometry calculations and reaction equations."},
    {"student_id": 1, "exam_name": "Monthly Assessment 3 (July 2026)", "subject": "Chemistry", "marks_obtained": 82, "total_marks": 100, "grade": "A+", "remarks": "Strong conceptual hold on periodic periodicity."},
    {"student_id": 1, "exam_name": "Monthly Assessment 2 (June 2026)", "subject": "Chemistry", "marks_obtained": 85, "total_marks": 100, "grade": "A+", "remarks": "Accurate molecular orbital theory diagrams."},
    {"student_id": 1, "exam_name": "Monthly Assessment 1 (May 2026)", "subject": "Chemistry", "marks_obtained": 80, "total_marks": 100, "grade": "A", "remarks": "Satisfactory grasp of chemical bonding concepts."},
    {"student_id": 1, "exam_name": "Diagnostic Aptitude Test (April 2026)", "subject": "Chemistry", "marks_obtained": 75, "total_marks": 100, "grade": "A", "remarks": "Competent understanding of atomic structures."},
    {"student_id": 1, "exam_name": "Annual Final Exam 2026", "subject": "Chemistry", "marks_obtained": 83, "total_marks": 100, "grade": "A", "remarks": "Well structured qualitative salt analysis."},
    {"student_id": 1, "exam_name": "Pre-Board Examination 2026", "subject": "Chemistry", "marks_obtained": 81, "total_marks": 100, "grade": "A", "remarks": "Consistent answers in organic reaction mechanisms."},
    {"student_id": 1, "exam_name": "Periodic Assessment 3 (January 2026)", "subject": "Chemistry", "marks_obtained": 76, "total_marks": 100, "grade": "A", "remarks": "Solid effort in redox reactions and balancing."},

    # Computer Science (Total 10)
    {"student_id": 1, "exam_name": "Unit Test 2 (September 2026)", "subject": "Computer Science", "marks_obtained": 99, "total_marks": 100, "grade": "O", "remarks": "Exceptional C++ OOP design and dynamic memory management."},
    {"student_id": 1, "exam_name": "Unit Test 1 (August 2026)", "subject": "Computer Science", "marks_obtained": 96, "total_marks": 100, "grade": "O", "remarks": "Superior implementation of binary search trees and hashing."},
    {"student_id": 1, "exam_name": "Monthly Assessment 3 (July 2026)", "subject": "Computer Science", "marks_obtained": 95, "total_marks": 100, "grade": "O", "remarks": "Top marks in SQL relational database queries and normalization."},
    {"student_id": 1, "exam_name": "Monthly Assessment 2 (June 2026)", "subject": "Computer Science", "marks_obtained": 97, "total_marks": 100, "grade": "O", "remarks": "Excellent code modularity and syntax discipline."},
    {"student_id": 1, "exam_name": "Monthly Assessment 1 (May 2026)", "subject": "Computer Science", "marks_obtained": 92, "total_marks": 100, "grade": "O", "remarks": "Strong understanding of computational complexity and Big-O."},
    {"student_id": 1, "exam_name": "Diagnostic Aptitude Test (April 2026)", "subject": "Computer Science", "marks_obtained": 90, "total_marks": 100, "grade": "O", "remarks": "Impressive foundational algorithmic thinking."},
    {"student_id": 1, "exam_name": "Annual Final Exam 2026", "subject": "Computer Science", "marks_obtained": 96, "total_marks": 100, "grade": "O", "remarks": "Class topper in practical computer programming lab."},
    {"student_id": 1, "exam_name": "Pre-Board Examination 2026", "subject": "Computer Science", "marks_obtained": 94, "total_marks": 100, "grade": "O", "remarks": "Comprehensive answers in networking architecture."},
    {"student_id": 1, "exam_name": "Periodic Assessment 3 (January 2026)", "subject": "Computer Science", "marks_obtained": 89, "total_marks": 100, "grade": "A+", "remarks": "Clean code execution in Boolean algebra and logic gates."},

    # English Literature (Total 10)
    {"student_id": 1, "exam_name": "Unit Test 2 (September 2026)", "subject": "English Literature", "marks_obtained": 94, "total_marks": 100, "grade": "O", "remarks": "Insightful literary critiques of Shakespearean tragedy."},
    {"student_id": 1, "exam_name": "Unit Test 1 (August 2026)", "subject": "English Literature", "marks_obtained": 90, "total_marks": 100, "grade": "O", "remarks": "Compelling argumentation in persuasive discourse."},
    {"student_id": 1, "exam_name": "Monthly Assessment 3 (July 2026)", "subject": "English Literature", "marks_obtained": 87, "total_marks": 100, "grade": "A+", "remarks": "Nuanced interpretation of romantic poetry symbolism."},
    {"student_id": 1, "exam_name": "Monthly Assessment 2 (June 2026)", "subject": "English Literature", "marks_obtained": 89, "total_marks": 100, "grade": "A+", "remarks": "Strong comprehension and precise syntactic structuring."},
    {"student_id": 1, "exam_name": "Monthly Assessment 1 (May 2026)", "subject": "English Literature", "marks_obtained": 85, "total_marks": 100, "grade": "A+", "remarks": "Engaging character sketch analysis and thematic flow."},
    {"student_id": 1, "exam_name": "Diagnostic Aptitude Test (April 2026)", "subject": "English Literature", "marks_obtained": 83, "total_marks": 100, "grade": "A", "remarks": "Expressive writing with good grammatical command."},
    {"student_id": 1, "exam_name": "Annual Final Exam 2026", "subject": "English Literature", "marks_obtained": 88, "total_marks": 100, "grade": "A+", "remarks": "High distinction in comprehension and creative writing."},
    {"student_id": 1, "exam_name": "Pre-Board Examination 2026", "subject": "English Literature", "marks_obtained": 86, "total_marks": 100, "grade": "A+", "remarks": "Well-organized essay on post-colonial literature."},
    {"student_id": 1, "exam_name": "Periodic Assessment 3 (January 2026)", "subject": "English Literature", "marks_obtained": 82, "total_marks": 100, "grade": "A+", "remarks": "Thoughtful response to prose and poetic devices."}
]

def seed():
    print(f"[*] Seeding {len(HISTORICAL_ASSESSMENTS)} historical assessment records to database...")
    success_count = 0
    for item in HISTORICAL_ASSESSMENTS:
        data = json.dumps(item).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8080/api/student-grades',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 201):
                    success_count += 1
        except Exception as e:
            print(f"[!] Error seeding {item['subject']} - {item['exam_name']}: {e}")
    print(f"[+] Successfully seeded {success_count}/{len(HISTORICAL_ASSESSMENTS)} assessment records!")

if __name__ == '__main__':
    seed()
