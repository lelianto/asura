// How Indonesian speakers actually dictate architecture: colloquial verbs,
// polite prefixes, "-nya" suffixes, filler stacks, and English technical terms
// pronounced word-by-word ("next js", "graph ql", "be ef ef").
import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent, normalize } from "../lib/diagram.ts";
import { examples } from "../lib/examples.ts";

const connect = (from: string, to: string) => ({ type: "CONNECT", from, to });
const add = (label: string) => ({ type: "ADD_NODE", label });

const check = (cases: Array<[string, unknown]>) => {
  for (const [said, expected] of cases)
    assert.deepEqual(parseIntent(said), expected, `input: ${said}`);
};

test("every example in the UI panel parses", () => {
  for (const lang of ["id", "en"] as const)
    for (const line of examples[lang])
      assert.ok(parseIntent(line).length > 0, `[${lang}] example does not parse: ${line}`);
});

test("English terms dictated word-by-word", () => {
  check([
    ["tambahkan next js", [add("Next.js")]],
    ["tambahkan graph ql", [add("GraphQL")]],
    ["tambahkan be ef ef", [add("BFF")]],
    ["tambahkan web socket", [add("WebSocket")]],
    ["tambahkan tan stack query", [add("TanStack Query")]],
    ["tambahkan service worker", [add("Service Worker")]],
    ["tambahkan local storage", [add("Local Storage")]],
    ["tambahkan aplikasi mobile", [add("Mobile App")]],
  ]);
});

test("colloquial imperatives", () => {
  check([
    ["tambahin Redis", [add("Redis")]],
    ["bikin Auth Service", [add("Auth Service")]],
    ["buatkan API Gateway", [add("API Gateway")]],
    ["nambahin CDN", [add("CDN")]],
    ["buang Redis", [{ type: "DELETE_NODE", target: "Redis" }]],
    ["hilangkan CDN", [{ type: "DELETE_NODE", target: "CDN" }]],
  ]);
});

test("polite and intent prefixes are stripped", () => {
  check([
    ["tolong tambahkan Redis", [add("Redis")]],
    ["coba tambahkan Redis", [add("Redis")]],
    ["aku mau tambahkan Redis", [add("Redis")]],
    ["saya ingin tambahkan Redis", [add("Redis")]],
    ["kita mau hubungkan User ke CDN", [connect("User", "CDN")]],
  ]);
});

test("stacked fillers at the start", () => {
  check([
    ["oke jadi begini, User ke CDN", [connect("User", "CDN")]],
    ["nah terus User ke CDN", [connect("User", "CDN")]],
    ["hmm, oke, tambahkan Redis", [add("Redis")]],
    ["ya sudah, hapus Redis", [{ type: "DELETE_NODE", target: "Redis" }]],
  ]);
});

test("'-nya' suffix and trailing particles", () => {
  check([
    ["User-nya terhubung ke CDN", [connect("User", "CDN")]],
    ["BFF-nya bercabang ke Redis dan GraphQL",
      [{ type: "BRANCH", from: "BFF", targets: ["Redis", "GraphQL"] }]],
    ["tambahkan Redis dong", [add("Redis")]],
    ["hapus CDN aja", [{ type: "DELETE_NODE", target: "CDN" }]],
    ["CDN itu terhubung ke Next js", [connect("CDN", "Next.js")]],
  ]);
});

test("colloquial connecting verbs", () => {
  check([
    ["Next js manggil graph ql", [connect("Next.js", "GraphQL")]],
    ["CDN ngakses Web", [connect("CDN", "Web")]],
    ["sambungkan User ke CDN", [connect("User", "CDN")]],
    ["hubungkan Mobile App ke BFF", [connect("Mobile App", "BFF")]],
    ["User masuk melalui CDN", [connect("User", "CDN")]],
    ["User lewat CDN", [connect("User", "CDN")]],
  ]);
});

test("longer chains with mixed connectors", () => {
  check([
    ["User ke CDN lalu ke Next js terus ke BFF",
      [connect("User", "CDN"), connect("CDN", "Next.js"), connect("Next.js", "BFF")]],
    ["dari pengguna ke aplikasi mobile lalu ke backend api",
      [connect("User", "Mobile App"), connect("Mobile App", "Backend API")]],
    ["dari User ke CDN, lalu ke Next js",
      [connect("User", "CDN"), connect("CDN", "Next.js")]],
  ]);
});

test("technology stated in Indonesian around an English term", () => {
  check([
    ["tambahkan Web terbuat dari next js",
      [add("Web"), { type: "SET_TECH", target: "Web", tech: "Next.js" }]],
    ["tambahkan Cache dibuat dengan Redis",
      [add("Cache"), { type: "SET_TECH", target: "Cache", tech: "Redis" }]],
    ["tambahkan Dashboard memakai tan stack query",
      [add("Dashboard"), { type: "SET_TECH", target: "Dashboard", tech: "TanStack Query" }]],
  ]);
});

test("rename and disconnect, Indonesian phrasing", () => {
  check([
    ["ubah local storage menjadi Redis",
      [{ type: "RENAME_NODE", target: "Local Storage", newLabel: "Redis" }]],
    ["ganti be ef ef jadi backend api",
      [{ type: "RENAME_NODE", target: "BFF", newLabel: "Backend API" }]],
    ["putuskan User dari CDN", [{ type: "DISCONNECT", from: "User", to: "CDN" }]],
    ["hapus koneksi CDN ke Next js", [{ type: "DISCONNECT", from: "CDN", to: "Next.js" }]],
  ]);
});

test("multi-statement dictation in one breath", () => {
  check([
    ["tambahkan Redis dan hubungkan BFF ke Redis",
      [add("Redis"), connect("BFF", "Redis")]],
    ["User ke CDN dan CDN mengakses Next js",
      [connect("User", "CDN"), connect("CDN", "Next.js")]],
  ]);
});

test("vocabulary normalisation is case- and spacing-tolerant", () => {
  for (const said of ["NEXT JS", "next  js", "Next.JS", "nextjs"])
    assert.equal(normalize(said), "Next.js", `input: ${said}`);
  // Spelled out in Indonesian, id-ID transcribes "J S" as "GS", "jes" or "ji es".
  for (const said of ["Next GS", "next ji es", "next je es", "next jes", "next ges"])
    assert.equal(normalize(said), "Next.js", `input: ${said}`);
  for (const said of ["GRAPH QL", "graphql", "Graph QL"])
    assert.equal(normalize(said), "GraphQL", `input: ${said}`);
});

test("clearing the whole canvas by voice", () => {
  for (const said of [
    "hapus semua", "hapus semuanya", "hapus semua node", "buang seluruh node",
    "bersihkan diagram", "bersihkan kanvas", "kosongkan kanvasnya", "reset diagram",
    "hapus semua dong", "mulai lagi dari awal",
    "clear all", "delete all nodes", "remove everything", "clear the canvas", "start over",
  ]) assert.deepEqual(parseIntent(said), [{ type: "CLEAR" }], `input: ${said}`);
});

test("clearing needs an explicit object, a named node is still a single delete", () => {
  check([
    ["hapus Redis", [{ type: "DELETE_NODE", target: "Redis" }]],
    ["hapus semua koneksi User ke CDN", [{ type: "DISCONNECT", from: "User", to: "CDN" }]],
  ]);
  for (const said of ["clear", "reset", "bersihkan", "semua"])
    assert.deepEqual(parseIntent(said), [], `should not wipe the canvas: ${said}`);
});

test("Indonesian small talk still draws nothing", () => {
  for (const said of [
    "oke kita lanjut ke topik berikutnya",
    "menurut saya desainnya sudah cukup",
    "nanti saya kirim ke kamu ya",
    "bentar ya saya cek dulu",
    "iya betul sekali",
  ]) assert.deepEqual(parseIntent(said), [], `should ignore: ${said}`);
});
