/* Scrawl: handwriting glyph capture + math/chem-aware handwritten page layout. Runs entirely in the browser. */
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const CHARS=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',...'.,:;!?\'"()[]{}-+=/*&%$#@_<>|',...'×÷±√∫∑∞≈≠≤≥→⇌°·∂∇πθαβγδΔλμσωΩ'];
const VARS=[...'aeiounrstldhcmpgy0123456789'],CELLS=[...CHARS,...VARS];
const G=96,BASE=.727;                 // glyph canvas size and baseline fraction (matches the template)
const glyphs={};                      // ch -> {cv, x0, x1, own}
const store={get(k){try{return JSON.parse(localStorage.getItem('scrawl_'+k))}catch(e){return null}},set(k,v){try{localStorage.setItem('scrawl_'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- glyph helpers ---------- */
function inkBounds(cv){const x=cv.getContext('2d'),d=x.getImageData(0,0,G,G).data;let x0=G,x1=-1,n=0;for(let i=0;i<G;i++)for(let j=0;j<G;j++){if(d[(j*G+i)*4+3]>60){n++;if(i<x0)x0=i;if(i>x1)x1=i}}return n<8?null:{x0:x0/G,x1:(x1+1)/G}}
function makeSample(ch){const cv=document.createElement('canvas');cv.width=cv.height=G;const x=cv.getContext('2d');x.fillStyle='#000';x.textBaseline='alphabetic';
  const mathy=/[×÷±√∫∑∞≈≠≤≥→⇌°·∂∇πθαβγδΔλμσωΩ]/.test(ch);x.font=mathy?'italic 48px "Caveat", Georgia, serif':'60px "Caveat", cursive';x.textAlign='center';x.fillText(ch,G/2,G*BASE);const b=inkBounds(cv)||{x0:.4,x1:.6};return {cv,...b,own:false}}
function loadSample(){CHARS.forEach(c=>{if(!glyphs[c]||!glyphs[c].own)glyphs[c]=makeSample(c)})}
function setOwn(ch,cv,alt){const b=inkBounds(cv);if(!b)return false;const g={cv,...b,own:true};if(alt){if(!glyphs[ch]||!glyphs[ch].own)glyphs[ch]=g;else (glyphs[ch].alts=glyphs[ch].alts||[]).push(g)}else{const alts=(glyphs[ch]&&glyphs[ch].own&&glyphs[ch].alts)||[];glyphs[ch]={...g,alts}}return true}
function saveOwn(){const o={};Object.entries(glyphs).forEach(([c,g])=>{if(g.own)o[c]=[g.cv,...(g.alts||[]).map(a=>a.cv)].map(v=>v.toDataURL())});store.set('glyphs',o)}
async function loadOwn(){const o=store.get('glyphs')||{};for(const [c,list] of Object.entries(o)){const arr=Array.isArray(list)?list:[list];for(let k=0;k<arr.length;k++){await new Promise(r=>{const im=new Image();im.onload=()=>{const cv=document.createElement('canvas');cv.width=cv.height=G;cv.getContext('2d').drawImage(im,0,0);setOwn(c,cv,k>0);r()};im.onerror=r;im.src=arr[k]})}}}

/* ---------- gallery ---------- */
function drawGallery(){const own=CHARS.filter(c=>glyphs[c]&&glyphs[c].own).length;$('#covTxt').textContent=`${own} of ${CHARS.length} characters are in your handwriting`;$('#covBar').style.width=(own/CHARS.length*100)+'%';
  $('#gall').innerHTML='';CHARS.forEach(c=>{const d=document.createElement('div');d.className='g'+(glyphs[c].own?' custom':'');d.title='Click to draw '+c;const cv=document.createElement('canvas');cv.width=cv.height=G;const x=cv.getContext('2d');x.strokeStyle='#cfe0ff';x.beginPath();x.moveTo(0,G*BASE);x.lineTo(G,G*BASE);x.stroke();x.drawImage(glyphs[c].cv,0,0);d.appendChild(cv);const s=document.createElement('small');s.textContent=c;d.appendChild(s);d.onclick=()=>openPad([c]);$('#gall').appendChild(d)})}

/* ---------- draw pad ---------- */
let padQueue=[],padIdx=0;const pad=$('#pad'),px=pad.getContext('2d');let drawing=false,last=null,dirty=false;
function padReset(){px.clearRect(0,0,400,400);px.fillStyle='#fff';px.fillRect(0,0,400,400);px.strokeStyle='#9cc0ff';px.lineWidth=2;px.beginPath();px.moveTo(0,400*BASE);px.lineTo(400,400*BASE);px.stroke();px.setLineDash([6,8]);px.strokeStyle='#d8e5ff';px.beginPath();px.moveTo(0,400*(BASE-.36));px.lineTo(400,400*(BASE-.36));px.stroke();px.setLineDash([]);dirty=false}
function openPad(list){padQueue=list;padIdx=0;$('#modal').classList.add('on');showPad()}
function showPad(){if(padIdx>=padQueue.length){$('#modal').classList.remove('on');saveOwn();drawGallery();renderAll();return}$('#mChar').textContent=padQueue[padIdx];padReset()}
const pp=e=>{const r=pad.getBoundingClientRect();return [(e.clientX-r.left)/r.width*400,(e.clientY-r.top)/r.height*400]};
pad.addEventListener('pointerdown',e=>{drawing=true;last=pp(e);pad.setPointerCapture(e.pointerId);px.fillStyle='#000';px.beginPath();px.arc(last[0],last[1],5,0,7);px.fill()});
pad.addEventListener('pointermove',e=>{if(!drawing)return;const p=pp(e);px.strokeStyle='#000';px.lineWidth=10;px.lineCap='round';px.lineJoin='round';px.beginPath();px.moveTo(...last);px.lineTo(...p);px.stroke();last=p;dirty=true});
pad.addEventListener('pointerup',()=>drawing=false);
$('#mClear').onclick=padReset;$('#mSkip').onclick=()=>{padIdx++;showPad()};
$('#mSave').onclick=()=>{if(dirty){const cv=document.createElement('canvas');cv.width=cv.height=G;const x=cv.getContext('2d');const tmp=document.createElement('canvas');tmp.width=tmp.height=400;const tx=tmp.getContext('2d');const d=px.getImageData(0,0,400,400);
  for(let i=0;i<d.data.length;i+=4){const l=(d.data[i]+d.data[i+1]+d.data[i+2])/3;const a=l<90?255:0;d.data[i]=d.data[i+1]=d.data[i+2]=0;d.data[i+3]=a}tx.putImageData(d,0,0);x.drawImage(tmp,0,0,G,G);setOwn(padQueue[padIdx],cv)}padIdx++;showPad()};
$('#drawA').onclick=()=>openPad([...'abcdefghijklmnopqrstuvwxyz']);
$('#resetG').onclick=()=>{store.set('glyphs',{});CHARS.forEach(c=>glyphs[c]=makeSample(c));drawGallery();renderAll()};

/* ---------- template (rendered on canvas, wrapped in a PDF) ---------- */
const PT=150/72,TW=612,TH=792,MK=[[36,36],[576,36],[36,756],[576,756]],GX=64,GY=100,CW=44,COLS=11;
function cellRect(i){return [GX+(i%COLS)*CW,GY+Math.floor(i/COLS)*CW,CW,CW]}
function templateCanvas(){const cv=document.createElement('canvas');cv.width=TW*PT;cv.height=TH*PT;const x=cv.getContext('2d');x.scale(PT,PT);x.fillStyle='#fff';x.fillRect(0,0,TW,TH);
  x.fillStyle='#000';MK.forEach(([a,b])=>x.fillRect(a-9,b-9,18,18));
  x.fillStyle='#222';x.font='600 13px Manrope, sans-serif';x.fillText('Scrawl handwriting template',GX,64);x.font='10px Manrope, sans-serif';x.fillStyle='#555';x.fillText('Use a dark pen. Write each character sitting on the blue line. Keep the four black squares visible in your photo.',GX,80);
  CELLS.forEach((c,i)=>{const [cx,cy]=cellRect(i);x.strokeStyle='#8cbfff';x.lineWidth=.6;x.strokeRect(cx,cy,CW,CW);x.strokeStyle='#a9d0ff';x.beginPath();x.moveTo(cx+4,cy+3.2+BASE*(CW-6.4));x.lineTo(cx+CW-4,cy+3.2+BASE*(CW-6.4));x.stroke();x.fillStyle='#8cbfff';x.font='7px "Helvetica", sans-serif';x.fillText(c+(i>=CHARS.length?'²':''),cx+3,cy+8)});
  x.fillStyle='#999';x.font='8px Manrope, sans-serif';x.fillText('scrawl · '+CELLS.length+' boxes · the last row(s) are second versions of common letters, so your writing varies',GX,GY+Math.ceil(CELLS.length/COLS)*CW+16);return cv}
$('#tplBtn').onclick=async()=>{const cv=templateCanvas();const doc=await PDFLib.PDFDocument.create();const pg=doc.addPage([TW,TH]);const png=await doc.embedPng(cv.toDataURL('image/png'));pg.drawImage(png,{x:0,y:0,width:TW,height:TH});download(new Blob([await doc.save()],{type:'application/pdf'}),'scrawl-template.pdf')};
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}

/* ---------- photo → glyphs ---------- */
function homography(src,dst){const A=[],b=[];for(let i=0;i<4;i++){const [x,y]=src[i],[u,v]=dst[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}
  for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];[b[c],b[p]]=[b[p],b[c]];for(let r=c+1;r<8;r++){const f=A[r][c]/A[c][c];for(let k=c;k<8;k++)A[r][k]-=f*A[c][k];b[r]-=f*b[c]}}
  const h=new Array(8);for(let r=7;r>=0;r--){let s=b[r];for(let k=r+1;k<8;k++)s-=A[r][k]*h[k];h[r]=s/A[r][r]}return (x,y)=>{const w=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w]}}
async function processPhoto(file){const st=$('#photoSt');st.className='status';st.textContent='Reading your photo…';
  const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=URL.createObjectURL(file)});
  const sc=Math.min(1,2200/Math.max(img.width,img.height)),W=Math.round(img.width*sc),H=Math.round(img.height*sc);const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);const D=x.getImageData(0,0,W,H).data;
  const lum=(i)=>.299*D[i]+.587*D[i+1]+.114*D[i+2];
  // marker search on a small dark mask
  const s2=Math.min(1,700/Math.max(W,H)),w=Math.round(W*s2),h=Math.round(H*s2);const m=new Uint8Array(w*h);let tot=0;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(Math.floor(j/s2)*W+Math.floor(i/s2))*4;tot+=lum(k)}const mean=tot/(w*h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(Math.floor(j/s2)*W+Math.floor(i/s2))*4;m[j*w+i]=lum(k)<mean*.45?1:0}
  const seen=new Uint8Array(w*h),blobs=[];for(let p=0;p<w*h;p++){if(!m[p]||seen[p])continue;const q=[p];seen[p]=1;let n=0,sx=0,sy=0,x0=w,x1=0,y0=h,y1=0;while(q.length){const c=q.pop(),cx=c%w,cy=(c/w)|0;n++;sx+=cx;sy+=cy;if(cx<x0)x0=cx;if(cx>x1)x1=cx;if(cy<y0)y0=cy;if(cy>y1)y1=cy;for(const d of [1,-1,w,-w]){const nb=c+d;if(nb>=0&&nb<w*h&&!seen[nb]&&m[nb]&&Math.abs((nb%w)-cx)<=1){seen[nb]=1;q.push(nb)}}}
    const bw=x1-x0+1,bh=y1-y0+1;if(n>20&&bw/bh>.55&&bw/bh<1.8&&n/(bw*bh)>.55)blobs.push({x:sx/n/s2,y:sy/n/s2,n})}
  const corners=[[0,0],[W,0],[0,H],[W,H]].map(([cx,cy])=>{let best=null,bs=-1;blobs.forEach(b=>{const d=Math.hypot(b.x-cx,b.y-cy)/Math.hypot(W,H);if(d<.42){const score=b.n*(1-d)**4;if(score>bs){bs=score;best=b}}});return best});
  if(corners.some(c=>!c)||new Set(corners).size<4){st.className='status err';st.textContent='Couldn’t find all four black corner squares. Retake the photo with the whole page in view, flat and well lit.';return}
  const H2=homography(MK,corners.map(c=>[c.x,c.y]));let got=0;
  CELLS.forEach((c,i)=>{const [cx,cy]=cellRect(i),ins=3.2,span=CW-2*ins;const L=new Float32Array(G*G),B=new Float32Array(G*G);
    for(let gy=0;gy<G;gy++)for(let gx=0;gx<G;gx++){const [u,v]=H2(cx+ins+(gx+.5)/G*span,cy+ins+(gy+.5)/G*span);const iu=Math.max(0,Math.min(W-1,Math.round(u))),iv=Math.max(0,Math.min(H-1,Math.round(v)));const k=(iv*W+iu)*4;L[gy*G+gx]=lum(k);B[gy*G+gx]=D[k+2]-D[k]}
    const sorted=Array.from(L).sort((a,b)=>a-b),bg=sorted[Math.floor(G*G*.9)];const g=document.createElement('canvas');g.width=g.height=G;const gx2=g.getContext('2d');const id=gx2.createImageData(G,G);let ink=0;
    for(let p=0;p<G*G;p++){let a=(bg*.74-L[p])/(bg*.3);if(B[p]>55&&L[p]>bg*.55)a=0;a=Math.max(0,Math.min(1,a));const yy=(p/G)|0,xx=p%G;if(yy<17&&xx<26)a=0;/* printed label */id.data[p*4+3]=a*255;if(a>.3)ink++}
    gx2.putImageData(id,0,0);if(ink>25&&setOwn(c,g,i>=CHARS.length))got++});
  saveOwn();drawGallery();renderAll();st.className='status ok';st.textContent=`Done! Read ${got} handwritten boxes. Any empty boxes use the sample style.`}
function bindDrop(el,inp,fn){el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over')});el.addEventListener('dragleave',()=>el.classList.remove('over'));el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('over');const f=e.dataTransfer.files[0];if(f)fn(f)});inp.onchange=()=>inp.files[0]&&fn(inp.files[0])}
bindDrop($('#photoDrop'),$('#photoIn'),f=>processPhoto(f).catch(()=>{$('#photoSt').className='status err';$('#photoSt').textContent='That image couldn’t be read. Try a JPG or PNG.'}));

/* ---------- PDF → text ---------- */
async function readPdf(file){const st=$('#pdfSt');st.className='status';st.textContent='Reading PDF…';
  try{const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let out=[];
    for(let p=1;p<=pdf.numPages;p++){const tc=await (await pdf.getPage(p)).getTextContent();const lines=[];tc.items.forEach(it=>{if(!it.str||!it.str.trim())return;const y=it.transform[5],x=it.transform[4],hgt=Math.abs(it.transform[3])||10;let L=lines.find(l=>Math.abs(l.y-y)<hgt*.45);if(!L){L={y,h:hgt,items:[]};lines.push(L)}L.items.push({x,s:it.str,w:it.width||0,h:hgt})});
      lines.sort((a,b)=>b.y-a.y);let prev=null;lines.forEach(L=>{L.items.sort((a,b)=>a.x-b.x);let s='',end=null,chunks=[''];L.items.forEach(it=>{if(end!==null&&it.x-end>it.h*1.6){chunks.push('')}else if(end!==null&&it.x-end>it.h*.18&&!chunks[chunks.length-1].endsWith(' '))chunks[chunks.length-1]+=' ';chunks[chunks.length-1]+=it.s;if(end!==null&&it.x-end>it.h*.18&&!s.endsWith(' '))s+=' ';s+=it.s;end=it.x+it.w});chunks=chunks.map(c=>c.replace(/\s+/g,' ').trim()).filter(Boolean);s=chunks.length>=3?'| '+chunks.join(' | ')+' |':s.replace(/\s+/g,' ').trim();if(!s)return;if(prev&&prev.tbl&&!s.startsWith('|'))out.push('');L.tbl=s.startsWith('|');if(L.tbl&&prev&&!prev.tbl)out.push('');
        if(prev&&prev.y-L.y>L.h*1.9)out.push('');out.push(s);prev=L});out.push('')}
    // pad short table rows (e.g. a header with an empty first cell) so columns line up
    for(let i=0;i<out.length;i++){if(!out[i].startsWith('|'))continue;let j=i;while(j<out.length&&out[j].startsWith('|'))j++;const rows=out.slice(i,j).map(r=>r.slice(1,-1).split('|').map(t=>t.trim()));const nc=Math.max(...rows.map(r=>r.length));rows.forEach((r,k)=>{while(r.length<nc)r.unshift('');out[i+k]='| '+r.join(' | ')+' |'});i=j}
    const text=out.join('\n').replace(/\n{3,}/g,'\n\n').trim();if(!text){st.className='status err';st.textContent='No text found. This PDF looks scanned (it’s an image), so paste the text instead.';return}
    $('#txt').value=text;st.className='status ok';st.textContent=`Loaded ${pdf.numPages} page${pdf.numPages>1?'s':''}. You can edit the text below.`;renderAll()}catch(e){st.className='status err';st.textContent='Couldn’t open that PDF.'}}
bindDrop($('#pdfDrop'),$('#pdfIn'),readPdf);

/* ---------- math / chemistry parsing into boxes ---------- */
const CMD={alpha:'α',beta:'β',gamma:'γ',delta:'δ',Delta:'Δ',theta:'θ',pi:'π',lambda:'λ',mu:'μ',sigma:'σ',omega:'ω',Omega:'Ω',epsilon:'ε',rho:'ρ',phi:'φ',tau:'τ',eta:'η',kappa:'κ',nu:'ν',
  int:'∫',sum:'∑',infty:'∞',partial:'∂',nabla:'∇',pm:'±',times:'×',cdot:'·',div:'÷',leq:'≤',le:'≤',geq:'≥',ge:'≥',neq:'≠',ne:'≠',approx:'≈',to:'→',rightarrow:'→',rightleftharpoons:'⇌',degree:'°',circ:'°',ldots:'…',cdots:'…',left:'',right:'',quad:' ',',':' ',';':' '};
const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','ⁿ':'n'},SUB={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-'};
function chem(s){return s.replace(/<=>|<->/g,'\\rightleftharpoons ').replace(/->/g,'\\to ').replace(/([A-Za-z\)\]])(\d+)/g,'$1_{$2}').replace(/\^(\d*[+-])/g,'^{$1}')}
function prep(t){t=t.replace(/[−–]/g,'-').replace(/[’‘]/g,"'").replace(/[“”]/g,'"');t=t.replace(/\\ce\{((?:[^{}]|\{[^{}]*\})*)\}/g,(_,c)=>'$'+chem(c)+'$');
  t=t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]+/g,m=>'^{'+[...m].map(c=>SUP[c]).join('')+'}').replace(/[₀₁₂₃₄₅₆₇₈₉₊₋]+/g,m=>'_{'+[...m].map(c=>SUB[c]).join('')+'}');return t}
// Box: {w,asc,desc,draw(ctx,x,y)}
function parse(src,math,F,ink,rnd,m){let i=0;const out=[];
  const glyphBox=(ch,sc=1)=>{if(ch&&ch!==' '&&!glyphs[ch])glyphs[ch]=makeSample(ch);const g0=glyphs[ch];const vi=g0&&g0.alts&&g0.alts.length?Math.floor(rnd()*(g0.alts.length+1)):0;const g=vi?g0.alts[vi-1]:g0;if(ch===' '||!g)return {w:F*(ch===' '?.36:.5)*sc,asc:F*.7*sc,desc:F*.2*sc,draw(){}};const Hg=F*1.42*sc,wink=(g.x1-g.x0)*Hg,big=/[∫∑]/.test(ch)?1.35:1;const jr=(rnd()-.5)*m*.09,js=1+(rnd()-.5)*m*.1,jy=(rnd()-.5)*m*.06*F,jx=(rnd()-.3)*m*.05*F;
    return {w:Math.max(wink*big,F*.12)+F*(.07+m*.02)+jx,asc:Hg*BASE*big,desc:Hg*(1-BASE)*big,draw(c,x,y){const cv=tinted(ch,ink,vi);c.save();c.translate(x+wink*big/2,y+jy);c.rotate(jr);c.scale(js*big,js*big);c.drawImage(cv,-g.x0*Hg-wink/2,-Hg*BASE,Hg,Hg);c.restore()}}};
  const hbox=list=>{let w=0,asc=0,desc=0;list.forEach(b=>{w+=b.w;asc=Math.max(asc,b.asc);desc=Math.max(desc,b.desc)});return {w,asc,desc,draw(c,x,y){let xx=x;list.forEach(b=>{b.draw(c,xx,y);xx+=b.w})}}};
  const group=(sc)=>{if(src[i]==='{'){let d=0,j=i;for(;j<src.length;j++){if(src[j]==='{')d++;else if(src[j]==='}'){d--;if(!d)break}}const inner=src.slice(i+1,j);i=j+1;return hbox(parse(inner,true,F*sc,ink,rnd,m))}if(src[i]==='\\'){const mm=src.slice(i).match(/^\\([A-Za-z]+)/);if(mm){i+=mm[0].length;return glyphBox(CMD[mm[1]]||mm[1],sc)}}const ch=[...src.slice(i)][0]||'';i+=ch.length;return glyphBox(ch,sc)};
  const line=(c,x1,y1,x2,y2,wd)=>{c.strokeStyle=ink;c.lineWidth=wd;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);const mx=(x1+x2)/2+(rnd()-.5)*2,my=(y1+y2)/2+(rnd()-.5)*m*3;c.quadraticCurveTo(mx,my,x2,y2);c.stroke()};
  while(i<src.length){const ch=[...src.slice(i)][0];
    if(ch==='$'){i++;continue}
    if(math&&(ch==='^'||ch==='_')){i++;const sc=.62;const b=group(sc);const up=ch==='^';out.push({w:b.w+F*.03,asc:up?b.asc+F*.42:Math.max(0,b.asc-F*.25),desc:up?0:b.desc+F*.25,draw(c,x,y){b.draw(c,x,y+(up?-F*.42:F*.25))}});continue}
    if(ch==='\\'){const mm=src.slice(i).match(/^\\([A-Za-z]+|.)/);i+=mm[0].length;const nm=mm[1];
      if(nm==='frac'){const n=group(.78),d=group(.78),w=Math.max(n.w,d.w)+F*.24,ax=F*.32,wd=Math.max(1.6,F*.06);out.push({w:w+F*.1,asc:ax+F*.12+n.asc+n.desc,desc:Math.max(F*.2,d.asc+d.desc+F*.12-ax),draw(c,x,y){const by=y-ax;line(c,x+F*.04,by,x+w,by+(rnd()-.5)*m*3,wd);n.draw(c,x+(w-n.w)/2+F*.04,by-F*.12-n.desc);d.draw(c,x+(w-d.w)/2+F*.04,by+F*.12+d.asc)}});continue}
      if(nm==='sqrt'){const b=group(1),wd=Math.max(1.6,F*.06);out.push({w:b.w+F*.62,asc:b.asc+F*.22,desc:Math.max(b.desc,F*.15),draw(c,x,y){c.strokeStyle=ink;c.lineWidth=wd;c.lineCap=c.lineJoin='round';const top=y-b.asc-F*.14;c.beginPath();c.moveTo(x+F*.04,y-F*.3);c.lineTo(x+F*.16,y-F*.38);c.lineTo(x+F*.3,y+b.desc*.6);c.lineTo(x+F*.48,top);c.lineTo(x+F*.54+b.w,top+(rnd()-.5)*m*3);c.stroke();b.draw(c,x+F*.52,y)}});continue}
      if(nm==='text'||nm==='mathrm'||nm==='mathbf'){out.push(group(1));continue}
      const u=CMD[nm];if(u!==undefined){[...u].forEach(cc=>out.push(glyphBox(cc)));continue}
      [...nm].forEach(cc=>out.push(glyphBox(cc)));continue}
    if(math&&(ch==='{'||ch==='}')){i++;continue}
    i+=ch.length;out.push(glyphBox(math&&ch==='*'?'·':ch))}
  return out}
const tintCache={};function tinted(ch,ink,vi=0){const k=ch+ink+vi;if(tintCache[k])return tintCache[k];const g=vi?glyphs[ch].alts[vi-1]:glyphs[ch];const cv=document.createElement('canvas');cv.width=cv.height=G;const x=cv.getContext('2d');x.drawImage(g.cv,0,0);x.globalCompositeOperation='source-in';x.fillStyle=ink;x.fillRect(0,0,G,G);return tintCache[k]=cv}
function clearTint(){for(const k in tintCache)delete tintCache[k]}

/* ---------- page layout ---------- */
const PW=1275,PH=1650;
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function paperBg(c,paper,rule){c.fillStyle='#fffefa';c.fillRect(0,0,PW,PH);if(paper==='lined'){c.strokeStyle='#bcd3f5';c.lineWidth=2;for(let y=150;y<PH-60;y+=rule){c.beginPath();c.moveTo(0,y);c.lineTo(PW,y);c.stroke()}c.strokeStyle='#f0a3a3';c.lineWidth=2.5;c.beginPath();c.moveTo(140,0);c.lineTo(140,PH);c.stroke()}
  if(paper==='graph'){for(let x=0;x<PW;x+=rule/2){c.strokeStyle=(x/(rule/2))%5===0?'#c3d9c3':'#e1ece1';c.lineWidth=1.4;c.beginPath();c.moveTo(x,0);c.lineTo(x,PH);c.stroke()}for(let y=0;y<PH;y+=rule/2){c.strokeStyle=(y/(rule/2))%5===0?'#c3d9c3':'#e1ece1';c.beginPath();c.moveTo(0,y);c.lineTo(PW,y);c.stroke()}}}
function layout(text,opt){const F=opt.size,rule=Math.round(F*1.95),m=opt.mess,rnd=rng(12345);const pages=[];let c=null,y=0;const L=165,R=PW-95,top=150,bottom=PH-110;
  const newPage=()=>{const cv=document.createElement('canvas');cv.width=PW;cv.height=PH;c=cv.getContext('2d');paperBg(c,opt.paper,rule);pages.push(cv);y=top};
  newPage();y=top-rule;
  const paras=prep(text).split(/\n\s*\n/);
  for(const para of paras){if(/^\s*---\s*$/.test(para)){newPage();y=top-rule;continue}
    const linesSrc=para.split('\n');
    const tbl=linesSrc.filter(l=>/^\s*\|/.test(l));
    if(tbl.length&&tbl.length===linesSrc.length){y=drawTable(tbl,y);continue}
    for(const ls of linesSrc){// split into words, keeping $…$ math together
      const words=[];let cur='',inM=false;for(const ch of ls){if(ch==='$')inM=!inM;if(ch===' '&&!inM){if(cur)words.push(cur);cur=''}else cur+=ch}if(cur)words.push(cur);
      const boxes=words.map(wd=>{const parts=[];let s=wd,isM=false,buf='';for(const ch of s){if(ch==='$'){if(buf)parts.push([buf,isM]);buf='';isM=!isM}else buf+=ch}if(buf)parts.push([buf,isM]);let list=[];parts.forEach(([t,mm])=>list=list.concat(parse(t,mm||/[\^_]\{/.test(t),F,opt.ink,rnd,m)));let w=0,asc=F*.7,desc=F*.25;list.forEach(b=>{w+=b.w;asc=Math.max(asc,b.asc);desc=Math.max(desc,b.desc)});return {w,asc,desc,list}});
      let line=[],lw=0;const flush=()=>{if(!line.length)return;const asc=Math.max(...line.map(b=>b.asc)),desc=Math.max(...line.map(b=>b.desc));let need=Math.max(rule,asc+F*.15);let ny=y+Math.ceil(need/rule)*rule;if(ny+desc>bottom){newPage();ny=top+Math.ceil(Math.max(0,asc-rule*.9)/rule)*rule}y=ny+Math.ceil(Math.max(0,desc-rule*.55)/rule)*rule*0;
        const slope=(rnd()-.5)*m*.012,x0=L+(rnd()-.3)*m*10;let x=x0;line.forEach(b=>{const yy=y+(x-L)*slope;let xx=x;b.list.forEach(g=>{g.draw(c,xx,yy);xx+=g.w});x+=b.w+F*(.38+(rnd()-.5)*m*.15)});if(desc>rule*.6)y+=Math.ceil((desc-rule*.4)/rule)*rule;line=[];lw=0};
      boxes.forEach(b=>{const sp=F*.38;if(lw&&lw+sp+b.w>R-L)flush();lw+=(lw?sp:0)+b.w;line.push(b)});flush()}
    y+=rule*.0+rule}
  function drawTable(rows,y0){rows=rows.filter(r=>!/^\s*\|?\s*:?-{2,}/.test(r)).map(r=>r.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(t=>t.trim()));const nc=Math.max(...rows.map(r=>r.length));
    const cells=rows.map(r=>Array.from({length:nc},(_,j)=>{const t=r[j]||'';const list=parse(t,/[\\^_]/.test(t),F*.92,opt.ink,rnd,m);let w=0,asc=F*.6,desc=F*.2;list.forEach(b=>{w+=b.w;asc=Math.max(asc,b.asc);desc=Math.max(desc,b.desc)});return {list,w,asc,desc}}));
    const pad=F*.45,cw=Array.from({length:nc},(_,j)=>Math.max(F*1.6,...cells.map(r=>r[j].w))+pad*2);const total=cw.reduce((a,b)=>a+b,0),sc=Math.min(1,(R-L)/total);for(let j=0;j<nc;j++)cw[j]*=sc;
    const rh=cells.map(r=>Math.max(rule,Math.ceil((Math.max(...r.map(c=>c.asc+c.desc))+pad*1.4)/rule)*rule));const th=rh.reduce((a,b)=>a+b,0);
    let top0=y0+rule*.55;if(top0+th>bottom){newPage();top0=top-rule*.45}
    const wob=(x1,y1,x2,y2)=>{c.strokeStyle=opt.ink;c.lineWidth=Math.max(2,F*.07);c.lineCap='round';c.beginPath();c.moveTo(x1+(rnd()-.5)*m*4,y1+(rnd()-.5)*m*4);c.quadraticCurveTo((x1+x2)/2+(rnd()-.5)*m*5,(y1+y2)/2+(rnd()-.5)*m*5,x2+(rnd()-.5)*m*4,y2+(rnd()-.5)*m*4);c.stroke()};
    const x0=L+F*.2,W=cw.reduce((a,b)=>a+b,0);let yy=top0;wob(x0,yy,x0+W,yy);rh.forEach((h,i)=>{yy+=h;wob(x0,yy,x0+W,yy)});let xx=x0;wob(xx,top0,xx,top0+th);cw.forEach(w=>{xx+=w;wob(xx,top0,xx,top0+th)});
    yy=top0;cells.forEach((r,i)=>{let xx=x0;r.forEach((cell,j)=>{const by=yy+rh[i]/2+(cell.asc-cell.desc)/2;let cx=xx+(cw[j]-cell.w*sc)/2;c.save();c.translate(cx,by);c.scale(sc,sc);let gx=0;cell.list.forEach(g=>{g.draw(c,gx,0);gx+=g.w});c.restore();xx+=cw[j]});yy+=rh[i]});
    return top0+th+rule*.35}
  return pages}
let pagesCv=[];const opt={paper:'lined',ink:'#1d2f7a',size:30,mess:.45};
function renderAll(){if(!$('#s3').classList.contains('on'))return;clearTint();pagesCv=layout($('#txt').value||' ',opt);const box=$('#pages');box.innerHTML='';pagesCv.forEach(p=>box.appendChild(p));$('#pgInfo').textContent=`${pagesCv.length} page${pagesCv.length>1?'s':''} · Letter size`}
let rt;const later=()=>{clearTimeout(rt);rt=setTimeout(renderAll,180)};
$$('#paper button').forEach(b=>b.onclick=()=>{$$('#paper button').forEach(z=>z.classList.toggle('on',z===b));opt.paper=b.dataset.v;renderAll()});
$$('#ink .sw').forEach(b=>b.onclick=()=>{$$('#ink .sw').forEach(z=>z.classList.toggle('on',z===b));opt.ink=b.dataset.v;renderAll()});
$('#sz').oninput=e=>{opt.size=+e.target.value;$('#szV').textContent=opt.size<27?'small':opt.size<35?'medium':'large';later()};
$('#ms').oninput=e=>{opt.mess=+e.target.value/100;$('#msV').textContent=opt.mess<.2?'neat':opt.mess<.6?'natural':'rushed';later()};
$('#txt').oninput=later;
$('#pdfBtn').onclick=async()=>{const doc=await PDFLib.PDFDocument.create();for(const p of pagesCv){const pg=doc.addPage([612,792]);const im=await doc.embedJpg(p.toDataURL('image/jpeg',.92));pg.drawImage(im,{x:0,y:0,width:612,height:792})}download(new Blob([await doc.save()],{type:'application/pdf'}),'scrawl-handwritten.pdf')};
$('#pngBtn').onclick=()=>pagesCv.forEach((p,i)=>setTimeout(()=>p.toBlob(b=>download(b,`scrawl-page-${i+1}.png`)),i*400));

/* ---------- steps ---------- */
function go(n){$$('.stepbar button').forEach(b=>{const s=+b.dataset.s;b.classList.toggle('on',s===n);b.classList.toggle('done',s<n)});$$('.step').forEach(s=>s.classList.toggle('on',s.id==='s'+n));if(n===3)renderAll()}
$$('.stepbar button').forEach(b=>b.onclick=()=>go(+b.dataset.s));$$('[data-go]').forEach(b=>b.onclick=()=>{go(+b.dataset.go);$('#app').scrollIntoView({behavior:'smooth'})});

/* ---------- hero demo ---------- */
function hero(){const cv=$('#heroCv'),r=cv.getBoundingClientRect();if(!r.width)return;const d=2;cv.width=r.width*d;cv.height=r.height*d;const c=cv.getContext('2d');const F=15*d,rnd=rng(7);const txt='The ideal gas law states that $PV = nRT$. For water, \\ce{H2O}, the molar mass is 18.02 g/mol, and $\\Delta G = \\Delta H - T\\Delta S$.';
  const words=prep(txt).match(/\$[^$]*\$|[^\s$]+/g)||[];let x=cv.width*.16,y=26*d+18*d,ln=26*d;words.forEach(w=>{const list=parse(w,w.startsWith('$'),F,'#1d2f7a',rnd,.45);const W=list.reduce((a,b)=>a+b.w,0);if(x+W>cv.width*.92){x=cv.width*.16;y+=ln}let xx=x;list.forEach(b=>{b.draw(c,xx,y);xx+=b.w});x+=W+F*.38})}

/* ---------- init ---------- */
$('#txt').value=`Thermodynamics Review: The First Law

For a closed system, $Q - W = \\Delta U$. Boundary work at constant pressure is $W = P(V_2 - V_1)$, and for an ideal gas $PV = mRT$ with $R = 0.287$ kJ/kg·K.

The Carnot efficiency is $\\eta = 1 - \\frac{T_L}{T_H}$, and an isentropic compression gives $T_2 = T_1 (P_2/P_1)^{(k-1)/k}$.

Chemistry check: \\ce{CH4 + 2O2 -> CO2 + 2H2O} releases about 890 kJ/mol, and \\ce{N2 + 3H2 <=> 2NH3} is the Haber process.

Calculus: $\\int_0^\\pi \\sin x \\, dx = 2$ and the period of a pendulum is $T = 2\\pi \\sqrt{L/g}$.

ICE table for \\ce{HA <=> H^+ + A^-} with $K_a = 1.8\\times10^{-5}$:

|   | HA | H^+ | A^- |
| I | 0.10 | 0 | 0 |
| C | -x | +x | +x |
| E | 0.10 - x | x | x |

$\\frac{x^2}{0.10 - x} = 1.8\\times10^{-5}$, so $x = 1.3\\times10^{-3}$ M and pH = 2.87`;
(async()=>{try{await document.fonts.load('60px "Caveat"')}catch(e){}loadSample();await loadOwn();drawGallery();hero()})();
addEventListener('resize',()=>{clearTimeout(window._h);window._h=setTimeout(hero,200)});
window.__scrawl={templateCanvas,glyphs,CHARS,CELLS,cellRect,processPhoto,go};
})();
