import sqlite3
from contextlib import contextmanager
import time
import psycopg
from psycopg.rows import dict_row

from config import Config


# Felix Legal Chatbot

DEFAULT_CONVERSATION_TITLE = "New Legal Research"
MAX_CONVERSATION_TITLE_LENGTH = 150
MAX_HISTORY_LIMIT = 500


def using_postgres():
    """Check whether PostgreSQL is configured."""
    return bool(Config.DATABASE_URL)


def get_connection():
    """Connect to PostgreSQL or the configured SQLite database."""

    if using_postgres():
        return psycopg.connect(
            Config.DATABASE_URL,
            row_factory=dict_row,
            connect_timeout=10,
        )

    connection = sqlite3.connect(
        str(Config.DATABASE_PATH),
        timeout=10,
    )

    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")

    return connection


def execute_query(connection, query, parameters=()):
    """
    Execute parameterised SQL using the appropriate placeholder style.

    Keep SQL statements compatible with both SQLite and PostgreSQL.
    """

    if using_postgres():
        query = query.replace("?", "%s")

    return connection.execute(query, parameters)


@contextmanager
def _database_connection(write=False):
    """Manage connection cleanup and transaction failure handling."""

    connection = get_connection()

    try:
        yield connection

        if write:
            connection.commit()

    except Exception:
        if write:
            connection.rollback()
        raise

    finally:
        connection.close()


def _normalise_owner_id(owner_id):
    """
    Normalise a trusted application-supplied owner identifier.

    None represents an unowned legacy conversation. Never obtain
    an authenticated owner's identity directly from request JSON.
    """

    if owner_id is None:
        return None

    if isinstance(owner_id, bool):
        raise ValueError("Invalid conversation owner.")

    owner_id = str(owner_id).strip()

    if not owner_id or len(owner_id) > 255:
        raise ValueError("Invalid conversation owner.")

    return owner_id


def _owner_condition(owner_id, table_alias=None):
    """Build a fixed, parameterised ownership condition."""

    owner_column = "owner_id"

    if table_alias:
        owner_column = f"{table_alias}.owner_id"

    if owner_id is None:
        return f"{owner_column} IS NULL", ()

    return f"{owner_column} = ?", (owner_id,)


def _validate_title(title):
    """Validate a conversation title."""

    if not isinstance(title, str):
        raise ValueError("The conversation title must be text.")

    title = title.strip()

    if not title:
        raise ValueError("The conversation title cannot be empty.")

    if len(title) > MAX_CONVERSATION_TITLE_LENGTH:
        raise ValueError(
            "The conversation title cannot exceed "
            f"{MAX_CONVERSATION_TITLE_LENGTH} characters."
        )

    return title


def _validate_message(role, content):
    """Validate message role and content."""

    if role not in ("user", "assistant"):
        raise ValueError("Invalid message role.")

    if not isinstance(content, str) or not content.strip():
        raise ValueError("Message content cannot be empty.")

    return content


def _validate_conversation_id(conversation_id):
    """Validate a conversation identifier."""

    if isinstance(conversation_id, bool):
        raise ValueError("Invalid conversation ID.")

    try:
        conversation_id = int(conversation_id)
    except (TypeError, ValueError):
        raise ValueError("Invalid conversation ID.") from None

    if conversation_id <= 0:
        raise ValueError("Invalid conversation ID.")

    return conversation_id


def _validate_limit(limit, default=50):
    """Validate pagination limits."""

    if limit is None:
        limit = default

    if isinstance(limit, bool):
        raise ValueError("Invalid result limit.")

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        raise ValueError("Invalid result limit.") from None

    if not 1 <= limit <= MAX_HISTORY_LIMIT:
        raise ValueError(
            f"The result limit must be between 1 and "
            f"{MAX_HISTORY_LIMIT}."
        )

    return limit


def _ensure_owner_column(connection):
    """Add owner_id to existing databases without deleting data."""

    if using_postgres():
        execute_query(
            connection,
            """
            ALTER TABLE conversations
            ADD COLUMN IF NOT EXISTS owner_id TEXT
            """,
        )
        return

    columns = connection.execute(
        "PRAGMA table_info(conversations)"
    ).fetchall()

    column_names = {row["name"] for row in columns}

    if "owner_id" not in column_names:
        connection.execute(
            "ALTER TABLE conversations ADD COLUMN owner_id TEXT"
        )


def init_db():
    """Create tables, migrate ownership and add useful indexes."""

    with _database_connection(write=True) as connection:
        execute_query(
            connection,
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'New Legal Research',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                owner_id TEXT
            )
            """ if using_postgres() else """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT 'New Legal Research',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                owner_id TEXT
            )
            """,
        )

        _ensure_owner_column(connection)

        execute_query(
            connection,
            """
            CREATE TABLE IF NOT EXISTS messages (
                id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                conversation_id BIGINT NOT NULL,
                role TEXT NOT NULL
                    CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id)
                    REFERENCES conversations(id)
                    ON DELETE CASCADE
            )
            """ if using_postgres() else """
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
            )
            """,
        )

        execute_query(
            connection,
            """
            CREATE INDEX IF NOT EXISTS idx_messages_conversation
            ON messages(conversation_id, id)
            """,
        )

        execute_query(
            connection,
            """
            CREATE INDEX IF NOT EXISTS idx_conversations_owner_updated
            ON conversations(owner_id, updated_at, id)
            """,
        )

def init_auth_db():
    """Create authentication and password-reset tables."""

    from config import Config

    connection = get_connection()

    try:
        if Config.DATABASE_URL:
            # Users table for PostgreSQL
            execute_query(
                connection,
                """
                CREATE TABLE IF NOT EXISTS users (
                    id BIGSERIAL PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL
                        DEFAULT CURRENT_TIMESTAMP
                )
                """,
            )

            # Password-reset tokens for PostgreSQL
            execute_query(
                connection,
                """
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
                    token_hash TEXT NOT NULL UNIQUE,
                    expires_at BIGINT NOT NULL,
                    used_at BIGINT
                )
                """,
            )

        else:
            # Users table for SQLite
            execute_query(
                connection,
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                        DEFAULT CURRENT_TIMESTAMP
                )
                """,
            )

            # Password-reset tokens for SQLite
            execute_query(
                connection,
                """
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
                    token_hash TEXT NOT NULL UNIQUE,
                    expires_at INTEGER NOT NULL,
                    used_at INTEGER
                )
                """,
            )

        
        # Guest access sessions
        execute_query(
            connection,
            """
            CREATE TABLE IF NOT EXISTS guest_sessions (
                guest_id TEXT PRIMARY KEY,
                started_at BIGINT NOT NULL,
                expires_at BIGINT NOT NULL,
                messages_used INTEGER NOT NULL DEFAULT 0
            )
            """,
        )

        # Index for looking up reset tokens by user
        execute_query(
            connection,
            """
            CREATE INDEX IF NOT EXISTS idx_password_reset_user
            ON password_reset_tokens(user_id)
            """,
        )

        connection.commit()


    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()



def _normalise_email(email):
    """Validate and normalise an email address for database operations."""

    if not isinstance(email, str):
        raise ValueError("A valid email address is required.")

    email = email.strip().lower()

    if (
        not email
        or len(email) > 254
        or "@" not in email
        or any(character.isspace() for character in email)
    ):
        raise ValueError("A valid email address is required.")

    return email


def create_user(email, password_hash):
    """Create a user and return their database ID."""

    email = _normalise_email(email)

    if not isinstance(password_hash, str) or not password_hash:
        raise ValueError("A valid password hash is required.")

    with _database_connection(write=True) as connection:
        cursor = execute_query(
            connection,
            """
            INSERT INTO users (email, password_hash)
            VALUES (?, ?)
            RETURNING id
            """,
            (email, password_hash),
        )

        row = cursor.fetchone()

        if row is None:
            raise RuntimeError("User creation failed.")

        return row["id"] if isinstance(row, dict) else row[0]


def get_user_by_email(email):
    """Find a user by their normalised email address."""

    email = _normalise_email(email)

    with _database_connection() as connection:
        cursor = execute_query(
            connection,
            """
            SELECT id, email, password_hash
            FROM users
            WHERE LOWER(email) = ?
            LIMIT 1
            """,
            (email,),
        )

        row = cursor.fetchone()

        return dict(row) if row else None


def get_user_by_id(user_id):
    """Find a user by ID without exposing their password hash."""

    if isinstance(user_id, bool) or user_id is None:
        return None

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    if user_id <= 0:
        return None

    with _database_connection() as connection:
        cursor = execute_query(
            connection,
            """
            SELECT id, email
            FROM users
            WHERE id = ?
            LIMIT 1
            """,
            (user_id,),
        )

        row = cursor.fetchone()

        return dict(row) if row else None


# Felix Legal Chatbot
def create_password_reset_token(user_id, token_hash, expires_at):
    """Store a hashed, expiring password-reset token."""

    connection = get_connection()

    try:
        now = int(time.time())

        # Invalidate any previous unused reset links for this user.
        execute_query(
            connection,
            """
            UPDATE password_reset_tokens
            SET used_at = ?
            WHERE user_id = ? AND used_at IS NULL
            """,
            (now, user_id),
        )

        execute_query(
            connection,
            """
            INSERT INTO password_reset_tokens (
                user_id, token_hash, expires_at
            )
            VALUES (?, ?, ?)
            """,
            (user_id, token_hash, int(expires_at)),
        )

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def get_valid_password_reset_token(token_hash, now):
    """Return a valid reset-token record, or None."""

    connection = get_connection()

    try:
        cursor = execute_query(
            connection,
            """
            SELECT user_id
            FROM password_reset_tokens
            WHERE token_hash = ?
              AND used_at IS NULL
              AND expires_at > ?
            LIMIT 1
            """,
            (token_hash, int(now)),
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return {"user_id": row["user_id"]}

    finally:
        connection.close()


def reset_password_with_token(token_hash, password_hash, now):
    """Consume a valid reset token and update the password."""

    connection = get_connection()

    try:
        # Find an unused, unexpired token.
        cursor = execute_query(
            connection,
            """
            SELECT user_id
            FROM password_reset_tokens
            WHERE token_hash = ?
              AND used_at IS NULL
              AND expires_at > ?
            LIMIT 1
            """,
            (token_hash, int(now)),
        )

        row = cursor.fetchone()

        if row is None:
            connection.rollback()
            return False

        user_id = row["user_id"]

        # Consume the token. The condition prevents reuse.
        cursor = execute_query(
            connection,
            """
            UPDATE password_reset_tokens
            SET used_at = ?
            WHERE token_hash = ?
              AND used_at IS NULL
              AND expires_at > ?
            """,
            (int(now), token_hash, int(now)),
        )

        if cursor.rowcount != 1:
            connection.rollback()
            return False

        # Update the account's password hash.
        cursor = execute_query(
            connection,
            """
            UPDATE users
            SET password_hash = ?
            WHERE id = ?
            """,
            (password_hash, user_id),
        )

        if cursor.rowcount != 1:
            raise RuntimeError(
                "The account password could not be updated."
            )

        # Invalidate any other unused reset links for this user.
        execute_query(
            connection,
            """
            UPDATE password_reset_tokens
            SET used_at = ?
            WHERE user_id = ?
              AND used_at IS NULL
            """,
            (int(now), user_id),
        )

        connection.commit()
        return True

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()




def create_conversation(
    title=DEFAULT_CONVERSATION_TITLE,
    owner_id=None,
):
    """Create a conversation and return its ID."""

    title = _validate_title(title)
    owner_id = _normalise_owner_id(owner_id)

    with _database_connection(write=True) as connection:
        if using_postgres():
            cursor = execute_query(
                connection,
                """
                INSERT INTO conversations (title, owner_id)
                VALUES (?, ?)
                RETURNING id
                """,
                (title, owner_id),
            )

            row = cursor.fetchone()
            conversation_id = row["id"]

        else:
            cursor = execute_query(
                connection,
                """
                INSERT INTO conversations (title, owner_id)
                VALUES (?, ?)
                """,
                (title, owner_id),
            )

            conversation_id = cursor.lastrowid

    return conversation_id


def save_message(
    conversation_id,
    role,
    content,
    owner_id=None,
):
    """Save a message only if the conversation belongs to the owner."""

    conversation_id = _validate_conversation_id(conversation_id)
    content = _validate_message(role, content)
    owner_id = _normalise_owner_id(owner_id)

    owner_sql, owner_parameters = _owner_condition(owner_id)

    with _database_connection(write=True) as connection:
        cursor = execute_query(
            connection,
            f"""
            INSERT INTO messages (
                conversation_id,
                role,
                content
            )
            SELECT id, ?, ?
            FROM conversations
            WHERE id = ?
              AND {owner_sql}
            """,
            (
                role,
                content,
                conversation_id,
                *owner_parameters,
            ),
        )

        if cursor.rowcount != 1:
            raise LookupError("Conversation not found.")

        execute_query(
            connection,
            f"""
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND {owner_sql}
            """,
            (conversation_id, *owner_parameters),
        )


def get_messages(
    conversation_id,
    limit=None,
    owner_id=None,
):
    """
    Retrieve messages in chronological order.

    When limit is supplied, return the most recent messages while
    preserving their original order in the returned list.
    """

    conversation_id = _validate_conversation_id(conversation_id)
    owner_id = _normalise_owner_id(owner_id)

    owner_sql, owner_parameters = _owner_condition(owner_id)

    with _database_connection() as connection:
        if limit is None:
            rows = execute_query(
                connection,
                f"""
                SELECT m.role, m.content, m.created_at
                FROM messages AS m
                JOIN conversations AS c
                  ON c.id = m.conversation_id
                WHERE c.id = ?
                  AND {owner_sql}
                ORDER BY m.id ASC
                """,
                (conversation_id, *owner_parameters),
            ).fetchall()

        else:
            limit = _validate_limit(limit)

            rows = execute_query(
                connection,
                f"""
                SELECT role, content, created_at
                FROM (
                    SELECT m.id, m.role, m.content, m.created_at
                    FROM messages AS m
                    JOIN conversations AS c
                      ON c.id = m.conversation_id
                    WHERE c.id = ?
                      AND {owner_sql}
                    ORDER BY m.id DESC
                    LIMIT ?
                ) AS recent_messages
                ORDER BY id ASC
                """,
                (
                    conversation_id,
                    *owner_parameters,
                    limit,
                ),
            ).fetchall()

        return [dict(row) for row in rows]


def get_conversations(limit=50, owner_id=None):
    """Retrieve recent conversations belonging to the specified owner."""

    limit = _validate_limit(limit)
    owner_id = _normalise_owner_id(owner_id)

    owner_sql, owner_parameters = _owner_condition(owner_id, "c")

    with _database_connection() as connection:
        rows = execute_query(
            connection,
            f"""
            SELECT
                c.id,
                c.title,
                c.created_at,
                c.updated_at,
                (
                    SELECT m.content
                    FROM messages AS m
                    WHERE m.conversation_id = c.id
                      AND m.role = 'user'
                    ORDER BY m.id ASC
                    LIMIT 1
                ) AS first_message
            FROM conversations AS c
            WHERE {owner_sql}
            ORDER BY c.updated_at DESC, c.id DESC
            LIMIT ?
            """,
            (*owner_parameters, limit),
        ).fetchall()

        return [dict(row) for row in rows]


def get_conversation(conversation_id, owner_id=None):
    """Retrieve one conversation, scoped to its owner."""

    conversation_id = _validate_conversation_id(conversation_id)
    owner_id = _normalise_owner_id(owner_id)

    owner_sql, owner_parameters = _owner_condition(owner_id)

    with _database_connection() as connection:
        row = execute_query(
            connection,
            f"""
            SELECT id, title, created_at, updated_at
            FROM conversations
            WHERE id = ?
              AND {owner_sql}
            """,
            (conversation_id, *owner_parameters),
        ).fetchone()

        return dict(row) if row else None


def rename_conversation(
    conversation_id,
    new_title,
    owner_id=None,
):
    """Rename a conversation only if it belongs to the owner."""

    conversation_id = _validate_conversation_id(conversation_id)
    title = _validate_title(new_title)
    owner_id = _normalise_owner_id(owner_id)

    owner_sql, owner_parameters = _owner_condition(owner_id)

    with _database_connection(write=True) as connection:
        cursor = execute_query(
            connection,
            f"""
            UPDATE conversations
            SET title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND {owner_sql}
            """,
            (title, conversation_id, *owner_parameters),
        )

        return cursor.rowcount > 0


def delete_conversation(conversation_id, owner_id=None):
    """Delete a conversation and its messages, restricted to its owner."""

    conversation_id = _validate_conversation_id(conversation_id)
    owner_id = _normalise_owner_id(owner_id)

    owner_sql, owner_parameters = _owner_condition(owner_id)

    with _database_connection(write=True) as connection:
        cursor = execute_query(
            connection,
            f"""
            DELETE FROM conversations
            WHERE id = ?
              AND {owner_sql}
            """,
            (conversation_id, *owner_parameters),
        )

        return cursor.rowcount > 0


# Felix Legal Chatbot

def create_guest_session(guest_id, started_at, expires_at):
    """Create a guest session with a fixed expiry time."""
    with _database_connection(write=True) as connection:
        execute_query(
            connection,
            """
            INSERT INTO guest_sessions (
                guest_id, started_at, expires_at, messages_used
            )
            VALUES (?, ?, ?, 0)
            """,
            (guest_id, int(started_at), int(expires_at)),
        )


def get_guest_session(guest_id):
    """Retrieve a guest session from the database."""
    if (
        not isinstance(guest_id, str)
        or not guest_id
        or len(guest_id) > 128
    ):
        return None

    with _database_connection() as connection:
        row = execute_query(
            connection,
            """
            SELECT guest_id, started_at, expires_at, messages_used
            FROM guest_sessions
            WHERE guest_id = ?
            LIMIT 1
            """,
            (guest_id,),
        ).fetchone()

        return dict(row) if row else None


def consume_guest_message(guest_id, now, max_messages=30):
    """Count a message only while the guest's allowance remains valid."""
    with _database_connection(write=True) as connection:
        cursor = execute_query(
            connection,
            """
            UPDATE guest_sessions
            SET messages_used = messages_used + 1
            WHERE guest_id = ?
              AND expires_at > ?
              AND messages_used < ?
            """,
            (guest_id, int(now), int(max_messages)),
        )

        return cursor.rowcount == 1
