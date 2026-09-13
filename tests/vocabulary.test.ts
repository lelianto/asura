// The vocabulary is the parser's most fragile surface: entries are applied in
// order over the same string, so one broad pattern can corrupt another's output.
// These tests check the table as a whole, not just individual words.
import test from "node:test";
import assert from "node:assert/strict";
import { normalize, parseIntent, kindOf, VOCABULARY, type NodeKind } from "../lib/diagram.ts";
import { useDiagramStore } from "../lib/store.ts";

const said = (phrase: string) => normalize(phrase);

test("every canonical label survives normalisation unchanged", () => {
  for (const { label } of VOCABULARY)
    assert.equal(normalize(label), label, `canonical label is rewritten: ${label}`);
});

test("normalisation reaches a fixed point for every canonical label", () => {
  for (const { label } of VOCABULARY) {
    const once = normalize(label);
    assert.equal(normalize(once), once, `oscillating entry: ${label}`);
  }
});

test("canonical labels are unique", () => {
  const seen = new Set<string>();
  for (const { label } of VOCABULARY) {
    assert.ok(!seen.has(label.toLowerCase()), `duplicate canonical label: ${label}`);
    seen.add(label.toLowerCase());
  }
});

test("every canonical label is a plausible node name the parser will accept", () => {
  for (const { label } of VOCABULARY)
    assert.deepEqual(parseIntent(`tambahkan ${label}`), [{ type: "ADD_NODE", label }],
      `vocabulary entry is rejected as a node name: ${label}`);
});

test("clients", () => {
  assert.equal(said("pengguna"), "User");
  assert.equal(said("pemakai"), "User");
  assert.equal(said("aplikasi mobile"), "Mobile App");
  assert.equal(said("aplikasi seluler"), "Mobile App");
  assert.equal(said("aplikasi android"), "Android App");
  assert.equal(said("peramban"), "Browser");
});

test("edge and network", () => {
  assert.equal(said("si di en"), "CDN");
  assert.equal(said("gerbang api"), "API Gateway");
  assert.equal(said("lod balanser"), "Load Balancer");
  assert.equal(said("penyeimbang beban"), "Load Balancer");
  assert.equal(said("engine x"), "Nginx");
  assert.equal(said("cloud flare"), "Cloudflare");
  assert.equal(said("reverse proxy"), "Reverse Proxy");
});

test("application layer", () => {
  assert.equal(said("next js"), "Next.js");
  assert.equal(said("nextjs"), "Next.js");
  assert.equal(said("dasbor"), "Dashboard");
  assert.equal(said("panel admin"), "Admin Panel");
  assert.equal(said("peladen web"), "Web Server");
  assert.equal(said("react query"), "TanStack Query");
});

test("services", () => {
  assert.equal(said("be ef ef"), "BFF");
  assert.equal(said("graph ql"), "GraphQL");
  assert.equal(said("res api"), "REST API");
  assert.equal(said("restful api"), "REST API");
  assert.equal(said("ge er pi si"), "gRPC");
  assert.equal(said("layanan pembayaran"), "Payment Service");
  assert.equal(said("layanan notifikasi"), "Notification Service");
  assert.equal(said("layanan autentikasi"), "Auth Service");
  assert.equal(said("layanan mikro"), "Microservice");
  assert.equal(said("fungsi cloud"), "Cloud Function");
  assert.equal(said("kron job"), "Cron Job");
  assert.equal(said("k8s"), "Kubernetes");
});

test("data stores", () => {
  assert.equal(said("post gres"), "PostgreSQL");
  assert.equal(said("postgresql"), "PostgreSQL");
  assert.equal(said("mai es kiu el"), "MySQL");
  assert.equal(said("mongo"), "MongoDB");
  assert.equal(said("elastik search"), "Elasticsearch");
  assert.equal(said("rabbit em kyu"), "RabbitMQ");
  assert.equal(said("antrian pesan"), "Message Queue");
  assert.equal(said("penyimpanan objek"), "Object Storage");
  assert.equal(said("gudang data"), "Data Warehouse");
  assert.equal(said("es tiga"), "S3");
  assert.equal(said("basis data"), "Database");
  assert.equal(said("tembolok"), "Cache");
});

test("one entry never corrupts another inside the same sentence", () => {
  assert.equal(said("service worker ke local storage"), "Service Worker ke Local Storage");
  assert.equal(said("web socket ke web server"), "WebSocket ke Web Server");
  assert.equal(said("object storage dan local storage"), "Object Storage dan Local Storage");
  assert.equal(said("backend api ke rest api"), "Backend API ke REST API");
  assert.equal(said("aplikasi mobile ke api gateway"), "Mobile App ke API Gateway");
});

test("kindOf classifies every vocabulary entry", () => {
  const allowed: NodeKind[] = ["client", "edge", "app", "service", "data", "requirement", "technique"];
  for (const { label, kind } of VOCABULARY) {
    assert.ok(allowed.includes(kind), `unknown kind ${kind} for ${label}`);
    assert.equal(kindOf(label), kind);
    assert.equal(kindOf(label.toLowerCase()), kind, "kindOf must be case-insensitive");
  }
});

test("unknown names fall back to 'service'", () => {
  assert.equal(kindOf("Legacy Billing"), "service");
  assert.equal(kindOf(""), "service");
});

test("the canvas colours a dictated node by its inferred kind", () => {
  useDiagramStore.setState({ nodes: [], edges: [], past: [], future: [] });
  useDiagramStore.getState().execute(parseIntent("dari pengguna ke si di en lalu ke next js terus ke post gres"));
  const byLabel = Object.fromEntries(
    useDiagramStore.getState().nodes.map(n => [String(n.data.label), String(n.data.kind)]));
  assert.deepEqual(byLabel, {
    User: "client", CDN: "edge", "Next.js": "app", PostgreSQL: "data",
  });
});

test("a name outside the vocabulary is still accepted verbatim", () => {
  assert.deepEqual(parseIntent("tambahkan Legacy Billing"), [{ type: "ADD_NODE", label: "Legacy Billing" }]);
  assert.deepEqual(parseIntent("Legacy Billing ke Redis"),
    [{ type: "CONNECT", from: "Legacy Billing", to: "Redis" }]);
});

// ---------------------------------------------------------------------------
// Exhaustive sweep: enumerate every string each vocabulary pattern can match
// and assert it normalises to that entry's canonical label. This is what caught
// `mongo di bi` -> "MongoDBdi bi", where a shorter alternative matched first.
// ---------------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function expand(src: string): string[] {
  let i = 0;
  const parseAtom = (): string[] => {
    const c = src[i];
    // A lookaround guards where an alternative may match; it is never itself spoken,
    // so it contributes nothing to the sweep. Without this, `(?<!react )hydration`
    // would be read as a spoken form called "?<!react hydration".
    if (c === "(" && /^\(\?<?[!=]/.test(src.slice(i))) {
      i += src[i + 2] === "<" ? 4 : 3;
      parseAlt(); i++; return [""];
    }
    if (c === "(") { i++; if (src.slice(i, i + 2) === "?:") i += 2; const inner = parseAlt(); i++; return inner; }
    if (c === "[") { const end = src.indexOf("]", i); const set = src.slice(i + 1, end).split(""); i = end + 1; return set; }
    if (c === "\\") { const n = src[i + 1]; i += 2; return n === "s" ? [" "] : [n]; }
    i++; return [c];
  };
  const parseSeq = (): string[] => {
    let out = [""];
    while (i < src.length && src[i] !== "|" && src[i] !== ")") {
      const atoms = parseAtom();
      let options = atoms;
      if (src[i] === "?" || src[i] === "*") { i++; options = ["", ...atoms]; }
      out = out.flatMap(prefix => options.map(a => prefix + a));
    }
    return out;
  };
  const parseAlt = (): string[] => {
    const branches = [parseSeq()];
    while (src[i] === "|") { i++; branches.push(parseSeq()); }
    return branches.flat();
  };
  return [...new Set(parseAlt().map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

const diagramSource = readFileSync(
  fileURLToPath(new URL("../lib/diagram.ts", import.meta.url)), "utf8");
const patterns = [...diagramSource.matchAll(
  /\{pattern:\/\\b\((.+?)\)\\b\/gi,label:"(.+?)",kind:"(.+?)"\}/g)];

test("every vocabulary pattern is extractable for the sweep", () => {
  assert.equal(patterns.length, VOCABULARY.length,
    "the sweep below would silently skip entries it cannot parse");
});

test("every spoken form a pattern accepts normalises to its canonical label", () => {
  let forms = 0;
  for (const [, pattern, label] of patterns)
    for (const spoken of expand(pattern)) {
      forms++;
      assert.equal(normalize(spoken), label, `"${spoken}" should normalise to "${label}"`);
    }
  assert.ok(forms > 250, `expected a broad sweep, only checked ${forms} forms`);
});

test("every spoken form works as a node name inside a real command", () => {
  for (const [, pattern, label] of patterns)
    for (const spoken of expand(pattern))
      assert.deepEqual(parseIntent(`tambahkan ${spoken}`), [{ type: "ADD_NODE", label }],
        `"tambahkan ${spoken}" should add "${label}"`);
});
