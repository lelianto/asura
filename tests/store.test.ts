import test from "node:test";
import assert from "node:assert/strict";
import { useDiagramStore } from "../lib/store.ts";
import { parseIntent } from "../lib/diagram.ts";

const reset = () => useDiagramStore.setState({
  nodes: [{ id: "user", position: { x: 0, y: 0 }, data: { label: "User", kind: "client" } }],
  edges: [], past: [], future: [],
});
const s = () => useDiagramStore.getState();
const labels = () => s().nodes.map(n => String(n.data.label)).sort();

test("ADD_NODE creates a node", () => {
  reset();
  s().execute(parseIntent("tambahkan Redis"));
  assert.deepEqual(labels(), ["Redis", "User"]);
});

test("ADD_NODE is idempotent for an existing label", () => {
  reset();
  s().execute(parseIntent("tambahkan Redis"));
  s().execute(parseIntent("tambahkan redis"));
  assert.equal(s().nodes.length, 2);
});

test("CONNECT auto-creates missing nodes and one edge", () => {
  reset();
  s().execute(parseIntent("User ke CDN"));
  assert.deepEqual(labels(), ["CDN", "User"]);
  assert.equal(s().edges.length, 1);
});

test("CONNECT does not duplicate an existing edge", () => {
  reset();
  s().execute(parseIntent("User ke CDN"));
  s().execute(parseIntent("User ke CDN"));
  assert.equal(s().edges.length, 1);
});

test("DELETE_NODE removes the node and its edges", () => {
  reset();
  s().execute(parseIntent("User ke CDN"));
  s().execute(parseIntent("hapus CDN"));
  assert.deepEqual(labels(), ["User"]);
  assert.equal(s().edges.length, 0);
});

test("RENAME_NODE keeps edges intact", () => {
  reset();
  s().execute(parseIntent("User ke BFF"));
  s().execute(parseIntent("ganti BFF jadi API Gateway"));
  assert.deepEqual(labels(), ["API Gateway", "User"]);
  assert.equal(s().edges.length, 1);
});

test("undo / redo round-trips", () => {
  reset();
  s().execute(parseIntent("tambahkan Redis"));
  s().undo();
  assert.deepEqual(labels(), ["User"]);
  s().redo();
  assert.deepEqual(labels(), ["Redis", "User"]);
});

test("a new command clears the redo stack", () => {
  reset();
  s().execute(parseIntent("tambahkan Redis"));
  s().undo();
  s().execute(parseIntent("tambahkan GraphQL"));
  assert.equal(s().future.length, 0);
});

test("clear is undoable", () => {
  reset();
  s().clear();
  assert.equal(s().nodes.length, 0);
  s().undo();
  assert.deepEqual(labels(), ["User"]);
});

// ---- behaviours that should hold but currently do not ----

test("a command that changes nothing must not push an undo step", () => {
  reset();
  const depth = s().past.length;
  s().execute(parseIntent("hapus NodeYangTidakAda"));
  assert.equal(s().past.length, depth, "no-op should not create history");
});

test("RENAME_NODE onto an existing label must not create a duplicate", () => {
  reset();
  s().execute(parseIntent("tambahkan Redis"));
  s().execute(parseIntent("ganti Redis jadi User"));
  assert.equal(new Set(labels()).size, s().nodes.length, "labels must stay unique");
});

test("history is bounded", () => {
  reset();
  for (let i = 0; i < 300; i++) s().execute(parseIntent(`tambahkan Node${i}`));
  assert.ok(s().past.length <= 100, `unbounded history: ${s().past.length} snapshots retained`);
});

test("DISCONNECT removes the edge but keeps both nodes", () => {
  reset();
  s().execute(parseIntent("User ke CDN"));
  assert.ok(s().execute(parseIntent("putuskan User dari CDN")));
  assert.deepEqual(labels(), ["CDN", "User"]);
  assert.equal(s().edges.length, 0);
});

test("'tambahkan X ke Y' adds the node and wires it", () => {
  reset();
  s().execute(parseIntent("tambahkan Redis ke BFF"));
  assert.deepEqual(labels(), ["BFF", "Redis", "User"]);
  assert.equal(s().edges.length, 1);
});

test("execute reports whether the diagram actually changed", () => {
  reset();
  assert.equal(s().execute(parseIntent("tambahkan Redis")), true);
  assert.equal(s().execute(parseIntent("tambahkan Redis")), false);
  assert.equal(s().execute(parseIntent("hapus TidakAda")), false);
  assert.equal(s().execute([]), false);
});

test("a node is never connected to itself", () => {
  reset();
  s().execute(parseIntent("User ke User"));
  assert.equal(s().edges.length, 0);
});

// The canvas offers the same three edits as speech: wipe everything, delete one
// node, fix a name that speech recognition got wrong.
test("'hapus semua' wipes the canvas and is undoable", () => {
  reset();
  s().execute(parseIntent("User terhubung ke CDN"));
  assert.equal(s().execute(parseIntent("hapus semua node")), true);
  assert.deepEqual(labels(), []);
  assert.equal(s().edges.length, 0);
  s().undo();
  assert.deepEqual(labels(), ["CDN", "User"]);
  assert.equal(s().edges.length, 1);
});

test("clearing an empty canvas is not a change", () => {
  reset();
  s().clear();
  assert.equal(s().execute(parseIntent("hapus semua")), false);
  assert.equal(s().past.length, 1);
});

test("remove drops a node with its edges, and only once", () => {
  reset();
  s().execute(parseIntent("User terhubung ke CDN"));
  const cdn = s().nodes.find(n => String(n.data.label) === "CDN")!;
  assert.equal(s().remove([cdn.id]), true);
  assert.deepEqual(labels(), ["User"]);
  assert.equal(s().edges.length, 0);
  assert.equal(s().remove([cdn.id]), false);
  s().undo();
  assert.deepEqual(labels(), ["CDN", "User"]);
});

test("remove deletes a lone edge without touching its nodes", () => {
  reset();
  s().execute(parseIntent("User terhubung ke CDN"));
  assert.equal(s().remove([], [s().edges[0].id]), true);
  assert.deepEqual(labels(), ["CDN", "User"]);
  assert.equal(s().edges.length, 0);
});

test("rename normalises the typed label and refuses a duplicate", () => {
  reset();
  s().execute(parseIntent("tambahkan Next GS"));
  const [node] = s().nodes.filter(n => String(n.data.label) !== "User");
  assert.equal(String(node.data.label), "Next.js");
  assert.equal(s().rename(node.id, "next js"), false);
  assert.equal(s().rename(node.id, "redis"), true);
  assert.deepEqual(labels(), ["Redis", "User"]);
  // kind follows the new label, so the node is recoloured as data, not an app.
  assert.equal(s().nodes.find(n => n.id === node.id)!.data.kind, "data");
  assert.equal(s().rename(node.id, "User"), false);
  assert.equal(s().rename(node.id, "  "), false);
  s().undo();
  assert.deepEqual(labels(), ["Next.js", "User"]);
});

// The manual editor is the deterministic path into the same diagram: it names a box
// and draws a line outright instead of hoping the parser recognises a sentence.
test("addNode creates a box, normalises its label and refuses a duplicate", () => {
  reset();
  assert.equal(s().addNode("next js"), true);
  assert.deepEqual(labels(), ["Next.js", "User"]);
  // The label is what makes a node findable, so a second box may not reuse one.
  assert.equal(s().addNode("NEXT JS"), false);
  assert.equal(s().addNode("   "), false);
  assert.equal(s().nodes.length, 2);
  s().undo();
  assert.deepEqual(labels(), ["User"]);
});

test("addNode keeps the kind picked in the editor over the one the vocabulary infers", () => {
  reset();
  assert.equal(s().addNode("Cache Miss", "technique"), true);
  assert.equal(s().nodes.find(n => String(n.data.label) === "Cache Miss")!.data.kind, "technique");
  // Without a choice the vocabulary still decides: "Redis" is a data store.
  assert.equal(s().addNode("Redis"), true);
  assert.equal(s().nodes.find(n => String(n.data.label) === "Redis")!.data.kind, "data");
});

test("link connects two existing boxes and records the line style", () => {
  reset();
  s().addNode("Cache Miss");
  const [user, miss] = s().nodes;
  assert.equal(s().link(user.id, miss.id, "dashed"), true);
  assert.equal(s().edges.length, 1);
  assert.equal(s().edges[0].data!.variant, "dashed");
  s().undo();
  assert.equal(s().edges.length, 0);
});

test("link refuses a self-loop, a duplicate and an id the canvas does not hold", () => {
  reset();
  s().addNode("Cache Miss");
  const [user, miss] = s().nodes;
  assert.equal(s().link(user.id, user.id, "solid"), false);
  assert.equal(s().link(user.id, "no-such-node", "solid"), false);
  assert.equal(s().link(user.id, miss.id, "solid"), true);
  assert.equal(s().link(user.id, miss.id, "dashed"), false);
  assert.equal(s().edges.length, 1);
});

test("setEdgeVariant flips a line between solid and dashed, and is undoable", () => {
  reset();
  s().execute(parseIntent("User terhubung ke CDN"));
  const edge = s().edges[0];
  // A parsed edge stores no style; the canvas infers one from its direction.
  assert.equal(edge.data?.variant, undefined);
  assert.equal(s().setEdgeVariant(edge.id, "dashed"), true);
  assert.equal(s().edges[0].data!.variant, "dashed");
  assert.equal(s().setEdgeVariant(edge.id, "dashed"), false);
  assert.equal(s().setEdgeVariant("no-such-edge", "solid"), false);
  s().undo();
  assert.equal(s().edges[0].data?.variant, undefined);
});
