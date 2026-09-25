"""Importing core services does not require the HTTP runtime."""
def create_app(config=None):
    from .app import build_app
    return build_app(config)
