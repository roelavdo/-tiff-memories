/* Free-form personal page: a canvas of text, photos, videos, stickers and links.
   Design units: the page is 1000 units wide and scales to the screen. */
(function(){
  var FONTS=["Caveat","Permanent Marker","Special Elite","Playfair Display","Inter"];
  var EMOJI_OLD=["⭐","❤️","✨","🎞️","📌","🌸","🎀","☀️","🌙","🔥","🎶","📷","🍒","🦋","💌","✈️"];
  var EMOJI=("\u2B50 \u2764\uFE0F \u2728 \uD83C\uDF9E\uFE0F \uD83D\uDCCC \uD83C\uDF38 \uD83C\uDF80 \u2600\uFE0F \uD83C\uDF19 \uD83D\uDD25 \uD83C\uDFB6 \uD83D\uDCF7 \uD83C\uDF52 \uD83E\uDD8B \uD83D\uDC8C \u2708\uFE0F "+
   "\uD83D\uDC9B \uD83D\uDC9C \uD83D\uDCAB \uD83C\uDF1F \uD83C\uDF08 \uD83C\uDF40 \uD83C\uDF3B \uD83C\uDF39 \uD83C\uDF53 \uD83C\uDF4B \uD83C\uDF55 \u2615 \uD83C\uDF89 \uD83C\uDF88 \uD83C\uDF81 \uD83C\uDFB5 \uD83C\uDFA4 \uD83C\uDFAC \uD83D\uDCFA \uD83D\uDCD6 \u270F\uFE0F \uD83D\uDD8A\uFE0F \uD83D\uDCCE \uD83E\uDDF8 \uD83D\uDC3E \uD83D\uDC31 \uD83D\uDC36 \uD83C\uDFD6\uFE0F \u26F0\uFE0F \uD83C\uDFE0 \uD83D\uDE97 \uD83D\uDE80 \uD83D\uDE0E \uD83E\uDD79 \uD83E\uDD70 \uD83D\uDE02 \uD83D\uDE4C \uD83D\uDC4B").split(" ");
  var SHAPES={circle:"circle(50% at 50% 50%)",star:"polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",heart:"polygon(50% 95%,8% 50%,8% 25%,25% 8%,50% 25%,75% 8%,92% 25%,92% 50%)"};
  var PATS={
    grid:"linear-gradient(rgba(0,0,0,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.09) 1px,transparent 1px)",
    dots:"radial-gradient(rgba(0,0,0,.2) 1.5px,transparent 1.5px)",
    lines:"linear-gradient(rgba(60,90,200,.18) 1px,transparent 1px)"
  };
  var PSIZE={grid:"28px 28px",dots:"22px 22px",lines:"100% 32px"};
  var css=".stage{position:relative;width:100%;overflow:hidden;background-position:center;background-size:cover}"+
  ".stage .it{position:absolute;transform-origin:center center;box-sizing:border-box}"+
  ".stage .it img,.stage .it video{width:100%;height:auto;display:block;pointer-events:none}"+
  ".stage .it.polaroid{background:#fff;padding:3.5% 3.5% 13%;box-shadow:0 6px 18px rgba(0,0,0,.28)}"+
  ".stage .it.tape:before{content:'';position:absolute;left:50%;top:-14px;width:34%;height:26px;transform:translateX(-50%) rotate(-3deg);background:rgba(255,226,140,.78);box-shadow:0 1px 3px rgba(0,0,0,.2)}"+
  ".stage .it.t-text,.stage .it.t-link{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.15}"+
  ".stage .it.t-link a{color:inherit;text-decoration:underline}"+
  ".stage .it.t-sticker{line-height:1;text-align:center;user-select:none}"+
  ".stage.edit .it{cursor:grab;touch-action:none}.stage.edit .it.sel{outline:2px solid #1a73e8;outline-offset:3px}"+
  ".stage.edit .it.t-text.typing{cursor:text;outline:2px solid #1a73e8}"+
  ".stage .hd{position:absolute;width:18px;height:18px;background:#fff;border:2px solid #1a73e8;border-radius:3px;z-index:9999}"+
  ".stage .hd.rs{right:-12px;bottom:-12px;cursor:nwse-resize}.stage .hd.ro{left:50%;top:-34px;margin-left:-9px;border-radius:50%;cursor:grab}"+
  ".stage .gd{position:absolute;background:#e91e63;z-index:9998;pointer-events:none}"+
  "@keyframes sfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes swig{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}@keyframes spul{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}"+
  ".stage .in.a-float{animation:sfloat 3.2s ease-in-out infinite}.stage .in.a-wiggle{animation:swig 1.6s ease-in-out infinite}.stage .in.a-pulse{animation:spul 2s ease-in-out infinite}"+
  "@media (prefers-reduced-motion:reduce){.stage .in{animation:none!important}}"+
  ".stage .it.pend{opacity:.6}"+
  ".sback{position:fixed;z-index:70;top:calc(env(safe-area-inset-top,0px) + 12px);left:12px;background:#fff;color:#111;border:1px solid #111;padding:6px 10px;font:500 .78rem 'DM Mono',monospace;text-transform:uppercase;text-decoration:none}"+
  "body.scrap .bar,body.scrap .foot{display:none}"+
  ".edbar .pnl{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;width:100%}"+
  ".edbar select,.edbar input[type=color]{font:inherit;color:inherit;background:var(--bg);border:1px solid var(--line);padding:5px}.edbar input[type=color]{width:38px;height:32px;padding:2px}"+
  ".edbar .pick{display:flex;flex-wrap:wrap;gap:6px;max-width:min(92vw,640px);max-height:34vh;overflow:auto;width:100%}"+
  ".edbar .pick img{height:64px;width:auto;cursor:pointer;border:1px solid var(--line)}.edbar .pick button{font-size:1.3rem;padding:4px 8px}";
  var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

  function uid(){return "i"+Math.random().toString(36).slice(2,10)}
  function norm(pg){
    pg=pg&&typeof pg==="object"?pg:{};
    var bg=pg.bg||{};
    return {h:Number(pg.h)||1400,bg:{color:bg.color||"#f4efe6",image:bg.image||"",pattern:bg.pattern||"none"},items:(pg.items||[]).map(function(i){return Object.assign({},i)})};
  }
  function isVid(u){return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u||"")}

  window.Scrap=function(root,pageIn,opt){
    opt=opt||{};var edit=!!opt.edit,page=norm(pageIn),sel=null,els={},U=1;
    var stage=document.createElement("div");stage.className="stage"+(edit?" edit":"");root.appendChild(stage);
    var api={page:page,stage:stage};
    var hist=[],hi=-1,ct=null,draftKey=opt.draftKey||"";
    function serial(){return JSON.stringify({h:page.h,bg:page.bg,items:page.items.filter(function(i){return !i.pending}).map(function(i){var o=Object.assign({},i);delete o.pending;return o})})}
    function flush(){clearTimeout(ct);ct=null;var j=serial();if(hist[hi]===j)return;hist=hist.slice(0,hi+1);hist.push(j);if(hist.length>100)hist.shift();hi=hist.length-1;
      if(draftKey&&hist.length>1){try{localStorage.setItem(draftKey,j)}catch(_){}}}
    function changed(){clearTimeout(ct);ct=setTimeout(flush,250);if(opt.onChange)opt.onChange()}
    api.commit=changed;
    function load(j){
      var n=norm(JSON.parse(j));page.h=n.h;page.bg=n.bg;page.items=n.items;
      stage.textContent="";els={};sel=null;paintStage();page.items.forEach(build);if(opt.onSelect)opt.onSelect(null);
      if(draftKey){try{localStorage.setItem(draftKey,j)}catch(_){}}
    }
    api.undo=function(){flush();if(hi>0){hi--;load(hist[hi])}};
    api.redo=function(){flush();if(hi<hist.length-1){hi++;load(hist[hi])}};
    api.canUndo=function(){return hi>0};

    function paintStage(){
      U=stage.clientWidth/1000||1;
      stage.style.height=Math.round(page.h*U)+"px";
      stage.style.backgroundColor=page.bg.color;
      document.body.style.background=page.bg.color;
      if(page.bg.image){stage.style.backgroundImage='url("'+page.bg.image.replace(/"/g,"%22")+'")';stage.style.backgroundSize="cover";}
      else if(PATS[page.bg.pattern]){stage.style.backgroundImage=PATS[page.bg.pattern];stage.style.backgroundSize=PSIZE[page.bg.pattern];}
      else{stage.style.backgroundImage="none"}
    }
    function place(el,it){
      el.style.left=(it.x*U)+"px";el.style.top=(it.y*U)+"px";el.style.width=(it.w*U)+"px";
      el.style.transform="rotate("+(it.r||0)+"deg)";el.style.zIndex=it.z||1;
      if(it.t==="text"||it.t==="link"){el.style.fontSize=(it.size*U)+"px";el.style.color=it.color;el.style.fontFamily="'"+it.font+"',system-ui,sans-serif"}
      if(it.t==="sticker"){var n=Math.max(1,Array.from(it.text||"").length);el.style.fontSize=(it.w*U*.9/Math.max(1,Math.ceil(n*.6)))+"px"}
    }
    function fill(el,it){
      el.className="it t-"+it.t+(it.frame&&it.frame!=="none"?" "+it.frame:"")+(sel===it.id?" sel":"")+(it.pending?" pend":"");
      el.textContent="";
      var inn=document.createElement("div");inn.className="in"+(it.anim&&it.anim!=="none"?" a-"+it.anim:"");el.appendChild(inn);
      if(it.t==="text"||it.t==="sticker")inn.textContent=it.text;
      else if(it.t==="link"){var a=document.createElement("a");a.textContent=it.text||it.url;if(it.url&&!edit){a.href=it.url;a.target="_blank";a.rel="noopener noreferrer"}inn.appendChild(a)}
      else{
        var m;
        if(it.t==="image"){m=document.createElement("img");m.alt="";m.decoding="async";m.src=it.src}
        else{m=document.createElement("video");m.muted=true;m.loop=true;m.playsInline=true;m.autoplay=true;m.preload="metadata";m.src=it.src;if(!edit){m.controls=true;m.style.pointerEvents="auto"}}
        if(SHAPES[it.shape]&&(!it.frame||it.frame==="none")){m.style.aspectRatio="1/1";m.style.objectFit="cover";m.style.clipPath=SHAPES[it.shape]}
        inn.appendChild(m);
      }
    }
    function build(it){
      var el=document.createElement("div");el.dataset.id=it.id;els[it.id]=el;
      fill(el,it);place(el,it);stage.appendChild(el);
      if(edit)wire(el,it);
      return el;
    }
    function byId(id){return page.items.filter(function(i){return i.id===id})[0]}
    function repaint(it){var el=els[it.id];if(!el)return;fill(el,it);place(el,it);if(sel===it.id)handles(el,it)}
    function handles(el,it){
      [].slice.call(el.querySelectorAll(".hd")).forEach(function(h){h.remove()});
      if(sel!==it.id)return;
      var rs=document.createElement("div");rs.className="hd rs";var ro=document.createElement("div");ro.className="hd ro";
      el.appendChild(rs);el.appendChild(ro);
      rs.addEventListener("pointerdown",function(e){drag(e,it,"rs")});
      ro.addEventListener("pointerdown",function(e){drag(e,it,"ro")});
    }
    function select(id){
      var prev=sel;sel=id;
      if(prev&&els[prev]){var p=byId(prev);if(p)repaint(p)}
      if(id&&els[id]){var it=byId(id);repaint(it)}
      if(opt.onSelect)opt.onSelect(id?byId(id):null);
    }
    var guides=[];
    function clearGuides(){guides.forEach(function(g){g.remove()});guides=[]}
    function guide(v,horiz){var g=document.createElement("div");g.className="gd";
      if(horiz){g.style.left="0";g.style.right="0";g.style.height="1px";g.style.top=(v*U)+"px"}else{g.style.top="0";g.style.bottom="0";g.style.width="1px";g.style.left=(v*U)+"px"}
      stage.appendChild(g);guides.push(g)}
    function snap(it,el){
      clearGuides();var T=6,w=it.w,h=el.offsetHeight/U;
      var xs=[0,500,1000],ys=[0,page.h/2,page.h];
      page.items.forEach(function(o){if(o===it||o.pending&&false)return;var oe=els[o.id];if(!oe)return;var oh=oe.offsetHeight/U;xs.push(o.x,o.x+o.w/2,o.x+o.w);ys.push(o.y,o.y+oh/2,o.y+oh)});
      var best=null;[[it.x,0],[it.x+w/2,w/2],[it.x+w,w]].forEach(function(p){xs.forEach(function(t){var d=t-p[0];if(Math.abs(d)<=T&&(!best||Math.abs(d)<Math.abs(best.d)))best={d:d,t:t}})});
      if(best){it.x=Math.round(it.x+best.d);guide(best.t,false)}
      best=null;[[it.y,0],[it.y+h/2,h/2],[it.y+h,h]].forEach(function(p){ys.forEach(function(t){var d=t-p[0];if(Math.abs(d)<=T&&(!best||Math.abs(d)<Math.abs(best.d)))best={d:d,t:t}})});
      if(best){it.y=Math.round(it.y+best.d);guide(best.t,true)}
      place(el,it);
    }
    function drag(e,it,mode){
      e.preventDefault();e.stopPropagation();
      var el=els[it.id],sx=e.clientX,sy=e.clientY,ox=it.x,oy=it.y,ow=it.w,box=el.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;
      el.setPointerCapture&&el.setPointerCapture(e.pointerId);
      function mv(ev){
        var dx=(ev.clientX-sx)/U,dy=(ev.clientY-sy)/U;
        if(mode==="mv"){it.x=Math.round(ox+dx);it.y=Math.round(oy+dy);if(!ev.altKey)snap(it,el)}
        else if(mode==="rs"){it.w=Math.max(30,Math.round(ow+dx))}
        else{var a=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI+90;a=((a+540)%360)-180;if(Math.abs(a)<5)a=0;it.r=Math.round(a)}
        place(el,it);
      }
      function up(){document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",up);clearGuides();changed()}
      document.addEventListener("pointermove",mv);document.addEventListener("pointerup",up);
    }
    function wire(el,it){
      el.addEventListener("pointerdown",function(e){
        if(e.target.classList.contains("hd"))return;
        if(el.classList.contains("typing"))return;
        select(it.id);drag(e,it,"mv");
      });
      el.addEventListener("dblclick",function(){
        if(it.t!=="text")return;
        var inn=el.querySelector(".in");el.classList.add("typing");inn.contentEditable="plaintext-only";inn.focus();
        function done(){inn.contentEditable="false";el.classList.remove("typing");it.text=(inn.innerText||"").replace(/\n+$/,"").slice(0,1500);inn.removeEventListener("blur",done);changed();repaint(it)}
        inn.addEventListener("blur",done);
      });
    }
    stage.addEventListener("pointerdown",function(e){if(edit&&e.target===stage)select(null)});

    api.add=function(it){
      it=Object.assign({id:uid(),x:300,y:Math.round((window.scrollY||0)/U)+120,w:300,r:0,z:nextZ()},it);
      page.items.push(it);build(it);select(it.id);changed();return it;
    };
    function nextZ(){return page.items.reduce(function(m,i){return Math.max(m,i.z||1)},0)+1}
    api.selected=function(){return sel?byId(sel):null};
    api.update=function(it){repaint(it);changed()};
    api.front=function(it){it.z=nextZ();repaint(it);changed()};
    api.back=function(it){var m=page.items.reduce(function(a,i){return Math.min(a,i.z||1)},1e9);it.z=Math.max(0,m-1);repaint(it);changed()};
    api.remove=function(it){page.items=page.items.filter(function(i){return i!==it});api.page.items=page.items;els[it.id].remove();delete els[it.id];select(null);changed()};
    api.dup=function(it){return api.add(Object.assign({},it,{id:uid(),x:it.x+30,y:it.y+30,z:nextZ()}))};
    api.repaintAll=function(){paintStage();page.items.forEach(function(i){place(els[i.id],i)})};
    api.paint=paintStage;
    api.deselect=function(){select(null)};
    paintStage();
    page.items.forEach(build);
    flush();
    var t;window.addEventListener("resize",function(){clearTimeout(t);t=setTimeout(api.repaintAll,60)});
    api.getPage=function(){return JSON.parse(serial())};
    api.pending=function(){return page.items.some(function(i){return i.pending})};
    api.paintItem=repaint;api.dirty=function(){flush();return hi>0};
    return api;
  };

  /* Toolbar for the owner. cfg: {Ed, save(page), cancel(), memPhotos:[urls]} */
  window.Scrap.toolbar=function(c,cfg){
    var Ed=cfg.Ed,bar=Ed.bar(),main=document.createElement("div"),insp=document.createElement("div"),pop=document.createElement("div");
    main.className="pnl";insp.className="pnl";pop.className="pnl";pop.hidden=true;insp.hidden=true;
    bar.appendChild(pop);bar.appendChild(insp);bar.appendChild(main);
    var stEl=document.createElement("span");stEl.className="st";
    function say(t,k){Ed.say(stEl,t,k)}
    function openPop(node){pop.textContent="";pop.hidden=false;pop.appendChild(node)}
    function closePop(){pop.hidden=true;pop.textContent=""}
    function file(accept,multi,cb){
      var f=document.createElement("input");f.type="file";f.accept=accept;f.multiple=!!multi;f.hidden=true;
      f.addEventListener("change",function(){cb([].slice.call(f.files));f.remove()});bar.appendChild(f);f.click();
    }
    function addMedia(files){
      var made=files.map(function(f,i){
        var vid=Ed.isVideoFile(f);
        return {f:f,it:c.add({t:vid?"video":"image",src:URL.createObjectURL(f),pending:true,w:300,frame:"polaroid",x:200+i*40})};
      });
      (async function(){
        for(var i=0;i<made.length;i++){
          var m=made[i];say("Uploading "+(i+1)+" of "+made.length+".");
          try{
            m.it.src=await Ed.upload(m.f,function(n){say("Uploading video "+n+"%")});
            delete m.it.pending;c.paintItem(m.it);c.commit();
          }catch(e){c.remove(m.it);say(e.message,"bad");return}
        }
        say("");
      })();
    }
    var B=function(l,fn,cls){var b=Ed.btn(l,fn,cls);return b};
    main.appendChild(B("Save",function(){
      if(c.pending()){say("Wait for the uploads to finish.","bad");return}
      c.deselect();say("Saving.");
      cfg.save(c.getPage(),say);
    },"pri"));
    var un=B("Undo",function(){c.undo()}),re=B("Redo",function(){c.redo()});
    main.appendChild(un);main.appendChild(re);
    main.appendChild(B("+ Text",function(){c.add({t:"text",text:"Double-click to type",size:34,color:"#222222",font:"Caveat",w:360})}));
    main.appendChild(B("+ Photo",function(){file("image/png,image/jpeg,image/webp,image/gif",true,addMedia)}));
    main.appendChild(B("+ Video",function(){file("video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov",false,addMedia)}));
    if(cfg.memPhotos&&cfg.memPhotos.length)main.appendChild(B("From memories",function(){
      var box=document.createElement("div");box.className="pick";
      cfg.memPhotos.forEach(function(u){
        var el;if(isVid(u)){el=document.createElement("video");el.muted=true;el.preload="metadata";el.src=u+"#t=0.1";el.style.height="64px";el.style.cursor="pointer"}
        else{el=document.createElement("img");el.src=u;el.loading="lazy";el.alt=""}
        el.addEventListener("click",function(){c.add({t:isVid(u)?"video":"image",src:u,w:300,frame:"polaroid"})});box.appendChild(el);
      });
      openPop(box);
    }));
    main.appendChild(B("+ Sticker",function(){
      var box=document.createElement("div");box.className="pick";
      EMOJI.forEach(function(e){var b=Ed.btn(e,function(){c.add({t:"sticker",text:e,w:90})});box.appendChild(b)});
      box.appendChild(Ed.btn("Type your own",function(){var t=prompt("Up to 8 characters (emoji or short word)");if(t)c.add({t:"sticker",text:Array.from(t).slice(0,8).join(""),w:140})}));
      openPop(box);
    }));
    main.appendChild(B("+ Link",function(){c.add({t:"link",text:"Instagram",url:"https://",size:30,color:"#222222",font:"Special Elite",w:300})}));
    main.appendChild(B("Page style",function(){
      var box=document.createElement("div");box.className="pnl";
      var col=document.createElement("input");col.type="color";col.value=c.page.bg.color;col.title="Background colour";
      col.addEventListener("input",function(){c.page.bg.color=col.value;c.page.bg.image="";c.paint();c.commit()});
      var pat=document.createElement("select");["none","grid","dots","lines"].forEach(function(p){var o=document.createElement("option");o.value=p;o.textContent="Paper: "+p;pat.appendChild(o)});pat.value=c.page.bg.pattern;
      pat.addEventListener("change",function(){c.page.bg.pattern=pat.value;c.page.bg.image="";c.paint();c.commit()});
      box.appendChild(col);box.appendChild(pat);
      box.appendChild(Ed.btn("Background photo",function(){file("image/png,image/jpeg,image/webp",false,async function(f){try{say("Uploading.");c.page.bg.image=await Ed.upload(f[0]);c.paint();c.commit();say("")}catch(e){say(e.message,"bad")}})}));
      box.appendChild(Ed.btn("No photo",function(){c.page.bg.image="";c.paint();c.commit()}));
      box.appendChild(Ed.btn("Longer",function(){c.page.h=Math.min(8000,c.page.h+300);c.paint();c.commit()}));
      box.appendChild(Ed.btn("Shorter",function(){c.page.h=Math.max(600,c.page.h-300);c.paint();c.commit()}));
      box.appendChild(Ed.btn("Done",closePop));
      openPop(box);
    }));
    main.appendChild(B("Cancel",cfg.cancel));
    main.appendChild(stEl);

    /* inspector for the selected item */
    function inspect(it){
      insp.textContent="";closePop();
      if(!it){insp.hidden=true;return}
      insp.hidden=false;
      function chg(){c.update(it)}
      if(it.t==="text"||it.t==="link"){
        var f=document.createElement("select");FONTS.forEach(function(n){var o=document.createElement("option");o.value=n;o.textContent=n;f.appendChild(o)});f.value=it.font;
        f.addEventListener("change",function(){it.font=f.value;chg()});insp.appendChild(f);
        var col=document.createElement("input");col.type="color";col.value=it.color||"#222222";col.addEventListener("input",function(){it.color=col.value;chg()});insp.appendChild(col);
        insp.appendChild(Ed.btn("A−",function(){it.size=Math.max(8,Math.round(it.size*.9));chg()}));
        insp.appendChild(Ed.btn("A+",function(){it.size=Math.min(300,Math.round(it.size*1.1));chg()}));
      }
      if(it.t==="link"){
        var l=document.createElement("input");l.placeholder="Label";l.value=it.text||"";l.addEventListener("input",function(){it.text=l.value;chg()});
        var u=document.createElement("input");u.placeholder="https://...";u.value=it.url||"";u.addEventListener("input",function(){it.url=u.value;chg()});
        insp.appendChild(l);insp.appendChild(u);
      }
      if(it.t==="image"||it.t==="video"){
        var fr=document.createElement("select");[["polaroid","Polaroid"],["tape","Tape"],["none","No frame"]].forEach(function(p){var o=document.createElement("option");o.value=p[0];o.textContent=p[1];fr.appendChild(o)});fr.value=it.frame||"none";
        fr.addEventListener("change",function(){it.frame=fr.value;chg()});insp.appendChild(fr);
      }
      if(it.t==="image"||it.t==="video"){
        var sh=document.createElement("select");[["none","Original shape"],["circle","Circle"],["star","Star"],["heart","Heart"]].forEach(function(p){var o=document.createElement("option");o.value=p[0];o.textContent=p[1];sh.appendChild(o)});sh.value=it.shape||"none";
        sh.title="Circle, star and heart crop the photo. They work with 'No frame'.";
        sh.addEventListener("change",function(){it.shape=sh.value;if(it.shape!=="none")it.frame="none";chg();inspect(it)});insp.appendChild(sh);
      }
      var an=document.createElement("select");[["none","No motion"],["float","Float"],["wiggle","Wiggle"],["pulse","Pulse"]].forEach(function(p){var o=document.createElement("option");o.value=p[0];o.textContent=p[1];an.appendChild(o)});an.value=it.anim||"none";
      an.addEventListener("change",function(){it.anim=an.value;chg()});insp.appendChild(an);
      insp.appendChild(Ed.btn("Front",function(){c.front(it);if(cfg.changed)cfg.changed()}));
      insp.appendChild(Ed.btn("Back",function(){c.back(it)}));
      insp.appendChild(Ed.btn("Copy",function(){c.dup(it)}));
      insp.appendChild(Ed.btn("Delete",function(){c.remove(it)}));
    }
    document.addEventListener("keydown",function(e){
      var tag0=(document.activeElement&&document.activeElement.tagName)||"";
      if((e.ctrlKey||e.metaKey)&&!(tag0==="INPUT"||tag0==="TEXTAREA"||(document.activeElement&&document.activeElement.isContentEditable))){
        var k=e.key.toLowerCase();
        if(k==="z"){e.preventDefault();e.shiftKey?c.redo():c.undo();return}
        if(k==="y"){e.preventDefault();c.redo();return}
      }
      var it=c.selected();if(!it)return;
      var tag=(document.activeElement&&document.activeElement.tagName)||"";
      if(tag==="INPUT"||tag==="SELECT"||tag==="TEXTAREA"||(document.activeElement&&document.activeElement.isContentEditable))return;
      if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();c.remove(it)}
    });
    return {inspect:inspect,bar:bar};
  };
})();
