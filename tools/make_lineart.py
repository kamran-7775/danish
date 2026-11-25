"""Experiments: cleaner ink line-art (XDoG) and painterly photo finish.
usage: python stylize.py <src_photo> <cutout_png> <photo_png> <out_dir>
"""
import sys
import cv2
import numpy as np
from PIL import Image

src, cutout_p, photo_p, out = sys.argv[1:5]
EPS = sys.argv[5] if len(sys.argv) > 5 else "0.34"


def load_rgba(p):
    return np.array(Image.open(p).convert("RGBA"))


def xdog(gray, sigma=1.6, k=1.6, p=22, eps=0.42, phi=12):
    g = gray.astype(np.float32) / 255.0
    g1 = cv2.GaussianBlur(g, (0, 0), sigma)
    g2 = cv2.GaussianBlur(g, (0, 0), sigma * k)
    d = (1 + p) * g1 - p * g2
    e = np.where(d >= eps, 1.0, 1.0 + np.tanh(phi * (d - eps)))
    return np.clip(e, 0, 1)


def ink_from_cutout(rgba, keep_ratio=0.43):
    rgb, a = rgba[:, :, :3], rgba[:, :, 3]
    # bigger working size = smoother lines
    scale = 2
    rgb = cv2.resize(rgb, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    a = cv2.resize(a, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 40, 11)
    gray = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    ys0 = np.where(a > 128)[0]
    neck0 = int(ys0.min() + (ys0.max() - ys0.min()) * 0.36)
    e_face = xdog(gray, sigma=2.0, k=1.6, p=18, eps=float(EPS), phi=10)
    e_body = xdog(gray, sigma=2.4, k=1.6, p=18, eps=0.08, phi=10)  # body: only strong edges
    # blend face -> body settings over a soft band instead of a hard line at the neck
    yy = np.arange(gray.shape[0], dtype=np.float32)[:, None]
    w = np.clip((yy - (neck0 - 30)) / 90.0, 0, 1)
    e = e_face * (1 - w) + e_body * w
    ink = (1 - e)  # 1 = ink
    # solid fills for hair/moustache (very dark), only above the neck
    ys = np.where(a > 128)[0]
    neck = int(ys.min() + (ys.max() - ys.min()) * 0.36)
    dark = (gray < 60).astype(np.float32)
    dark[neck:, :] = 0
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    ink = np.maximum(ink, dark)
    # outline of the silhouette
    edge = cv2.morphologyEx((a > 128).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((5, 5), np.uint8)).astype(np.float32)
    ink = np.maximum(ink, edge)
    ink = ink * (a > 128)
    # crisp black ink, no grey: hard threshold with a 1px soft edge
    ink = np.clip((ink - 0.42) / 0.16, 0, 1)
    # clean small specks
    binm = (ink > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(binm)
    small = np.isin(lab, np.where(st[:, cv2.CC_STAT_AREA] < 40)[0]) & (lab > 0)
    ink[small] = 0
    ink = cv2.GaussianBlur(ink, (3, 3), 0)
    alpha = (np.clip(ink, 0, 1) * 255).astype(np.uint8)
    h = alpha.shape[0]
    out_img = np.dstack([np.full_like(alpha, 11)] * 3 + [alpha])
    im = Image.fromarray(out_img)
    bb = im.getbbox()
    im = im.crop(bb)
    im = im.crop((0, 0, im.width, int(im.height * keep_ratio)))
    return im.crop(im.getbbox())


def painterly(rgba):
    rgb, a = rgba[:, :, :3].copy(), rgba[:, :, 3]
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    styl = cv2.stylization(bgr, sigma_s=45, sigma_r=0.35)
    # gentle posterize for a printed / illustrated look
    styl = (styl // 24) * 24 + 12
    styl = cv2.addWeighted(styl, 0.75, cv2.edgePreservingFilter(bgr, flags=1, sigma_s=40, sigma_r=0.3), 0.25, 0)
    out_rgb = cv2.cvtColor(styl, cv2.COLOR_BGR2RGB)
    # warm contrast
    lab = cv2.cvtColor(out_rgb, cv2.COLOR_RGB2LAB)
    l, A, B = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(6, 6)).apply(l)
    out_rgb = cv2.cvtColor(cv2.merge([l, A, B]), cv2.COLOR_LAB2RGB)
    return Image.fromarray(np.dstack([out_rgb, a]))


cut = load_rgba(cutout_p)
photo = load_rgba(photo_p)
# line art from the full photo cut-out (photo.png has the whole figure)
ink_from_cutout(photo).save(f"{out}/ink_xdog_{EPS}.png", optimize=True)
print("ok")
