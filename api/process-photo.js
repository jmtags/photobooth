import { PhotoProcessingError, processPhoto } from "../lib/photo-processing.mjs";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const processedPhotoUrl = await processPhoto(body ?? {});
    res.status(200).json({ processedPhotoUrl });
  } catch (err) {
    const status = err instanceof PhotoProcessingError ? err.status : 500;
    res.status(status).json({
      error: err instanceof Error ? err.message : "Photo processing failed.",
      details: err instanceof PhotoProcessingError ? err.details : undefined,
    });
  }
}
