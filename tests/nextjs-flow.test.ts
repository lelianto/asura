import test from "node:test";
import assert from "node:assert/strict";
import {parseIntent} from "../lib/diagram.ts";
import {useDiagramStore} from "../lib/store.ts";

const statements = [
  "URL terhubung ke DNS.",
  "DNS terhubung ke HTTPS/TLS.",
  "HTTPS/TLS terhubung ke CDN/Edge.",
  "CDN/Edge terhubung ke Next.js Server.",
  "Next.js Server terhubung ke API/BFF.",
  "API/BFF terhubung kembali ke Next.js Server.",
  "Next.js Server terhubung ke HTML/CSS/JS.",
  "HTML/CSS/JS bercabang ke DOM, CSSOM, dan JavaScript Execution.",
  "DOM dan CSSOM terhubung ke Render Tree.",
  "Render Tree terhubung ke Layout.",
  "Layout terhubung ke Paint.",
  "Paint terhubung ke Composite.",
  "Composite terhubung ke Screen/Initial Page.",
  "Screen/Initial Page bercabang ke LCP dan CLS.",
  "JavaScript Execution terhubung ke React Hydration.",
  "React Hydration terhubung ke Interactive Page.",
  "Interactive Page terhubung ke INP.",
  "Interactive Page terhubung ke Client-side Data Fetching.",
  "Client-side Data Fetching bercabang ke Cache, Deduplication, Revalidation, dan Pagination.",
  "Client-side Data Fetching terhubung ke Update UI.",
  "Update UI bercabang ke Optimistic Update, Virtualization, dan Memoization.",
];

const notes = [
  ["URL", "URL sederhana dan redirect minimal"],
  ["DNS", "DNS caching dan CDN/Anycast DNS"],
  ["HTTPS/TLS", "TLS 1.3, connection reuse, dan security headers"],
  ["CDN", "Cache, compression, image optimization, dan geographic distribution"],
  ["Next.js Server", "SSG, ISR, SSR, caching, streaming, parallel data fetching, dan hindari waterfall"],
  ["BFF", "Cache, request aggregation, dan timeout"],
  ["HTML/CSS/JS", "Server Components, streaming, dan kurangi client-side JavaScript"],
  ["DOM", "Kurangi DOM size dan gunakan semantic HTML"],
  ["CSSOM", "Critical CSS, kurangi unused CSS, dan hindari CSS blocking berlebihan"],
  ["Render Tree", "Kurangi kompleksitas DOM dan CSS"],
  ["Layout", "Reserve image dimensions, hindari layout thrashing, dan optimasi CLS"],
  ["Paint", "Kurangi expensive CSS effects dan repaint"],
  ["Composite", "Gunakan transform atau opacity untuk animasi dan hindari layer berlebihan"],
  ["Screen/Initial Page", "Optimasi LCP dan CLS"],
  ["JavaScript Execution", "Code splitting, lazy loading, tree shaking, dan kurangi long task"],
  ["React Hydration", "Kurangi Client Components, gunakan selective atau streaming hydration, dan hindari hydration mismatch"],
  ["Interactive Page", "Optimasi INP, gunakan debounce atau throttle, dan hindari unnecessary re-render"],
  ["Client-Side Data Fetching", "Cache, deduplication, revalidation, dan pagination"],
  ["Update UI", "Optimistic update, virtualization, dan memoization bila diperlukan"],
] as const;

const reset = () => useDiagramStore.setState({nodes:[],edges:[],past:[],future:[]});

test("the supplied Next.js flow draws every connection without a stray Frontend node", () => {
  reset();
  for(const statement of statements){
    const commands=parseIntent(statement);
    assert.ok(commands.length, `did not understand: ${statement}`);
    assert.equal(useDiagramStore.getState().execute(commands), true, `did not apply: ${statement}`);
  }
  const state=useDiagramStore.getState();
  assert.equal(state.nodes.length, 29);
  assert.equal(state.edges.length, 30);
  assert.ok(!state.nodes.some(node=>node.data.label==="Frontend"));
});

test("quoted note commands annotate all supplied flow nodes", () => {
  reset();
  for(const statement of statements)useDiagramStore.getState().execute(parseIntent(statement));
  for(const [target,note] of notes){
    const statement=`Tambahkan catatan "${note}" pada ${target}.`;
    assert.deepEqual(parseIntent(statement),[{type:"SET_NOTE",target,note}]);
    assert.equal(useDiagramStore.getState().execute(parseIntent(statement)),true);
  }
  const byLabel=new Map(useDiagramStore.getState().nodes.map(node=>[String(node.data.label),node.data.note]));
  for(const [target,note] of notes)assert.equal(byLabel.get(target),note);
});
