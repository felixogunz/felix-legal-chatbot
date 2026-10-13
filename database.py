import sqlite3

from config import Config


def get_connection():
    """Open a connection to the SQLite database."""

    connection = sqlite3.connect(Config.DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


def init_db():
    """Create the conversation and message tables."""

    connection = get_connection()

    try:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT 'New Legal Research',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL
                    CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id)
                    REFERENCES conversations(id)
                    ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_messages_conversation
            ON messages(conversation_id, id);
            """
        )

        connection.commit()

    finally:
        connection.close()


def create_conversation(title="New Legal Research"):
    """Create a conversation and return its ID."""

    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO conversations (title)
            VALUES (?)
            """,
            (title,),
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        connection.close()


def save_message(conversation_id, role, content):
    """Save a user or assistant message."""

    if role not in ("user", "assistant"):
        raise ValueError("Invalid message role.")

    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO messages (
                conversation_id,
                role,
                content
            )
            VALUES (?, ?, ?)
            """,
            (conversation_id, role, content),
        )

        connection.execute(
            """
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (conversation_id,),
        )

        connection.commit()

    finally:
        connection.close()


def get_messages(conversation_id):
    """Retrieve messages in their original order."""

    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT role, content, created_at
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            """,
            (conversation_id,),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_conversations(limit=50):
    """Retrieve recent conversations, newest activity first."""

    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT
                c.id,
                c.title,
                c.created_at,
                c.updated_at,
                (
                    SELECT content
                    FROM messages
                    WHERE conversation_id = c.id
                      AND role = 'user'
                    ORDER BY id ASC
                    LIMIT 1
                ) AS first_message
            FROM conversations AS c
            ORDER BY c.updated_at DESC, c.id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_conversation(conversation_id):
    """Retrieve one conversation by its ID."""

    connection = get_connection()

    try:
        row = connection.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM conversations
            WHERE id = ?
            """,
            (conversation_id,),
        ).fetchone()

        return dict(row) if row else None

    finally:
        connection.close()


def rename_conversation(conversation_id, new_title):
    """Rename an existing conversation."""

    title = new_title.strip()

    if not title:
        raise ValueError("The conversation title cannot be empty.")

    if len(title) > 150:
        raise ValueError("The conversation title cannot exceed 150 characters.")

    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            UPDATE conversations
            SET title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (title, conversation_id),
        )

        connection.commit()

        return cursor.rowcount > 0

    finally:
        connection.close()


def delete_conversation(conversation_id):
    """Delete a conversation and its associated messages."""

    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            DELETE FROM conversations
            WHERE id = ?
            """,
            (conversation_id,),
        )

        connection.commit()

        return cursor.rowcount > 0

    finally:
        connection.close()
