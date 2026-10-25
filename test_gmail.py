
# Felix Legal Chatbot
import smtplib
import ssl
from email.message import EmailMessage

from config import Config


def main():
    username = Config.MAIL_USERNAME
    password = Config.MAIL_PASSWORD
    sender = Config.MAIL_DEFAULT_SENDER or username

    if not username or not password or not sender:
        print("ERROR: Gmail settings are missing from .env.")
        return

    recipient = input(
        "Enter the email address that should receive the test email: "
    ).strip()

    if not recipient or "@" not in recipient:
        print("ERROR: Enter a valid recipient email address.")
        return

    message = EmailMessage()
    message["Subject"] = "Felix Legal Chatbot - Gmail Test"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        "Success! Your Felix Legal Chatbot can send email through Gmail.\n\n"
        "This is a test message for the password-reset email feature."
    )

    try:
        with smtplib.SMTP(
            Config.MAIL_SERVER,
            Config.MAIL_PORT,
            timeout=15,
        ) as smtp:
            smtp.ehlo()

            if Config.MAIL_USE_TLS:
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()

            smtp.login(username, password)
            smtp.send_message(message)

        print("SUCCESS: Gmail accepted the test email for sending.")
        print("Check the recipient's inbox and spam folder.")

    except smtplib.SMTPAuthenticationError:
        print("ERROR: Gmail rejected the credentials.")
        print(
            "Check MAIL_USERNAME and MAIL_PASSWORD in .env. "
            "Use a Google App Password, not your normal Gmail password."
        )

    except (OSError, smtplib.SMTPException) as error:
        print(f"ERROR: Gmail connection or sending failed: {error}")


if __name__ == "__main__":
    main()
