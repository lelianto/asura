// Saved designs are the only state that outlives a reload, so the storage layer has to
// survive what a real browser hands back: missing keys, and entries written by an
// older build that no longer parse as a diagram.
import test from "node:test";
import assert from "node:assert/strict";
import type { Edge, Node } from "@xyflow/react";
import { deleteDesign, readAutosave, readDesigns, saveDesign, writeAutosave } from "../lib/persistence.ts";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => memory.has(key) ? memory.get(key)! : null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    },
  },
});

const nodes: Node[] = [{ id: "user", position: { x: 0, y: 0 }, data: { label: "User" } }];
const edges: Edge[] = [{ id: "user-cdn", source: "user", target: "cdn" }];
const reset = () => memory.clear();
const AT = Date.UTC(2026, 0, 2, 3, 4, 5);

test("a design survives the round trip through storage", () => {
  reset();
  const saved = saveDesign("Checkout flow", nodes, edges, AT);
  assert.equal(saved!.name, "Checkout flow");
  assert.equal(saved!.savedAt, new Date(AT).toISOString());
  const [stored] = readDesigns();
  assert.equal(stored.name, "Checkout flow");
  assert.equal(stored.nodes.length, 1);
  assert.equal(stored.edges.length, 1);
});

// Saving twice under one name is someone iterating on a diagram, not collecting copies.
test("saving under an existing name replaces that design instead of adding one", () => {
  reset();
  const first = saveDesign("Checkout flow", nodes, [], AT)!;
  const second = saveDesign("checkout FLOW", nodes, edges, AT + 1000)!;
  assert.equal(readDesigns().length, 1);
  assert.equal(second.id, first.id);
  assert.equal(readDesigns()[0].edges.length, 1);
});

test("a blank name is refused", () => {
  reset();
  assert.equal(saveDesign("   ", nodes, edges, AT), null);
  assert.deepEqual(readDesigns(), []);
});

test("deleteDesign drops one design and leaves the rest", () => {
  reset();
  const doomed = saveDesign("Draft", nodes, edges, AT)!;
  saveDesign("Keeper", nodes, edges, AT)!;
  assert.equal(deleteDesign(doomed.id), true);
  assert.deepEqual(readDesigns().map(d => d.name), ["Keeper"]);
});

test("entries that are not diagrams are ignored rather than thrown at the canvas", () => {
  reset();
  memory.set("asuradraw:designs", JSON.stringify([
    { id: "ok", name: "Real", savedAt: "", nodes: [], edges: [] },
    { id: "broken", name: "No arrays", savedAt: "" },
    "not even an object",
  ]));
  assert.deepEqual(readDesigns().map(d => d.name), ["Real"]);
  memory.set("asuradraw:designs", "{ not json");
  assert.deepEqual(readDesigns(), []);
});

test("autosave round-trips, and reports nothing when storage is empty or corrupt", () => {
  reset();
  assert.equal(readAutosave(), null);
  writeAutosave(nodes, edges);
  assert.equal(readAutosave()!.nodes.length, 1);
  memory.set("asuradraw:autosave", JSON.stringify({ nodes: "no" }));
  assert.equal(readAutosave(), null);
});
