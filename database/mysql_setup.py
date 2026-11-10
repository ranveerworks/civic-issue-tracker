"""
===========================================================================
Civic Issue Tracker - MySQL Setup Script
Sharda University | CSCR2600 Project-Based Learning
===========================================================================

PURPOSE:
  After you reset your MySQL root password (see FIX_MYSQL.md), run this
  script to:
    1. Create the civic_issue_tracker database
    2. Create all tables
    3. Seed admin and demo citizen accounts with correct bcrypt hashes
    4. Verify everything is working

USAGE:
  python database/mysql_setup.py --password YOUR_NEW_MYSQL_PASSWORD

  Or interactively:
  python database/mysql_setup.py
===========================================================================
"""

import sys
import getpass
import pymysql
import bcrypt


def get_connection(host, port, user, password, database=None):
    kwargs = dict(host=host, port=port, user=user, password=password,
                  charset="utf8mb4", autocommit=True)
    if database:
        kwargs["database"] = database
    return pymysql.connect(**kwargs)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def run_setup(host, port, user, password):
    print("\n" + "=" * 60)
    print("  Civic Issue Tracker - MySQL Setup")
    print("=" * 60)

    # Step 1: Connect without selecting a database
    print(f"\n[1/6] Connecting to MySQL at {host}:{port} as {user}...")
    try:
        conn = get_connection(host, port, user, password)
        cur = conn.cursor()
        cur.execute("SELECT VERSION()")
        version = cur.fetchone()[0]
        print(f"      Connected! MySQL version: {version}")
    except Exception as e:
        print(f"\n  ERROR: Cannot connect to MySQL.")
        print(f"  Details: {e}")
        print(f"\n  Make sure:")
        print(f"    - MySQL service is running (MySQL80)")
        print(f"    - Password is correct")
        print(f"    - Host/port are correct ({host}:{port})")
        return False

    # Step 2: Create database
    print(f"\n[2/6] Creating database 'civic_issue_tracker'...")
    try:
        cur.execute(
            "CREATE DATABASE IF NOT EXISTS civic_issue_tracker "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        cur.execute("SHOW DATABASES LIKE 'civic_issue_tracker'")
        if cur.fetchone():
            print("      Database 'civic_issue_tracker' exists and is ready.")
        conn.close()
    except Exception as e:
        print(f"  ERROR creating database: {e}")
        return False

    # Step 3: Connect to the new database and create tables
    print(f"\n[3/6] Creating tables...")
    try:
        conn = get_connection(host, port, user, password, database="civic_issue_tracker")
        cur = conn.cursor()

        # Users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                mobile VARCHAR(20) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'citizen',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_user_role CHECK (role IN ('citizen', 'admin'))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        # Complaints table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id VARCHAR(50) NOT NULL UNIQUE,
                user_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                image_path VARCHAR(500) NULL,
                location VARCHAR(255) NOT NULL,
                latitude DECIMAL(10, 7) NULL,
                longitude DECIMAL(10, 7) NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT chk_complaint_status CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        # Complaint updates table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS complaint_updates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                updated_by_id INT NOT NULL,
                old_status VARCHAR(50) NULL,
                new_status VARCHAR(50) NOT NULL,
                note TEXT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_cu_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
                CONSTRAINT fk_cu_user FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        # Notifications table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                complaint_id INT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_notifications_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        # Indexes
        for idx_sql in [
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_complaints_complaint_id ON complaints(complaint_id)",
            "CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category)",
            "CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)",
            "CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_complaint_updates_cid ON complaint_updates(complaint_id)",
            "CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)",
        ]:
            try:
                cur.execute(idx_sql)
            except pymysql.err.OperationalError:
                pass  # Index may already exist

        cur.execute("SHOW TABLES")
        tables = [row[0] for row in cur.fetchall()]
        print(f"      Tables created: {', '.join(tables)}")
    except Exception as e:
        print(f"  ERROR creating tables: {e}")
        return False

    # Step 4: Seed demo accounts
    print(f"\n[4/6] Seeding demo accounts...")

    users_to_seed = [
        {
            "full_name": "Civic Administrator",
            "email": "admin@civictracker.gov.in",
            "mobile": "+91 9876543210",
            "password": "Admin@123",
            "role": "admin",
        },
        {
            "full_name": "Aarav Sharma",
            "email": "citizen@example.com",
            "mobile": "+91 9811223344",
            "password": "Citizen@123",
            "role": "citizen",
        },
        {
            "full_name": "Priya Verma",
            "email": "priya.v@example.com",
            "mobile": "+91 9822334455",
            "password": "Citizen@123",
            "role": "citizen",
        },
    ]

    for u in users_to_seed:
        cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (u["email"],))
        existing = cur.fetchone()
        if existing:
            # Verify the hash is correct
            if verify_password(u["password"], existing[1]):
                print(f"      {u['email']} ({u['role']}) - already exists, password OK")
            else:
                # Fix the hash
                new_hash = hash_password(u["password"])
                cur.execute("UPDATE users SET password_hash = %s WHERE email = %s",
                            (new_hash, u["email"]))
                print(f"      {u['email']} ({u['role']}) - hash was invalid, FIXED")
        else:
            pw_hash = hash_password(u["password"])
            cur.execute(
                "INSERT INTO users (full_name, email, mobile, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                (u["full_name"], u["email"], u["mobile"], pw_hash, u["role"])
            )
            print(f"      {u['email']} ({u['role']}) - created with correct bcrypt hash")

    conn.close()

    # Step 5: Verify by reconnecting and checking counts
    print(f"\n[5/6] Verifying setup...")
    try:
        conn = get_connection(host, port, user, password, database="civic_issue_tracker")
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users WHERE role='admin'")
        admins = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users WHERE role='citizen'")
        citizens = cur.fetchone()[0]
        print(f"      Users in MySQL: {admins} admin(s), {citizens} citizen(s)")

        # Verify password hashes
        cur.execute("SELECT email, password_hash FROM users WHERE email IN ('admin@civictracker.gov.in','citizen@example.com')")
        rows = cur.fetchall()
        for email, pw_hash in rows:
            test_pw = "Admin@123" if "admin" in email else "Citizen@123"
            ok = verify_password(test_pw, pw_hash)
            status = "PASS" if ok else "FAIL"
            print(f"      Password verify [{status}]: {email}")
        conn.close()
    except Exception as e:
        print(f"  ERROR during verification: {e}")
        return False

    # Step 6: Print .env update instructions
    print(f"\n[6/6] Update your backend/.env file:")
    print(f"      DATABASE_URL=mysql+pymysql://{user}:{password}@{host}:{port}/civic_issue_tracker")

    print("\n" + "=" * 60)
    print("  MySQL setup COMPLETE!")
    print("=" * 60)
    print("\n  Demo credentials:")
    print("    Admin:   admin@civictracker.gov.in  /  Admin@123")
    print("    Citizen: citizen@example.com         /  Citizen@123")
    print("\n  Next: Update backend/.env, then restart your FastAPI server.")
    print("=" * 60 + "\n")
    return True


def main():
    print("\nCivic Issue Tracker - MySQL Setup Script")
    print("-" * 40)

    # Allow --password flag
    password = None
    for i, arg in enumerate(sys.argv[1:]):
        if arg.startswith("--password="):
            password = arg.split("=", 1)[1]
        elif arg == "--password" and i + 1 < len(sys.argv) - 1:
            password = sys.argv[i + 2]

    host = "localhost"
    port = 3306
    user = "root"

    if not password:
        print("\nEnter your MySQL root password.")
        print("(This is the password you set when you installed MySQL.)")
        password = getpass.getpass("MySQL root password: ")

    run_setup(host, port, user, password)


if __name__ == "__main__":
    main()
