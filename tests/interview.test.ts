// A real FE system-design monologue: mostly rationale, with structural statements
// buried inside it. The parser has to draw the structure and ignore the reasoning —
// drawing the reasoning is worse than drawing nothing, because it leaves the canvas
// full of boxes named after half-sentences.
import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent } from "../lib/diagram.ts";

const cmds = (said: string) => parseIntent(said);
const drawsNothing = (said: string) => assert.deepEqual(parseIntent(said), [], `should ignore: ${said}`);

test("a narration opener still names the node it mentions", () => {
  assert.deepEqual(cmds("Saya mulai dari User, kemudian User terhubung ke Browser"), [
    { type: "ADD_NODE", label: "User" },
    { type: "CONNECT", from: "User", to: "Browser" },
  ]);
});

test("a chain survives a connector it was never taught", () => {
  // "melewati" sits beside "melalui" and "lewat"; "sebelum" introduces the next step.
  assert.deepEqual(cmds("Browser melewati CDN sebelum masuk ke Frontend Application"), [
    { type: "CONNECT", from: "Browser", to: "CDN" },
    { type: "CONNECT", from: "CDN", to: "Frontend" },
  ]);
});

test("one box named twice collapses onto the name the vocabulary knows", () => {
  assert.deepEqual(cmds("Browser melewati CDN atau Edge Layer"),
    [{ type: "CONNECT", from: "Browser", to: "CDN" }]);
  // The first recognised half wins, and the protocol is dropped: an edge carries no label.
  assert.deepEqual(cmds("API Client terhubung melalui HTTPS ke API Gateway atau BFF"),
    [{ type: "CONNECT", from: "API Client", to: "API Gateway" }]);
  // A slash inside a canonical label is not an alias.
  assert.deepEqual(cmds("source code terhubung ke CI/CD pipeline"),
    [{ type: "CONNECT", from: "Source Code", to: "CI/CD Pipeline" }]);
});

test("branching accepts the words people actually use", () => {
  for (const verb of ["bercabang menjadi", "bercabang ke", "terpecah menjadi", "dibagi jadi", "splits into"])
    assert.deepEqual(cmds(`UI Layer ${verb} Pages, Feature Components, dan Design System`),
      [{ type: "BRANCH", from: "UI Layer", targets: ["Pages", "Feature Components", "Design System"] }],
      `branch verb: ${verb}`);
});

test("a step naming two nodes fans out to both", () => {
  assert.deepEqual(cmds("Backend Services terhubung ke Database dan Object Storage"), [
    { type: "CONNECT", from: "Backend Service", to: "Database" },
    { type: "CONNECT", from: "Backend Service", to: "Object Storage" },
  ]);
});

test("scene-setting before a comma is dropped, a source before one is not", () => {
  assert.deepEqual(cmds("Di luar flow utama, Frontend Application juga terhubung ke Observability Layer"),
    [{ type: "CONNECT", from: "Frontend", to: "Observability" }]);
  // "Dari X, …" names the source, so the opening phrase has to survive.
  assert.deepEqual(cmds("Dari Browser, request melewati CDN"),
    [{ type: "CONNECT", from: "Browser", to: "CDN" }]);
});

test("markers, modals and rationale are stripped from names", () => {
  assert.deepEqual(cmds("Pertama, UI Layer bercabang ke Pages"),
    [{ type: "BRANCH", from: "UI Layer", targets: ["Pages"] }]);
  assert.deepEqual(cmds("BFF kemudian bercabang ke User Service"),
    [{ type: "BRANCH", from: "BFF", targets: ["User Service"] }]);
  assert.deepEqual(cmds("Asset tersebut dapat terhubung kembali melalui CDN agar delivery lebih efisien"),
    [{ type: "CONNECT", from: "Asset", to: "CDN" }]);
  assert.deepEqual(cmds("Server State dapat menggunakan React Query"),
    [{ type: "SET_TECH", target: "Server State", tech: "TanStack Query" }]);
});

test("a branch target carrying its own verb is not a target", () => {
  // "kemudian terhubung ke build" has an implicit subject the parser refuses to guess,
  // so "build" is dropped rather than attached to whichever node was named last.
  assert.deepEqual(
    cmds("Pipeline bercabang ke type checking, unit test, integration test, dan E2E test, kemudian terhubung ke build dan deployment"),
    [{ type: "BRANCH", from: "Pipeline",
       targets: ["Type Checking", "Unit Test", "Integration Test", "E2E Test", "Deployment"] }]);
});

test("a technology stated on its own annotates without connecting", () => {
  assert.deepEqual(cmds("Setelah itu CDN terhubung ke Frontend Application, misalnya menggunakan Next.js"), [
    { type: "CONNECT", from: "CDN", to: "Frontend" },
    { type: "SET_TECH", target: "Frontend", tech: "Next.js" },
  ]);
});

test("what the design avoids is never drawn", () => {
  for (const said of [
    "frontend sebaiknya tidak mengambil semuanya melalui application server",
    "interactive dashboard tidak harus dipaksakan semuanya menggunakan SSR",
    "frontend tidak perlu mengetahui implementasi internal masing-masing service",
  ]) drawsNothing(said);
});

test("rationale sentences leave the canvas alone", () => {
  for (const said of [
    "Pages menangani composition per halaman",
    "Retry digunakan untuk transient failure, tetapi harus dibatasi agar tidak menyebabkan request storm",
    "Tujuannya untuk mengurangi latency, bandwidth, dan request yang langsung mencapai origin",
    "SSG cocok untuk static content, ISR untuk konten yang relatif statis tetapi perlu diperbarui",
    "Dengan begitu keputusan performance tidak hanya berdasarkan local testing",
  ]) drawsNothing(said);
});

test("a condition is dropped, a place that names a node is not", () => {
  assert.deepEqual(cmds("Untuk offline atau unstable network, Browser bercabang ke Service Worker"),
    [{ type: "BRANCH", from: "Browser", targets: ["Service Worker"] }]);
  assert.deepEqual(cmds("Di CDN, request diteruskan ke Origin"),
    [{ type: "CONNECT", from: "CDN", to: "Origin" }]);
});

test("an example given for a name is not part of the name", () => {
  assert.deepEqual(cmds("Browser bercabang ke local storage layer seperti Cache API atau IndexedDB"),
    [{ type: "BRANCH", from: "Browser", targets: ["Local Storage Layer", "IndexedDB"] }]);
});

test("a pasted paragraph is read one sentence at a time", () => {
  const pasted = `Saya mulai dari User, kemudian User terhubung ke Browser. Di Browser, saya akan memperhatikan Core Web Vitals.

Dari Browser, request melewati CDN atau Edge Layer. Setelah itu CDN terhubung ke Frontend Application, misalnya menggunakan Next.js.`;
  assert.deepEqual(cmds(pasted), [
    { type: "ADD_NODE", label: "User" },
    { type: "CONNECT", from: "User", to: "Browser" },
    { type: "CONNECT", from: "Browser", to: "CDN" },
    { type: "CONNECT", from: "CDN", to: "Frontend" },
    { type: "SET_TECH", target: "Frontend", tech: "Next.js" },
  ]);
});

test("a full stop inside a dictated name is not a sentence break", () => {
  // Dictation writes "next. js" as readily as "next js"; splitting there loses the node.
  for (const said of ["tambahkan next. js", "tambahkan next . js", "tambahkan next.js"])
    assert.deepEqual(cmds(said), [{ type: "ADD_NODE", label: "Next.js" }], `input: ${said}`);
});

test("a pronoun may speak a command, but may not be the one acting", () => {
  // The command word is what makes the pronoun a speaker rather than a subject.
  assert.deepEqual(cmds("kita sambungkan User ke CDN"), [{ type: "CONNECT", from: "User", to: "CDN" }]);
  assert.deepEqual(cmds("saya tambahkan Redis"), [{ type: "ADD_NODE", label: "Redis" }]);
  assert.deepEqual(cmds("kami hapus CDN"), [{ type: "DELETE_NODE", target: "CDN" }]);
  assert.deepEqual(cmds("we connect User to CDN"), [{ type: "CONNECT", from: "User", to: "CDN" }]);
  // Without one, the pronoun stays in the sentence and the guard reads it as chatter.
  for (const said of [
    "saya pindah ke bagian berikutnya",
    "kita kembali ke desain awal",
    "saya menghubungkan User ke CDN",
    "kita lanjut ke topik berikutnya",
  ]) drawsNothing(said);
});
