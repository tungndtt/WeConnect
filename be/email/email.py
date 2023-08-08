import smtplib
import os


class EmailHandler:
    def __init__(self) -> None:
        mail_host = os.environ.get("MAIL_HOST", "smtp.gmail.com")
        mail_port = int(os.environ.get("MAIL_PORT", 587))
        email = os.environ.get("EMAIL", "weconnect-noreply@gmail.com")
        password = os.environ.get("PASSWORD", "weconnect")
        self.__email = email
        self.__server = smtplib.SMTP(mail_host, mail_port)
        self.__server.ehlo()
        self.__server.starttls()
        self.__server.login(email, password)

    def send_email(self, recipient, subject, content) -> bool:
        sender = self.__email
        receiver = recipient if isinstance(recipient, list) else [recipient]
        mail = f"""
        From: {sender}
        To: {receiver}
        Subject: {subject}
        {content}
        """
        try:
            self.__server.sendmail(sender, receiver, mail)
            return True
        except Exception as error:
            print("[Email] Cannot send the registration confirmation mail: " + error)
            return False