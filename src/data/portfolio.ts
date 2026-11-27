/* ==========================================================================
 *  ✏️  EDIT YOUR CONTENT HERE
 *  --------------------------------------------------------------------------
 *  Every word, link, project, image and colour on the site comes from this file.
 *
 *  MEDIA TIPS
 *  - Put your files in /public/media/ and reference them as "/media/file.png".
 *  - Leave any media field "" and a styled placeholder is shown instead.
 *  - Portraits look best as transparent PNG / WebP cut-outs (background removed).
 *  - videoUrl accepts: a YouTube / Vimeo / Instagram reel link, OR your own video file
 *    in /public/media (e.g. "/media/reel-1.mp4"). Own files play smoothest and fastest.
 *  - For Instagram reels: open the reel, tap ⋯ → Copy link, paste it as videoUrl.
 *    Best quality: download the reel (⋯ → Download on your own reels), put the .mp4 in
 *    /public/media, and use it as both `videoUrl` and `preview` (hover autoplay).
 * ========================================================================== */

/* NOTE: projects, categories (workSections), bts and showreel below are only the STARTING data.
   On first run they're copied into the database; after that, manage them at /admin. */
export type Category = string;

export type Project = {
  id: string;
  title: string;
  category: Category;
  year: number;
  client: string;
  thumbnail: string; // still image, "" for placeholder
  preview: string; // short muted MP4 loop played on hover, "" for none
  videoUrl: string; // full YouTube / Vimeo link
  vertical?: boolean; // true = 9:16 (Reels / TikTok / Shorts)
  description: string;
  role: string;
  tools: string[];
  hue: number; // 0-360 tint for the placeholder
};

export const portfolio = {
  /* ---------- SEO ---------- */
  meta: {
    title: "Danish Naveed | Video Editor & Cinematography in Lahore, Pakistan",
    description:
      "Danish Naveed is a Lahore-based video editor and cinematographer creating short-form content, commercial ads and YouTube edits that perform.",
    url: "https://your-domain.com",
  },

  /* ---------- Colours ---------- */
  theme: {
    accent: "#D9381C", // red: sticker outline, SERVICES title, buttons
    highlight: "#F5B301", // yellow: SERVICES shadow, tape
    showreel: "#F26B1D", // orange: showreel name
  },

  /* ---------- About you ---------- */
  person: {
    firstName: "Danish",
    lastName: "Naveed",
    initials: "DN",
    title: "Video Editor & Cinematography",
    location: "Lahore, Pakistan",
    // Your IANA timezone for the live clock in Contact, e.g. "Asia/Karachi", "Europe/London". "" hides it.
    timezone: "Asia/Karachi",
    year: 2026,
    availability: "Available for projects", // badge in Contact
    tagline: "I cut stories that move: frame by frame, beat by beat.", // shown under the hero on phones
    greeting: "Hi, I'm Danish Naveed.",
    bio: [
      "Great editing is more than smooth transitions and visual effects. It's about capturing attention, keeping viewers engaged, and delivering a message that people remember.",
      "I specialize in cinematic video editing and motion design, creating high-quality content that helps brands, creators, and businesses stand out in today's fast-moving digital world.",
      "Every project I create is built with one goal in mind: turning ideas into visuals that perform, connect, and leave a lasting impression.",
    ],
    // Line-art illustration that replaces the "O" in PORTFOLIO (transparent PNG, roughly square)
    illustration: "/media/portrait-illustration.png",
    // Round avatar used as the "O" in PORTFOLIO (takes priority over the illustration when the file exists)
    avatar: "/media/avatar.png",
    // Cut-out photo with moving eyes used as the "O" (takes priority over avatar/illustration).
    // Built from public/media/hero.png by tools/make_hero_cutout.py, which also writes
    // hero-iris-l.webp / hero-iris-r.webp next to it.
    face: "/media/hero-cutout.webp",
    // Photo inside the red selection box in About (transparent PNG, portrait)
    // (cut-out of public/media/second.png, made by tools/make_about_cutout.py)
    photo: "/media/about-cutout.webp",
    // Head-and-shoulders cut-out with the red sticker outline (transparent; made from
    // public/media/2nd (2).png by tools/make_identity_cutout.py)
    cutout: "/media/identity-cutout.webp",
  },

  education: [
    {
      school: "Your University / Institute, City",
      detail: "Your degree or course • 2022–2026",
    },
  ],

  experience: [
    {
      period: "2022 – Present",
      role: "Freelance Video Editor & Cinematography",
      description:
        "Delivering high-quality commercial videos, and social media content with a strong focus on storytelling and audience.",
    },
  ],

  stats: [
    { value: 4, suffix: "+", label: "Years" },
    { value: 150, suffix: "+", label: "Projects" },
    { value: 60, suffix: "+", label: "Clients" },
  ],

  /* ---------- Skills: app-icon tiles ---------- */
  tools: [
    { name: "Premiere Pro", abbr: "Pr", bg: "#00005B", fg: "#9999FF" },
    { name: "After Effects", abbr: "Ae", bg: "#1B0A4A", fg: "#C8A2FF" },
    { name: "Photoshop", abbr: "Ps", bg: "#001E36", fg: "#31A8FF" },
    { name: "Illustrator", abbr: "Ai", bg: "#330000", fg: "#FF9A00" },
    { name: "Audition", abbr: "Au", bg: "#0B3236", fg: "#3FE0C5" },
    { name: "DaVinci Resolve", abbr: "Dr", bg: "#1A1A1A", fg: "#FFFFFF", resolve: true },
  ],

  /* ---------- Marquee band texts ---------- */
  bands: {
    about: "About me",
    identity: ["Video Editor", "Cinematography"],
    showreel: "Showreel",
    work: "Selected work",
    bts: "Behind the scenes",
    testimonials: "Kind words",
    contact: "Let's work",
  },

  /* ---------- Showreel ---------- */
  showreel: {
    videoUrl: "/media/demo/showreel.mp4", // DEMO: replace with your reel (file or YouTube / Vimeo link)
    poster: "", // optional cover image; leave "" for the built-in SHOWREEL title card
    tagline: "Storytelling through edits",
  },

  /* ---------- Work: each entry becomes a track (V1, V2…) on the timeline ---------- */
  workSections: [
    { category: "Reels" as Category, band: "Social Media & Reels" },
    { category: "Ads" as Category, band: "Commercial Ads" },
    { category: "Cinematography" as Category, band: "Cinematography" },
    { category: "Video Editing" as Category, band: "YouTube Editing" },
  ],

  /* ---------- Projects (sample content: replace with your own) ---------- */
  projects: [
    {
      id: "city-reel",
      title: "City Launch Reel",
      category: "Reels",
      year: 2026,
      client: "Sample Client",
      thumbnail: "/media/demo/city-reel.jpg", // DEMO: replace with your own
      preview: "/media/demo/city-reel.mp4",
      videoUrl: "/media/demo/city-reel.mp4",
      vertical: true,
      description: "A fast-paced event reel with speed ramps, sound design and animated captions.",
      role: "Editor & motion",
      tools: ["Premiere Pro", "After Effects"],
      hue: 120,
    },
    {
      id: "noodle-reel",
      title: "Wok & Roll",
      category: "Reels",
      year: 2026,
      client: "Food Brand",
      thumbnail: "/media/demo/noodle-reel.jpg", // DEMO: replace with your own
      preview: "/media/demo/noodle-reel.mp4",
      videoUrl: "/media/demo/noodle-reel.mp4",
      vertical: true,
      description: "ASMR-driven food content with punchy cuts and layered sound design.",
      role: "Editor & sound designer",
      tools: ["Premiere Pro", "Audition"],
      hue: 30,
    },
    {
      id: "car-reel",
      title: "Supercar VFX",
      category: "Reels",
      year: 2025,
      client: "Automotive Creator",
      thumbnail: "/media/demo/car-reel.jpg", // DEMO: replace with your own
      preview: "/media/demo/car-reel.mp4",
      videoUrl: "/media/demo/car-reel.mp4",
      vertical: true,
      description: "A high-impact reel combining footage with explosion VFX and 3D tracking.",
      role: "Editor & VFX",
      tools: ["After Effects", "Premiere Pro"],
      hue: 0,
    },
    {
      id: "ugc-hook",
      title: "UGC Hook Edit",
      category: "Ads",
      year: 2026,
      client: "Skincare Brand",
      thumbnail: "/media/demo/ugc-hook.jpg", // DEMO: replace with your own
      preview: "/media/demo/ugc-hook.mp4",
      videoUrl: "/media/demo/ugc-hook.mp4",
      vertical: true,
      description: "A UGC ad with 3D text, pop-out graphics and a retention-first structure.",
      role: "Editor & motion",
      tools: ["Premiere Pro", "After Effects"],
      hue: 200,
    },
    {
      id: "perfume-ad",
      title: "Noir Perfume",
      category: "Ads",
      year: 2026,
      client: "Fragrance Brand",
      thumbnail: "/media/demo/perfume-ad.jpg", // DEMO: replace with your own
      preview: "/media/demo/perfume-ad.mp4",
      videoUrl: "/media/demo/perfume-ad.mp4",
      vertical: true,
      description: "A moody product commercial with macro shots and a rich, dark grade.",
      role: "Editor & colorist",
      tools: ["DaVinci Resolve", "Premiere Pro"],
      hue: 25,
    },
    {
      id: "burger-ad",
      title: "Smash Burger",
      category: "Ads",
      year: 2025,
      client: "Restaurant",
      thumbnail: "/media/demo/burger-ad.jpg", // DEMO: replace with your own
      preview: "/media/demo/burger-ad.mp4",
      videoUrl: "/media/demo/burger-ad.mp4",
      vertical: true,
      description: "A mouth-watering food ad built around slow motion, sizzle sound and bold type.",
      role: "Editor & motion",
      tools: ["Premiere Pro", "After Effects"],
      hue: 40,
    },
    {
      id: "lahore-nights",
      title: "Lahore Nights",
      category: "Cinematography",
      year: 2026,
      client: "Personal Project",
      thumbnail: "/media/demo/lahore-nights.jpg", // DEMO: replace with your own
      preview: "/media/demo/lahore-nights.mp4",
      videoUrl: "/media/demo/lahore-nights.mp4",
      description: "A cinematic city film shot after dark: handheld street scenes, neon reflections and slow, moody camera moves.",
      role: "Director of photography & editor",
      tools: ["Sony FX3", "DJI RS 3", "DaVinci Resolve"],
      hue: 215,
    },
    {
      id: "chai-story",
      title: "Chai Story",
      category: "Cinematography",
      year: 2025,
      client: "Café Brand",
      thumbnail: "/media/demo/chai-story.jpg", // DEMO: replace with your own
      preview: "/media/demo/chai-story.mp4",
      videoUrl: "/media/demo/chai-story.mp4",
      description: "A warm brand film with lit close-ups, slow-motion pours and natural window light.",
      role: "Cinematographer & colorist",
      tools: ["Sony FX3", "Aputure 300d", "DaVinci Resolve"],
      hue: 28,
    },
    {
      id: "yt-doc",
      title: "Creator Documentary",
      category: "Video Editing",
      year: 2026,
      client: "YouTube Creator",
      thumbnail: "/media/demo/yt-doc.jpg", // DEMO: replace with your own
      preview: "/media/demo/yt-doc.mp4",
      videoUrl: "/media/demo/yt-doc.mp4",
      description: "A long-form YouTube documentary with story structure, b-roll and custom graphics.",
      role: "Lead editor",
      tools: ["Premiere Pro", "After Effects", "Audition"],
      hue: 15,
    },
    {
      id: "yt-podcast",
      title: "Podcast Highlights",
      category: "Video Editing",
      year: 2025,
      client: "Podcast Channel",
      thumbnail: "/media/demo/yt-podcast.jpg", // DEMO: replace with your own
      preview: "/media/demo/yt-podcast.mp4",
      videoUrl: "/media/demo/yt-podcast.mp4",
      description: "Multi-cam podcast edits with captions, zooms and retention-focused pacing.",
      role: "Editor",
      tools: ["Premiere Pro"],
      hue: 210,
    },
  ] as Project[],

  /* ---------- Behind the scenes gallery ----------
   * Photos (.jpg/.png/.webp) or short videos (.mp4) from your shoots: camera, set, lighting, editing.
   * shape: "wide" (16:9) · "tall" (9:16) · "portrait" (4:5) · "square" (1:1)
   * DEMO files live in /public/media/demo/: replace `src` with your own media. */
  bts: [
    { src: "/media/demo/bts-camera.mp4", caption: "Cam A rolling: product hero shot", category: "Shoot", shape: "wide" },
    { src: "/media/demo/bts-lighting.jpg", caption: "Key light + softbox, 45° from camera left", category: "Lighting", shape: "portrait" },
    { src: "/media/demo/bts-gimbal.mp4", caption: "Gimbal tracking shot for a reel", category: "Shoot", shape: "tall" },
    { src: "/media/demo/bts-set.jpg", caption: "Set build: backdrop, props and practicals", category: "Set", shape: "wide" },
    { src: "/media/demo/bts-monitor.jpg", caption: "Checking framing on the field monitor", category: "Shoot", shape: "square" },
    { src: "/media/demo/bts-rgb.mp4", caption: "RGB tube test for the night look", category: "Lighting", shape: "portrait" },
    { src: "/media/demo/bts-grade.jpg", caption: "Colour grade session in DaVinci Resolve", category: "Edit", shape: "wide" },
    { src: "/media/demo/bts-timeline.jpg", caption: "Final timeline: 47 cuts in 30 seconds", category: "Edit", shape: "square" },
  ] as Array<{ src: string; caption: string; category: "Shoot" | "Lighting" | "Set" | "Edit"; shape: "wide" | "tall" | "portrait" | "square" }>,

  /* ---------- Gear ("In the bag" label-maker tapes). Edit to match your kit. ---------- */
  kit: ["Sony FX3", "24–70mm f/2.8", "Aputure 300d", "RGB tubes", "DJI RS 3", "Rode Wireless Go", "Field monitor", "MacBook Pro"],

  /* ---------- Services (sticky notes) ---------- */
  // title = front of the note · description = back of the note (shown on hover / tap)
  services: [
    { title: "Short-Form Content", description: "Reels, TikToks and Shorts with scroll-stopping hooks, captions and retention-first pacing." },
    { title: "Commercial Ads", description: "Brand and performance ads cut for every platform, from 6s bumpers to 60s hero spots." },
    { title: "Cinematography", description: "Camera work, lighting and composition for brand films, music videos and reels that look cinematic." },
    { title: "Color Grading", description: "Cinematic grades and consistent looks that give your footage mood and polish." },
    { title: "YouTube Editing", description: "Long-form edits with story structure, b-roll, graphics and sound that hold viewers." },
    { title: "Product Ads", description: "Product films and ads with clean lighting, macro details and punchy edits that make people want to buy." },
  ],

  /* ---------- Process ---------- */
  process: [
    { title: "Brief", description: "We talk goals, audience, references and deadlines. You get a clear plan and quote." },
    { title: "Edit", description: "Selects, rough cut, motion, music and sound, shaped around your brief." },
    { title: "Revisions", description: "Frame-accurate feedback through review links. Two rounds included." },
    { title: "Delivery", description: "Final masters in every format and aspect ratio you need, ready to post." },
  ],

  /* ---------- Testimonials (placeholders: replace with real quotes) ---------- */
  testimonials: [
    { quote: "Fast, creative and incredibly detail-oriented. Our reels finally look as good as the product.", name: "Client Name", role: "Marketing Lead, Company" },
    { quote: "Understood our channel's voice from day one. Watch time went up and our workload went down.", name: "Client Name", role: "YouTube Creator" },
    { quote: "The ad edits gave our brand real personality. Smooth process, on time and over-delivered.", name: "Client Name", role: "Founder, Brand" },
  ],

  /* ---------- Contact ---------- */
  contact: {
    email: "danihfz25@gmail.com",
    whatsapp: "+923183032687", // 0318 3032687 in international format (used for the wa.me link)
    // Optional Formspree/Getform endpoint. Leave "" to open the visitor's email app instead.
    formEndpoint: "",
    projectTypes: [
      "Short-form content",
      "Commercial ad",
      "Product ad",
      "Cinematography",
      "YouTube editing",
      "Color grading",
      "Something else",
    ],
  },

  socials: [
    { label: "Instagram", url: "https://www.instagram.com/filmbydani011/" },
    { label: "Facebook", url: "https://www.facebook.com/profile.php?id=61595401718438" },
    { label: "LinkedIn", url: "https://linkedin.com/in/yourhandle" },
    { label: "YouTube", url: "https://youtube.com/@yourhandle" },
  ],
};
