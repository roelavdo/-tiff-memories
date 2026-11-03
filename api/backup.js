import { guard, readList, readPeople } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Use GET." });
    if (!(await guard(req, res))) return;
    const memories = await readList();
    const people = await readPeople();
    return res.status(200).json({ exportedAt: new Date().toISOString(), memories, people });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
