"""Render Android launcher resources from the approved square MCF logo.

Requires Pillow. Keep the original source file in assets untouched.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'android-launcher-logo.png'
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'
SCALES = {'ldpi': .75, 'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def render():
    logo = Image.open(SOURCE).convert('RGBA')
    if logo.size != (512, 512):
        raise ValueError('Expected the approved 512x512 square brand asset')
    for density, scale in SCALES.items():
        folder = RES / f'mipmap-{density}'
        folder.mkdir(parents=True, exist_ok=True)
        icon_size = round(48 * scale)
        square = logo.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        square.save(folder / 'ic_launcher.png')
        circle = Image.new('L', (icon_size, icon_size), 0)
        ImageDraw.Draw(circle).ellipse((0, 0, icon_size - 1, icon_size - 1), fill=255)
        round_icon = square.copy()
        round_icon.putalpha(circle)
        round_icon.save(folder / 'ic_launcher_round.png')

        adaptive_size = round(108 * scale)
        foreground = Image.new('RGBA', (adaptive_size, adaptive_size), (0, 0, 0, 0))
        # Android's mask can cut outside its central 66dp. Keep the entire mark inside it.
        mark_size = round(adaptive_size * 0.60)
        mark = logo.resize((mark_size, mark_size), Image.Resampling.LANCZOS)
        foreground.alpha_composite(mark, ((adaptive_size - mark_size) // 2,) * 2)
        foreground.save(folder / 'ic_launcher_foreground.png')
        Image.new('RGBA', (adaptive_size, adaptive_size), '#ffffff').save(folder / 'ic_launcher_background.png')

    for splash in RES.glob('drawable*/splash.png'):
        width, height = Image.open(splash).size
        canvas = Image.new('RGB', (width, height), '#ffffff')
        mark_size = round(min(width, height) * 0.55)
        mark = logo.convert('RGB').resize((mark_size, mark_size), Image.Resampling.LANCZOS)
        canvas.paste(mark, ((width - mark_size) // 2, (height - mark_size) // 2))
        canvas.save(splash)


if __name__ == '__main__':
    render()
