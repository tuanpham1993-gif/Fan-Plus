class DomainError(Exception):
    def __init__(self, code: str, message: str, status: int = 400, fields=None):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status
        self.fields = fields or {}
