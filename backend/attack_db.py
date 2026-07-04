import sqlite3
from datetime import datetime


DB_NAME = "attack_history.db"


def init_db():

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attacks (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        time TEXT,

        source_ip TEXT,

        destination_ip TEXT,

        confidence REAL,

        result TEXT

    )
    """)

    conn.commit()

    conn.close()



def save_attack(
    source_ip,
    destination_ip,
    confidence,
    result
):

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()


    cursor.execute(
        """
        INSERT INTO attacks
        (
        time,
        source_ip,
        destination_ip,
        confidence,
        result
        )

        VALUES (?,?,?,?,?)

        """,
        (
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

            source_ip,

            destination_ip,

            confidence,

            result
        )
    )


    conn.commit()

    conn.close()



if __name__ == "__main__":

    init_db()

    print("Attack Database Ready")
