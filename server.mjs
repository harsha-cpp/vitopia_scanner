import { createRequire } from "module";

const require = createRequire(new URL("./fe/package.json", import.meta.url));
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

try {
  const nextApp = next({ dev, dir: "./fe", turbopack: false, webpack: true });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const { createApp } = await import("./be/dist/src/app.js");
  const app = createApp({ enableNotFound: false });

  app.all("*", (req, res) => handle(req, res));

  app.listen(port, () => {
    console.log(`Combined service running on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Failed to start combined service:", error);
  process.exit(1);
}

