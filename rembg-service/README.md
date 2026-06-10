# rembg Photo API

Small temporary image-processing service for Render. It removes the photo background with `rembg`, composites the person onto a white or blue background, and returns a PNG data URL. Images are not stored.

## Local

```bash
cd rembg-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8787
```

Then set the frontend env:

```bash
VITE_PHOTO_API_URL=http://localhost:8787
```

## Render

Create a Render Web Service using this folder as the root directory.

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Environment variable: `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app`

Use the deployed URL as:

```bash
VITE_PHOTO_API_URL=https://your-render-service.onrender.com
```
