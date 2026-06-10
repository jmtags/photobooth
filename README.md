
  # Complete current task

  This is a code bundle for Complete current task. The original project is available at https://www.figma.com/design/UwmZbuVkfuhMh3OnnbZLmQ/Complete-current-task.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  For camera access and photo processing during local testing, start the
  `rembg-service` API, create a `.env` file from `.env.example`, then run the
  HTTPS dev server:

  ```bash
  npm run dev:https
  ```

  ## Photo Processing API

  The React app calls `VITE_PHOTO_API_URL` and expects:

  - `GET /api/health`
  - `POST /api/process-photo`

  Deploy `rembg-service` to Render for background removal. Images are processed
  temporarily and returned to the browser; they are not stored in a database.
  
