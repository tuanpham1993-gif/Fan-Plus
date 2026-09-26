from pathlib import Path
from uuid import uuid4
from werkzeug.utils import secure_filename


def save_file(file, folder, category_id):
    if file is None or file.filename == "":
        return None

    filename = secure_filename(file.filename)

    extension = Path(filename).suffix.lower()

    new_filename = f"{uuid4()}{extension}"

    upload_dir = Path(
        "uploads"
    ) / folder / str(category_id)

    upload_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    file_path = upload_dir / new_filename

    file.save(file_path)

    return str(file_path)