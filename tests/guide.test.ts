// The in-app guide teaches people what to say. If the parser changes and a
// taught phrase stops working, that is a broken promise to a beginner — so
// every sentence the guide prints is executed here against the real parser.
import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent, VOCABULARY, DIAGRAM_KINDS } from "../lib/diagram.ts";
import { guide, wordsByKind } from "../lib/guide.ts";
import { useDiagramStore } from "../lib/store.ts";

const LANGS = ["id", "en"] as const;
const KINDS = DIAGRAM_KINDS;
const reset = () => useDiagramStore.setState({ nodes: [], edges: [], past: [], future: [] });

test("every sentence the guide teaches produces a command", () => {
  for (const lang of LANGS)
    for (const recipe of guide[lang].recipes)
      for (const phrase of recipe.say)
        assert.ok(parseIntent(phrase).length > 0,
          `[${lang}] "${recipe.goal}" teaches a phrase the parser ignores: "${phrase}"`);
});

test("every taught sentence actually changes the diagram", () => {
  // Each phrase is applied in the situation it is meant for: a rename needs its
  // target to exist, an undo needs history, an add needs a clear canvas.
  for (const lang of LANGS)
    for (const recipe of guide[lang].recipes)
      for (const phrase of recipe.say) {
        reset();
        const commands = parseIntent(phrase);
        const needs = commands.flatMap(c =>
          c.type === "DELETE_NODE" || c.type === "RENAME_NODE" ? [c.target] :
          c.type === "DISCONNECT" ? [c.from, c.to] : []);
        for (const label of needs)
          useDiagramStore.getState().execute([{ type: "ADD_NODE", label }]);
        if (commands.some(c => c.type === "DISCONNECT"))
          useDiagramStore.getState().execute(
            commands.filter(c => c.type === "DISCONNECT")
              .map(c => ({ type: "CONNECT", from: c.from, to: c.to }) as const));
        if (commands.some(c => c.type === "UNDO" || c.type === "REDO")) {
          useDiagramStore.getState().execute(parseIntent("tambahkan Redis"));
          if (commands[0].type === "REDO") useDiagramStore.getState().undo();
        }
        const before = useDiagramStore.getState();
        const snapshot = { nodes: before.nodes, edges: before.edges };
        useDiagramStore.getState().execute(commands);
        const after = useDiagramStore.getState();
        assert.ok(snapshot.nodes !== after.nodes || snapshot.edges !== after.edges,
          `[${lang}] "${phrase}" leaves the canvas untouched`);
      }
});

test("the delete recipe removes rather than adds", () => {
  for (const lang of LANGS) {
    const recipe = guide[lang].recipes.find(r => /Menghapus|^Delete$/.test(r.goal));
    assert.ok(recipe, `[${lang}] guide lost its delete recipe`);
    reset();
    useDiagramStore.getState().execute(parseIntent("dari User ke CDN lalu ke Redis"));
    const before = useDiagramStore.getState().nodes.length;
    useDiagramStore.getState().execute(parseIntent(recipe!.say[0]));
    assert.ok(useDiagramStore.getState().nodes.length < before,
      `[${lang}] "${recipe!.say[0]}" did not remove anything`);
  }
});

test("undo and redo are taught with phrases that work standalone", () => {
  for (const lang of LANGS) {
    const recipe = guide[lang].recipes.at(-1)!;
    for (const phrase of recipe.say) {
      const [command] = parseIntent(phrase);
      assert.ok(command && (command.type === "UNDO" || command.type === "REDO"),
        `[${lang}] "${phrase}" is taught as undo/redo but parses as ${command?.type}`);
    }
  }
});

test("the word list covers every system word exactly once", () => {
  // Design-language words (requirements, techniques) belong to the cheatsheet,
  // not to the beginner guide — listing 150+ terms there would bury a newcomer.
  const expected = VOCABULARY.filter(v => (DIAGRAM_KINDS as readonly string[]).includes(v.kind));
  const listed = KINDS.flatMap(wordsByKind);
  assert.equal(listed.length, expected.length);
  assert.equal(new Set(listed).size, expected.length, "a word is listed twice");
});

test("every group has a plain-language name in both languages", () => {
  for (const lang of LANGS)
    for (const kind of KINDS) {
      const name = guide[lang].groups[kind];
      assert.ok(name && name.length > 2, `[${lang}] group ${kind} has no readable name`);
      assert.ok(!/[_{}]|NodeKind/.test(name), `[${lang}] group ${kind} leaks a technical term: ${name}`);
    }
});

test("the guide stays free of developer jargon", () => {
  // A beginner should never meet a type signature or an internal command name.
  const jargon = /ADD_NODE|DELETE_NODE|RENAME_NODE|SET_TECH|DiagramCommand|parseIntent|boolean|=>|regex|\bAPI\b.*\bsignature\b/;
  for (const lang of LANGS) {
    const g = guide[lang];
    const prose = [g.tagline, g.recipesLede, g.wordsLede, g.freeform,
      ...g.steps.flatMap(s => [s.title, s.body]),
      ...g.recipes.map(r => `${r.goal} ${r.result}`),
      ...g.tips, ...g.trouble.flatMap(t => [t.problem, t.fix])].join("\n");
    const hit = prose.match(jargon);
    assert.equal(hit, null, `[${lang}] guide prose contains jargon: ${hit?.[0]}`);
  }
});

test("both languages describe the same set of recipes", () => {
  assert.equal(guide.id.recipes.length, guide.en.recipes.length);
  for (let i = 0; i < guide.id.recipes.length; i++)
    assert.deepEqual(guide.id.recipes[i].preview, guide.en.recipes[i].preview,
      `recipe ${i} previews a different shape in each language`);
});
