import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

const commands = [
  ["api", npmCommand, ["run", "api"]],
  ["web", npmCommand, ["run", "dev:https"]],
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: "pipe",
    env: process.env,
    shell: true,
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      children.forEach((running) => {
        if (running !== child && !running.killed) {
          running.kill();
        }
      });
      process.exitCode = code ?? 1;
    }
  });

  return child;
});

function shutdown() {
  children.forEach((child) => {
    if (!child.killed) {
      child.kill();
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
