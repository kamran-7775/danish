"""Head-and-chest sticker for the black Identity strip (below About). The red outline is added by CSS.
usage: python tools/make_identity_cutout.py "public/media/2nd (2).png" public/media/identity-cutout.webp
needs: python -m pip install rembg onnxruntime
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
BOTTOM = 0.66  # keep the top 66% of the person (head, shoulders, chest; not the hands/legs)

im = Image.open(src).convert("RGB")
a = np.array(remove(im, session=new_session("u2net_human_seg"), post_process_mask=True))

# keep only the blob connected to the face (drops chair / plant pieces the model may pick up)
solid = Image.fromarray(((a[..., 3] > 100) * 255).astype(np.uint8)).copy()
ImageDraw.floodfill(solid, (im.width // 2, int(im.height * 0.3)), 128)
keep = np.asarray(solid.filter(ImageFilter.MaxFilter(5))) == 128
keep = np.asarray(Image.fromarray(keep.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
a[..., 3] = np.where(keep, a[..., 3], 0)

# tighten + feather the edge (drops the background fringe)
al = Image.fromarray(a[..., 3]).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
a[..., 3] = np.minimum(a[..., 3], np.asarray(al))

ys, xs = np.where(a[..., 3] > 40)
top = ys.min()
bot = int(top + (ys.max() - top) * BOTTOM)
a[bot:, :, 3] = 0
ys, xs = np.where(a[..., 3] > 40)
pad = 6
box = (max(xs.min() - pad, 0), max(top - pad, 0), min(xs.max() + pad, im.width), bot)
res = Image.fromarray(a, "RGBA").crop(box)
res.save(out, quality=90, method=6)
print("box", box, "size", res.size)
