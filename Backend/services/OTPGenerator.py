

import random
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import os




# 1. Define your email details
load_dotenv()
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")



def generateOTP(Length=6):
    """Generate a random OTP of specified length."""
    digits = "0123456789"
    OTP = ""
    for _ in range(Length):
        OTP += random.choice(digits)
    return OTP
    
    
def sendOTPEmail(receiver_email: str, otp: str):
    
    RECEIVER_EMAIL = receiver_email

# 2. Construct the email message
    msg = EmailMessage()
    msg["Subject"] = "OTP Email Verification"
    msg["From"] = SENDER_EMAIL
    msg["To"] = RECEIVER_EMAIL
    msg.set_content(f"Your OTP is: {otp}\n\nPlease use this OTP to verify your email address. This OTP is valid for a limited time only. If you did not request this, please ignore this email.")

# 3. Connect to the SMTP server and send the email
    try:
    # Use port 587 for standard TLS encryption
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()  # Secure the connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        print("Email sent successfully!")
    except Exception as e:
        print(f"An error occurred: {e}")
