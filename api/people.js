import crypto from "node:crypto";
import { guard, readPeople, writePeople, cleanPerson, slugOf, del, isBlobPhoto } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") return res.status(200).json(await readPeople());
    if (req.method !== "POST") return res.status(405).json({ error: "Use GET or POST." });
    if (!(await guard(req, res))) return;

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    body = body || {};

    if (body.action === "save") {
      const clean = cleanPerson(body.person);
      if (!clean) return res.status(400).json({ error: "A name is required." });
      const items = await readPeople();
      const id = String((body.person && body.person.id) || "");
      const hit = id ? items.find((p) => p.id === id) : null;

      if (hit) {
        const oldBanner = hit.banner;
        Object.assign(hit, clean);
        await writePeople(items);
        if (oldBanner && oldBanner !== hit.banner && isBlobPhoto(oldBanner)) {
          try { await del(oldBanner); } catch (_) { /* a stray old banner is harmless */ }
        }
        return res.status(200).json({ ok: true, person: hit });
      }

      if (items.length >= 300) return res.status(400).json({ error: "That is the most people the list can hold." });
      const base = slugOf(clean.name) || "person";
      let slug = base, n = 2;
      while (items.some((p) => p.slug === slug)) slug = base + "-" + n++;
      const entry = { id: crypto.randomUUID(), slug, ...clean, createdAt: Date.now() };
      items.push(entry);
      await writePeople(items);
      return res.status(200).json({ ok: true, person: entry });
    }

    if (body.action === "delete") {
      const id = String(body.id || "");
      const items = await readPeople();
      const hit = items.find((p) => p.id === id);
      if (!hit) return res.status(404).json({ error: "That person was not found." });
      await writePeople(items.filter((p) => p.id !== id));
      if (isBlobPhoto(hit.banner)) {
        try { await del(hit.banner); } catch (_) { /* the person is already gone */ }
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
