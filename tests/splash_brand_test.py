"""Check that every Android launch screen carries the approved mark."""
import unittest
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'
LOGO = Image.open(ROOT / 'assets' / 'android-launcher-logo.png').convert('RGB')


class SplashBrandTest(unittest.TestCase):
    def test_all_splash_variants_show_approved_mark_on_white(self):
        files = list(RES.glob('drawable*/splash.png'))
        self.assertGreaterEqual(len(files), 20)
        for file in files:
            with self.subTest(file=file.parent.name):
                image = Image.open(file).convert('RGB')
                width, height = image.size
                self.assertEqual(image.getpixel((0, 0)), (255, 255, 255))
                size = round(min(width, height) * 0.55)
                mark = image.crop(((width-size)//2, (height-size)//2, (width-size)//2+size, (height-size)//2+size))
                expected = LOGO.resize((size, size), Image.Resampling.LANCZOS)
                self.assertIsNone(ImageChops.difference(mark, expected).getbbox())


if __name__ == '__main__':
    unittest.main()
