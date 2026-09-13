"use client";
import {create} from "zustand";
import {addEdge,applyEdgeChanges,applyNodeChanges} from "@xyflow/react";
import type {Edge,EdgeChange,Node,NodeChange} from "@xyflow/react";
import type {DiagramCommand} from "./diagram";
type Snapshot={nodes:Node[];edges:Edge[]};
type State=Snapshot&{past:Snapshot[];future:Snapshot[];execute:(c:DiagramCommand[])=>boolean;undo:()=>void;redo:()=>void;clear:()=>void;onNodesChange:(c:NodeChange[])=>void;onEdgesChange:(c:EdgeChange[])=>void};
// A long voice session emits a command every few seconds; cap the snapshot stack.
const HISTORY_LIMIT=100;
const initial:Snapshot={nodes:[],edges:[]};
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"node-"+Date.now();
const find=(nodes:Node[],label:string)=>nodes.find(n=>String(n.data.label).toLowerCase()===label.toLowerCase());
export const useDiagramStore=create<State>((set,get)=>({...initial,past:[],future:[],
  execute(commands){if(!commands.length)return false;if(commands[0].type==="UNDO"){get().undo();return true}if(commands[0].type==="REDO"){get().redo();return true}
    const before={nodes:get().nodes,edges:get().edges};let nodes=[...before.nodes],edges=[...before.edges];let changed=false;
    const ensure=(label:string)=>{let n=find(nodes,label);if(!n){const id=slug(label)+"-"+Date.now()+"-"+nodes.length;n={id,position:{x:100+nodes.length*210,y:150+(nodes.length%2)*140},data:{label,kind:"service"}};nodes.push(n);changed=true}return n};
    const connect=(a:Node,b:Node)=>{if(a.id===b.id)return;if(edges.some(e=>e.source===a.id&&e.target===b.id))return;edges=addEdge({id:a.id+"-"+b.id,source:a.id,target:b.id,animated:true},edges);changed=true};
    for(const cmd of commands){
      if(cmd.type==="ADD_NODE")ensure(cmd.label);
      if(cmd.type==="CONNECT")connect(ensure(cmd.from),ensure(cmd.to));
      if(cmd.type==="BRANCH"){const a=ensure(cmd.from);for(const t of cmd.targets)connect(a,ensure(t))}
      if(cmd.type==="DELETE_NODE"){const n=find(nodes,cmd.target);if(n){nodes=nodes.filter(x=>x.id!==n.id);edges=edges.filter(e=>e.source!==n.id&&e.target!==n.id);changed=true}}
      // Renaming onto a label that already exists would make `find` ambiguous, so skip it.
      if(cmd.type==="RENAME_NODE"){const n=find(nodes,cmd.target),taken=find(nodes,cmd.newLabel);if(n&&(!taken||taken.id===n.id)&&String(n.data.label)!==cmd.newLabel){nodes=nodes.map(x=>x.id===n.id?{...x,data:{...x.data,label:cmd.newLabel}}:x);changed=true}}
      if(cmd.type==="DISCONNECT"){const a=find(nodes,cmd.from),b=find(nodes,cmd.to);if(a&&b){const next=edges.filter(e=>!(e.source===a.id&&e.target===b.id));if(next.length!==edges.length){edges=next;changed=true}}}
    }
    // A command that matched but moved nothing must not leave an empty undo step behind.
    if(!changed)return false;
    set({nodes,edges,past:[...get().past,before].slice(-HISTORY_LIMIT),future:[]});return true;
  },
  undo(){const p=get().past;if(!p.length)return;const v=p.at(-1)!;set({nodes:v.nodes,edges:v.edges,past:p.slice(0,-1),future:[{nodes:get().nodes,edges:get().edges},...get().future]})},
  redo(){const n=get().future[0];if(!n)return;set({nodes:n.nodes,edges:n.edges,past:[...get().past,{nodes:get().nodes,edges:get().edges}].slice(-HISTORY_LIMIT),future:get().future.slice(1)})},
  clear(){if(!get().nodes.length&&!get().edges.length)return;set({nodes:[],edges:[],past:[...get().past,{nodes:get().nodes,edges:get().edges}].slice(-HISTORY_LIMIT),future:[]})},
  onNodesChange(c){set({nodes:applyNodeChanges(c,get().nodes)})},onEdgesChange(c){set({edges:applyEdgeChanges(c,get().edges)})}
}));
