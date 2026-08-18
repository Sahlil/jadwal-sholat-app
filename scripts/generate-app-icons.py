#!/usr/bin/env python3
"""
Menghasilkan asset ikon aplikasi Jadwal Sholat.

Desain: bulan sabit + bintang putih di atas latar gradasi teal (warna brand).
Output (semua 1024x1024):
  - assets/images/icon.png                       (opaque, legacy/iOS)
  - assets/images/android-icon-foreground.png    (transparan, art di safe zone)
  - assets/images/android-icon-background.png    (gradasi teal opaque)
  - assets/images/android-icon-monochrome.png    (solid putih untuk themed icon)
  - assets/images/splash-icon.png                (transparan, logo brand utk splash screen)

Jalankan: python3 scripts/generate-app-icons.py
"""
import os

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT_DIR = os.path.join(ROOT, "assets", "images")

SIZE = 1024
GRAD_TOP = (23, 165, 150)     # #17A596
GRAD_BOTTOM = (15, 118, 110)  # #0F766E
WHITE = (255, 255, 255, 255)

# Offset & skala komposisi (bulan sabit + bintang) relatif ke pusat.
CRESCENT = {"dx": -0.06, "dy": 0.03, "radius": 0.24, "shift": 0.34}
STAR = {"dx": 0.16, "dy": -0.17, "radius": 0.095}


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_background(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        color = lerp(GRAD_TOP, GRAD_BOTTOM, t)
        for x in range(size):
            px[x, y] = color
    return img


def draw_star(draw, cx, cy, r, color):
    outer = r
    inner = r * 0.42
    points = []
    for i in range(10):
        ang = -90 + i * 36
        rad = outer if i % 2 == 0 else inner
        import math

        points.append((cx + rad * math.cos(math.radians(ang)), cy + rad * math.sin(math.radians(ang))))
    draw.polygon(points, fill=color)


def compose_art(size, scale, color):
    """Render bulan sabit + bintang berwarna `color` di tengah kanvas transparan."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Supersampling 4x untuk tepi halus.
    ss = 4
    hi = Image.new("RGBA", (size * ss, size * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(hi)
    c = size / 2

    # Bulan sabit: lingkaran luar dikurangi lingkaran dalam (mask anti-aliasing).
    R = CRESCENT["radius"] * size * scale * ss
    cx = (c + CRESCENT["dx"] * size * scale) * ss
    cy = (c + CRESCENT["dy"] * size * scale) * ss
    shift = R * CRESCENT["shift"]

    moon = Image.new("L", (size * ss, size * ss), 0)
    md = ImageDraw.Draw(moon)
    md.ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
    md.ellipse([cx + shift - R, cy - R, cx + shift + R, cy + R], fill=0)
    moon = moon.resize((size, size), Image.LANCZOS)

    art = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    art.paste((*color[:3], 255), (0, 0), moon)

    # Bintang.
    star_hi = Image.new("RGBA", (size * ss, size * ss), (0, 0, 0, 0))
    sd = ImageDraw.Draw(star_hi)
    sr = STAR["radius"] * size * scale * ss
    draw_star(sd, (c + STAR["dx"] * size * scale) * ss, (c + STAR["dy"] * size * scale) * ss, sr, (*color[:3], 255))
    star_hi = star_hi.resize((size, size), Image.LANCZOS)
    art.alpha_composite(star_hi)
    return art


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # 1. icon.png — opaque: gradient bg + white art, full square.
    bg = gradient_background(SIZE).convert("RGBA")
    icon = bg.copy()
    icon.alpha_composite(compose_art(SIZE, 0.68, WHITE))
    icon.convert("RGB").save(os.path.join(OUT_DIR, "icon.png"))
    print("icon.png")

    # 2. android-icon-foreground.png — transparent, art dalam safe zone 66%.
    fg = compose_art(SIZE, 0.72, WHITE)
    fg.save(os.path.join(OUT_DIR, "android-icon-foreground.png"))
    print("android-icon-foreground.png")

    # 3. android-icon-background.png — gradient teal opaque.
    gradient_background(SIZE).convert("RGB").save(os.path.join(OUT_DIR, "android-icon-background.png"))
    print("android-icon-background.png")

    # 4. android-icon-monochrome.png — solid putih untuk themed icon.
    mono = compose_art(SIZE, 0.72, WHITE)
    mono.save(os.path.join(OUT_DIR, "android-icon-monochrome.png"))
    print("android-icon-monochrome.png")

    # 5. splash-icon.png — logo brand (bulan sabit + bintang putih) transparan,
    #    ditampilkan di atas latar teal pada splash screen.
    splash = compose_art(SIZE, 0.5, WHITE)
    splash.save(os.path.join(OUT_DIR, "splash-icon.png"))
    print("splash-icon.png")


if __name__ == "__main__":
    main()
