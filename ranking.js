// ランキング：config.js に Supabase の設定があれば全国、無ければこの端末内に保存する
const Rank=(()=>{
  const cfg=window.RANKING||{},remote=!!(cfg.url&&cfg.anonKey),LIMIT=20,KEY="saize-ranking";
  const base=(cfg.url||"").replace(/\/+$/,"")+"/rest/v1/scores";
  function headers(extra={}){
    const h={apikey:cfg.anonKey,"Content-Type":"application/json",...extra};
    // 旧形式の anon キー（JWT）は Authorization にも載せる
    if(/^eyJ/.test(cfg.anonKey))h.Authorization="Bearer "+cfg.anonKey;
    return h;
  }
  // 「今日」は日本時間の0時から
  function todayStart(){
    const jst=new Date(Date.now()+9*36e5);jst.setUTCHours(0,0,0,0);
    return new Date(jst.getTime()-9*36e5).toISOString();
  }
  function local(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}}
  function saveLocal(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}

  async function list(period="all"){
    if(!remote){
      const t=Date.parse(todayStart());
      return local().filter(e=>period==="all"||Date.parse(e.created_at)>=t).slice(0,LIMIT);
    }
    let q=`${base}?select=name,score,correct,created_at&order=score.desc,created_at.asc&limit=${LIMIT}`;
    if(period==="today")q+=`&created_at=gte.${encodeURIComponent(todayStart())}`;
    const r=await fetch(q,{headers:headers()});
    if(!r.ok)throw new Error("ranking "+r.status);
    return r.json();
  }
  // 登録して全期間での順位を返す
  async function submit({name,score,correct,bill}){
    const row={name:name.trim().slice(0,12),score,correct,bill};
    if(!remote){
      const a=local();a.push({...row,created_at:new Date().toISOString()});
      a.sort((x,y)=>y.score-x.score||Date.parse(x.created_at)-Date.parse(y.created_at));
      saveLocal(a.slice(0,100));
      return {rank:a.filter(e=>e.score>score).length+1};
    }
    const r=await fetch(base,{method:"POST",headers:headers({Prefer:"return=minimal"}),body:JSON.stringify(row)});
    if(!r.ok)throw new Error("submit "+r.status);
    const c=await fetch(`${base}?select=id&score=gt.${score}`,{headers:headers({Prefer:"count=exact",Range:"0-0"})});
    const total=+(c.headers.get("content-range")||"").split("/")[1];
    return {rank:Number.isFinite(total)?total+1:null};
  }
  return {remote,list,submit,LIMIT};
})();
