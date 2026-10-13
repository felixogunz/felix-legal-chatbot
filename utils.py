def create_conversation_title(message, max_length=60):

    title = " ".join(message.split())

    if len(title) <= max_length:

        return title

    return title[:max_length - 3].rstrip() + "..."