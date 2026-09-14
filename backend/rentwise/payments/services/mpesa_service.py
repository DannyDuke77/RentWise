import base64
from datetime import datetime
import requests
from requests.auth import HTTPBasicAuth

from ..models import MpesaConfiguration
from ..utils.encryption import decrypt_value

class MpesaService:
    def __init__(self, configuration: MpesaConfiguration):
        self.configuration = configuration

        if configuration.environment == "production":
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"

    def get_access_token(self):
        consumer_key = self.configuration.consumer_key
        consumer_secret = decrypt_value(
            self.configuration.consumer_secret
        )

        response = requests.get(
            f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials",
            auth=HTTPBasicAuth(
                consumer_key,
                consumer_secret,
            ),
            timeout=30,
        )

        if not response.ok:
            raise Exception(
                f"M-Pesa OAuth failed: {response.status_code} - {response.text}"
            )

        return response.json()["access_token"]

    def initiate_stk_push(self, *, phone_number, amount, account_reference, transaction_description, callback_url):
        access_token = self.get_access_token()
        if not access_token:
            return {"error": "Failed to generate access token"}

        passkey = decrypt_value(self.configuration.passkey)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

        password_data = (
            f"{self.configuration.shortcode}"
            f"{passkey}"
            f"{timestamp}"
        )

        password = base64.b64encode(password_data.encode()).decode()

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "BusinessShortCode": self.configuration.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.configuration.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_description,
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30,
        )

        if not response.ok:
            raise Exception(
                f"M-Pesa STK Push failed: "
                f"{response.status_code} - {response.text}"
            )

        return response.json()