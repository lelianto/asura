import type {Edge,Node} from "@xyflow/react";

// Quote only when punctuation could be mistaken for shortcut syntax. JSON string
// escaping matches the shortcut parser's handling of quotes and backslashes.
function labelOf(node:Node):string{return String(node.data.label??"").trim()}
function notationLabel(label:string):string{
  return /[>|@\n\r"]|:=|::|!>/.test(label)||/^[+\-:]/.test(label)
    ?JSON.stringify(label)
    :label;
}

export function diagramToNotation(nodes:Node[],edges:Edge[]):string{
  const byId=new Map(nodes.map(node=>[node.id,node]));
  const outgoing=new Map<string,string[]>();
  const incoming=new Set<string>();
  for(const edge of edges){
    if(!byId.has(edge.source)||!byId.has(edge.target))continue;
    const targets=outgoing.get(edge.source)??[];
    if(!targets.includes(edge.target))targets.push(edge.target);
    outgoing.set(edge.source,targets);incoming.add(edge.target);
  }

  const lines:string[]=[];
  for(const node of nodes){
    const source=notationLabel(labelOf(node));
    if(!source)continue;
    const targets=(outgoing.get(node.id)??[]).map(id=>byId.get(id)).filter((target):target is Node=>Boolean(target));
    if(targets.length>1)lines.push(`${source}>>${targets.map(target=>notationLabel(labelOf(target))).join("|")}`);
    else if(targets.length===1)lines.push(`${source}>${notationLabel(labelOf(targets[0]))}`);
    else if(!incoming.has(node.id))lines.push(`+${source}`);
  }
  for(const node of nodes){
    const source=notationLabel(labelOf(node));
    const tech=String(node.data.tech??"").trim();
    const note=String(node.data.note??"").trim();
    if(source&&tech)lines.push(`${source}@${notationLabel(tech)}`);
    if(source&&note)lines.push(`${source}::${JSON.stringify(note)}`);
  }
  return lines.join("\n");
}
