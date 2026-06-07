
  # Complete current task

  This is a code bundle for Complete current task. The original project is available at https://www.figma.com/design/UwmZbuVkfuhMh3OnnbZLmQ/Complete-current-task.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  For camera access and photo processing during local testing, create a `.env`
  file from `.env.example`, set `OPENAI_API_KEY`, then run:

  ```bash
  npm run dev:full
  ```

  ## Production

  The `/api/process-photo` endpoint is included as a serverless API route for
  hosts like Vercel. Set these environment variables in your hosting dashboard:

  - `OPENAI_API_KEY`
  - `OPENAI_IMAGE_MODEL` (optional, defaults to `gpt-image-1`)
  
