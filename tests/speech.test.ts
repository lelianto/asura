import test from "node:test";
import assert from "node:assert/strict";

type Rec = {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void;
  onresult: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

let starts = 0;

class FakeRecognition {
  continuous = false; interimResults = false; lang = "";
  onresult: Rec["onresult"] = null; onend: Rec["onend"] = null; onerror: Rec["onerror"] = null;
  running = false;
  start() { if (this.running) throw new Error("InvalidStateError"); this.running = true; starts++; }
  stop() { this.running = false; }
}

(globalThis as { window?: unknown }).window = { SpeechRecognition: FakeRecognition };
const { WebSpeechProvider } = await import("../lib/speech.ts");

const fresh = () => { starts = 0; return new WebSpeechProvider(); };
const rec = (p: unknown) => (p as { recognition: Rec }).recognition;

test("start() configures continuous interim recognition", async () => {
  const p = fresh();
  await p.start();
  assert.equal(starts, 1);
  assert.equal(rec(p).continuous, true);
  assert.equal(rec(p).interimResults, true);
});

test("setLanguage applies to a live recogniser", async () => {
  const p = fresh();
  p.setLanguage("en-US");
  await p.start();
  assert.equal(rec(p).lang, "en-US");
});

test("transcripts reach subscribers, and unsubscribe stops them", async () => {
  const p = fresh();
  const seen: string[] = [];
  const unsub = p.subscribe(e => seen.push(e.transcript));
  await p.start();
  rec(p).onresult?.({ resultIndex: 0, results: [{ 0: { transcript: "halo", confidence: 0.9 }, isFinal: true }] });
  unsub();
  rec(p).onresult?.({ resultIndex: 0, results: [{ 0: { transcript: "diam", confidence: 0.9 }, isFinal: true }] });
  assert.deepEqual(seen, ["halo"]);
});

test("a fatal error stops the restart loop and is reported as fatal", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = fresh();
  const errors: Array<[string, boolean]> = [];
  p.subscribeError((e, fatal) => errors.push([e, fatal]));
  await p.start();
  rec(p).onerror?.({ error: "not-allowed" });
  rec(p).onend?.();
  t.mock.timers.tick(60_000);
  assert.deepEqual(errors, [["not-allowed", true]]);
  assert.equal(starts, 1, "must not restart after a permission denial");
});

test("a transient end restarts with backoff", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = fresh();
  await p.start();
  rec(p).stop();
  rec(p).onend?.();
  assert.equal(starts, 1, "restart is deferred, not immediate");
  t.mock.timers.tick(400);
  assert.equal(starts, 2);
});

test("repeated immediate ends give up instead of spinning forever", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = fresh();
  const errors: Array<[string, boolean]> = [];
  p.subscribeError((e, fatal) => errors.push([e, fatal]));
  await p.start();
  for (let i = 0; i < 20; i++) { rec(p).stop(); rec(p).onend?.(); t.mock.timers.tick(60_000); }
  assert.ok(starts <= 9, `runaway restarts: ${starts}`);
  assert.deepEqual(errors.at(-1), ["restart-limit", true]);
});

test("stop() cancels a pending restart", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = fresh();
  await p.start();
  rec(p).stop();
  rec(p).onend?.();
  await p.stop();
  t.mock.timers.tick(60_000);
  assert.equal(starts, 1);
});

test("start() twice does not throw", async () => {
  const p = fresh();
  await p.start();
  await assert.doesNotReject(() => p.start());
});

test("start() rejects with 'unsupported' when the browser has no API", async () => {
  (globalThis as { window?: unknown }).window = {};
  const p = new WebSpeechProvider();
  await assert.rejects(() => p.start(), /unsupported/);
  (globalThis as { window?: unknown }).window = { SpeechRecognition: FakeRecognition };
});
