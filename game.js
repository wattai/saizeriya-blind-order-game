const $=id=>document.getElementById(id);
const TIME=15000,ROUNDS=10,LIVES=3,RING=339.3;
// 3秒ごとに番号が1桁ずつ見えてくる。見えている桁が少ないほど倍率が高い
const REVEAL_EVERY=3000,HINT_MULT=[3,2,1.4,.8,.4];
const EMOJI={
  2101:"🍛",1202:"🥗",1401:"🍗",2203:"🍕",2402:"🍗",1307:"🧅",2301:"🍝",2406:"🍖",1403:"🥬",2303:"🌶️",
  3206:"🍮",3906:"🍮",5101:"🥤",5102:"🧃",5103:"🥤",1410:"🦪",2407:"🍖",2204:"🍄",1305:"🥣",1302:"🎃",
  1405:"🐌",2328:"🦑",1425:"🫛",2305:"🍝",2304:"🍅",1402:"🍢",1452:"🍢",3201:"🍰",3901:"🍰",
  3401:"🍷",3402:"🥂",3413:"🍾",3412:"🍷",3414:"🍷",3415:"🥂",3416:"🍷",3419:"🍷"
};
// 料理のイラスト（いらすとや）。無いものは絵文字
const IMG={
  2101:"gratin",1202:"salad",1425:"salad",1401:"chicken",2402:"chicken",2203:"pizza",2204:"pizza",
  1307:"onion_soup",1305:"minestrone",2301:"pasta_tarako",2305:"pasta_carbonara",2304:"pasta_tomato",
  2406:"hamburg",2407:"hamburg",3206:"pudding",3906:"pudding",5101:"drinkbar",5102:"drinkbar",5103:"drinkbar",
  3401:"wine",3402:"wine",3413:"wine",3412:"wine",3414:"wine",3415:"wine",3416:"wine",3419:"wine"
};
let MENU=[],meta={},s,timer,cur,t0,locked=true;

const yen=n=>"¥"+n.toLocaleString("ja-JP");
const label=m=>m.name+(m.variant?`（${m.variant}）`:"");
function show(id){["title","game","result","ranking"].forEach(x=>$(x).classList.toggle("hide",x!==id));$("note").classList.toggle("hide",id==="game")}
function best(){try{return +localStorage.getItem("saize-best")||0}catch(e){return 0}}
function setBest(v){try{localStorage.setItem("saize-best",v)}catch(e){}}
function restart(el,cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls)}
const pic=m=>m.img?`<img src="img/${m.img}.webp" alt="">`:m.e;
const pick=a=>a[Math.random()*a.length|0];
// 店員さんの表情とセリフ
function face(name,el=$("face")){el.src=`img/staff_${name}.webp`;restart(el.parentNode,"talk")}
function say(html,cls=""){const t=$("toast");t.className="toast bubble "+cls;t.innerHTML=html}
$("best").textContent=best();

// ---- メニュー読み込み（scripts/fetch_menu.py で公式サイトから生成） ----
fetch("menu.json").then(r=>r.json()).then(d=>{
  meta=d;
  MENU=d.items.map(m=>({...m,e:EMOJI[m.code]||"🍽️",img:IMG[m.code]}));
  new Set(Object.values(IMG)).forEach(n=>{new Image().src=`img/${n}.webp`});
  ["laugh","cry","angry"].forEach(n=>{new Image().src=`img/staff_${n}.webp`});
  $("count").textContent=MENU.length+"品";
  $("note").innerHTML=`番号データ: <a href="${d.source}" target="_blank" rel="noopener">サイゼリヤ公式サイト「人気メニュー」</a>より取得（${d.fetched}）。<br>イラスト: <a href="https://www.irasutoya.com/" target="_blank" rel="noopener">いらすとや</a> ／ 店員さんボイス: <a href="https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small" target="_blank" rel="noopener">Irodori-TTS</a> によるAI合成音声<br>非公式ファンゲーム。番号は店舗・時期により異なる場合があります。`;
  $("start").disabled=false;$("start").textContent="注文をはじめる";
}).catch(()=>{$("start").textContent="メニューを読み込めませんでした"});

// ---- 演出：紙吹雪 ----
const fx=$("fx"),g=fx.getContext("2d");let parts=[],fxOn=false;
function resize(){fx.width=innerWidth*devicePixelRatio;fx.height=innerHeight*devicePixelRatio}
addEventListener("resize",resize);resize();
function burst(n=60,x=innerWidth/2,y=innerHeight*.4){
  const cols=["#18a957","#ffffff","#ef3b2d","#ffc94a"];
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=4+Math.random()*7;
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-4,r:Math.random()*6.3,vr:(Math.random()-.5)*.4,c:cols[i%4],life:90+Math.random()*40})}
  if(!fxOn){fxOn=true;requestAnimationFrame(tick)}
}
function tick(){
  const d=devicePixelRatio;g.clearRect(0,0,fx.width,fx.height);
  parts=parts.filter(p=>p.life-->0);
  for(const p of parts){p.vy+=.25;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;
    g.save();g.translate(p.x*d,p.y*d);g.rotate(p.r);g.globalAlpha=Math.min(1,p.life/30);g.fillStyle=p.c;g.fillRect(-4*d,-2.5*d,8*d,5*d);g.restore()}
  if(parts.length)requestAnimationFrame(tick);else{fxOn=false;g.clearRect(0,0,fx.width,fx.height)}
}

// ---- 入力 ----
const keyEls={};
[1,2,3,4,5,6,7,8,9,"del",0,"bell"].forEach(k=>{
  const b=document.createElement("button");
  if(k==="del"){b.className="del";b.textContent="⌫ 消す";b.setAttribute("aria-label","1文字消す")}
  else if(k==="bell"){b.className="bell";b.textContent="🔔 注文"}
  else b.textContent=k;
  b.onclick=()=>press(k);
  keyEls[k]=b;$("pad").appendChild(b);
});
let entry="",shown=[],order=[];
function renderDigits(){
  [...$("digits").children].forEach((el,i)=>{
    const hint=!entry[i]&&shown[i]&&!locked;
    el.textContent=entry[i]||(hint?cur.code[i]:"");
    el.classList.toggle("hint",!!hint);
    el.classList.toggle("cur",i===entry.length&&!locked);
  });
}
const revealed=()=>shown.filter(Boolean).length;
function points(elapsed){
  return Math.round((100+Math.max(0,TIME-elapsed)/50)*HINT_MULT[revealed()])+Math.max(0,s.combo)*50;
}
function reveal(){
  const i=order[revealed()];
  shown[i]=true;Snd.reveal();
  renderDigits();restart($("digits").children[i],"flip");
  $("hints").textContent=`ヒント ${revealed()}/4`;
  if(revealed()===1){say("ヒント、出しちゃいますね♪");if(Math.random()<.5)Snd.voice("hint")}
  if(revealed()===4)say("もう全部見えてますよ〜！");
}
function press(k){
  if(locked)return;
  if(k==="del"){entry=entry.slice(0,-1);Snd.key()}
  else if(k==="bell")return submit();
  else if(entry.length<4){entry+=k;Snd.key();restart($("digits").children[entry.length-1],"fill")}
  renderDigits();
}
document.addEventListener("keydown",e=>{
  if($("game").classList.contains("hide"))return;
  const k=/^\d$/.test(e.key)?+e.key:e.key==="Backspace"?"del":e.key==="Enter"?"bell":null;
  if(k===null)return;
  e.preventDefault();press(k);
  const el=keyEls[k];el.classList.add("press");setTimeout(()=>el.classList.remove("press"),90);
});

// ---- 進行 ----
function start(){
  s={r:0,score:0,lives:LIVES,ok:0,combo:0,bill:[]};
  show("game");Snd.bgm(true);Snd.voice("start");next();
}
function next(){
  if(s.r>=ROUNDS||s.lives<=0)return end();
  s.r++;locked=false;entry="";
  cur={...MENU[Math.random()*MENU.length|0],q:1+(Math.random()*3|0)};
  shown=[false,false,false,false];
  order=[0,1,2,3].sort(()=>Math.random()-.5);
  $("hints").textContent="ノーヒント";
  $("dish").textContent=cur.name;
  $("variant").textContent=cur.variant;
  $("qty").textContent=cur.q;
  $("price").textContent=yen(cur.price);
  restart($("ticket"),"in");
  $("plate").textContent="🍽️";$("plate").classList.remove("arrive");
  $("digits").className="digits";
  face("smile");
  if(s.r===1)say("ご注文は<b>番号</b>でおねがいしまーす！");
  else{say("ご注文、どうぞ〜♪");if(Math.random()<.35)Snd.voice("order")}
  renderDigits();hud();
  t0=Date.now();
  let lastSec=99;
  clearInterval(timer);
  timer=setInterval(()=>{
    const el=Date.now()-t0,left=Math.max(0,TIME-el),r=left/TIME;
    while(revealed()<Math.min(4,el/REVEAL_EVERY|0))reveal();
    $("pts").textContent="+"+points(el);
    $("ring").style.strokeDashoffset=RING*(1-r);
    $("ring").style.stroke=r>.5?"var(--green)":r>.2?"var(--gold)":"var(--red)";
    // 残り時間が減るほどBGMが速くなる
    Snd.tempo(1+(1-r)*.8);
    const sec=Math.ceil(left/1000);
    if(sec<=3&&sec>0&&sec<lastSec)Snd.tick();
    if(sec===3&&lastSec>3){Snd.voice("hurry");say("お急ぎくださ〜い！")}
    lastSec=sec;
    if(left<=0){clearInterval(timer);judge(null)}
  },50);
}
function hud(){
  $("round").textContent=`${s.r}/${ROUNDS}`;
  $("score").textContent=s.score;
  $("lives").textContent="❤️".repeat(s.lives)+"🖤".repeat(LIVES-s.lives);
  $("combo").textContent=s.combo>1?`${s.combo} COMBO`:"";
}
function submit(){
  if(entry.length<4){restart($("digits"),"shake");return}
  clearInterval(timer);Snd.bell();judge(entry);
}
function deliver(m,q){$("plate").innerHTML=m?pic(m):"❓";restart($("plate"),"arrive");if(m)s.bill.push({m,q,ok:m.code===cur.code})}
function judge(v){
  locked=true;renderDigits();
  Snd.tempo(1);
  if(v===cur.code){
    const pts=points(Date.now()-t0);
    s.combo++;s.ok++;
    s.score+=pts;
    Snd.ok();deliver(cur,cur.q);
    face("laugh");Snd.voice(s.combo>=2?"combo":pick(["ok1","ok2","ok3"]),.7);
    $("digits").className="digits ok";
    say(`正解！ ${label(cur)}が${cur.q}つ届きました <b>+${pts}</b>`,"ok");
    setTimeout(()=>burst(),450);
  }else{
    s.lives--;s.combo=0;
    const got=v&&MENU.find(m=>m.code===v);
    if(v===null){Snd.timeout();deliver(null);face("angry");Snd.voice("timeout",.4)}
    else if(got){Snd.ng();deliver(got,cur.q);face("cry");Snd.voice(pick(["ng1","ng2"]),.7)}
    else{Snd.huh();deliver(null);face("cry");Snd.voice("huh",.7)}
    entry=v||"";renderDigits();
    $("digits").className="digits ng";restart($("digits"),"shake");
    say(v===null?`お客様〜？ 時間切れです。正解は <b>${cur.code}</b>`
      :got?`${v}は「${label(got)}」ですよ〜！ 正解は <b>${cur.code}</b>`
      :`${v}…？ そんな番号ないです…。正解は <b>${cur.code}</b>`,"ng");
  }
  hud();
  setTimeout(next,2200);
}
function end(){
  clearInterval(timer);
  show("result");
  Snd.bgm(false);
  const good=s.ok>=7;
  if(good){Snd.fanfare();setTimeout(()=>{burst(90,innerWidth*.25,innerHeight*.3);burst(90,innerWidth*.75,innerHeight*.3)},300)}else Snd.sad();
  Snd.voice(good?"great":"bye",good?1.3:2.7);
  face(good?"laugh":s.ok>=4?"smile":"cry",$("r-face"));
  const rank=s.ok>=ROUNDS?"サイゼ番号マスター 🏆":s.ok>=7?"常連のお客様 🍷":s.ok>=4?"ドリンクバー民 🥤":s.ok>=1?"初来店の学生 🎒":"ただの迷子 🍅";
  $("rank").textContent=rank;
  const total=s.bill.reduce((a,b)=>a+b.m.price*b.q,0);
  const miss=s.bill.filter(b=>!b.ok).length;
  $("r-items").innerHTML=s.bill.length?s.bill.map(b=>
    `<li class="${b.ok?"":"miss"}"><span class="c">${b.m.code}</span><span><span class="e">${pic(b.m)}</span> ${label(b.m)} ×${b.q}${b.ok?"":"（誤）"}</span><span>${yen(b.m.price*b.q)}</span></li>`).join("")
    :`<li class="none"><span></span><span>何も届きませんでした</span><span></span></li>`;
  $("r-total").textContent=yen(total);
  $("r-ok").textContent=`${s.ok} / ${s.r}`;
  $("r-score").textContent=s.score;
  $("r-date").textContent=new Date().toLocaleString("ja-JP");
  $("r-msg").textContent=miss?`頼んでいない料理が${miss}品届きました。おいしく召し上がれ。`:s.ok?"完璧なご注文、ありがとうございました。":"またのご来店をお待ちしております。";
  const nb=s.score>best();
  if(nb){setBest(s.score);$("r-score").textContent+=" NEW!"}
  $("best").textContent=best();
  s.total=total;
  $("entry").classList.remove("done");$("entry-btn").disabled=false;$("entry-msg").textContent="";
}
function share(){
  const text=`サイゼの注文番号をノーヒントで書いたら ${s.ok}/${s.r}問正解、スコア${s.score}点、お会計${yen(s.total)}でした。「${$("rank").textContent}」 #サイゼ注文番号ノーヒント`;
  const url=location.href.split("#")[0];
  if(navigator.share)navigator.share({text,url}).catch(()=>{});
  else open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,"_blank","noopener");
}

$("start").onclick=start;
$("host").onclick=()=>{Snd.voice("welcome");face("smile",$("host").querySelector("img"))};
document.addEventListener("pointerdown",()=>Snd.warm(),{once:true});
$("again").onclick=start;
$("share").onclick=share;

// ---- ランキング ----
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
let backTo="title",period="all",mine=null;
function savedName(){try{return localStorage.getItem("saize-name")||""}catch(e){return""}}
$("rank-title").textContent=Rank.remote?"全国ランキング":"この端末のランキング";
$("entry-label").textContent=Rank.remote?"全国ランキングに登録":"ランキングに登録（この端末）";
function openRanking(from){backTo=from;show("ranking");loadBoard()}
async function loadBoard(){
  document.querySelectorAll(".tab").forEach(t=>{const on=t.dataset.period===period;t.classList.toggle("on",on);t.setAttribute("aria-selected",on)});
  const b=$("board");b.innerHTML=`<li class="empty">読み込み中…</li>`;
  try{
    const rows=await Rank.list(period);
    let marked=false;
    b.innerHTML=rows.length?rows.map((r,i)=>{
      const me=!marked&&mine&&r.name===mine.name&&r.score===mine.score&&(marked=true);
      return `<li class="${me?"me":""}"><span class="no">${["🥇","🥈","🥉"][i]||i+1}</span>`+
        `<span class="who">${esc(r.name)}<small>${r.correct}/10問正解 ・ ${new Date(r.created_at).toLocaleDateString("ja-JP")}</small></span>`+
        `<span class="pt">${r.score}</span></li>`}).join("")
      :`<li class="empty">まだ誰も注文していません</li>`;
  }catch(e){b.innerHTML=`<li class="empty">ランキングを読み込めませんでした</li>`}
}
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{period=t.dataset.period;loadBoard()});
$("to-rank").onclick=()=>openRanking("title");
$("r-rank").onclick=()=>openRanking("result");
$("rank-back").onclick=()=>show(backTo);
$("name").value=savedName();
$("entry").onsubmit=async e=>{
  e.preventDefault();
  const name=$("name").value.trim();
  if(!name||s.submitted)return;
  try{localStorage.setItem("saize-name",name)}catch(err){}
  s.submitted=true;$("entry-btn").disabled=true;$("entry-msg").textContent="登録中…";
  try{
    const {rank}=await Rank.submit({name,score:s.score,correct:s.ok,bill:s.total});
    mine={name,score:s.score};
    $("entry").classList.add("done");
    $("entry-msg").innerHTML=rank?`${esc(name)} さんは ${Rank.remote?"全国":""} <b>${rank}</b> 位です！`:"登録しました！";
  }catch(err){
    s.submitted=false;$("entry-btn").disabled=false;
    $("entry-msg").textContent="登録できませんでした。時間をおいて試してください。";
  }
};
$("mute").textContent=Snd.muted?"🔇":"🔊";
$("mute").onclick=e=>{$("mute").textContent=Snd.toggle()?"🔇":"🔊";e.currentTarget.blur()};
