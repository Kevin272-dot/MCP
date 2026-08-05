import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "GitHub Copilot";
pptx.company = "MCP Lecture";
pptx.subject = "MCP for freshers";
pptx.title = "MCP Made Simple";
pptx.lang = "en-IN";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-IN",
};

const colors = {
  navy: "0B1220",
  slate: "111827",
  ink: "E5E7EB",
  muted: "94A3B8",
  mint: "5EEAD4",
  gold: "FBBF24",
  coral: "FB7185",
  sky: "7DD3FC",
  white: "FFFFFF",
  card: "172033",
  line: "2B3648",
};

function addBackground(slide, title, subtitle, index) {
  slide.background = { color: colors.navy };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    line: { color: colors.navy, transparency: 100 },
    fill: { color: colors.navy },
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: 10.7,
    y: -0.4,
    w: 3.5,
    h: 3.5,
    line: { color: colors.mint, transparency: 85 },
    fill: { color: colors.mint, transparency: 92 },
    rotate: 0,
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: -1.1,
    y: 5.4,
    w: 4.4,
    h: 4.4,
    line: { color: colors.gold, transparency: 88 },
    fill: { color: colors.gold, transparency: 94 },
  });
  slide.addText(`0${index}`, {
    x: 0.6,
    y: 0.45,
    w: 0.75,
    h: 0.3,
    fontFace: "Aptos Mono",
    fontSize: 11,
    color: colors.muted,
    bold: true,
    margin: 0,
  });
  slide.addText(title, {
    x: 0.6,
    y: 0.82,
    w: 9.6,
    h: 0.7,
    fontFace: "Aptos Display",
    fontSize: 24,
    bold: true,
    color: colors.white,
    margin: 0,
  });
  slide.addText(subtitle, {
    x: 0.6,
    y: 1.45,
    w: 11.6,
    h: 0.45,
    fontFace: "Aptos",
    fontSize: 11.5,
    color: colors.muted,
    margin: 0,
  });
}

function addFooter(slide, text) {
  slide.addText(text, {
    x: 0.6,
    y: 6.95,
    w: 12,
    h: 0.25,
    fontFace: "Aptos Mono",
    fontSize: 8.5,
    color: colors.muted,
    margin: 0,
  });
}

function addCard(slide, x, y, w, h, title, body, fill = colors.card) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.1,
    line: { color: colors.line, pt: 1 },
    fill: { color: fill },
    shadow: {
      type: "outer",
      color: "000000",
      blur: 2,
      angle: 45,
      distance: 1,
      opacity: 0.22,
    },
  });
  slide.addText(title, {
    x: x + 0.25,
    y: y + 0.18,
    w: w - 0.5,
    h: 0.26,
    fontFace: "Aptos Display",
    fontSize: 16,
    bold: true,
    color: colors.white,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.25,
    y: y + 0.5,
    w: w - 0.5,
    h: h - 0.65,
    fontFace: "Aptos",
    fontSize: 11.5,
    color: colors.ink,
    margin: 0,
    valign: "top",
    breakLine: false,
    fit: "shrink",
  });
}

function addMeme(slide, x, y, w, h, text) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.1,
    line: { color: colors.gold, pt: 1.5 },
    fill: { color: "1F2937" },
  });
  slide.addText("MEME BREAK", {
    x: x + 0.2,
    y: y + 0.12,
    w: w - 0.4,
    h: 0.22,
    fontFace: "Aptos Mono",
    fontSize: 9,
    bold: true,
    color: colors.gold,
    margin: 0,
  });
  slide.addText(text, {
    x: x + 0.2,
    y: y + 0.42,
    w: w - 0.4,
    h: h - 0.5,
    fontFace: "Aptos Display",
    fontSize: 14,
    bold: true,
    color: colors.white,
    italic: true,
    margin: 0,
    fit: "shrink",
    align: "center",
    valign: "mid",
  });
}

// Slide 1
{
  const slide = pptx.addSlide();
  addBackground(slide, "MCP Made Simple", "Lecture Part 1 for freshers", 1);
  slide.addText("Model Context Protocol", {
    x: 0.65,
    y: 2.1,
    w: 6.6,
    h: 0.6,
    fontFace: "Aptos Display",
    fontSize: 30,
    bold: true,
    color: colors.mint,
    margin: 0,
  });
  slide.addText(
    "One shared way for AI apps to talk to tools, files, and services.",
    {
      x: 0.65,
      y: 2.8,
      w: 7.5,
      h: 0.75,
      fontFace: "Aptos",
      fontSize: 18,
      color: colors.ink,
      margin: 0,
    },
  );
  addCard(
    slide,
    8.25,
    1.95,
    4.3,
    2.1,
    "Lecture vibe",
    "Simple words, one idea per slide, and enough humor to keep the room awake.",
  );
  addMeme(
    slide,
    8.25,
    4.35,
    4.3,
    1.55,
    "“If the integration graph looks like spaghetti, MCP is the fork.”",
  );
  addFooter(slide, "MCP lecture deck for fresher-friendly delivery");
}

// Slide 2
{
  const slide = pptx.addSlide();
  addBackground(slide, "Quick recap", "What MCP is in one line", 2);
  addCard(
    slide,
    0.7,
    2.0,
    5.8,
    2.1,
    "Short version",
    "MCP is a standard that lets an AI app connect to tools and data without custom wiring every time.",
  );
  addCard(
    slide,
    6.85,
    2.0,
    5.8,
    2.1,
    "Why it matters",
    "Without a standard, every app builds the same connections again and again.",
  );
  addMeme(
    slide,
    2.0,
    4.55,
    9.35,
    1.45,
    "“Me after hearing ‘just make one connector for every app’”",
  );
  addFooter(
    slide,
    "Keep this slide short and use it as the lecture reset point",
  );
}

// Slide 3
{
  const slide = pptx.addSlide();
  addBackground(
    slide,
    "The problem",
    "AI is smart, but it still needs access",
    3,
  );
  addCard(
    slide,
    0.7,
    2.0,
    3.95,
    2.2,
    "No access",
    "The model cannot read your files or check your data unless something connects it first.",
  );
  addCard(
    slide,
    4.7,
    2.0,
    3.95,
    2.2,
    "Duplicate work",
    "Every app rebuilds the same connection again and again.",
  );
  addCard(
    slide,
    8.7,
    2.0,
    3.95,
    2.2,
    "Hard to maintain",
    "When one API changes, the custom connectors start breaking in different places.",
  );
  addMeme(
    slide,
    2.1,
    4.8,
    9.1,
    1.35,
    "“One API update and suddenly the whole team is in incident mode.”",
  );
  addFooter(slide, "This is the pain point MCP is trying to remove");
}

// Slide 4
{
  const slide = pptx.addSlide();
  addBackground(slide, "MCP is like USB-C", "One plug, many devices", 4);
  addCard(
    slide,
    0.75,
    2.05,
    4.0,
    2.2,
    "Analogy",
    "USB-C works because the port is standard. MCP works the same way for AI tools.",
  );
  addCard(
    slide,
    4.95,
    2.05,
    3.55,
    2.2,
    "What changes",
    "The app does not need a custom cable for every service.",
  );
  addCard(
    slide,
    8.75,
    2.05,
    3.8,
    2.2,
    "Result",
    "One connection pattern can be reused everywhere.",
  );
  addMeme(
    slide,
    1.9,
    4.75,
    9.55,
    1.45,
    "“Finally, a port that does not need 12 adapters and emotional support.”",
  );
  addFooter(
    slide,
    "Use this analogy early. Freshers usually remember it fastest.",
  );
}

// Slide 5
{
  const slide = pptx.addSlide();
  addBackground(slide, "What MCP is", "A short definition", 5);
  addCard(
    slide,
    0.7,
    2.0,
    3.9,
    2.25,
    "Open standard",
    "Anyone can read it, use it, and build on it.",
  );
  addCard(
    slide,
    4.75,
    2.0,
    3.9,
    2.25,
    "Live context",
    "The app gets the right data when the user asks, not from old guesses.",
  );
  addCard(
    slide,
    8.8,
    2.0,
    3.9,
    2.25,
    "Vendor-neutral",
    "It works across apps and stacks instead of locking you to one company.",
  );
  addMeme(
    slide,
    2.2,
    4.8,
    8.9,
    1.35,
    "“The protocol is open, so the drama is optional.”",
  );
  addFooter(slide, "One definition, three ideas: open, live, neutral");
}

// Slide 6
{
  const slide = pptx.addSlide();
  addBackground(
    slide,
    "How it fits together",
    "One request moves through five pieces",
    6,
  );
  const labels = [
    ["User", "Asks the question"],
    ["Host", "The AI app"],
    ["Client", "The connector inside the app"],
    ["Server", "Shows tools and data"],
    ["Service", "The real system"],
  ];
  labels.forEach((item, index) => {
    addCard(slide, 0.7 + index * 2.48, 2.35, 2.25, 1.85, item[0], item[1]);
  });
  addMeme(
    slide,
    1.55,
    4.7,
    10.2,
    1.25,
    "“Five pieces, one request, zero custom chaos.”",
  );
  addFooter(slide, "This replaces the “everything talks to everything” mess");
}

// Slide 7
{
  const slide = pptx.addSlide();
  addBackground(
    slide,
    "Without MCP vs with MCP",
    "The same apps become much easier to wire",
    7,
  );
  addCard(
    slide,
    0.65,
    2.05,
    5.85,
    2.45,
    "Without MCP",
    "Every app needs a direct connection to every service. That grows into a spaghetti graph very quickly.",
  );
  addCard(
    slide,
    6.83,
    2.05,
    5.85,
    2.45,
    "With MCP",
    "Each app connects once. Each service is described once.",
  );
  addMeme(
    slide,
    2.1,
    4.9,
    9.15,
    1.25,
    "“The left side is a graph. The right side is a plan.”",
  );
  addFooter(slide, "This is the clearest slide for comparing the two worlds");
}

// Slide 8
{
  const slide = pptx.addSlide();
  addBackground(
    slide,
    "Step 1: Discover",
    "The client asks what the server can do",
    8,
  );
  addCard(
    slide,
    0.7,
    2.05,
    4.0,
    2.0,
    "Discovery",
    "The client sends a tools/list request to ask what is available.",
  );
  addCard(
    slide,
    4.95,
    2.05,
    4.0,
    2.0,
    "Response",
    "The server returns names, descriptions, and inputs for each tool.",
  );
  addCard(
    slide,
    9.2,
    2.05,
    3.45,
    2.0,
    "Result",
    "The client now knows what it can offer to the LLM.",
  );
  addMeme(
    slide,
    2.0,
    4.65,
    9.3,
    1.35,
    "“Before the question, we ask: what do you even have?”",
  );
  addFooter(slide, "Discovery is basically the menu before the meal");
}

// Slide 9
{
  const slide = pptx.addSlide();
  addBackground(
    slide,
    "Step 2: Call the tool",
    "Now the real request happens",
    9,
  );
  addCard(
    slide,
    0.7,
    2.05,
    4.0,
    2.0,
    "LLM chooses a tool",
    "The model picks the best tool based on the user request.",
  );
  addCard(
    slide,
    4.95,
    2.05,
    4.0,
    2.0,
    "Client sends it",
    "The client sends a clean JSON-RPC call to the server.",
  );
  addCard(
    slide,
    9.2,
    2.05,
    3.45,
    2.0,
    "Server responds",
    "The service returns the result and the client gives it back to the app.",
  );
  addMeme(
    slide,
    2.0,
    4.65,
    9.3,
    1.35,
    "“It is not magic. It is just a well-behaved request/response loop.”",
  );
  addFooter(slide, "This is the slide where JSON-RPC stops sounding scary");
}

// Slide 10
{
  const slide = pptx.addSlide();
  addBackground(
    slide,
    "Security and limits",
    "MCP solves the wiring problem, not every risk",
    10,
  );
  addCard(
    slide,
    0.7,
    2.0,
    3.9,
    2.25,
    "Tool poisoning",
    "A bad server can describe a tool in a misleading way.",
  );
  addCard(
    slide,
    4.75,
    2.0,
    3.9,
    2.25,
    "Prompt injection",
    "Tool output can include hidden instructions if you are not careful.",
  );
  addCard(
    slide,
    8.8,
    2.0,
    3.9,
    2.25,
    "Permissions",
    "A tool should only be allowed to do what it really needs.",
  );
  addMeme(
    slide,
    2.0,
    4.8,
    9.3,
    1.35,
    "“MCP is not a force field. It still needs good security.”",
  );
  addFooter(slide, "Good protocol, still needs good guardrails");
}

// Slide 11
{
  const slide = pptx.addSlide();
  addBackground(
    slide,
    "Real-world uses",
    "Where students will actually see this idea",
    11,
  );
  addCard(
    slide,
    0.7,
    2.0,
    3.9,
    2.25,
    "IDE assistants",
    "Connect coding tools to files, terminals, and project data.",
  );
  addCard(
    slide,
    4.75,
    2.0,
    3.9,
    2.25,
    "Knowledge tools",
    "Connect AI to notes, documents, and searchable resources.",
  );
  addCard(
    slide,
    8.8,
    2.0,
    3.9,
    2.25,
    "Agent workflows",
    "Let AI apps talk to services in a reusable way.",
  );
  addMeme(
    slide,
    2.1,
    4.8,
    9.1,
    1.35,
    "“This is the part where the lecture stops being theory.”",
  );
  addFooter(slide, "Use this to make the topic feel concrete");
}

// Slide 12
{
  const slide = pptx.addSlide();
  addBackground(slide, "Takeaway", "What students should remember", 12);
  addCard(
    slide,
    0.85,
    2.05,
    3.85,
    2.2,
    "1. Problem",
    "AI needs access to tools and data.",
  );
  addCard(
    slide,
    4.75,
    2.05,
    3.85,
    2.2,
    "2. Fix",
    "MCP gives one standard connection pattern.",
  );
  addCard(
    slide,
    8.65,
    2.05,
    3.85,
    2.2,
    "3. Result",
    "Less repeated work, cleaner integrations, easier scaling.",
  );
  addMeme(
    slide,
    2.15,
    4.8,
    9.0,
    1.35,
    "“One protocol to rule the integrations.”",
  );
  addFooter(slide, "End here if the class needs the short version");
}

await pptx.writeFile({ fileName: "MCP_Freshers_Simplified.pptx" });
