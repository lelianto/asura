import test from "node:test";
import assert from "node:assert/strict";
import type {Edge,Node} from "@xyflow/react";
import {diagramToNotation} from "../lib/notation.ts";
import {parseIntent} from "../lib/diagram.ts";

const nodes:Node[]=[
  {id:"user",position:{x:0,y:0},data:{label:"User",kind:"client"}},
  {id:"cdn",position:{x:0,y:0},data:{label:"CDN",kind:"edge",tech:"Cloudflare",note:"Cache > origin"}},
  {id:"hit",position:{x:0,y:0},data:{label:"Cache Hit",kind:"service"}},
  {id:"miss",position:{x:0,y:0},data:{label:"Cache Miss",kind:"service"}},
  {id:"solo",position:{x:0,y:0},data:{label:"Worker > Queue",kind:"service"}},
];
const edges:Edge[]=[
  {id:"1",source:"user",target:"cdn"},
  {id:"2",source:"cdn",target:"hit"},
  {id:"3",source:"cdn",target:"miss"},
];

test("diagram notation includes edges, branches, isolated nodes and metadata",()=>{
  const notation=diagramToNotation(nodes,edges);
  assert.equal(notation,[
    "User>CDN",
    "CDN>>Cache Hit|Cache Miss",
    '+"Worker > Queue"',
    "CDN@Cloudflare",
    'CDN::"Cache > origin"',
  ].join("\n"));
  assert.ok(notation.split("\n").every(line=>parseIntent(line).length>0));
});
