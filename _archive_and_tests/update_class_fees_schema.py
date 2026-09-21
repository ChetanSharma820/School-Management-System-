import psycopg2
import os

DB_HOST = "db.xzmirtkasmtuadvyslri.supabase.co"
DB_PORT = 5432
DB_USER = "postgres"
DB_PASSWORD = "chetan9166sharma"
DB_NAME = "postgres"

def run_migration():
    print("[*] Connecting to Supabase PostgreSQL database...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        sslmode="require"
    )
    conn.autocommit = True
    cursor = conn.cursor()

    print("[*] Adding base_fee column to classes table...")
    cursor.execute("""
    ALTER TABLE public.classes 
        ADD COLUMN IF NOT EXISTS base_fee NUMERIC DEFAULT 45000;
    
    COMMENT ON COLUMN public.classes.base_fee IS 'Standard academic annual/semester fee for this grade and section batch';
    """)

    print("[*] Updating existing classes with realistic base fee amounts...")
    cursor.execute("""
    UPDATE public.classes 
    SET base_fee = CASE 
        WHEN class_name ILIKE '%9%' THEN 40000
        WHEN class_name ILIKE '%10%' THEN 45000
        WHEN class_name ILIKE '%11%' THEN 52000
        WHEN class_name ILIKE '%12%' THEN 58000
        ELSE 45000
    END
    WHERE base_fee IS NULL OR base_fee = 45000;
    """)

    print("[*] Verifying classes with their base_fee:")
    cursor.execute("SELECT id, class_name, section, base_fee, teacher_id FROM public.classes ORDER BY id ASC;")
    rows = cursor.fetchall()
    for r in rows:
        print(f"  Class #{r[0]}: {r[1]} - Sec {r[2]} | Base Fee: INR {r[3]} | Teacher ID: {r[4]}")

    print("[*] Ensuring student_fees reflect class base fees...")
    cursor.execute("""
    UPDATE public.student_fees sf
    SET gross_amount = c.base_fee,
        net_payable = c.base_fee - COALESCE(sf.discount_amount, 0) + COALESCE(sf.late_fine, 0),
        balance_due = GREATEST(0, (c.base_fee - COALESCE(sf.discount_amount, 0) + COALESCE(sf.late_fine, 0)) - COALESCE(sf.amount_paid, 0)),
        payment_status = CASE 
            WHEN COALESCE(sf.amount_paid, 0) >= (c.base_fee - COALESCE(sf.discount_amount, 0) + COALESCE(sf.late_fine, 0)) THEN 'Paid'
            WHEN COALESCE(sf.amount_paid, 0) > 0 THEN 'Partial'
            ELSE 'Pending'
        END
    FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE sf.student_id = s.id AND c.base_fee IS NOT NULL;
    """)

    print("[*] Reloading PostgREST schema cache...")
    cursor.execute("NOTIFY pgrst, 'reload schema';")

    cursor.close()
    conn.close()
    print("[SUCCESS] Class base_fee migration completed successfully!")

if __name__ == "__main__":
    run_migration()
