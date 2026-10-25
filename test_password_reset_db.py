import hashlib
import secrets
import time

from werkzeug.security import generate_password_hash, check_password_hash

from database import (
    init_auth_db,
    create_user,
    get_user_by_email,
    create_password_reset_token,
    get_valid_password_reset_token,
    reset_password_with_token,
)


def main():
    init_auth_db()

    # Use a unique test account so an existing user isn't modified.
    email = f"reset-test-{secrets.token_hex(6)}@example.com"
    original_password = "Original-Test-Password-123!"
    new_password = "Updated-Test-Password-456!"

    user_id = create_user(
        email,
        generate_password_hash(original_password),
    )

    # Support create_user implementations that return no ID.
    if not user_id:
        user = get_user_by_email(email)
        if not user:
            raise RuntimeError("Test account was not created.")
        user_id = user["id"]

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = int(time.time())

    create_password_reset_token(
        user_id,
        token_hash,
        now + 600,
    )

    valid_token = get_valid_password_reset_token(token_hash, now)
    assert valid_token is not None, "New reset token should be valid."
    assert valid_token["user_id"] == user_id

    updated = reset_password_with_token(
        token_hash,
        generate_password_hash(new_password),
        int(time.time()),
    )
    assert updated, "Password reset should succeed."

    # Confirm that the new password works.
    user = get_user_by_email(email)
    assert check_password_hash(
        user["password_hash"], new_password
    ), "The new password hash does not match."

    # Confirm the token cannot be reused.
    reused = reset_password_with_token(
        token_hash,
        generate_password_hash("Another-Test-Password-789!"),
        int(time.time()),
    )
    assert not reused, "A consumed reset token must not be reusable."

    print("SUCCESS: Reset token creation works.")
    print("SUCCESS: Token validation works.")
    print("SUCCESS: Password update works.")
    print("SUCCESS: Reset token cannot be reused.")
    print("Test account:", email)
    print("Delete the test account after testing if desired.")


if __name__ == "__main__":
    main()
