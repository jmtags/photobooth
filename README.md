
  # Complete current task

  This is a code bundle for Complete current task. The original project is available at https://www.figma.com/design/UwmZbuVkfuhMh3OnnbZLmQ/Complete-current-task.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  For camera access during local testing, create a `.env` file from
  `.env.example`, then run the HTTPS dev server:

  ```bash
  npm run dev:https
  ```

  ## Photo Processing

  Background replacement runs in the browser with MediaPipe Image Segmenter.
  Images are processed locally on the device and are not uploaded to a database
  or external API.
  
