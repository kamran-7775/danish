"""
Generate DEMO behind-the-scenes media for the `bts` list in src/data/portfolio.ts.
Every entry whose src starts with /media/demo/ gets a placeholder:
  .jpg -> a still: studio-light gradient in the category colour, grain, vignette, labels
  .mp4 -> a 6s loop of the same look with a drifting light
Replace them with real photos/videos from your shoots later.

usage:  python tools/make_demo_bts.py <path-to-ffmpeg>
"""
import re
import subprocess
import sys
from pathlib import Path

FFMPEG = sys.argv[1] if len(sys.argv) > 1 else "ffmpeg"
ROOT = Path(__file__).resolve().parent.parent
FONT = "C\\:/Windows/Fonts/impact.ttf"
FONT_SMALL = "C\\:/Windows/Fonts/bahnschrift.ttf"
SIZES = {"wide": (1280, 720), "tall": (720, 1280), "portrait": (960, 1200), "square": (1000, 1000)}
# light colours per category: (glow, mid, shadow)
COLORS = {
    "Shoot": ("0xffb14a", "0x5a2a0c", "0x080604"),
    "Lighting": ("0xf4f1e8", "0x2c4a52", "0x050708"),
    "Set": ("0xff6a3d", "0x4a1208", "0x070404"),
    "Edit": ("0x6aa8ff", "0x1d1f4a", "0x050509"),
}

src = (ROOT / "src" / "data" / "portfolio.ts").read_text(encoding="utf-8")
block = src[src.index("bts: [") : src.index("] as Array<{ src: string; caption")]
items = [
    dict(zip(("src", "caption", "category", "shape"), m))
    for m in re.findall(r'src: "([^"]+)", caption: "([^"]+)", category: "([^"]+)", shape: "([^"]+)"', block)
]


def esc(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def run(args):
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


for n, it in enumerate(items, start=1):
    if not it["src"].startswith("/media/demo/"):
        continue
    out = ROOT / "public" / it["src"].lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    w, h = SIZES.get(it["shape"], (1280, 720))
    c0, c1, c2 = COLORS.get(it["category"], COLORS["Shoot"])
    video = out.suffix == ".mp4"
    dur = 6 if video else 1
    grad = (
        f"gradients=s={w}x{h}:r=25:d={dur}:type=radial:speed={0.01 if video else 0}:n=3:"
        f"c0={c0}:c1={c1}:c2={c2}:x0={int(w * 0.28)}:y0={int(h * 0.3)}:x1={int(w * 0.95)}:y1={int(h * 1.05)}"
    )
    m = int(min(w, h) * 0.06)
    fs = max(26, int(min(w, h) * 0.05))
    vf = [
        "vignette=PI/3.2",
        "noise=alls=9:allf=t" if video else "noise=alls=9",
        # soft light-leak bar that drifts across in videos
        *(
            [f"drawbox=x='mod(t*{w // 4}\\,{w + 400})-400':y=0:w=260:h={h}:color=0xfff2d0@0.07:t=fill"]
            if video
            else []
        ),
        # camera frame corners
        f"drawbox=x={m}:y={m}:w={m}:h=3:color=white@0.8:t=fill",
        f"drawbox=x={m}:y={m}:w=3:h={m}:color=white@0.8:t=fill",
        f"drawbox=x={w - 2 * m}:y={m}:w={m}:h=3:color=white@0.8:t=fill",
        f"drawbox=x={w - m - 3}:y={m}:w=3:h={m}:color=white@0.8:t=fill",
        f"drawbox=x={m}:y={h - m - 3}:w={m}:h=3:color=white@0.8:t=fill",
        f"drawbox=x={m}:y={h - 2 * m}:w=3:h={m}:color=white@0.8:t=fill",
        f"drawbox=x={w - 2 * m}:y={h - m - 3}:w={m}:h=3:color=white@0.8:t=fill",
        f"drawbox=x={w - m - 3}:y={h - 2 * m}:w=3:h={m}:color=white@0.8:t=fill",
        f"drawtext=fontfile='{FONT_SMALL}':text='BTS · {esc(it['category'].upper())}':fontsize={int(fs * 0.62)}:"
        f"fontcolor=white@0.9:x={int(m * 1.4)}:y={int(m * 1.5)}",
        f"drawtext=fontfile='{FONT_SMALL}':text='DEMO':fontsize={int(fs * 0.62)}:fontcolor=0xF5B301:"
        f"x=w-text_w-{int(m * 1.4)}:y={int(m * 1.5)}",
        f"drawtext=fontfile='{FONT}':text='{esc(it['category'].upper())}':fontsize={int(min(w, h) * 0.2)}:"
        f"fontcolor=white@0.16:x=(w-text_w)/2:y=(h-text_h)/2",
        f"drawtext=fontfile='{FONT_SMALL}':text='{n:02d}A':fontsize={int(fs * 0.6)}:fontcolor=white@0.7:"
        f"x=w-text_w-{int(m * 1.4)}:y=h-text_h-{int(m * 1.5)}",
    ]
    if video:
        vf.append(
            f"drawtext=fontfile='{FONT_SMALL}':timecode='00\\:00\\:00\\:00':rate=25:fontsize={int(fs * 0.6)}:"
            f"fontcolor=white:x={int(m * 1.4)}:y=h-text_h-{int(m * 1.5)}"
        )
        run(["-f", "lavfi", "-i", grad, "-vf", ",".join(vf), "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(out)])
        run(["-ss", "2", "-i", str(out), "-frames:v", "1", "-q:v", "4", str(out.with_suffix(".jpg"))])
    else:
        run(["-f", "lavfi", "-i", grad, "-vf", ",".join(vf), "-frames:v", "1", "-q:v", "3", str(out)])
    print(f"{out.name:<18} {it['shape']:<9} {out.stat().st_size // 1024} KB")
