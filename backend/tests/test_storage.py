from pathlib import Path

from app.storage import resolve_uploads_directory


def test_upload_directory_falls_back_when_configured_path_is_not_writable(monkeypatch, tmp_path: Path) -> None:
    blocked_path = tmp_path / "blocked"
    blocked_path.write_text("not a directory", encoding="utf-8")
    fallback_root = tmp_path / "temporary"
    monkeypatch.setenv("UPLOADS_DIRECTORY", str(blocked_path))
    monkeypatch.setattr("app.storage.tempfile.gettempdir", lambda: str(fallback_root))

    resolved = resolve_uploads_directory()

    assert resolved == fallback_root / "drugspot-uploads"
    assert resolved.is_dir()


def test_upload_directory_is_verified_without_leaving_probe_files(monkeypatch, tmp_path: Path) -> None:
    uploads = tmp_path / "uploads"
    monkeypatch.setenv("UPLOADS_DIRECTORY", str(uploads))

    resolved = resolve_uploads_directory()

    assert resolved == uploads
    assert list(uploads.iterdir()) == []
