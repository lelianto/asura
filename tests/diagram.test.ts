import test from "node:test";
import assert from "node:assert/strict";
import { normalize, parseIntent } from "../lib/diagram.ts";

test("normalize maps spoken vocabulary to canonical labels", () => {
  assert.equal(normalize("next js"), "Next.js");
  assert.equal(normalize("be ef ef"), "BFF");
  assert.equal(normalize("pengguna"), "User");
  assert.equal(normalize("jadi tambahkan redis."), "tambahkan Redis");
});

test("normalize is idempotent", () => {
  const once = normalize("user ke cdn lalu ke next js");
  assert.equal(normalize(once), once);
});

test("undo / redo", () => {
  assert.deepEqual(parseIntent("undo"), [{ type: "UNDO" }]);
  assert.deepEqual(parseIntent("batalkan"), [{ type: "UNDO" }]);
  assert.deepEqual(parseIntent("redo"), [{ type: "REDO" }]);
});

test("add node (id + en)", () => {
  assert.deepEqual(parseIntent("tambahkan Redis"), [{ type: "ADD_NODE", label: "Redis" }]);
  assert.deepEqual(parseIntent("add Redis"), [{ type: "ADD_NODE", label: "Redis" }]);
});

test("delete node (id + en)", () => {
  assert.deepEqual(parseIntent("hapus Redis"), [{ type: "DELETE_NODE", target: "Redis" }]);
  assert.deepEqual(parseIntent("delete Redis"), [{ type: "DELETE_NODE", target: "Redis" }]);
});

test("rename node (id + en)", () => {
  assert.deepEqual(parseIntent("ganti BFF jadi API Gateway"),
    [{ type: "RENAME_NODE", target: "BFF", newLabel: "API Gateway" }]);
  assert.deepEqual(parseIntent("rename BFF to API Gateway"),
    [{ type: "RENAME_NODE", target: "BFF", newLabel: "API Gateway" }]);
});

test("branch (id + en)", () => {
  assert.deepEqual(parseIntent("BFF bercabang ke Redis dan GraphQL"),
    [{ type: "BRANCH", from: "BFF", targets: ["Redis", "GraphQL"] }]);
  assert.deepEqual(parseIntent("BFF branches to Redis and GraphQL"),
    [{ type: "BRANCH", from: "BFF", targets: ["Redis", "GraphQL"] }]);
});

test("indonesian chain: 'A ke B lalu ke C'", () => {
  assert.deepEqual(parseIntent("User ke CDN lalu ke Next.js"), [
    { type: "CONNECT", from: "User", to: "CDN" },
    { type: "CONNECT", from: "CDN", to: "Next.js" },
  ]);
});

test("indonesian chain with 'dari ... ke ...'", () => {
  assert.deepEqual(parseIntent("dari User ke CDN"), [{ type: "CONNECT", from: "User", to: "CDN" }]);
});

test("non-command sentences produce no commands", () => {
  assert.deepEqual(parseIntent("saya rasa arsitekturnya sudah bagus"), []);
  assert.deepEqual(parseIntent(""), []);
});

// ---- behaviours a bilingual app should support; these document current gaps ----

test("english: 'from A to B' connects", () => {
  assert.deepEqual(parseIntent("from User to CDN"), [{ type: "CONNECT", from: "User", to: "CDN" }]);
});

test("english chain: 'A connects to B then to C'", () => {
  assert.deepEqual(parseIntent("User connects to CDN then to Next.js"), [
    { type: "CONNECT", from: "User", to: "CDN" },
    { type: "CONNECT", from: "CDN", to: "Next.js" },
  ]);
});

test("'tambahkan X ke Y' should add AND connect, not create one node named 'X ke Y'", () => {
  assert.deepEqual(parseIntent("tambahkan Redis ke BFF"), [
    { type: "CONNECT", from: "Redis", to: "BFF" },
  ]);
});

test("disconnect is parseable", () => {
  assert.deepEqual(parseIntent("putuskan User ke CDN"),
    [{ type: "DISCONNECT", from: "User", to: "CDN" }]);
  assert.deepEqual(parseIntent("disconnect User from CDN"),
    [{ type: "DISCONNECT", from: "User", to: "CDN" }]);
});
