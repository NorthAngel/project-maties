function markAnchor(anchor){document.querySelectorAll('[aria-expanded="true"]').forEach(el=>el.setAttribute('aria-expanded','false'));anchor.setAttribute('aria-expanded','true');}
export function showOptions(anchor,title,items,onChange,{search=false,placeholder=''}={}){
 markAnchor(anchor);const popup=document.querySelector('#popup');popup.replaceChildren();
 const heading=document.createElement('h2');heading.textContent=title;popup.append(heading);
 let input;
 if(search){input=document.createElement('input');input.className='popup-search';input.placeholder=placeholder;popup.append(input);}
 const list=document.createElement('div');list.setAttribute('role','listbox');popup.append(list);
 const draw=()=>{list.replaceChildren();for(const item of items.filter(x=>!input?.value||x.label.toLocaleLowerCase().includes(input.value.toLocaleLowerCase()))){
  const b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.textContent=item.label;b.setAttribute('aria-selected',String(!!item.selected));b.disabled=!!item.disabled;
  b.onclick=()=>{popup.hidden=true;onChange(item.value);};list.append(b);
 }};
 input?.addEventListener('input',draw);draw();popup.hidden=false;
 const box=anchor.getBoundingClientRect();popup.style.left=Math.max(12,Math.min(innerWidth-332,box.right-320))+'px';popup.style.top=Math.max(36,Math.min(innerHeight-popup.offsetHeight-12,box.bottom+10))+'px';
 input?.focus();
}
export function showMessage(anchor,title,message,actions=[]){
 markAnchor(anchor);const popup=document.querySelector('#popup');popup.replaceChildren();
 const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=message;popup.append(h,p);
 for(const action of actions){const b=document.createElement('button');b.className='confirm-button';b.textContent=action.label;b.onclick=()=>{popup.hidden=true;action.run();};popup.append(b);}
 popup.hidden=false;const box=anchor.getBoundingClientRect();popup.style.left=Math.max(12,Math.min(innerWidth-332,box.right-320))+'px';popup.style.top=Math.max(36,Math.min(innerHeight-popup.offsetHeight-12,box.bottom+10))+'px';
}
document.addEventListener('pointerdown',e=>{const popup=document.querySelector('#popup');if(!popup.hidden&&!popup.contains(e.target)&&!e.target.closest('button'))popup.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('#popup').hidden=true;});

new MutationObserver(()=>{if(document.querySelector('#popup').hidden)document.querySelectorAll('[aria-expanded="true"]').forEach(el=>el.setAttribute('aria-expanded','false'));}).observe(document.querySelector('#popup'),{attributes:true,attributeFilter:['hidden']});
