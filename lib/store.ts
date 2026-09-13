"use client";
import {create} from "zustand";
import {addEdge,applyEdgeChanges,applyNodeChanges,Edge,EdgeChange,Node,NodeChange} from "@xyflow/react";
import type {DiagramCommand} from "./diagram";
type Snapshot={nodes:Node[];edges:Edge[]};
type State=Snapshot&{past:Snapshot[];future:Snapshot[];execute:(c:DiagramCommand[])=>void;undo:()=>void;redo:()=>void;clear:()=>void;onNodesChange:(c:NodeChange[])=>void;onEdgesChange:(c:EdgeChange[])=>void};
const initial:Snapshot={nodes:[
  {id:"user",position:{x:30,y:170},data:{label:"User",kind:"client"}},
  {id:"cdn",position:{x:290,y:170},data:{label:"CDN",kind:"edge"}},
  {id:"next-js",position:{x:550,y:170},data:{label:"Next.js",kind:"app"}},
  {id:"bff",position:{x:810,y:170},data:{label:"BFF",kind:"service"}},
],edges:[
  {id:"user-cdn",source:"user",target:"cdn",animated:true},{id:"cdn-next",source:"cdn",target:"next-js",animated:true},{id:"next-bff",source:"next-js",target:"bff",animated:true}
]};
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"node-"+Date.now();
const find=(nodes:Node[],label:string)=>nodes.find(n=>String(n.data.label).toLowerCase()===label.toLowerCase());
export const useDiagramStore=create<State>((set,get)=>({...initial,past:[],future:[],
  execute(commands){if(!commands.length)return;if(commands[0].type==="UNDO"){get().undo();return}if(commands[0].type==="REDO"){get().redo();return}
    const before={nodes:get().nodes,edges:get().edges};let nodes=[...before.nodes],edges=[...before.edges];
    const ensure=(label:string)=>{let n=find(nodes,label);if(!n){const id=slug(label)+"-"+Date.now()+"-"+nodes.length;n={id,position:{x:100+nodes.length*210,y:150+(nodes.length%2)*140},data:{label,kind:"service"}};nodes.push(n)}return n};
    for(const cmd of commands){
      if(cmd.type==="ADD_NODE")ensure(cmd.label);
      if(cmd.type==="CONNECT"){const a=ensure(cmd.from),b=ensure(cmd.to);if(!edges.some(e=>e.source===a.id&&e.target===b.id))edges=addEdge({id:a.id+"-"+b.id,source:a.id,target:b.id,animated:true},edges)}
      if(cmd.type==="BRANCH"){const a=ensure(cmd.from);for(const t of cmd.targets){const b=ensure(t);if(!edges.some(e=>e.source===a.id&&e.target===b.id))edges=addEdge({id:a.id+"-"+b.id,source:a.id,target:b.id,animated:true},edges)}}
      if(cmd.type==="DELETE_NODE"){const n=find(nodes,cmd.target);if(n){nodes=nodes.filter(x=>x.id!==n.id);edges=edges.filter(e=>e.source!==n.id&&e.target!==n.id)}}
      if(cmd.type==="RENAME_NODE"){const n=find(nodes,cmd.target);if(n)nodes=nodes.map(x=>x.id===n.id?{...x,data:{...x.data,label:cmd.newLabel}}:x)}
      if(cmd.type==="DISCONNECT"){const a=find(nodes,cmd.from),b=find(nodes,cmd.to);if(a&&b)edges=edges.filter(e=>!(e.source===a.id&&e.target===b.id))}
    }set({nodes,edges,past:[...get().past,before],future:[]});
  },
  undo(){const p=get().past;if(!p.length)return;const v=p.at(-1)!;set({nodes:v.nodes,edges:v.edges,past:p.slice(0,-1),future:[{nodes:get().nodes,edges:get().edges},...get().future]})},
  redo(){const n=get().future[0];if(!n)return;set({nodes:n.nodes,edges:n.edges,past:[...get().past,{nodes:get().nodes,edges:get().edges}],future:get().future.slice(1)})},
  clear(){set({nodes:[],edges:[],past:[...get().past,{nodes:get().nodes,edges:get().edges}],future:[]})},
  onNodesChange(c){set({nodes:applyNodeChanges(c,get().nodes)})},onEdgesChange(c){set({edges:applyEdgeChanges(c,get().edges)})}
}));
