import { createApp } from "../server/app.ts";

// Vercel serves the built SPA from dist/ and routes /api/* here.
// Static serving stays disabled so the platform handles asset delivery.
const appPromise = createApp({ serveStatic: false, enableDevVite: false });

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
