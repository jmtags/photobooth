import base64
import io
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image
from rembg import remove


MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]
BACKGROUND_COLORS = {
    "white": (255, 255, 255, 255),
    "blue": (37, 99, 235, 255),
}


class PhotoOptions(BaseModel):
    background: str = "white"
    attire: str = "original"


class ProcessPhotoRequest(BaseModel):
    photoUrl: str
    options: PhotoOptions = Field(default_factory=PhotoOptions)


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health():
    return {"ok": True}


def decode_data_url(data_url: str) -> bytes:
    if not data_url.startswith("data:image/") or ";base64," not in data_url:
        raise HTTPException(status_code=400, detail="A base64 image data URL is required.")

    encoded = data_url.split(";base64,", 1)[1]
    try:
        image_bytes = base64.b64decode(encoded, validate=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid image data.") from exc

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Photo is too large. Please capture a smaller image.")

    return image_bytes


def encode_png_data_url(image: Image.Image) -> str:
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True)
    encoded = base64.b64encode(output.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


@app.post("/api/process-photo")
def process_photo(payload: ProcessPhotoRequest):
    background = payload.options.background
    if background == "original":
        return {"processedPhotoUrl": payload.photoUrl, "notice": None}
    if background not in BACKGROUND_COLORS:
        raise HTTPException(status_code=400, detail="Background must be white or blue.")

    image_bytes = decode_data_url(payload.photoUrl)

    try:
        source = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        cutout = remove(source).convert("RGBA")
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Background removal failed.") from exc

    background_layer = Image.new("RGBA", cutout.size, BACKGROUND_COLORS[background])
    background_layer.alpha_composite(cutout)

    notice = None
    if payload.options.attire != "original":
        notice = "Clothes change is temporarily turned off. Background was updated, but clothes were kept original."

    return {
        "processedPhotoUrl": encode_png_data_url(background_layer.convert("RGB")),
        "notice": notice,
    }
