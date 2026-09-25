class MpesaError(Exception):
    default_message = "M-Pesa is unavailable right now."

    def __init__(self, message: str | None = None):
        super().__init__(message or self.default_message)


class MpesaNotConfigured(MpesaError):
    default_message = "M-Pesa is not configured for this business."

class MpesaDisabled(MpesaError):
    default_message = "M-Pesa payments are currently disabled for this business."

class MpesaInitiationFailed(MpesaError):
    default_message = "Could not start the M-Pesa payment. Please try again."