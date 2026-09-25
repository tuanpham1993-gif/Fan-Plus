from pathlib import Path
from uuid import uuid4

from flask import current_app
from werkzeug.utils import secure_filename


def save_file(file, folder, category_id):
	"""Save an uploaded file under Flask's static uploads directory.

	Returns a URL path that can be stored in ``image_url`` and served by
	Flask, or ``None`` when no file was selected.
	"""
	if file is None or not getattr(file, "filename", ""):
		return None

	filename = secure_filename(file.filename)
	if not filename:
		raise ValueError("Invalid upload filename.")

	extension = Path(filename).suffix.lower()
	safe_folder = secure_filename(str(folder))
	safe_category_id = secure_filename(str(category_id))
	if not safe_folder or not safe_category_id:
		raise ValueError("Upload folder and category ID are required.")

	static_dir = Path(current_app.static_folder)
	upload_dir = static_dir / "uploads" / safe_folder / safe_category_id
	upload_dir.mkdir(parents=True, exist_ok=True)

	new_filename = f"{uuid4()}{extension}"
	file.save(upload_dir / new_filename)

	relative_path = (upload_dir / new_filename).relative_to(static_dir)
	return f"/static/{relative_path.as_posix()}"
