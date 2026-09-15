import {FIGMA_LAYOUT,FIGMA_SIZE} from './figma-layout.js';
import {DISCS} from './radial.js';
let nextWheel=0;
export async function createWheel(host) {
 const prefix=`wheel${++nextWheel}-`;
 const layers=[],tiles=[];
 for(let mode=0;mode<3;mode++){
  const layer=document.createElement('div');layer.className='disc-layer';layer.dataset.disc=mode;layers.push(layer);tiles[mode]=[];
  for(let sector=0;sector<7;sector++){
   const tile=document.createElement('div');tile.className='sector';tile.dataset.sector=sector;tiles[mode][sector]=tile;
   for(const node of FIGMA_LAYOUT[mode][sector]){
    const response=await fetch(node.asset);if(!response.ok)throw new Error(`Missing Figma asset: ${node.asset}`);
    const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
    const svg=doc.documentElement;
    // Only local, original Figma exports; remove any active/foreign content before embedding.
    svg.querySelectorAll('script,foreignObject').forEach(n=>n.remove());
    svg.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes])if(/^on/i.test(a.name))el.removeAttribute(a.name);});
    const ids=new Map([...svg.querySelectorAll('[id]')].map(el=>[el.id,prefix+el.id]));
    svg.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes]){let value=a.value;for(const [id,replacement] of ids){value=value.replaceAll(`url(#${id})`,`url(#${replacement})`);if(value===`#${id}`)value=`#${replacement}`;}if(a.name==='id')value=ids.get(a.value);el.setAttribute(a.name,value);}});
    svg.setAttribute('aria-hidden','true');
    const isText=node.type==='TEXT';
    const el=document.createElement('div');el.className=isText?'letter':'plate';
    el.dataset.figmaId=node.id;
    el.style.cssText=`left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px`;
    if(isText){const slot=[...DISCS[mode].chars].slice(sector*4,sector*4+4).indexOf(node.text);el.dataset.slot=slot;el.dataset.character=node.text;el.setAttribute('aria-label',`扇区 ${sector+1}，${['Y','A','X','B'][slot]} 键输入 ${node.text}`);el.addEventListener('pointerdown',e=>e.preventDefault());}
    el.append(document.importNode(svg,true));
    if(!isText){
     const outline=document.createElementNS('http://www.w3.org/2000/svg','svg');outline.setAttribute('viewBox',svg.getAttribute('viewBox'));outline.classList.add('selection-outline');outline.setAttribute('aria-hidden','true');
     const source=svg.querySelector('path[fill]:not([fill="none"])');if(source){const path=source.cloneNode(true);path.setAttribute('fill','none');path.removeAttribute('fill-opacity');path.removeAttribute('shape-rendering');path.setAttribute('stroke-linejoin','round');outline.append(path);}el.append(outline);
    }
    tile.append(el);
   }
   layer.append(tile);
  }
  host.append(layer);
 }
 let last='';
 const update=state=>{
  const effective=state.shift&&state.mode<2?1-state.mode:state.mode;
  const key=`${effective}:${state.selected}`;if(key===last)return;last=key;
  layers.forEach((layer,m)=>{layer.classList.toggle('active',m===effective);layer.setAttribute('aria-hidden',String(m!==effective));layer.inert=m!==effective;tiles[m].forEach((tile,s)=>tile.classList.toggle('selected',s===state.selected));});
 };
 const pulse=(state,slot)=>{host.querySelectorAll('.pulse').forEach(e=>e.classList.remove('pulse'));if(state.selected===null)return;const m=state.shift&&state.mode<2?1-state.mode:state.mode;tiles[m][state.selected].querySelector(`[data-slot="${slot}"]`).classList.add('pulse');};
 return {update,pulse,size:FIGMA_SIZE};
}
