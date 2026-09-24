"""Fan Hub Plus. Importing domain modules does not initialize Flask or a database."""
def create_app(config_override=None):
    from .factory import build_app
    return build_app(config_override)
