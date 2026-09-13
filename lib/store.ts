"use client";
import {create} from "zustand";
import {addEdge,applyEdgeChanges,applyNodeChanges,MarkerType} from "@xyflow/react";
import type {Edge,EdgeChange,Node,NodeChange} from "@xyflow/react";
import {kindOf,normalize} from "./diagram.ts";
import type {DiagramCommand,NodeKind} from "./diagram";
type Snapshot={nodes:Node[];edges:Edge[]};
// A dashed line is normally inferred from geometry, so a hand-drawn one has to say
// so explicitly; the canvas reads this back off `edge.data`.
export type EdgeVariant="solid"|"dashed";
type State=Snapshot&{past:Snapshot[];future:Snapshot[];execute:(c:DiagramCommand[])=>boolean;undo:()=>void;redo:()=>void;clear:()=>void;remove:(nodeIds:string[],edgeIds?:string[])=>boolean;rename:(id:string,label:string)=>boolean;load:(nodes:Node[],edges:Edge[])=>void;addNode:(label:string,kind?:NodeKind)=>boolean;link:(sourceId:string,targetId:string,variant:EdgeVariant)=>boolean;setEdgeVariant:(edgeId:string,variant:EdgeVariant)=>boolean;onNodesChange:(c:NodeChange[])=>void;onEdgesChange:(c:EdgeChange[])=>void};
// A long voice session emits a command every few seconds; cap the snapshot stack.
const HISTORY_LIMIT=100;
const initial:Snapshot={nodes:[],edges:[]};
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"node-"+Date.now();
const find=(nodes:Node[],label:string)=>nodes.find(n=>String(n.data.label).toLowerCase()===label.toLowerCase());
export const useDiagramStore=create<State>((set,get)=>{
// Every user-visible mutation goes through here, so voice, keyboard and mouse edits
// all land in the same undo history.
const commit=(next:Snapshot)=>set({...next,past:[...get().past,{nodes:get().nodes,edges:get().edges}].slice(-HISTORY_LIMIT),future:[]});
return{...initial,past:[],future:[],
  execute(commands){if(!commands.length)return false;if(commands[0].type==="UNDO"){get().undo();return true}if(commands[0].type==="REDO"){get().redo();return true}
    const before={nodes:get().nodes,edges:get().edges};let nodes=[...before.nodes],edges=[...before.edges];let changed=false;
    const isNewNode=new Set<string>();
    const ensure=(label:string)=>{let n=find(nodes,label);if(!n){const id=slug(label)+"-"+Date.now()+"-"+nodes.length;const lastNode=nodes[nodes.length-1];n={id,position:{x:lastNode?lastNode.position.x+220:100,y:lastNode?lastNode.position.y:150},data:{label,kind:kindOf(label)}};nodes.push(n);isNewNode.add(id);changed=true}return n};
    const connect=(a:Node,b:Node)=>{if(a.id===b.id)return;if(isNewNode.has(b.id)&&!isNewNode.has(a.id)){b.position={x:a.position.x+240,y:a.position.y}}else if(isNewNode.has(a.id)&&!isNewNode.has(b.id)){a.position={x:Math.max(40,b.position.x-240),y:b.position.y}}if(edges.some(e=>e.source===a.id&&e.target===b.id))return;edges=addEdge({id:a.id+"-"+b.id,source:a.id,target:b.id,animated:true,style:{stroke:"#446b5f",strokeWidth:1.5},markerEnd:{type:MarkerType.ArrowClosed,color:"#65d9e8",width:15,height:15}},edges);changed=true};
    for(const cmd of commands){
      if(cmd.type==="ADD_NODE")ensure(cmd.label);
      if(cmd.type==="CONNECT")connect(ensure(cmd.from),ensure(cmd.to));
      if(cmd.type==="BRANCH"){const a=ensure(cmd.from);for(const t of cmd.targets)connect(a,ensure(t))}
      if(cmd.type==="DELETE_NODE"){const n=find(nodes,cmd.target);if(n){nodes=nodes.filter(x=>x.id!==n.id);edges=edges.filter(e=>e.source!==n.id&&e.target!==n.id);changed=true}}
      // Renaming onto a label that already exists would make `find` ambiguous, so skip it.
      if(cmd.type==="RENAME_NODE"){const n=find(nodes,cmd.target),taken=find(nodes,cmd.newLabel);if(n&&(!taken||taken.id===n.id)&&String(n.data.label)!==cmd.newLabel){nodes=nodes.map(x=>x.id===n.id?{...x,data:{...x.data,label:cmd.newLabel}}:x);changed=true}}
      // "Web terbuat dari Next.js" annotates the node instead of renaming it.
      if(cmd.type==="SET_TECH"){const n=find(nodes,cmd.target);if(n&&String(n.data.tech??"")!==cmd.tech){nodes=nodes.map(x=>x.id===n.id?{...x,data:{...x.data,tech:cmd.tech}}:x);changed=true}}
      if(cmd.type==="CLEAR"){if(nodes.length||edges.length){nodes=[];edges=[];changed=true}}
      if(cmd.type==="DISCONNECT"){const a=find(nodes,cmd.from),b=find(nodes,cmd.to);if(a&&b){const next=edges.filter(e=>!(e.source===a.id&&e.target===b.id));if(next.length!==edges.length){edges=next;changed=true}}}
    }
    // A command that matched but moved nothing must not leave an empty undo step behind.
    if(!changed)return false;
    commit({nodes,edges});return true;
  },
  undo(){const p=get().past;if(!p.length)return;const v=p.at(-1)!;set({nodes:v.nodes,edges:v.edges,past:p.slice(0,-1),future:[{nodes:get().nodes,edges:get().edges},...get().future]})},
  redo(){const n=get().future[0];if(!n)return;set({nodes:n.nodes,edges:n.edges,past:[...get().past,{nodes:get().nodes,edges:get().edges}].slice(-HISTORY_LIMIT),future:get().future.slice(1)})},
  clear(){if(!get().nodes.length&&!get().edges.length)return;commit({nodes:[],edges:[]})},
  // Deleting a node takes its edges with it; ids the diagram no longer holds are ignored.
  remove(nodeIds,edgeIds=[]){const dropNode=new Set(nodeIds),dropEdge=new Set(edgeIds);const before={nodes:get().nodes,edges:get().edges};
    const nodes=before.nodes.filter(n=>!dropNode.has(n.id));
    const edges=before.edges.filter(e=>!dropEdge.has(e.id)&&!dropNode.has(e.source)&&!dropNode.has(e.target));
    if(nodes.length===before.nodes.length&&edges.length===before.edges.length)return false;
    commit({nodes,edges});return true},
  // A typed correction is normalised like speech, so "next js" still becomes "Next.js".
  rename(id,label){const next=normalize(label);const node=get().nodes.find(n=>n.id===id);
    if(!node||!next||String(node.data.label)===next)return false;
    // Two nodes sharing a label would make every later voice command ambiguous.
    if(get().nodes.some(n=>n.id!==id&&String(n.data.label).toLowerCase()===next.toLowerCase()))return false;
    commit({nodes:get().nodes.map(n=>n.id===id?{...n,data:{...n.data,label:next,kind:kindOf(next)}}:n),edges:get().edges});return true},
  // Opening a saved design replaces the canvas through the same commit path, so the
  // diagram it displaced stays one undo away.
  load(nodes,edges){commit({nodes,edges})},
  // The manual editor builds the same diagram speech does, so it reuses the same
  // guards: labels are normalised, and a duplicate would make every later voice
  // command ambiguous.
  addNode(label,kind){const next=normalize(label);if(!next)return false;
    const nodes=get().nodes;
    if(nodes.some(n=>String(n.data.label).toLowerCase()===next.toLowerCase()))return false;
    const last=nodes[nodes.length-1];
    const node:Node={id:slug(next)+"-"+Date.now()+"-"+nodes.length,position:{x:last?last.position.x+220:100,y:last?last.position.y:150},data:{label:next,kind:kind??kindOf(next)}};
    commit({nodes:[...nodes,node],edges:get().edges});return true},
  // Connects two nodes that already exist, unlike CONNECT which creates what it names.
  link(sourceId,targetId,variant){if(sourceId===targetId)return false;
    const nodes=get().nodes;
    if(!nodes.some(n=>n.id===sourceId)||!nodes.some(n=>n.id===targetId))return false;
    const edges=get().edges;
    if(edges.some(e=>e.source===sourceId&&e.target===targetId))return false;
    commit({nodes,edges:addEdge({id:sourceId+"-"+targetId,source:sourceId,target:targetId,animated:true,data:{variant},style:{stroke:"#446b5f",strokeWidth:1.5},markerEnd:{type:MarkerType.ArrowClosed,color:"#65d9e8",width:15,height:15}},edges)});return true},
  setEdgeVariant(edgeId,variant){const edges=get().edges,edge=edges.find(e=>e.id===edgeId);
    if(!edge||(edge.data?.variant??"solid")===variant)return false;
    commit({nodes:get().nodes,edges:edges.map(e=>e.id===edgeId?{...e,data:{...e.data,variant}}:e)});return true},
  onNodesChange(c){set({nodes:applyNodeChanges(c,get().nodes)})},onEdgesChange(c){set({edges:applyEdgeChanges(c,get().edges)})}
}});
