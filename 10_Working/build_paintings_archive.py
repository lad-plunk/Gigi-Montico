"""Build the public paintings-photo archive from a read-only source folder."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageCms, ImageOps


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = REPOSITORY_ROOT / "assets" / "archive" / "montico-paintings"
PREVIEW_ROOT = OUTPUT_ROOT / "previews"
FULL_ROOT = OUTPUT_ROOT / "full"
JSON_PATH = REPOSITORY_ROOT / "assets" / "data" / "paintings-archive.json"
JS_PATH = REPOSITORY_ROOT / "assets" / "data" / "paintings-archive.js"
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png"}


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="External read-only source folder")
    parser.add_argument("--preview-edge", type=int, default=520)
    parser.add_argument("--full-edge", type=int, default=1800)
    parser.add_argument("--preview-quality", type=int, default=72)
    parser.add_argument("--full-quality", type=int, default=82)
    return parser.parse_args()


def natural_key(path: Path) -> list[object]:
    import re

    return [int(part) if part.isdigit() else part.casefold() for part in re.split(r"(\d+)", path.name)]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def to_srgb(image: Image.Image) -> Image.Image:
    icc = image.info.get("icc_profile")
    if icc:
        try:
            source_profile = ImageCms.ImageCmsProfile(__import__("io").BytesIO(icc))
            target_profile = ImageCms.createProfile("sRGB")
            image = ImageCms.profileToProfile(image, source_profile, target_profile, outputMode="RGBA" if image.mode == "RGBA" else "RGB")
        except (ImageCms.PyCMSError, OSError, ValueError):
            pass

    if image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        background = Image.new("RGB", rgba.size, "white")
        background.paste(rgba, mask=rgba.getchannel("A"))
        return background
    return image.convert("RGB")


def resized(image: Image.Image, max_edge: int) -> Image.Image:
    result = image.copy()
    result.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    return result


def save_webp(image: Image.Image, target: Path, quality: int) -> None:
    image.save(target, "WEBP", quality=quality, method=6, optimize=True)


def main() -> None:
    args = arguments()
    source = args.source.resolve()
    if not source.is_dir():
        raise SystemExit(f"Source folder does not exist: {source}")
    if source == REPOSITORY_ROOT or REPOSITORY_ROOT in source.parents:
        raise SystemExit("The source must remain external to the repository.")

    source_files = sorted(
        (path for path in source.iterdir() if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES),
        key=natural_key,
    )
    if not source_files:
        raise SystemExit("No supported images found.")

    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    FULL_ROOT.mkdir(parents=True, exist_ok=True)
    for folder in (PREVIEW_ROOT, FULL_ROOT):
        for stale in folder.glob("*.webp"):
            stale.unlink()

    items: list[dict[str, object]] = []
    for index, source_path in enumerate(source_files, start=1):
        identifier = f"GM-{index:04d}"
        filename = f"{identifier.lower()}.webp"
        preview_path = PREVIEW_ROOT / filename
        full_path = FULL_ROOT / filename

        with Image.open(source_path) as opened:
            image = to_srgb(ImageOps.exif_transpose(opened))
            width, height = image.size
            preview = resized(image, args.preview_edge)
            full = resized(image, args.full_edge)
            save_webp(preview, preview_path, args.preview_quality)
            save_webp(full, full_path, args.full_quality)

        items.append(
            {
                "id": identifier,
                "sourceFile": source_path.name,
                "sourceSha256": sha256(source_path),
                "width": width,
                "height": height,
                "previewWidth": preview.width,
                "previewHeight": preview.height,
                "fullWidth": full.width,
                "fullHeight": full.height,
                "previewPath": f"assets/archive/montico-paintings/previews/{filename}",
                "fullPath": f"assets/archive/montico-paintings/full/{filename}",
                "previewBytes": preview_path.stat().st_size,
                "fullBytes": full_path.stat().st_size,
            }
        )

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    manifest = {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "source": "External read-only reference-artworks folder supplied by the owner",
        "total": len(items),
        "profile": {
            "format": "WebP",
            "previewMaxEdge": args.preview_edge,
            "previewQuality": args.preview_quality,
            "fullMaxEdge": args.full_edge,
            "fullQuality": args.full_quality,
            "resize": "Lanczos; no crop; no upscale; EXIF orientation applied; metadata stripped",
        },
        "items": items,
    }
    payload = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    JSON_PATH.write_text(payload, encoding="utf-8")
    JS_PATH.write_text("window.PAINTINGS_ARCHIVE = " + payload.rstrip() + ";\n", encoding="utf-8")

    preview_bytes = sum(int(item["previewBytes"]) for item in items)
    full_bytes = sum(int(item["fullBytes"]) for item in items)
    print(f"Generated {len(items)} image pairs")
    print(f"Previews: {preview_bytes / 1024 / 1024:.1f} MiB")
    print(f"Full: {full_bytes / 1024 / 1024:.1f} MiB")
    print(f"Total derivatives: {(preview_bytes + full_bytes) / 1024 / 1024:.1f} MiB")


if __name__ == "__main__":
    main()
