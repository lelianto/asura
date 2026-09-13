"use client";
import type {Edge,Node} from "@xyflow/react";
// Designs live in the browser only. Nothing here talks to a server, so a diagram
// survives a reload and a closed tab, but never leaves the machine it was drawn on.
export type SavedDesign={id:string;name:string;savedAt:string;nodes:Node[];edges:Edge[]};
type Snapshot={nodes:Node[];edges:Edge[]};
const DESIGNS_KEY="asuradraw:designs";
const AUTOSAVE_KEY="asuradraw:autosave";
// Private-mode Safari throws on write and a full quota throws on save, so every call
// here is best-effort: a failed read is an empty library, never a crashed canvas.
function read<T>(key:string,fallback:T):T{
  if(typeof window==="undefined")return fallback;
  try{const raw=window.localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}
  catch{return fallback}
}
function write(key:string,value:unknown):boolean{
  if(typeof window==="undefined")return false;
  try{window.localStorage.setItem(key,JSON.stringify(value));return true}
  catch{return false}
}
// A stored entry is only usable if both halves survived the round trip.
const isSnapshot=(v:unknown):v is Snapshot=>{
  if(typeof v!=="object"||v===null)return false;
  const s=v as Partial<Snapshot>;
  return Array.isArray(s.nodes)&&Array.isArray(s.edges);
};
export function readDesigns():SavedDesign[]{
  const stored=read<unknown>(DESIGNS_KEY,[]);
  if(!Array.isArray(stored))return[];
  return stored.filter((d):d is SavedDesign=>isSnapshot(d)&&typeof (d as SavedDesign).id==="string"&&typeof (d as SavedDesign).name==="string");
}
// Two designs saved in the same millisecond would otherwise share an id, and deleting
// one would take the other with it.
function freshId(designs:SavedDesign[],now:number):string{
  let candidate=`design-${now}`;
  for(let suffix=1;designs.some(d=>d.id===candidate);suffix++)candidate=`design-${now}-${suffix}`;
  return candidate;
}
// Saving under a name that already exists replaces it, which is what "save" means to
// someone iterating on one diagram; a new name adds an entry.
export function saveDesign(name:string,nodes:Node[],edges:Edge[],now:number):SavedDesign|null{
  const trimmed=name.trim();
  if(!trimmed)return null;
  const designs=readDesigns();
  const existing=designs.find(d=>d.name.toLowerCase()===trimmed.toLowerCase());
  const design:SavedDesign={id:existing?.id??freshId(designs,now),name:trimmed,savedAt:new Date(now).toISOString(),nodes,edges};
  const next=existing?designs.map(d=>d.id===existing.id?design:d):[...designs,design];
  return write(DESIGNS_KEY,next)?design:null;
}
export function deleteDesign(id:string):boolean{
  return write(DESIGNS_KEY,readDesigns().filter(d=>d.id!==id));
}
export function readAutosave():Snapshot|null{
  const stored=read<unknown>(AUTOSAVE_KEY,null);
  return isSnapshot(stored)?stored:null;
}
export function writeAutosave(nodes:Node[],edges:Edge[]):void{
  write(AUTOSAVE_KEY,{nodes,edges});
}
