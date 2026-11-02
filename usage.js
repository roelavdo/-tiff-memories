import { guard, storageUsage } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (!(await guard(req, res))) return;
    return res.status(200).json(await storageUsage());
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
