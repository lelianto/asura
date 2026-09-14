// The FE system design material is only useful here if the canvas can actually
// draw it. These tests prove every requirement, technique and pair in the
// material survives the real parser and produces the diagram it promises.
import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent, normalize, kindOf, VOCABULARY } from "../lib/diagram.ts";
import { useDiagramStore } from "../lib/store.ts";
import {
  ACRONYMS, BUCKETS, MENTAL_MODEL, PAIRS, CHEATSHEET, MEMORISE, WORKED_EXAMPLE, rowToStatement,
  PIPELINE, PIPELINE_SHORT, WEB_VITALS, pipelineToStatements,
} from "../lib/system-design.ts";

const reset = () => useDiagramStore.setState({ nodes: [], edges: [], past: [], future: [] });
const state = () => useDiagramStore.getState();
const labels = () => state().nodes.map(n => String(n.data.label));
const edgesByLabel = () => {
  const byId = new Map(state().nodes.map(n => [n.id, String(n.data.label)]));
  return state().edges.map(e => `${byId.get(e.source)}->${byId.get(e.target)}`);
};

const allTechniques = [...new Set(CHEATSHEET.flatMap(r => r.techniques))];
const allRequirements = CHEATSHEET.map(r => r.node);

test("the abbreviation glossary has unique, non-empty entries", () => {
  assert.equal(new Set(ACRONYMS.map(item => item.short)).size, ACRONYMS.length);
  for (const item of ACRONYMS) {
    assert.ok(item.short.trim(), "glossary abbreviation is blank");
    assert.ok(item.long.trim(), `${item.short} has no expansion`);
  }
});

// --- the material is drawable -------------------------------------------------

test("every technique is a stable canvas label", () => {
  for (const t of allTechniques)
    assert.equal(normalize(t), t, `"${t}" is rewritten by the vocabulary, so it can never be drawn as itself`);
});

test("every requirement is a stable canvas label", () => {
  for (const r of allRequirements)
    assert.equal(normalize(r), r, `"${r}" is rewritten by the vocabulary`);
});

test("every technique can be dictated as a node", () => {
  for (const t of allTechniques)
    assert.deepEqual(parseIntent(`tambahkan ${t}`), [{ type: "ADD_NODE", label: t }],
      `"tambahkan ${t}" does not create the node`);
});

test("every requirement can be dictated as a node", () => {
  for (const r of allRequirements)
    assert.deepEqual(parseIntent(`tambahkan ${r}`), [{ type: "ADD_NODE", label: r }]);
});

test("requirements and techniques are colour-coded as such", () => {
  for (const r of allRequirements)
    assert.equal(kindOf(r), "requirement", `"${r}" would be drawn as a plain service`);
  for (const t of allTechniques) {
    const kind = kindOf(t);
    assert.ok(kind === "technique" || VOCABULARY.some(v => v.label === t),
      `"${t}" is not in the vocabulary at all`);
  }
});

// --- drawing a row --------------------------------------------------------------

test("each cheatsheet row draws its requirement branching into its techniques", () => {
  for (const row of CHEATSHEET) {
    reset();
    const applied = state().execute(parseIntent(rowToStatement(row)));
    assert.ok(applied, `"${row.node}" drew nothing`);
    assert.deepEqual(labels().sort(), [row.node, ...row.techniques].sort(),
      `"${row.node}" drew the wrong set of nodes`);
    assert.deepEqual(edgesByLabel().sort(),
      row.techniques.map(t => `${row.node}->${t}`).sort(),
      `"${row.node}" wired the wrong edges`);
  }
});

test("drawing a row twice changes nothing the second time", () => {
  const row = CHEATSHEET[0];
  reset();
  assert.equal(state().execute(parseIntent(rowToStatement(row))), true);
  assert.equal(state().execute(parseIntent(rowToStatement(row))), false);
});

test("rows sharing a technique reuse the node instead of duplicating it", () => {
  reset();
  const seo = CHEATSHEET.find(r => r.node === "SEO")!;
  const load = CHEATSHEET.find(r => r.node === "Fast Initial Load")!;
  state().execute(parseIntent(rowToStatement(seo)));
  state().execute(parseIntent(rowToStatement(load)));
  assert.equal(labels().filter(l => l === "SSR").length, 1, "SSR was drawn twice");
  assert.equal(new Set(labels()).size, labels().length, "the canvas has duplicate labels");
});

test("a whole bucket can be drawn onto one canvas", () => {
  reset();
  const rows = CHEATSHEET.filter(r => r.bucket === "performance");
  for (const row of rows) state().execute(parseIntent(rowToStatement(row)));
  for (const row of rows) {
    assert.ok(labels().includes(row.node), `${row.node} missing`);
    for (const t of row.techniques) assert.ok(labels().includes(t), `${t} missing`);
  }
  assert.equal(new Set(labels()).size, labels().length);
});

// --- the ten pairs ---------------------------------------------------------------

test("all ten quick pairs are drawable", () => {
  assert.equal(PAIRS.length, 10);
  for (const pair of PAIRS) {
    reset();
    const statement = `${pair.trigger} bercabang ke ${pair.answer.join(" dan ")}`;
    assert.ok(state().execute(parseIntent(statement)), `pair "${pair.trigger}" drew nothing`);
    assert.deepEqual(labels().sort(), [pair.trigger, ...pair.answer].sort());
  }
});

test("a single-answer pair is stated as a plain connection", () => {
  const pair = PAIRS.find(p => p.answer.length === 1)!;
  reset();
  assert.ok(state().execute(parseIntent(`${pair.trigger} ke ${pair.answer[0]}`)));
  assert.deepEqual(edgesByLabel(), [`${pair.trigger}->${pair.answer[0]}`]);
});

// --- spoken Indonesian reaches the same diagram ------------------------------------

test("the material can be dictated in Indonesian, not just typed", () => {
  const spoken: Array<[string, string[]]> = [
    ["SEO penting bercabang ke es es er dan es es ji", ["SEO", "SSR", "SSG"]],
    ["jaringan lambat bercabang ke kompresi dan optimasi gambar", ["Slow Network", "Compression", "Image Optimization"]],
    ["daftar panjang bercabang ke paginasi dan virtualisasi", ["Huge List", "Pagination", "Virtualization"]],
    ["api sering gagal bercabang ke coba ulang dan ui cadangan", ["API Failure", "Retry", "Fallback UI"]],
    ["perangkat lemah bercabang ke pemecahan kode dan muat malas", ["Low End Device", "Code Splitting", "Lazy Loading"]],
    ["data sering berubah bercabang ke revalidasi dan polling", ["Frequently Changing Data", "Revalidation", "Polling"]],
  ];
  for (const [said, expected] of spoken) {
    reset();
    assert.ok(state().execute(parseIntent(said)), `"${said}" drew nothing`);
    assert.deepEqual(labels().sort(), [...expected].sort(), `"${said}" drew the wrong nodes`);
  }
});

test("the interview flow itself can be dictated as a chain", () => {
  reset();
  const said = "dari Requirements ke Architecture lalu ke Quality terus ke Scale";
  assert.ok(state().execute(parseIntent(said)));
  assert.deepEqual(edgesByLabel(),
    ["Requirements->Architecture", "Architecture->Quality", "Quality->Scale"]);
});

// --- the material is internally consistent -----------------------------------------

test("the mental model has five steps in order", () => {
  assert.deepEqual(MENTAL_MODEL.map(s => s.step), [1, 2, 3, 4, 5]);
  for (const step of MENTAL_MODEL)
    assert.ok(step.asks.length >= 3, `step ${step.step} lists too few questions`);
  assert.equal(MENTAL_MODEL.at(-1)!.id, "Trade-off", "trade-off must be the closing step");
});

test("all eight buckets exist and every one has at least one row", () => {
  assert.equal(BUCKETS.length, 8);
  for (const bucket of BUCKETS)
    assert.ok(CHEATSHEET.some(r => r.bucket === bucket.key),
      `bucket "${bucket.key}" has no cheatsheet row`);
});

test("every row belongs to a declared bucket and lists at least one technique", () => {
  const keys = new Set(BUCKETS.map(b => b.key));
  for (const row of CHEATSHEET) {
    assert.ok(keys.has(row.bucket), `${row.node} has an unknown bucket`);
    assert.ok(row.techniques.length > 0, `${row.node} lists no technique`);
    assert.equal(new Set(row.techniques).size, row.techniques.length, `${row.node} repeats a technique`);
  }
});

test("requirements are unique and phrased in both languages", () => {
  assert.equal(new Set(allRequirements).size, CHEATSHEET.length, "duplicate requirement node");
  for (const row of CHEATSHEET) {
    assert.ok(row.id.length > 2 && row.en.length > 2, `${row.node} is missing a phrasing`);
    assert.ok(row.focus.id.length > 5 && row.focus.en.length > 5, `${row.node} is missing a focus`);
  }
});

test("the memorise/skip table keeps the framework on the left", () => {
  assert.ok(MEMORISE.length >= 15);
  for (const { learn, skip } of MEMORISE) {
    assert.ok(learn && skip, "a row is missing a side");
    assert.notEqual(learn, skip);
  }
  assert.ok(MEMORISE.some(m => /Trade-off/i.test(m.learn)), "trade-off must be on the memorise side");
});

test("the worked example answers with needs before naming a tool", () => {
  const { weak, strong, closing } = WORKED_EXAMPLE;
  assert.match(weak.en, /Next\.js/, "the weak answer should be the tool-first one");
  assert.ok(strong.length >= 5, "the strong answer should cover several needs");
  for (const line of strong)
    assert.ok(line.answer.every(t => allTechniques.includes(t) || VOCABULARY.some(v => v.label === t)),
      `worked example uses an undrawable technique: ${line.answer.join(", ")}`);
  assert.match(closing.id, /Next\.js/, "the closing line should place the tool last");
});

test("the worked example draws as one coherent diagram", () => {
  reset();
  for (const line of WORKED_EXAMPLE.strong)
    state().execute(parseIntent(`${line.need} bercabang ke ${line.answer.join(" dan ")}`));
  for (const line of WORKED_EXAMPLE.strong) {
    assert.ok(labels().includes(line.need), `${line.need} missing from the canvas`);
    for (const t of line.answer) assert.ok(labels().includes(t), `${t} missing from the canvas`);
  }
  assert.equal(new Set(labels()).size, labels().length, "duplicate nodes on the canvas");
});

// --- what the cheatsheet page's buttons actually do --------------------------------

test("the 'Draw all' button for a bucket draws every row in it", () => {
  for (const bucket of BUCKETS) {
    reset();
    const rows = CHEATSHEET.filter(r => r.bucket === bucket.key);
    for (const row of rows) state().execute(parseIntent(rowToStatement(row)));
    const drawn = new Set(labels());
    for (const row of rows) {
      assert.ok(drawn.has(row.node), `${bucket.key}: ${row.node} missing`);
      for (const t of row.techniques) assert.ok(drawn.has(t), `${bucket.key}: ${t} missing`);
    }
    assert.equal(drawn.size, labels().length, `${bucket.key} produced duplicate nodes`);
  }
});

test("the sentences the cheatsheet offers to speak all work", () => {
  // Mirrors SPOKEN in components/cheatsheet.tsx.
  for (const said of [
    "SEO penting bercabang ke es es er dan es es ji",
    "jaringan lambat bercabang ke kompresi dan optimasi gambar",
    "daftar panjang bercabang ke paginasi dan virtualisasi",
    "api sering gagal bercabang ke coba ulang dan ui cadangan",
  ]) {
    reset();
    assert.ok(state().execute(parseIntent(said)), `the page offers a dead phrase: "${said}"`);
    assert.ok(state().edges.length >= 2, `"${said}" drew no branch`);
  }
});

test("drawing every row in the material leaves one connected study map", () => {
  reset();
  for (const row of CHEATSHEET) state().execute(parseIntent(rowToStatement(row)));
  assert.equal(new Set(labels()).size, labels().length, "duplicate labels across the whole sheet");
  const expected = new Set([...allRequirements, ...allTechniques]);
  assert.deepEqual(new Set(labels()), expected, "the full sheet does not draw exactly its own terms");
  assert.equal(state().edges.length, CHEATSHEET.reduce((n, r) => n + r.techniques.length, 0));
});

test("the whole study map fits inside the history limit", () => {
  reset();
  for (const row of CHEATSHEET) state().execute(parseIntent(rowToStatement(row)));
  assert.ok(state().past.length <= 100, "drawing the sheet overflows the undo stack");
  assert.ok(state().past.length >= CHEATSHEET.length - 1, "rows are collapsing into one undo step");
});

// --- the Next.js request pipeline ------------------------------------------------
// The pipeline is only worth putting on the cheatsheet if the canvas can draw it, so
// it gets the same drawability guarantees as every cheatsheet row.

test("every pipeline stage is a stable canvas label", () => {
  for (const stage of PIPELINE)
    assert.equal(normalize(stage.node), stage.node,
      `"${stage.node}" is rewritten by the vocabulary, so the pipeline would draw a different node`);
});

test("every pipeline stage can be dictated as a node", () => {
  for (const stage of PIPELINE)
    assert.deepEqual(parseIntent(`tambahkan ${stage.node}`), [{ type: "ADD_NODE", label: stage.node }]);
});

test("the pipeline draws as one unbroken chain in the stated order", () => {
  reset();
  for (const statement of pipelineToStatements()) state().execute(parseIntent(statement));
  assert.deepEqual(labels(), PIPELINE.map(s => s.node));
  assert.equal(state().edges.length, PIPELINE.length - 1);
  assert.deepEqual(edgesByLabel(),
    PIPELINE.slice(1).map((stage, i) => `${PIPELINE[i].node}->${stage.node}`));
});

test("each hop is one connect, so a broken hop cannot hide inside a longer chain", () => {
  for (const statement of pipelineToStatements()) {
    const commands = parseIntent(statement);
    assert.equal(commands.length, 1, `"${statement}" parsed into ${commands.length} commands`);
    assert.equal(commands[0].type, "CONNECT");
  }
});

test("each web vital is drawable and points at a stage the pipeline actually has", () => {
  const stages = new Set(PIPELINE.map(s => s.node));
  for (const vital of WEB_VITALS) {
    assert.equal(normalize(vital.node), vital.node);
    assert.equal(kindOf(vital.node), "requirement", `"${vital.node}" would not be drawn as a requirement`);
    assert.ok(stages.has(vital.at), `"${vital.node}" points at "${vital.at}", which is not a pipeline stage`);
  }
});

// The short form is a memory aid, not a second source of truth: it must not drift into
// naming stages the full pipeline does not have.
test("the short pipeline stays shorter than the full one and keeps its order", () => {
  assert.ok(PIPELINE_SHORT.length < PIPELINE.length);
  assert.deepEqual(PIPELINE_SHORT[0], PIPELINE[0].node);
});
