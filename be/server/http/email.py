import smtplib
import os


class EmailHandler:
    def __init__(self) -> None:
        mail_host = os.environ.get("MAIL_HOST", "smtp.gmail.com")
        mail_port = int(os.environ.get("MAIL_PORT", 587))
        email = os.environ.get("EMAIL", "weconnect-noreply@gmail.com")
        password = os.environ.get("PASSWORD", "weconnect")
        self._email = email
        self._server = smtplib.SMTP(mail_host, mail_port)
        self._server.ehlo()
        self._server.starttls()
        self._server.login(email, password)

    def send_email(self, recipient) -> bool:
        sender = self._email
        receiver = recipient if isinstance(recipient, list) else [recipient]
        content = f"""
        From: {sender}
        To: {receiver}
        Subject: WeConnect - Registration Confirmation
        
        <html>
            <body>
                <h5>Welcome to WeConnect community</h5>
                <p>In order to keep our community from bots, your created account must be associated with a real email</p>
                <p>Please enter this <a href=''>verfication link</a> to confirm your registration</p>
            </body>
        </html>
        """
        try:
            self._server.sendmail(sender, receiver, content)
            return True
        except Exception as error:
            print("[Email] Cannot send the registration confirmation mail: " + error)
            return False
