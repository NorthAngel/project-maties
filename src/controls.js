export const PHYSICAL={Up:1,Down:2,Left:4,Right:8,Menu:16,View:32,L3:64,R3:128,LB:256,RB:512,A:4096,B:8192,X:16384,Y:32768,LT:65536,RT:131072};
export const LABELS={Up:'↑',Down:'↓',Left:'←',Right:'→',Menu:'Menu',View:'View',L3:'L3',R3:'R3',LB:'LB',RB:'RB',A:'A',B:'B',X:'X',Y:'Y',LT:'LT',RT:'RT'};
export const ACTIONS={none:'不分配',Y:'上方字符',A:'下方字符',X:'左侧字符',B:'右侧字符',space:'空格',backspace:'退格',enter:'回车',shift:'按住 Shift',mouseLeft:'鼠标左键',mouseRight:'鼠标右键',mouseMiddle:'鼠标中键',cyclePrevious:'上一字符布局',cycleNext:'下一字符布局',cycleLeft:'切换左盘',cycleRight:'切换右盘',ime:'切换输入法','app:keyboard':'显示 / 收起转盘',leftY:'左盘 · 上方字符',leftA:'左盘 · 下方字符',leftX:'左盘 · 左侧字符',leftB:'左盘 · 右侧字符'};
for(const key of ['space','backspace','enter','tab','escape','delete','left','right','up','down','home','end','copy','paste','undo','mediaPlay','mediaPrevious','mediaNext',...'abcdefghijklmnopqrstuvwxyz0123456789'])ACTIONS['key:'+key]='键盘 '+key.toUpperCase();
for(let i=1;i<=12;i++)ACTIONS['key:f'+i]='F'+i;
for(const key of ['ctrl','shift','alt','win'])ACTIONS['modifier:'+key]='按住 '+key;
export const LOCKED_BINDINGS={idle:{L3:'app:keyboard'},typing:{L3:'app:keyboard',Y:'Y',A:'A',X:'X',B:'B'},dual:{L3:'app:keyboard',Y:'Y',A:'A',X:'X',B:'B',Up:'leftY',Down:'leftA',Left:'leftX',Right:'leftB'}};
export const DEFAULT_BINDINGS={idle:{...LOCKED_BINDINGS.idle,A:'mouseLeft',B:'mouseRight',Up:'key:up',Down:'key:down',Left:'key:left',Right:'key:right'},typing:{...LOCKED_BINDINGS.typing,Up:'space',Down:'enter',Left:'cyclePrevious',Right:'cycleNext'},dual:{...LOCKED_BINDINGS.dual}};
export function normalizeBindings(value={}){
 const result={};
 for(const mode of ['idle','typing','dual']){
  result[mode]={};
  for(const key of Object.keys(PHYSICAL)){
   const action=value?.[mode]?.[key];
   result[mode][key]=LOCKED_BINDINGS[mode][key]??(Object.hasOwn(ACTIONS,action)?action:DEFAULT_BINDINGS[mode][key]??'none');
  }
 }
 return result;
}
// Transitional export until the old settings UI is replaced; no auxiliary state is accepted.
export function normalizeAuxiliary(){return {};}
export function actionsDown(buttons,bindings,mode){return new Set(Object.entries(bindings[mode]??bindings.typing).filter(([key,action])=>key!=='L3'&&(buttons&PHYSICAL[key])&&action!=='none').map(([,action])=>action));}
export function buttonFor(bindings,action,mode='typing'){return Object.keys(bindings[mode]).filter(k=>bindings[mode][k]===action).map(k=>LABELS[k]).join(' / ')||'—';}
