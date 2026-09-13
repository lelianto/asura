// The workspace UI is bilingual. A key present in one language and missing in the
// other renders as `undefined`, and a string hardcoded outside the label tables
// leaves the interface half-translated — a bug this project has shipped before.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const workspace = read("../components/workspace.tsx");

// Pull the `id:{...}` and `en:{...}` literals out of the labels table.
function keysOf(lang: "id" | "en"): string[] {
  const start = workspace.indexOf(`\n  ${lang}:{`);
  assert.ok(start > 0, `labels.${lang} not found — did the table move?`);
  const from = workspace.indexOf("{", start);
  let depth = 0, end = from;
  for (let i = from; i < workspace.length; i++) {
    if (workspace[i] === "{") depth++;
    else if (workspace[i] === "}") { depth--; if (!depth) { end = i; break } }
  }
  const body = workspace.slice(from + 1, end);
  return [...body.matchAll(/(?:^|,)\s*([A-Za-z][\w]*)\s*:/g)].map(m => m[1]);
}

test("both languages define exactly the same label keys", () => {
  const id = keysOf("id"), en = keysOf("en");
  const onlyId = id.filter(k => !en.includes(k));
  const onlyEn = en.filter(k => !id.includes(k));
  assert.deepEqual(onlyId, [], `keys missing from labels.en: ${onlyId.join(", ")}`);
  assert.deepEqual(onlyEn, [], `keys missing from labels.id: ${onlyEn.join(", ")}`);
});

test("no label key is declared twice in the same language", () => {
  for (const lang of ["id", "en"] as const) {
    const keys = keysOf(lang);
    assert.equal(new Set(keys).size, keys.length, `labels.${lang} repeats a key`);
  }
});

test("every declared label is actually used in the markup", () => {
  // Labels are read as `L.key` and, in the toast, as `labels[last.lang].key`.
  const used = new Set([
    ...[...workspace.matchAll(/\bL\.(\w+)/g)].map(m => m[1]),
    ...[...workspace.matchAll(/\blabels\[[^\]]+\]\.(\w+)/g)].map(m => m[1]),
  ]);
  // `L[status]` covers the six status strings by index rather than by name.
  const byStatus = ["listening", "processing", "initializing", "denied", "unavailable", "ended"];
  const unused = keysOf("id").filter(k => !used.has(k) && !byStatus.includes(k));
  assert.deepEqual(unused, [], `declared but never rendered: ${unused.join(", ")}`);
});

test("the workspace has no hardcoded Indonesian left in the markup", () => {
  // Words that would betray an untranslated string sitting outside the tables.
  const indonesian = /(?<![\w.])(Ucapkan|Bersihkan|Urungkan|Diterapkan|Tidak ada perubahan|Coba lagi|Kanvas siap|koneksi|Akhiri sesi|Sembunyikan)(?![\w"])/g;
  const markup = workspace.slice(workspace.indexOf("return <main"));
  const hits = [...markup.matchAll(indonesian)].map(m => m[0]);
  assert.deepEqual(hits, [], `hardcoded Indonesian in JSX: ${hits.join(", ")}`);
});

test("the guide is reachable from the canvas", () => {
  assert.match(workspace, /href="\/panduan"/, "no link to the guide");
});

test("the cheatsheet stays unlisted — reachable only by typing its URL", () => {
  // Personal interview-prep material. It is deliberately not advertised anywhere
  // in the public UI; re-adding a link here would expose it to every visitor.
  for (const [name, source] of [["workspace", workspace], ["guide", read("../components/guide.tsx")]] as const)
    assert.doesNotMatch(source, /href="\/cheatsheet"/,
      `${name} links to the cheatsheet — it must stay unlisted`);
});

test("the cheatsheet page asks crawlers not to index it", () => {
  const page = read("../app/cheatsheet/page.tsx");
  assert.match(page, /robots:\s*\{[^}]*index:\s*false/,
    "an unlisted page still gets indexed unless it says noindex");
});

test("voice mode can be turned off, and the text input takes the full row", () => {
  assert.match(workspace, /const \[voice,setVoice\]=useState\(false\)/, "voice mode state is missing");
  assert.match(workspace, /toggleVoice/, "no toggle for voice mode");
  assert.match(workspace, /void speech\.current\?\.stop\(\)[^}]*setVoice\(false\)/,
    "turning voice off must also stop the recogniser");
  assert.match(workspace, /voice\?"lg:grid-cols-\[1fr_340px\]":"grid-cols-1"/,
    "the bottom row must collapse to one column when voice is hidden");
  assert.match(workspace, /\{voice&&<div className="flex min-w-0 items-center gap-4/,
    "the microphone panel must be hidden when voice is off");
});
