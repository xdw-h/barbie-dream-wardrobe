const $=s=>document.querySelector(s);
const categories=[['dress','♧','时装','日常、职业、运动与礼服，每天都有新角色'],['shoes','♧','鞋色','穿上喜欢的鞋，去喜欢的地方'],['accessory','♢','配饰','小小点缀，也要闪闪发光']];
let outfitTheme='全部';
const themeBar=document.createElement('div');themeBar.className='outfit-themes';themeBar.setAttribute('aria-label','服装风格');
$('#items').before(themeBar);
themeBar.onclick=e=>{const b=e.target.closest('[data-theme]');if(b){outfitTheme=b.dataset.theme;renderItems()}};
const sceneColors=['#f6e8e7','#e9e8f3','#e6ede6','#f1e7d5'];
const initial={dress:'pink-gala',hair:'gold-hair',shoes:'rose-heels',accessory:'pearl',scene:0};
let state={...initial},category='dress',history=[],saved=[],savedView=false,toastTimer;
try{const raw=JSON.parse(localStorage.getItem('paper-atelier-looks')||'[]');if(Array.isArray(raw))saved=raw.filter(x=>x&&typeof x==='object').slice(0,30)}catch{}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600)}
let outfitRequest=0;
const outfitLoads=new Map();
function ensureOutfit(id){
 if(DollAssets[id])return Promise.resolve();
 if(!HeritageOutfits.some(item=>item.id===id))return Promise.reject(new Error('Unknown outfit'));
 if(outfitLoads.has(id))return outfitLoads.get(id);
 const promise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const timer=setTimeout(()=>finish(new Error('Outfit loading timed out')),15000);
  function finish(error){clearTimeout(timer);script.onload=script.onerror=null;script.remove();if(error){outfitLoads.delete(id);reject(error)}else resolve()}
  script.onload=()=>finish(DollAssets[id]?null:new Error('Missing outfit data'));
  script.onerror=()=>finish(new Error('Outfit download failed'));
  script.src=`assets/packages/${id}.js`;document.head.appendChild(script);
 });
 outfitLoads.set(id,promise);return promise;
}
function applyLook(next){
 const id=next.dress||state.dress;
 if(DollAssets[id]){change(next);return Promise.resolve()}
 const request=++outfitRequest;$('#stage').setAttribute('aria-busy','true');toast('正在取出这套衣服…');
 return ensureOutfit(id).then(()=>{if(request===outfitRequest)change(next)}).catch(()=>{if(request===outfitRequest){$('#stage').setAttribute('aria-busy','false');toast('这套衣服加载失败，请再点一次')}});
}
function change(next){outfitRequest++;$('#stage').setAttribute('aria-busy','false');history.push({...state});if(history.length>50)history.shift();state={...state,...next};render()}
function render(){ $('#doll').innerHTML=Art.svg(Art.doll(state));$('#stage').style.background=sceneColors[state.scene]||sceneColors[0];$('#scenes').innerHTML=sceneColors.map((color,i)=>`<button class="swatch ${state.scene===i?'selected':''}" style="background:${color}" data-scene="${i}" aria-label="背景颜色 ${i+1}" aria-pressed="${state.scene===i}"></button>`).join('');$('#saveCount').textContent=saved.length;$('#undo').disabled=!history.length;renderItems() }
function renderItems(){ $('#panelTitle').innerHTML=savedView?'我的心动收藏 <span>♡</span>':'打开你的心动衣橱 <span>♡</span>';$('#total').textContent=savedView?`${saved.length} 套珍藏`:`${Art.items.length} 件心动单品`;$('#categories').style.display=savedView?'none':'flex';$('#collectionTitle').textContent=savedView?'把喜欢的自己，好好收藏':categories.find(c=>c[0]===category)[3];const list=savedView?saved:Art.items.filter(x=>x.cat===category);$('#itemCount').textContent=`${list.length} ${savedView?'套搭配':'件单品'}`;$('#items').innerHTML=list.length?list.map((item,i)=>savedView?`<div class="item"><button class="delete-save" data-delete="${i}" title="删除这套收藏" aria-label="删除收藏 ${i+1}">×</button><button class="saved-look" data-look="${i}" style="border:0;background:none;width:100%;padding:0"><div class="saved-art">${Art.svg(Art.doll(item))}</div><span class="item-label">心动搭配 ${String(i+1).padStart(2,'0')}</span><span class="item-sub">CLICK TO WEAR</span></button></div>`:`<button class="item ${state[category]===item.id?'selected':''}" data-item="${item.id}" draggable="true" aria-label="穿上${item.name}" aria-pressed="${state[category]===item.id}"><span class="item-art">${Art.thumbnail(item)}</span><span class="item-label">${item.name}</span><span class="item-sub">${item.en}</span></button>`).join(''):'<p class="empty">♡<br><br>还没有收藏，先搭一套喜欢的吧。</p>';$('#categories').innerHTML=categories.map(([id,icon,name])=>`<button class="category ${category===id?'selected':''}" data-cat="${id}" aria-pressed="${category===id}"><b>${icon}</b>${name}</button>`).join('') }
const renderAllItems=renderItems;
renderItems=function(){
 renderAllItems();
 const visible=!savedView&&category==='dress';
 themeBar.style.display=visible?'flex':'none';
 if(!visible)return;
 const themes=['全部','经典','电影','日常','职业','运动','礼服','主题'];
 themeBar.innerHTML=themes.map(theme=>`<button data-theme="${theme}" aria-pressed="${theme===outfitTheme}" class="${theme===outfitTheme?'selected':''}">${theme}</button>`).join('');
 let count=0;
 document.querySelectorAll('#items [data-item]').forEach(button=>{
  const item=Art.items.find(item=>item.id===button.dataset.item);
  button.hidden=outfitTheme!=='全部'&&item.theme!==outfitTheme;
  if(!button.hidden)count++;
 });
 $('#itemCount').textContent=`${count} 套服装`;
};
function wear(id){const item=Art.items.find(x=>x.id===id);if(item)return applyLook({[item.cat]:state[item.cat]===id&&item.cat==='accessory'?null:id})}
function persist(){try{localStorage.setItem('paper-atelier-looks',JSON.stringify(saved));return true}catch{toast('浏览器未允许保存，收藏暂留在本页');return false}}
$('#categories').onclick=e=>{const b=e.target.closest('[data-cat]');if(b){category=b.dataset.cat;renderItems()}};
$('#items').onclick=e=>{const del=e.target.closest('[data-delete]');if(del){saved.splice(Number(del.dataset.delete),1);persist();render();return}const look=e.target.closest('[data-look]');if(look){applyLook({...initial,...saved[Number(look.dataset.look)]});return}const b=e.target.closest('[data-item]');if(b)wear(b.dataset.item)};
$('#items').ondragstart=e=>{const b=e.target.closest('[data-item]');if(b){e.dataTransfer.setData('text/plain',b.dataset.item);e.dataTransfer.effectAllowed='copy'}};
$('#stage').ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='copy'};$('#stage').ondrop=e=>{e.preventDefault();wear(e.dataTransfer.getData('text/plain'))};
$('#scenes').onclick=e=>{const b=e.target.closest('[data-scene]');if(b)change({scene:Number(b.dataset.scene)})};
$('#reset').onclick=()=>{change({...initial});toast('回到最初的心动搭配')};$('#undo').onclick=()=>{outfitRequest++;$('#stage').setAttribute('aria-busy','false');if(history.length){state=history.pop();render()}};
$('#random').onclick=()=>{const next={};for(const [cat] of categories){const list=Art.items.filter(x=>x.cat===cat);next[cat]=list[Math.floor(Math.random()*list.length)].id}applyLook(next)};
$('#save').onclick=()=>{if(saved.some(x=>JSON.stringify(x)===JSON.stringify(state))){toast('这套已经在收藏里啦 ♡');return}if(saved.length>=30){toast('收藏已满 30 套，请先删除一套');return}saved.push({...state});const ok=persist();render();if(ok)toast('心动搭配已收藏 ♡')};
function switchPanel(value){
 if(value){const missing=[...new Set(saved.map(look=>look.dress).filter(id=>id&&!DollAssets[id]&&HeritageOutfits.some(item=>item.id===id)))];if(missing.length){toast('正在打开收藏…');return Promise.all(missing.map(ensureOutfit)).then(()=>switchPanel(true)).catch(()=>toast('部分收藏加载失败，请重试'))}}
 savedView=value;$('#closetNav').classList.toggle('active',!value);$('#savedNav').classList.toggle('active',value);renderItems()
}
$('#closetNav').onclick=()=>switchPanel(false);$('#savedNav').onclick=()=>switchPanel(true);
$('#download').onclick=()=>{const content=`<rect width="300" height="650" rx="20" fill="${sceneColors[state.scene]||sceneColors[0]}"/><path d="M30 560 V160 A120 120 0 0 1 270 160 V560Z" fill="#ffffff33" stroke="#d2adaf"/><g transform="translate(0 10)">${Art.doll(state)}</g><text x="150" y="623" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="14" fill="#906b79">My little wardrobe</text>`;const blob=new Blob([Art.svg(content,'0 0 300 650')],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const image=new Image();image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1950;canvas.getContext('2d').drawImage(image,0,0,900,1950);canvas.toBlob(b=>{if(!b){toast('图片生成失败，请重试');return}const downloadUrl=URL.createObjectURL(b);const a=document.createElement('a');a.href=downloadUrl;a.download='我的心动穿搭.png';a.click();setTimeout(()=>URL.revokeObjectURL(downloadUrl),3000);toast('穿搭图片已生成，查看浏览器下载')},'image/png')}catch{toast('当前浏览器不支持导出，请使用 Chrome 或 Edge')}finally{URL.revokeObjectURL(url)}};image.onerror=()=>{URL.revokeObjectURL(url);toast('图片生成失败，请重试')};image.src=url};
render();
