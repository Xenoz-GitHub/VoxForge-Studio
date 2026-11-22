import "dotenv/config";
import { createApp } from "./server/app.ts";

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = await createApp({
    serveStatic: process.env.NODE_ENV === "production",
    enableDevVite: process.env.NODE_ENV !== "production",
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoxForge Studio listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
