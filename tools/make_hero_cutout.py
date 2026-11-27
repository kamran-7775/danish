"""Removes the flat grey studio background from the hero photo (PIL + numpy only).
usage: python tools/make_hero_cutout.py public/media/hero.png public/media/hero-cutout.webp
The crop box is printed; the eye coordinates in src/components/HeroFace.tsx are in this cropped space.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
CROP = (250, 80, 1062, 960)  # left, top, right, bottom in source pixels


def ramp(x, lo, hi):
    """0 at lo, 1 at hi (works for lo > hi too)."""
    return np.clip((x - lo) / (hi - lo), 0, 1)


im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)
h, w, _ = a.shape
R, G, B = a[..., 0], a[..., 1], a[..., 2]
V = a.max(axis=2)

# "wallness": blue-grey, low saturation, mid brightness
blue = B - R
wall = (
    ramp(blue, 3, 9) * ramp(blue, 26, 20)       # B a bit above R
    * ramp(np.abs(G - R), 9, 4)                  # G ~ R
    * ramp(V, 72, 86) * ramp(V, 160, 148)        # not dark hair/shirt, not bright
)

# only wall that touches the image border counts (keeps grey shirt folds / shadows inside)
seed = (wall > 0.5).astype(np.uint8) * 255
m = Image.fromarray(seed, "L").copy()  # copy: flood fill on an array-backed image is a no-op
for x in range(0, w, 8):
    for y in (0, h - 1):
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
for y in range(0, h, 8):
    for x in (0, w - 1):
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
reach = np.asarray(m) == 128
# wall showing through gaps in the curls is enclosed by hair, so the fill can't reach it:
# in the hair band (above the eyebrows) any clearly wall-coloured pixel is background too
hair_band = np.zeros_like(reach)
hair_band[:360] = True
reach = reach | (hair_band & (wall > 0.6))
near = np.asarray(Image.fromarray(reach.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7))) > 0
wall = np.where(near, wall, 0.0)
wall = np.where(reach, np.maximum(wall, 0.85), wall)
# drop tiny opaque specks floating in the wall
alpha = 1 - wall
al = Image.fromarray((alpha * 255).astype(np.uint8))
al = al.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
alpha = np.asarray(al).astype(np.float32) / 255
alpha = ramp(alpha, 0.12, 0.95)

# smooth estimate of the wall colour everywhere (normalised blur of known-wall pixels)
wm = (reach & (wall > 0.8)).astype(np.float32)
def blur(x, r):
    """box blur via cumulative sums (float, edge-clamped)"""
    p = np.pad(x, r + 1, mode="edge").astype(np.float64)
    c = p.cumsum(0)
    p = (c[2 * r + 1:] - c[:-(2 * r + 1)])
    c = p.cumsum(1)
    p = (c[:, 2 * r + 1:] - c[:, :-(2 * r + 1)])
    return (p / (2 * r + 1) ** 2)[: x.shape[0], : x.shape[1]]
num = np.dstack([blur(a[..., c] * wm, 40) for c in range(3)])
den = blur(wm, 40)[..., None]
bg = num / np.maximum(den, 1e-3)
bg = np.where(den > 1e-3, bg, a)

# un-mix the wall out of semi-transparent edge pixels (no grey halo on light paper)
al3 = alpha[..., None]
fg = (a - (1 - al3) * bg) / np.maximum(al3, 0.08)
fg = np.where(al3 > 0.97, a, fg)
fg = np.clip(fg, 0, 255)

# ---- moving eyes ----
# Each iris is exported as its own small round image, and erased from the base picture
# (filled with eye-white from either side), so the page can slide it inside the eye opening.
# Source-pixel geometry: eye corners, upper/lower lid mid-points, iris centre + radius.
EYES = {
    "l": dict(p0=(530, 425), p2=(596, 430), up=(560, 413.5), lo=(561, 432.5), c=(560, 420), r=14.3),
    "r": dict(p0=(692, 430), p2=(756, 425), up=(729, 412.5), lo=(729, 432.5), c=(729, 420), r=14.3),
}


def ctrl(p0, mid, p2):
    """control point of the quadratic curve p0 -> p2 that passes through mid at t=0.5"""
    return ((4 * mid[0] - p0[0] - p2[0]) / 2, (4 * mid[1] - p0[1] - p2[1]) / 2)


def almond(e, n=40):
    cu, cl = ctrl(e["p0"], e["up"], e["p2"]), ctrl(e["p0"], e["lo"], e["p2"])
    def q(p0, c, p2):
        return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0],
                 (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]
    return q(e["p0"], cu, e["p2"]) + q(e["p2"], cl, e["p0"]), cu, cl


def bright(px):
    """brightest of a few neighbouring pixels = eye-white, not lash/lid"""
    return px[np.argmax(px.sum(1))]


yy, xx = np.mgrid[0:h, 0:w]
out_dir = out.rsplit("/", 1)[0] if "/" in out else "."
geo = {}
for k, e in EYES.items():
    pts, cu, cl = almond(e)
    mk = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mk).polygon(pts, fill=255)
    mask = np.asarray(mk.filter(ImageFilter.MaxFilter(5))) > 0  # a bit bigger than the clip
    cx, cy = e["c"]
    r = e["r"]
    # 1) cut the iris sprite from the untouched photo
    R = int(np.ceil(r + 2))
    x0, y0 = int(round(cx)) - R, int(round(cy)) - R
    patch = a[y0:y0 + 2 * R, x0:x0 + 2 * R]
    d = np.hypot(xx[y0:y0 + 2 * R, x0:x0 + 2 * R] + 0.5 - cx, yy[y0:y0 + 2 * R, x0:x0 + 2 * R] + 0.5 - cy)
    pa = ramp(d, r + 0.8, r - 0.8) * 255
    Image.fromarray(np.dstack([patch, pa]).astype(np.uint8), "RGBA").save(f"{out_dir}/hero-iris-{k}.webp", lossless=True)
    # 2) erase the iris from the base: per row, interpolate eye-white from both sides
    iris = (np.hypot(xx + 0.5 - cx, yy + 0.5 - cy) < r + 2.5) & mask
    for y in np.unique(np.where(iris)[0]):
        row_in = np.where(mask[y] & ~iris[y])[0]
        L, Rr = row_in[row_in < cx], row_in[row_in > cx]
        xs = np.where(iris[y])[0]
        cL = bright(a[y, L[-4:]]) if len(L) else None
        cR = bright(a[y, Rr[:4]]) if len(Rr) else None
        if cL is None and cR is None:
            continue
        cL = cR if cL is None else cL
        cR = cL if cR is None else cR
        xl = L[-1] if len(L) else xs[0]
        xr = Rr[0] if len(Rr) else xs[-1]
        t = np.clip((xs - xl) / max(xr - xl, 1), 0, 1)[:, None]
        fg[y, xs] = cL * (1 - t) + cR * t
    # soften the filled patch
    sm = np.dstack([np.asarray(Image.fromarray(fg[..., c].astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))) for c in range(3)])
    fg = np.where(iris[..., None], sm, fg)
    ox, oy = CROP[0], CROP[1]
    sh = lambda p: (round(p[0] - ox, 1), round(p[1] - oy, 1))
    geo[k] = dict(p0=sh(e["p0"]), cu=sh(cu), p2=sh(e["p2"]), cl=sh(cl),
                  iris=dict(x=x0 - ox, y=y0 - oy, size=2 * R))

# fade the bottom of the bust out so the cropped shoulders melt into the page
top, bot = CROP[1], CROP[3]
fade = ramp(yy.astype(np.float32), bot, bot - 0.16 * (bot - top))
alpha = alpha * fade

rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
res = Image.fromarray(rgba, "RGBA").crop(CROP)
res.save(out, quality=90, method=6)
print("crop", CROP, "size", res.size)
for k, g in geo.items():
    print(k, g)
