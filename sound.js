// 音（Web Audio で全部合成。音声ファイルなし）
const Snd=(()=>{
  let ctx,master,muted=false,bgmOn=false,step=0,nextT=0,tempo=1,loop;
  try{muted=localStorage.getItem("saize-mute")==="1"}catch(e){}
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function init(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return false;
      ctx=new AC();master=ctx.createGain();master.connect(ctx.destination);
      master.gain.value=muted?0:.5;
    }
    if(ctx.state==="suspended")ctx.resume();
    return true;
  }
  function tone(f,t,d,{type="square",vol=.2,to=null}={}){
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);
    if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g).connect(master);o.start(t);o.stop(t+d+.02);
  }
  function noise(t,d,vol=.15){
    const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*d),ctx.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;
    const s=ctx.createBufferSource(),g=ctx.createGain();
    s.buffer=b;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    s.connect(g).connect(master);s.start(t);
  }
  // 6/8 のタランテラ風（イ短調）。0 は休符
  const MEL=[69,76,76,76,74,72, 71,72,74,72,71,69, 68,71,76,76,74,71, 69,72,71,69,64,64,
             72,76,79,79,77,76, 74,77,76,74,72,71, 72,69,71,72,71,68, 69,0,69,69,0,0];
  const BASS=[45,45,40,45,48,50,40,45];
  function sched(){
    const len=60/150/2/tempo;
    while(nextT<ctx.currentTime+.15){
      const i=step%MEL.length,m=MEL[i],b=BASS[(i/6|0)%8];
      if(m)tone(hz(m),nextT,len*.9,{vol:.07});
      if(i%3===0)tone(hz(b+(i%6?7:0)),nextT,len*1.8,{type:"triangle",vol:.18});
      if(i%6===0)tone(150,nextT,.1,{type:"sine",vol:.25,to:50});
      if(i%6===3)noise(nextT,.05,.06);
      nextT+=len;step++;
    }
  }
  const S={
    get muted(){return muted},
    toggle(){
      muted=!muted;
      try{localStorage.setItem("saize-mute",muted?"1":"0")}catch(e){}
      if(init())master.gain.setTargetAtTime(muted?0:.5,ctx.currentTime,.02);
      return muted;
    },
    bgm(on){
      if(!init())return;
      clearInterval(loop);bgmOn=on;
      if(on){step=0;tempo=1;nextT=ctx.currentTime+.05;loop=setInterval(sched,40);sched()}
    },
    tempo(x){tempo=x},
    key(){if(init())tone(1200,ctx.currentTime,.05,{vol:.1})},
    // 呼び出しベル「ピンポーン」
    bell(){if(!init())return;const t=ctx.currentTime;
      tone(1318,t,.35,{type:"sine",vol:.3});tone(1046,t+.25,.7,{type:"sine",vol:.3})},
    ok(){if(!init())return;const t=ctx.currentTime+.5;
      [72,76,79,84].forEach((m,i)=>tone(hz(m),t+i*.08,.25,{type:"triangle",vol:.25}))},
    ng(){if(!init())return;const t=ctx.currentTime+.5;
      tone(180,t,.22,{type:"sawtooth",vol:.2});tone(140,t+.28,.4,{type:"sawtooth",vol:.2})},
    // 存在しない番号：店員さん困惑のびよよーん
    huh(){if(!init())return;const t=ctx.currentTime+.5;
      const o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain();
      o.frequency.setValueAtTime(500,t);o.frequency.linearRampToValueAtTime(200,t+.8);
      l.frequency.value=12;lg.gain.value=40;l.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(.2,t);g.gain.linearRampToValueAtTime(0,t+.8);
      o.connect(g).connect(master);o.start(t);l.start(t);o.stop(t+.85);l.stop(t+.85)},
    timeout(){if(!init())return;const t=ctx.currentTime;
      tone(hz(64),t,1.2,{type:"sine",vol:.3});tone(hz(76),t,1.2,{type:"sine",vol:.1})},
    tick(){if(init())tone(2000,ctx.currentTime,.03,{type:"square",vol:.08})},
    fanfare(){if(!init())return;const t=ctx.currentTime;
      [[72,0],[72,.12],[72,.24],[76,.36],[79,.6],[84,.84]].forEach(([m,d],i)=>
        tone(hz(m),t+d,i===5?1:.2,{vol:.15}))},
    // しょんぼりトロンボーン
    sad(){if(!init())return;const t=ctx.currentTime;
      [63,62,61].forEach((m,i)=>tone(hz(m),t+i*.45,.4,{type:"sawtooth",vol:.15}));
      const o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain();
      o.type="sawtooth";o.frequency.value=hz(60);l.frequency.value=6;lg.gain.value=6;
      l.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(.15,t+1.35);g.gain.linearRampToValueAtTime(0,t+2.6);
      o.connect(g).connect(master);o.start(t+1.35);l.start(t+1.35);o.stop(t+2.6);l.stop(t+2.6)}
  };
  return S;
})();
