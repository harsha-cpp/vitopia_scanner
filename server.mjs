import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const nextApp = next({ dev, dir: "./fe" });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();

const { createApp } = await import("./be/dist/app.js");
const app = createApp({ enableNotFound: false });

app.all("*", (req, res) => handle(req, res));

app.listen(port, () => {
  console.log(`Combined service running on http://localhost:${port}`);
});
