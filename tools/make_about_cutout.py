"""Full-body cut-out for the About section (needs: python -m pip install rembg onnxruntime).
usage: python tools/make_about_cutout.py public/media/second.png public/media/about-cutout.webp
The first run downloads the u2net_human_seg model (~170 MB) into ~/.u2net; everything runs locally.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")

session = new_session("u2net_human_seg")
rgba = remove(im, session=session, post_process_mask=True)
a = np.array(rgba)

# bits of the dark office (chair, wall panel) left in the gaps between arms, hands and legs:
# below the beard, dark *grey* pixels aren't him (brown shirt, cream trousers, skin, white shoes)
rgb = a[..., :3].astype(np.float32)
mx, mn = rgb.max(2), rgb.min(2)
sat = (mx - mn) / np.maximum(mx, 1)
# office greys are neutral/bluish (B >= R); the brown shirt always has R well above B
junk = (mx < 110) & (sat < 0.3) & (rgb[..., 2] - rgb[..., 0] > -4)
junk[:420] = False
junk_img = Image.fromarray((junk * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
a[..., 3] = np.where(np.asarray(junk_img) > 0, 0, a[..., 3])

# pull the edge in ~1.5px and feather it: removes the dark fringe left by the office background
al = Image.fromarray(a[..., 3]).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MinFilter(3))
al = al.filter(ImageFilter.GaussianBlur(0.9))
a[..., 3] = np.minimum(a[..., 3], np.asarray(al))

# crop to the person
alpha = a[..., 3]
ys, xs = np.where(alpha > 40)
x0, x1 = xs.min(), xs.max()
y0, y1 = ys.min(), ys.max()
pad = 12
box = (max(x0 - pad, 0), max(y0 - pad, 0), min(x1 + pad, im.width), min(y1 + pad, im.height))
res = Image.fromarray(a, "RGBA").crop(box)
res.save(out, quality=90, method=6)
print("box", box, "size", res.size)

