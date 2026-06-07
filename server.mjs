import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.API_PORT ?? 8787);
const MAX_BODY_SIZE = 12 * 1024 * 1024;

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error("Photo is too large. Please capture a smaller image."));
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON request."));
      }
    });

    req.on("error", reject);
  });
}

function dataUrlToBlob(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid photo data.");
  }

  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  return new Blob([bytes], { type: mimeType });
}

function buildPrompt(options) {
  const background = {
    original: "Keep the original background.",
    white: "Replace the background with a clean, plain white studio background.",
    blue: "Replace the background with a clean, plain royal blue ID-photo background.",
    removed: "Remove the background and return a transparent PNG around the person.",
  }[options.background ?? "original"];

  const attire = {
    original: "Keep the person's original clothing.",
    "male-office":
      "Replace only the clothing with realistic male office attire: dark blazer, light collared shirt, neat professional styling.",
    "female-office":
      "Replace only the clothing with realistic female office attire: professional blazer, modest blouse, neat professional styling.",
  }[options.attire ?? "original"];

  const retouching = [
    options.brightness ? "Balance exposure and make the portrait evenly lit." : "",
    options.smoothing ? "Apply subtle natural skin smoothing without changing facial features." : "",
    options.skinTone ? "Keep skin tone natural and realistic." : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "Edit this into a print-ready ID photo.",
    "Preserve the same identity, face shape, facial features, hair, expression, and head position.",
    "Use a centered head-and-shoulders passport-photo composition with natural lighting.",
    background,
    attire,
    retouching,
    "Do not add text, logos, filters, accessories, or decorative elements.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function processPhoto({ photoUrl, options }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set on the API server.");
  }

  if (!photoUrl || typeof photoUrl !== "string") {
    throw new Error("A captured photo is required.");
  }

  const imageBlob = dataUrlToBlob(photoUrl);
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1");
  form.append("image", imageBlob, "photo.png");
  form.append("prompt", buildPrompt(options ?? {}));
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("output_format", "png");

  if (options?.background === "removed") {
    form.append("background", "transparent");
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = result?.error?.message ?? "OpenAI image editing failed.";
    throw new Error(message);
  }

  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI did not return an edited image.");
  }

  return `data:image/png;base64,${b64}`;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/api/process-photo") {
    try {
      const body = await readJsonBody(req);
      const processedPhotoUrl = await processPhoto(body);
      sendJson(res, 200, { processedPhotoUrl });
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : "Photo processing failed.",
      });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Photo processing API listening on http://localhost:${PORT}`);
});
