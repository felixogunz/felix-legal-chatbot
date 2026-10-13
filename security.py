def validate_message(message, max_length=10000):
    if not isinstance(message, str):
        return False, "Message must be text."

    message = message.strip()

    if not message:
        return False, "Please enter a message."

    if len(message) > max_length:
        return (
            False,
            f"Your message cannot exceed {max_length} characters."
        )

    return True, message