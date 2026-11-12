from pathlib import Path
import sys

from PIL import Image, ImageEnhance, ImageFilter

# Derive paths from this file so the build works from any checkout location.
# Optional first argument: repository root override.
base = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
src = base / "_build" / "gojo-source.jpg"
dst = base / "_build" / "wallpaper-raw.jpg"

img = Image.open(src).convert("RGB")
print("source", img.size)
img = img.resize((2560, 1440), Image.LANCZOS)
# Soft-focus the artwork: it sits behind conversation text, so high-frequency
# detail would fight the interface. A wider blur keeps the glow and silhouette.
img = img.filter(ImageFilter.GaussianBlur(radius=11))
img = ImageEnhance.Brightness(img).enhance(0.88)
img = ImageEnhance.Color(img).enhance(1.06)
img = ImageEnhance.Contrast(img).enhance(1.02)
img.save(dst, "JPEG", quality=85, optimize=True, progressive=True)
print("saved", dst, dst.stat().st_size, Image.open(dst).size)
