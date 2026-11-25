"""Builds the portfolio portrait assets from one photo.
usage: python make_assets.py <input.png> <out_dir>
Outputs (transparent PNGs):
  cutout.png        colour cut-out, punchy grade (sticker in the Identity strip)
  photo.png         colour cut-out for the About selection box
  illustration.png  black ink line-art (replaces the O in PORTFOLIO)
"""
import sys
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove, new_session

src, out = sys.argv[1], sys.argv[2]
SCALE = 4

im = Image.open(src).convert("RGB")
# Upscale (the source is tiny) and sharpen a little
big = im.resize((im.width * SCALE, im.height * SCALE), Image.LANCZOS)
big = big.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=2))

# ---- background removal ----
session = new_session("u2net_human_seg")
rgba = remove(big, session=session, post_process_mask=True)
alpha = np.array(rgba)[:, :, 3]

# keep only the largest connected blob (drops the other person's shoulder at the left edge)
_, bw = cv2.threshold(alpha, 40, 255, cv2.THRESH_BINARY)
n, labels, stats, _ = cv2.connectedComponentsWithStats(bw)
if n > 1:
    biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    keep = (labels == biggest).astype(np.uint8)
    keep = cv2.dilate(keep, np.ones((5, 5), np.uint8))
    alpha = (alpha * keep).astype(np.uint8)
rgb = np.array(big)
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
H, S, V = hsv[:, :, 0].astype(int), hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
m = (alpha > 128).astype(np.uint8)

# 1) wall art sitting on top of the head: per column, drop everything above the first hair (dark) pixel
hair = (V < 70) & (m > 0)
h_img = m.shape[0]
for x in range(m.shape[1]):
    col = np.where(hair[: int(h_img * 0.45), x])[0]
    if len(col):
        m[: col[0], x] = 0
    else:
        m[: int(h_img * 0.18), x] = 0  # columns with no hair: clear the very top
# 2) bright yellow / saturated wall colours (skin is never this yellow)
m[(H >= 22) & (H <= 40) & (S > 120) & (V > 150)] = 0
m[((H >= 160) | (H <= 4)) & (S > 110) & (V > 90) & (V < 200) & (np.arange(h_img)[:, None] < h_img * 0.3)] = 0
# 3) thin squiggles: morphological opening removes strokes thinner than the kernel
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
# keep the biggest blob again and fill small holes
n, labels, stats, _ = cv2.connectedComponentsWithStats(m)
if n > 1:
    m = (labels == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
alpha = np.minimum(alpha, m * 255).astype(np.uint8)
# soften the mask edge slightly
alpha = cv2.GaussianBlur(alpha, (5, 5), 0)

def crop_to_alpha(img_rgba: np.ndarray, pad: int = 6) -> Image.Image:
    a = img_rgba[:, :, 3]
    ys, xs = np.where(a > 10)
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + pad)
    return Image.fromarray(img_rgba[y0:y1, x0:x1])

# ---- colour cut-outs ----
graded = Image.fromarray(rgb)
graded = ImageEnhance.Contrast(graded).enhance(1.18)
graded = ImageEnhance.Color(graded).enhance(1.12)
graded = ImageEnhance.Sharpness(graded).enhance(1.4)
# warm, slightly painterly look like the reference sticker
g = np.array(graded).astype(np.float32)
g[:, :, 0] *= 1.06
g[:, :, 2] *= 0.92
g = np.clip(g, 0, 255).astype(np.uint8)
g = cv2.bilateralFilter(g, 9, 40, 9)

cut = np.dstack([g, alpha])
crop_to_alpha(cut).save(f"{out}/photo.png", optimize=True)

# sticker = head + chest (top ~78% of the figure)
c = crop_to_alpha(cut)
c.crop((0, 0, c.width, int(c.height * 0.78))).save(f"{out}/cutout.png", optimize=True)

# ---- ink line-art illustration ----
gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
gray = cv2.bilateralFilter(gray, 9, 50, 9)
# pencil "dodge" sketch, then crush it into clean ink lines
inv = 255 - gray
blur = cv2.GaussianBlur(inv, (0, 0), 9)
sketch = cv2.divide(gray, 255 - blur, scale=256)
ink = cv2.adaptiveThreshold(sketch, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 21, 9)
# solid fills for very dark areas (hair, moustache, shirt shadows)
dark = (gray < 55).astype(np.uint8) * 255
ys_fig = np.where(alpha > 128)[0]
neck_y = int(ys_fig.min() + (ys_fig.max() - ys_fig.min()) * 0.36)  # roughly the chin/neck line
dark[neck_y:, :] = 0  # solid fills only for hair + moustache, not the shirt
ink = np.where(dark > 0, 0, ink).astype(np.uint8)
# below the neck keep only the strongest lines (shirt folds), so the shirt reads as line art
strong = cv2.adaptiveThreshold(sketch, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 31, 28)
ink[neck_y:, :] = strong[neck_y:, :]
# clean speckles
lines = 255 - ink
lines = cv2.morphologyEx(lines, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
# silhouette outline so the figure reads clearly
edge = cv2.morphologyEx((alpha > 128).astype(np.uint8) * 255, cv2.MORPH_GRADIENT, np.ones((5, 5), np.uint8))
lines = np.maximum(lines, edge)
lines = (lines * (alpha > 128)).astype(np.uint8)
lines = cv2.GaussianBlur(lines, (3, 3), 0)

ill = np.dstack([np.full_like(lines, 11), np.full_like(lines, 11), np.full_like(lines, 11), lines])
i = crop_to_alpha(ill)
# head + shoulders only, like the reference
i.crop((0, 0, i.width, int(i.height * 0.43))).save(f"{out}/illustration.png", optimize=True)

print("done")
