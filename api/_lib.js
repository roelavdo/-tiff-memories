import { put, list, del } from "@vercel/blob";
import crypto from "node:crypto";

export { put, del };

const DATA_PATH = "data/memories.json";
const PHOTO_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/* Best effort: lives in the memory of one server instance. */
const FAILS = new Map();

function samePassword(given) {
  const real = process.env.ADMIN_PASSWORD || "";
  const a = crypto.createHash("sha256").update(String(given)).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Resolves true when the request carries the right password. Otherwise it answers the request and resolves false. */
export async function guard(req, res) {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ error: "ADMIN_PASSWORD is not set in Vercel yet." });
    return false;
  }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const f = FAILS.get(ip);
  if (f && f.n >= 6 && Date.now() - f.t < 10 * 60 * 1000) {
    res.status(429).json({ error: "Too many wrong passwords. Wait 10 minutes and try again." });
    return false;
  }
  if (!samePassword(req.headers["x-admin-password"] || "")) {
    FAILS.set(ip, { n: (f && Date.now() - f.t < 10 * 60 * 1000 ? f.n : 0) + 1, t: Date.now() });
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ error: "Wrong password." });
    return false;
  }
  FAILS.delete(ip);
  return true;
}

export async function readList() {
  const { blobs } = await list({ prefix: DATA_PATH, limit: 5 });
  const hit = blobs.find((b) => b.pathname === DATA_PATH);
  if (!hit) return [];
  const r = await fetch(hit.url + "?t=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("Could not read the memories list (" + r.status + ").");
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

export async function writeList(items) {
  await put(DATA_PATH, JSON.stringify(items), {
    access: "public",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export const MAX_PHOTOS = 500;

export function cleanPhotos(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((u) => typeof u === "string" && PHOTO_URL.test(u)).slice(0, MAX_PHOTOS);
}

/** All photo URLs of a memory, including the older single `photo` field. */
export function photosOf(m) {
  const a = Array.isArray(m && m.photos) ? m.photos.filter((u) => typeof u === "string" && u) : [];
  if (!a.length && m && typeof m.photo === "string" && m.photo) return [m.photo];
  return a;
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Returns a safe memory object, or null when the title is missing. */
export function clean(m) {
  if (!m || typeof m !== "object") return null;
  const title = str(m.title, 120);
  if (!title) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(m.date || "") ? m.date : "";
  let photos = cleanPhotos(m.photos);
  if (!photos.length) photos = cleanPhotos([m.photo]);
  return {
    title,
    date,
    place: str(m.place, 120),
    people: str(m.people, 400),
    story: str(m.story, 6000),
    photos,
    photo: photos[0] || "",
  };
}

export function isBlobPhoto(url) {
  return typeof url === "string" && PHOTO_URL.test(url);
}

/* ---- people profiles ---- */
const PEOPLE_PATH = "data/people.json";

async function readAt(path) {
  const { blobs } = await list({ prefix: path, limit: 5 });
  const hit = blobs.find((b) => b.pathname === path);
  if (!hit) return [];
  const r = await fetch(hit.url + "?t=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("Could not read the list (" + r.status + ").");
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

async function writeAt(path, items) {
  await put(path, JSON.stringify(items), {
    access: "public",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export const readPeople = () => readAt(PEOPLE_PATH);
export const writePeople = (items) => writeAt(PEOPLE_PATH, items);

/** "Besë Krasniqi" becomes "bese-krasniqi". Used in page addresses and to match names. */
export function slugOf(name) {
  return String(name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export function cleanPerson(p) {
  if (!p || typeof p !== "object") return null;
  const name = str(p.name, 80);
  if (!name) return null;
  const socials = (Array.isArray(p.socials) ? p.socials : [])
    .slice(0, 12)
    .map((s) => ({ label: str(s && s.label, 30), url: str(s && s.url, 300) }))
    .filter((s) => s.label && /^https?:\/\//i.test(s.url));
  const banner = typeof p.banner === "string" && PHOTO_URL.test(p.banner) ? p.banner : "";
  const out = { name, bio: str(p.bio, 4000), socials, banner };
  if (p.page === null) out.page = null;
  else if (p.page !== undefined) out.page = cleanPage(p.page);
  return out;
}

/* ---- free-form personal page (scrapbook canvas) ---- */
const FONTS = ["Caveat", "Permanent Marker", "Special Elite", "Playfair Display", "Inter"];
const num = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
const HEX = /^#[0-9a-f]{3,8}$/i;

export function cleanPage(pg) {
  if (!pg || typeof pg !== "object") return null;
  const bg = pg.bg && typeof pg.bg === "object" ? pg.bg : {};
  const items = (Array.isArray(pg.items) ? pg.items : []).slice(0, 150).map((it) => {
    if (!it || typeof it !== "object") return null;
    const t = ["text", "link", "image", "video", "sticker"].includes(it.t) ? it.t : null;
    if (!t) return null;
    const o = {
      id: str(it.id, 40) || crypto.randomUUID(), t,
      x: num(it.x, -300, 1300, 0), y: num(it.y, -300, 8300, 0), w: num(it.w, 20, 1600, 200),
      r: num(it.r, -180, 180, 0), z: num(it.z, 0, 9999, 1),
    };
    if (t === "text" || t === "link") {
      o.text = str(it.text, 1500); o.size = num(it.size, 8, 300, 28);
      o.color = HEX.test(it.color || "") ? it.color : "#222222";
      o.font = FONTS.includes(it.font) ? it.font : "Inter";
      if (t === "link") { o.url = /^https?:\/\//i.test(it.url || "") ? str(it.url, 300) : ""; }
    }
    if (t === "image" || t === "video") {
      if (!(typeof it.src === "string" && PHOTO_URL.test(it.src))) return null;
      o.src = it.src; o.frame = ["none", "polaroid", "tape"].includes(it.frame) ? it.frame : "none";
      o.shape = ["none", "circle", "star", "heart"].includes(it.shape) ? it.shape : "none";
    }
    if (t === "sticker") o.text = Array.from(str(it.text, 16)).slice(0, 8).join("");
    o.anim = ["none", "float", "wiggle", "pulse"].includes(it.anim) ? it.anim : "none";
    return o;
  }).filter(Boolean);
  return {
    h: num(pg.h, 600, 8000, 1400),
    bg: {
      color: HEX.test(bg.color || "") ? bg.color : "#f4efe6",
      image: typeof bg.image === "string" && PHOTO_URL.test(bg.image) ? bg.image : "",
      pattern: ["none", "grid", "dots", "lines"].includes(bg.pattern) ? bg.pattern : "none",
    },
    items,
  };
}

/* ---- backup and storage helpers ---- */
export async function storageUsage() {
  let bytes = 0, count = 0, cursor;
  for (let i = 0; i < 30; i++) {
    const r = await list({ cursor, limit: 1000 });
    for (const b of r.blobs) { bytes += b.size || 0; count++; }
    if (!r.hasMore) break;
    cursor = r.cursor;
  }
  return { bytes, count };
}
