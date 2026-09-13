// Every utterance printed in docs/VOICE-COMMANDS.md must behave as documented.
// Documentation that drifts from the parser is worse than no documentation.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseIntent, VOCABULARY } from "../lib/diagram.ts";
import { examples } from "../lib/examples.ts";

const docs = readFileSync(fileURLToPath(new URL("../docs/VOICE-COMMANDS.md", import.meta.url)), "utf8");

test("documented commands produce the documented number of commands", () => {
  const cases: Array<[string, number]> = [
    ["tambahkan API Gateway", 1], ["bikin Auth Service", 1], ["tambahkan Redis dan GraphQL", 2],
    ["add Load Balancer", 1], ["tambahkan Redis ke BFF", 1],
    ["User terhubung ke CDN", 1], ["dari Mobile App ke BFF lalu ke Redis", 2],
    ["Next js manggil graph ql", 1], ["CDN accesses Web", 1],
    ["User ke CDN lalu ke Next js terus ke BFF", 3],
    ["BFF bercabang ke Redis dan GraphQL", 1], ["BFF branches to Redis and PostgreSQL", 1],
    ["putuskan User dari CDN", 1], ["hapus koneksi CDN ke Next js", 1],
    ["delete connection User to CDN", 1],
    ["hapus Redis", 1], ["buang CDN aja", 1], ["remove Nginx", 1],
    ["ganti BFF jadi Backend API", 1], ["ubah local storage menjadi Redis", 1],
    ["rename CDN to Cloudflare", 1],
    ["tambahkan Web terbuat dari next js", 2], ["CDN mengakses Web terbuat dari Next js", 2],
    ["tambahkan Dashboard memakai tan stack query", 2],
    ["undo", 1], ["balik", 1], ["batalkan", 1], ["redo", 1], ["ulangi", 1],
    ["tambahkan Legacy Billing", 1], ["tambahkan Redis dan hapus CDN", 2], ["A ke B dan C ke D", 2],
  ];
  for (const [said, count] of cases)
    assert.equal(parseIntent(said).length, count, `documented example changed: "${said}"`);
});

test("utterances documented as rejected really are rejected", () => {
  for (const said of [
    "kita pindah ke bagian berikutnya",
    "menurut saya lebih baik kita kembali ke desain awal",
    "let's move on to the next topic",
    "nanti saya kirim ke kamu ya",
    "iya betul sekali",
    "kembali ke desain yang kita bahas kemarin sore",
  ]) assert.deepEqual(parseIntent(said), [], `documented as rejected: "${said}"`);
});

test("the vocabulary table in the docs lists every canonical label", () => {
  for (const { label } of VOCABULARY)
    assert.ok(docs.includes(`| \`${label}\` |`), `missing from the vocabulary table: ${label}`);
});

test("the vocabulary count stated in the docs is accurate", () => {
  assert.ok(docs.includes(`${VOCABULARY.length} entri`),
    `docs claim the wrong entry count; vocabulary now has ${VOCABULARY.length}`);
});

test("every panel example is also reachable from the docs' command grammar", () => {
  for (const lang of ["id", "en"] as const)
    for (const line of examples[lang])
      assert.ok(parseIntent(line).length > 0, `panel example no longer parses: ${line}`);
});
