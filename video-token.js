import { handleUploadPresigned } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { guard } from "./_lib.js";

const TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX = 500 * 1024 * 1024; // 500 MB per video

/** Hands the browser a short-lived permission to upload one video straight to storage. Needs the password. */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    if (!(await guard(req, res))) return;
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const out = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => {
        if (!/^videos\/[a-z0-9._-]{1,80}\.(mp4|webm|mov)$/i.test(pathname)) {
          throw new Error("Use an MP4, WebM or MOV video.");
        }
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: TYPES,
          maximumSizeInBytes: MAX,
          validUntil: Date.now() + 60 * 60 * 1000,
        });
        return { token, urlOptions: { addRandomSuffix: true } };
      },
    });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
