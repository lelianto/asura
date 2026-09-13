// Messy, real-world speech transcripts: fillers, stutters, dropped letters,
// two statements joined by "dan", and technology described inline.
import test from "node:test";
import assert from "node:assert/strict";
import { normalize, parseIntent } from "../lib/diagram.ts";
import { useDiagramStore } from "../lib/store.ts";

const reset = () => useDiagramStore.setState({ nodes: [], edges: [], past: [], future: [] });
const s = () => useDiagramStore.getState();
const graph = () => {
  const byId = new Map(s().nodes.map(n => [n.id, String(n.data.label)]));
  return {
    nodes: s().nodes.map(n => String(n.data.label)).sort(),
    tech: Object.fromEntries(s().nodes.filter(n => n.data.tech).map(n => [String(n.data.label), String(n.data.tech)])),
    edges: s().edges.map(e => `${byId.get(e.source)}->${byId.get(e.target)}`).sort(),
  };
};

const SENTENCE = "oke, dari user user tehubung ke CDN dan CDN mengakses Web terbuat dari Next js";

test("the full spoken sentence normalises to clean text", () => {
  assert.equal(normalize(SENTENCE), "dari User terhubung ke CDN dan CDN mengakses Web terbuat dari Next.js");
});

test("the full spoken sentence parses into both statements", () => {
  assert.deepEqual(parseIntent(SENTENCE), [
    { type: "CONNECT", from: "User", to: "CDN" },
    { type: "CONNECT", from: "CDN", to: "Web" },
    { type: "SET_TECH", target: "Web", tech: "Next.js" },
  ]);
});

test("the full spoken sentence draws the right diagram", () => {
  reset();
  assert.equal(s().execute(parseIntent(SENTENCE)), true);
  assert.deepEqual(graph(), {
    nodes: ["CDN", "User", "Web"],
    tech: { Web: "Next.js" },
    edges: ["CDN->Web", "User->CDN"],
  });
});

test("stuttered and repeated words collapse", () => {
  assert.equal(normalize("user user user ke CDN"), "User ke CDN");
  assert.equal(normalize("tambahkan tambahkan Redis"), "tambahkan Redis");
});

test("dropped letters in connectives are repaired", () => {
  for (const said of ["tehubung", "terhubun", "terhbung"])
    assert.deepEqual(parseIntent(`User ${said} ke CDN`), [{ type: "CONNECT", from: "User", to: "CDN" }]);
  assert.deepEqual(parseIntent("CDN mengakse Web"), [{ type: "CONNECT", from: "CDN", to: "Web" }]);
});

test("the connecting verb is never absorbed into the node label", () => {
  assert.deepEqual(parseIntent("dari User terhubung ke CDN"), [{ type: "CONNECT", from: "User", to: "CDN" }]);
  assert.deepEqual(parseIntent("User terhubung dengan CDN"), [{ type: "CONNECT", from: "User", to: "CDN" }]);
});

test("extra connecting verbs are understood", () => {
  for (const verb of ["mengakses", "memanggil", "menuju", "mengirim ke", "meneruskan ke"])
    assert.deepEqual(parseIntent(`CDN ${verb} Web`), [{ type: "CONNECT", from: "CDN", to: "Web" }]);
  for (const verb of ["calls", "accesses", "routes to", "sends to"])
    assert.deepEqual(parseIntent(`CDN ${verb} Web`), [{ type: "CONNECT", from: "CDN", to: "Web" }]);
});

test("'dan' joins two statements when both carry a verb", () => {
  assert.deepEqual(parseIntent("User ke CDN dan CDN ke Web"), [
    { type: "CONNECT", from: "User", to: "CDN" },
    { type: "CONNECT", from: "CDN", to: "Web" },
  ]);
  assert.deepEqual(parseIntent("tambahkan Redis dan hapus CDN"), [
    { type: "ADD_NODE", label: "Redis" },
    { type: "DELETE_NODE", target: "CDN" },
  ]);
});

test("'dan' still lists branch targets rather than splitting the statement", () => {
  assert.deepEqual(parseIntent("BFF bercabang ke Redis dan GraphQL"),
    [{ type: "BRANCH", from: "BFF", targets: ["Redis", "GraphQL"] }]);
});

test("'tambahkan A dan B' adds two nodes", () => {
  assert.deepEqual(parseIntent("tambahkan Redis dan GraphQL"), [
    { type: "ADD_NODE", label: "Redis" },
    { type: "ADD_NODE", label: "GraphQL" },
  ]);
});

test("technology phrases annotate the node instead of renaming it", () => {
  for (const phrase of ["terbuat dari", "dibuat dengan", "menggunakan", "built with", "powered by"])
    assert.deepEqual(parseIntent(`tambahkan Web ${phrase} Next js`), [
      { type: "ADD_NODE", label: "Web" },
      { type: "SET_TECH", target: "Web", tech: "Next.js" },
    ]);
});

test("SET_TECH is idempotent and reports no change on a repeat", () => {
  reset();
  assert.equal(s().execute(parseIntent("tambahkan Web menggunakan Next js")), true);
  assert.equal(s().execute(parseIntent("tambahkan Web menggunakan Next js")), false);
});

test("'hapus koneksi A ke B' removes the edge, not the node", () => {
  reset();
  s().execute(parseIntent("User ke CDN"));
  assert.deepEqual(parseIntent("hapus koneksi User ke CDN"),
    [{ type: "DISCONNECT", from: "User", to: "CDN" }]);
  s().execute(parseIntent("hapus koneksi User ke CDN"));
  assert.deepEqual(graph().nodes, ["CDN", "User"]);
  assert.equal(s().edges.length, 0);
});

test("ambient conversation still draws nothing", () => {
  for (const said of [
    "saya rasa arsitekturnya sudah bagus",
    "oke, jadi menurut saya itu masuk akal",
    "nanti kita bahas lagi ya",
  ]) assert.deepEqual(parseIntent(said), [], `should ignore: ${said}`);
});

test("conversation that merely fits the 'A ke B' shape is ignored", () => {
  for (const said of [
    "kita pindah ke bagian berikutnya",
    "menurut saya lebih baik kita kembali ke desain awal",
    "let's move on to the next topic",
    "saya kirim ke kamu nanti",
    "maybe we should add that to the backlog",
  ]) assert.deepEqual(parseIntent(said), [], `should ignore: ${said}`);
});

test("the guard does not reject legitimate architecture labels", () => {
  assert.deepEqual(parseIntent("User ke CDN"), [{ type: "CONNECT", from: "User", to: "CDN" }]);
  assert.deepEqual(parseIntent("tambahkan Auth Service"), [{ type: "ADD_NODE", label: "Auth Service" }]);
  assert.deepEqual(parseIntent("API Gateway ke Next.js"),
    [{ type: "CONNECT", from: "API Gateway", to: "Next.js" }]);
  assert.deepEqual(parseIntent("tambahkan Web menggunakan Next js"),
    [{ type: "ADD_NODE", label: "Web" }, { type: "SET_TECH", target: "Web", tech: "Next.js" }]);
});
