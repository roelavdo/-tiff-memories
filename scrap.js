/* Free-form personal page: a canvas of text, photos, videos, stickers and links.
   Design units: the page is 1000 units wide and scales to the screen. */
(function(){
  var FONTS=["Caveat","Permanent Marker","Special Elite","Playfair Display","Inter"];
  var EMOJI=["⭐","❤️","✨","🎞️","📌","🌸","🎀","☀️","🌙","🔥","🎶","📷","🍒","🦋","💌","✈️"];
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
      if(it.t==="sticker")el.style.fontSize=(it.w*U*.9)+"px";
    }
    function fill(el,it){
      el.className="it t-"+it.t+(it.frame&&it.frame!=="none"?" "+it.frame:"")+(sel===it.id?" sel":"");
      el.textContent="";
      if(it.t==="text")el.textContent=it.text;
      else if(it.t==="sticker")el.textContent=it.text;
      else if(it.t==="link"){var a=document.createElement("a");a.textContent=it.text||it.url;if(it.url&&!edit){a.href=it.url;a.target="_blank";a.rel="noopener noreferrer"}el.appendChild(a)}
      else if(it.t==="image"){var im=document.createElement("img");im.alt="";im.decoding="async";im.src=it.src;el.appendChild(im)}
      else if(it.t==="video"){var v=document.createElement("video");v.muted=true;v.loop=true;v.playsInline=true;v.autoplay=true;v.preload="metadata";v.src=it.src;el.appendChild(v);
        if(!edit){v.controls=true;v.style.pointerEvents="auto"}}
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
    function drag(e,it,mode){
      e.preventDefault();e.stopPropagation();
      var el=els[it.id],sx=e.clientX,sy=e.clientY,ox=it.x,oy=it.y,ow=it.w,box=el.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;
      el.setPointerCapture&&el.setPointerCapture(e.pointerId);
      function mv(ev){
        var dx=(ev.clientX-sx)/U,dy=(ev.clientY-sy)/U;
        if(mode==="mv"){it.x=Math.round(ox+dx);it.y=Math.round(oy+dy)}
        else if(mode==="rs"){it.w=Math.max(30,Math.round(ow+dx))}
        else{var a=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI+90;a=((a+540)%360)-180;if(Math.abs(a)<5)a=0;it.r=Math.round(a)}
        place(el,it);
      }
      function up(){document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",up);if(opt.onChange)opt.onChange()}
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
        el.classList.add("typing");el.contentEditable="plaintext-only";el.focus();
        function done(){el.contentEditable="false";el.classList.remove("typing");it.text=(el.innerText||"").replace(/\n+$/,"").slice(0,1500);el.removeEventListener("blur",done);if(opt.onChange)opt.onChange();repaint(it)}
        el.addEventListener("blur",done);
      });
    }
    stage.addEventListener("pointerdown",function(e){if(edit&&e.target===stage)select(null)});

    api.add=function(it){
      it=Object.assign({id:uid(),x:300,y:Math.round((window.scrollY||0)/U)+120,w:300,r:0,z:nextZ()},it);
      page.items.push(it);build(it);select(it.id);if(opt.onChange)opt.onChange();return it;
    };
    function nextZ(){return page.items.reduce(function(m,i){return Math.max(m,i.z||1)},0)+1}
    api.selected=function(){return sel?byId(sel):null};
    api.update=function(it){repaint(it);if(opt.onChange)opt.onChange()};
    api.front=function(it){it.z=nextZ();repaint(it)};
    api.back=function(it){var m=page.items.reduce(function(a,i){return Math.min(a,i.z||1)},1e9);it.z=Math.max(0,m-1);repaint(it)};
    api.remove=function(it){page.items=page.items.filter(function(i){return i!==it});api.page.items=page.items;els[it.id].remove();delete els[it.id];select(null);if(opt.onChange)opt.onChange()};
    api.dup=function(it){return api.add(Object.assign({},it,{id:uid(),x:it.x+30,y:it.y+30,z:nextZ()}))};
    api.repaintAll=function(){paintStage();page.items.forEach(function(i){place(els[i.id],i)})};
    api.paint=paintStage;
    api.deselect=function(){select(null)};
    paintStage();
    page.items.forEach(build);
    var t;window.addEventListener("resize",function(){clearTimeout(t);t=setTimeout(api.repaintAll,60)});
    api.getPage=function(){return {h:page.h,bg:page.bg,items:page.items}};
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
      (async function(){
        for(var i=0;i<files.length;i++){
          say("Uploading "+(i+1)+" of "+files.length+".");
          try{
            var u=await Ed.upload(files[i],function(n){say("Uploading video "+n+"%")});
            c.add({t:Ed.isVideoFile(files[i])?"video":"image",src:u,w:300,frame:"polaroid",x:200+i*40});
          }catch(e){say(e.message,"bad");return}
        }
        say("");
      })();
    }
    var B=function(l,fn,cls){var b=Ed.btn(l,fn,cls);return b};
    main.appendChild(B("Save",function(){
      c.deselect();say("Saving.");
      cfg.save(c.getPage(),say);
    },"pri"));
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
      openPop(box);
    }));
    main.appendChild(B("+ Link",function(){c.add({t:"link",text:"Instagram",url:"https://",size:30,color:"#222222",font:"Special Elite",w:300})}));
    main.appendChild(B("Page style",function(){
      var box=document.createElement("div");box.className="pnl";
      var col=document.createElement("input");col.type="color";col.value=c.page.bg.color;col.title="Background colour";
      col.addEventListener("input",function(){c.page.bg.color=col.value;c.page.bg.image="";c.paint()});
      var pat=document.createElement("select");["none","grid","dots","lines"].forEach(function(p){var o=document.createElement("option");o.value=p;o.textContent="Paper: "+p;pat.appendChild(o)});pat.value=c.page.bg.pattern;
      pat.addEventListener("change",function(){c.page.bg.pattern=pat.value;c.page.bg.image="";c.paint()});
      box.appendChild(col);box.appendChild(pat);
      box.appendChild(Ed.btn("Background photo",function(){file("image/png,image/jpeg,image/webp",false,async function(f){try{say("Uploading.");c.page.bg.image=await Ed.upload(f[0]);c.paint();say("")}catch(e){say(e.message,"bad")}})}));
      box.appendChild(Ed.btn("No photo",function(){c.page.bg.image="";c.paint()}));
      box.appendChild(Ed.btn("Longer",function(){c.page.h=Math.min(8000,c.page.h+300);c.paint()}));
      box.appendChild(Ed.btn("Shorter",function(){c.page.h=Math.max(600,c.page.h-300);c.paint()}));
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
      insp.appendChild(Ed.btn("Front",function(){c.front(it);if(cfg.changed)cfg.changed()}));
      insp.appendChild(Ed.btn("Back",function(){c.back(it)}));
      insp.appendChild(Ed.btn("Copy",function(){c.dup(it)}));
      insp.appendChild(Ed.btn("Delete",function(){c.remove(it)}));
    }
    document.addEventListener("keydown",function(e){
      var it=c.selected();if(!it)return;
      var tag=(document.activeElement&&document.activeElement.tagName)||"";
      if(tag==="INPUT"||tag==="SELECT"||tag==="TEXTAREA"||(document.activeElement&&document.activeElement.isContentEditable))return;
      if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();c.remove(it)}
    });
    return {inspect:inspect,bar:bar};
  };
})();
