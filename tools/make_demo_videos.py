"""
Generate placeholder DEMO videos for every project in src/data/portfolio.ts,
plus a demo showreel. Replace them later with your real videos.

For each project it writes to public/media/demo/:
  <id>.mp4   5s clip: animated gradient in the project's hue, title, category,
             "DEMO" tag and a burned-in timecode (9:16 if vertical, else 16:9)
  <id>.jpg   thumbnail (a frame from the clip)
and public/media/demo/showreel.mp4 (16:9, ~12s).

usage:  python tools/make_demo_videos.py <path-to-ffmpeg>
        (any ffmpeg build with drawtext + gradients, e.g. from `pip install imageio-ffmpeg`)
"""
import colorsys
import re
import subprocess
import sys
from pathlib import Path

FFMPEG = sys.argv[1] if len(sys.argv) > 1 else "ffmpeg"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "media" / "demo"
OUT.mkdir(parents=True, exist_ok=True)
FONT = "C\\:/Windows/Fonts/impact.ttf"
FONT_SMALL = "C\\:/Windows/Fonts/bahnschrift.ttf"
DUR, FPS = 5, 25

src = (ROOT / "src" / "data" / "portfolio.ts").read_text(encoding="utf-8")
projects_block = src[src.index("projects: [") : src.index("] as Project[]")]
projects = []
for m in re.finditer(r"\{(.*?)\n    \}", projects_block, re.S):
    body = m.group(1)
    get = lambda k: (re.search(rf'{k}: "([^"]*)"', body) or [None, ""])[1]
    projects.append(
        {
            "id": get("id"),
            "title": get("title"),
            "category": get("category"),
            "vertical": "vertical: true" in body,
            "hue": int((re.search(r"hue: (\d+)", body) or [0, "0"])[1]),
        }
    )
first = re.search(r'firstName: "([^"]*)"', src)[1]
last = re.search(r'lastName: "([^"]*)"', src)[1]


def hexcol(h, l, s):
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, l, s)
    return f"0x{int(r * 255):02x}{int(g * 255):02x}{int(b * 255):02x}"


def esc(t):
    """escape text for ffmpeg drawtext"""
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def run(args):
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def wrap(text, max_chars):
    """greedy word wrap"""
    lines, cur = [], ""
    for word in text.split():
        if cur and len(cur) + 1 + len(word) > max_chars:
            lines.append(cur)
            cur = word
        else:
            cur = f"{cur} {word}".strip()
    return lines + [cur] if cur else lines


def title_lines(text, w, h, big, max_chars, fade, slide):
    """one drawtext per line, centred as a block, sized so the longest line fits the width"""
    lines = wrap(text.upper(), max_chars)
    fs = min(big, int(0.84 * w / (0.47 * max(len(l) for l in lines))))
    lh = int(fs * 1.02)
    top = f"(h-{lh * len(lines)})/2"
    return [
        f"drawtext=fontfile='{FONT}':text='{esc(l)}':fontsize={fs}:fontcolor=white:alpha='{fade}':"
        f"x=(w-text_w)/2:y={top}+{i * lh}+{slide}:shadowcolor=black@0.5:shadowx=4:shadowy=4"
        for i, l in enumerate(lines)
    ]


def make_clip(p):
    w, h = (720, 1280) if p["vertical"] else (1280, 720)
    big = 150
    hue = p["hue"]
    grad = (
        f"gradients=s={w}x{h}:r={FPS}:d={DUR}:speed=0.012:n=3:"
        f"c0={hexcol(hue, 0.36, 0.7)}:c1={hexcol(hue + 40, 0.14, 0.55)}:c2={hexcol(hue - 30, 0.05, 0.3)}"
    )
    slide = "40*max(0\\,1-t/0.7)"  # title slides up during the first 0.7s
    fade = "if(lt(t\\,0.6)\\,t/0.6\\,1)"
    cat = esc(p["category"].upper())
    titles = title_lines(p["title"], w, h, big, 8 if p["vertical"] else 16, fade, slide)
    vf = ",".join(
        [
            "noise=alls=5:allf=t",
            # moving light bar
            f"drawbox=x='mod(t*{w // 2}\\,{w + 300})-300':y=0:w=180:h={h}:color=white@0.06:t=fill",
            # safe-area frame
            f"drawbox=x={w * 0.06:.0f}:y={h * 0.06:.0f}:w={w * 0.88:.0f}:h={h * 0.88:.0f}:color=white@0.18:t=2",
            *titles,
            f"drawtext=fontfile='{FONT_SMALL}':text='{cat}':fontsize=30:fontcolor=white@0.85:x={w * 0.09:.0f}:y={h * 0.09:.0f}",
            f"drawtext=fontfile='{FONT_SMALL}':text='DEMO CLIP':fontsize=26:fontcolor=0xF5B301:"
            f"x=w-text_w-{w * 0.09:.0f}:y={h * 0.09:.0f}",
            f"drawtext=fontfile='{FONT_SMALL}':timecode='00\\:00\\:00\\:00':rate={FPS}:fontsize=30:"
            f"fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-text_h-{h * 0.1:.0f}",
        ]
    )
    mp4 = OUT / f"{p['id']}.mp4"
    run(["-f", "lavfi", "-i", grad, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "27",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(mp4)])
    run(["-ss", "2.2", "-i", str(mp4), "-frames:v", "1", "-q:v", "4", str(OUT / f"{p['id']}.jpg")])
    return mp4


def make_showreel():
    w, h, d = 1280, 720, 12
    grad = f"gradients=s={w}x{h}:r={FPS}:d={d}:speed=0.02:n=4:c0=0xd9381c:c1=0x1a0805:c2=0xf26b1d:c3=0x050505"
    lines = [("VIDEO EDITOR", 0, 3), ("Cinematography", 3, 6), ("SHOWREEL", 6, 9), (f"{first} {last}".upper(), 9, 12)]
    parts = ["noise=alls=6:allf=t"]
    for text, a, b in lines:
        fs = min(170, int(0.84 * w / (0.47 * len(text))))
        parts.append(
            f"drawtext=fontfile='{FONT}':text='{esc(text)}':fontsize={fs}:fontcolor=white:"
            f"enable='between(t\\,{a}\\,{b})':x=(w-text_w)/2:y=(h-text_h)/2+30*max(0\\,1-(t-{a})/0.6):"
            f"alpha='min(1\\,(t-{a})/0.4)':shadowcolor=black@0.5:shadowx=5:shadowy=5"
        )
    parts += [
        f"drawtext=fontfile='{FONT_SMALL}':text='DEMO SHOWREEL':fontsize=26:fontcolor=0xF5B301:x=w-text_w-60:y=50",
        f"drawtext=fontfile='{FONT_SMALL}':timecode='00\\:00\\:00\\:00':rate={FPS}:fontsize=28:fontcolor=white:"
        "box=1:boxcolor=black@0.5:boxborderw=10:x=60:y=h-90",
    ]
    out = OUT / "showreel.mp4"
    run(["-f", "lavfi", "-i", grad, "-vf", ",".join(parts), "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(out)])
    run(["-ss", "7", "-i", str(out), "-frames:v", "1", "-q:v", "3", str(OUT / "showreel.jpg")])
    return out


if __name__ == "__main__":
    for p in projects:
        f = make_clip(p)
        print(f"{p['id']:<16} {'9:16' if p['vertical'] else '16:9'}  {f.stat().st_size // 1024} KB")
    s = make_showreel()
    print(f"{'showreel':<16} 16:9  {s.stat().st_size // 1024} KB")
