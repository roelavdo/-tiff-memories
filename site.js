/* Shared helpers for the People pages */
(function(){
  var S=window.Site={};
  S.esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  S.slugOf=function(n){return String(n||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")};
  S.names=function(m){var p=m.people;var a=Array.isArray(p)?p:String(p||"").split(/[,;\n]+/);return a.map(function(x){return String(x).trim()}).filter(Boolean)};
  S.isVideo=function(u){return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u)};
  S.pics=function(m){var a=Array.isArray(m.photos)?m.photos:[];if(!a.length&&typeof m.photo==="string"&&m.photo)a=[m.photo];return a.filter(function(u){return typeof u==="string"&&u})};
  S.newer=function(a,b){var ca=a.createdAt||0,cb=b.createdAt||0;if(ca!==cb)return cb-ca;return (a.date||"")<(b.date||"")?1:(a.date||"")>(b.date||"")?-1:0};
  S.getJson=function(u){return fetch(u,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("http "+r.status);return r.json()})};
  S.load=function(){
    return Promise.all([
      S.getJson("/api/memories").catch(function(){return []}),
      S.getJson("/memories.json").catch(function(){return []}),
      S.getJson("/api/people").catch(function(){return []})
    ]).then(function(r){
      function ok(a){return (Array.isArray(a)?a:[]).filter(function(m){return m&&(m.title||m.name)})}
      var fromApi=ok(r[0]).map(function(m,i){m.id=String(m.id||"a"+i);return m});
      var fromFile=ok(r[1]).map(function(m,i){m.id="f"+i;return m});
      return {memories:fromApi.concat(fromFile).sort(S.newer),people:ok(r[2])};
    });
  };
  /* profiles made in the portal, plus anyone who is only tagged in a memory */
  S.buildPeople=function(memories,people){
    var map={},alias={},order=[];
    people.forEach(function(p){
      var k=p.slug||S.slugOf(p.name);if(!k)return;
      map[k]={id:p.id,slug:k,name:p.name,bio:p.bio||"",socials:p.socials||[],banner:p.banner||"",profile:true,mems:[]};
      alias[k]=k;alias[S.slugOf(p.name)]=k;order.push(k);
    });
    var extra=[];
    memories.forEach(function(m){S.names(m).forEach(function(n){
      var s=S.slugOf(n);if(!s)return;
      var k=alias[s]||s;
      if(!map[k]){map[k]={slug:k,name:n,bio:"",socials:[],banner:"",profile:false,mems:[]};extra.push(k)}
      if(map[k].mems.indexOf(m)<0)map[k].mems.push(m);
    })});
    extra.sort(function(a,b){return map[b].mems.length-map[a].mems.length||(map[a].name<map[b].name?-1:1)});
    return order.concat(extra).map(function(k){return map[k]});
  };
  S.watchVideos=function(root){
    var still=matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(still||!("IntersectionObserver" in window))return;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      var v=e.target;if(e.isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause()})},{threshold:0.25});
    root.querySelectorAll("video[data-autoplay]").forEach(function(v){io.observe(v)});
  };
  var $=function(s){return document.querySelector(s)};
  var y=$("#year");if(y)y.textContent=new Date().getFullYear();
  var root=document.documentElement;
  try{var t=localStorage.getItem("tiff-theme");if(t==="light"||t==="dark")root.setAttribute("data-theme",t)}catch(_){}
  var tb=$("#theme");
  if(tb)tb.addEventListener("click",function(){
    var cur=root.getAttribute("data-theme")||"light",nxt=cur==="dark"?"light":"dark";
    root.setAttribute("data-theme",nxt);try{localStorage.setItem("tiff-theme",nxt)}catch(_){}
  });
})();
