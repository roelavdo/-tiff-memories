/* Owner-only live editor helpers. Public visitors never get a toolbar:
   it only starts when the owner password is stored in this tab, or when the URL has ?edit. */
(function(){
  var KEY="tiff-pw",pw="";
  var E=window.Editor={};
  var css=".edbar{position:fixed;z-index:60;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 14px);display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;max-width:calc(100vw - 24px);padding:8px 10px;background:var(--bg);color:var(--ink);border:1px solid var(--ink)}"+
  ".edbar button,.edbar input{font:inherit;color:inherit;background:none;border:1px solid var(--line);padding:7px 11px;cursor:pointer}"+
  ".edbar input{cursor:text;min-width:12rem}.edbar button:hover{border-color:var(--ink)}.edbar .pri{background:var(--ink);color:var(--bg);border-color:var(--ink)}"+
  ".edbar button:disabled{opacity:.5;cursor:default}.edbar .st{font-size:.8rem;color:var(--muted)}.edbar .st.bad{color:#c0392b}"+
  ".editing [contenteditable]{outline:1px dashed var(--muted);outline-offset:4px;cursor:text}.editing [contenteditable]:focus{outline:2px solid var(--ink)}"+
  ".editing .hero h1{mix-blend-mode:normal;text-shadow:0 1px 14px rgba(0,0,0,.45)}"+
  "[contenteditable][data-ph]:empty:before{content:attr(data-ph);color:var(--muted);opacity:.8}"+
  ".soced{display:flex;flex-direction:column;gap:8px}.soced .r{display:flex;gap:6px}.soced input{flex:1;min-width:0;font:inherit;color:var(--ink);background:none;border:1px solid var(--line);padding:8px}"+
  ".soced input.lab{flex:0 0 34%}.soced button{font:inherit;color:inherit;background:none;border:1px solid var(--line);padding:6px 10px;cursor:pointer}";
  var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
  E.esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  E.api=function(path,opts){
    opts=opts||{};opts.headers=Object.assign({"x-admin-password":pw},opts.headers||{});
    return fetch(path,opts).then(function(r){return r.json().catch(function(){return{}}).then(function(j){
      if(!r.ok){var e=new Error(j.error||("Something went wrong ("+r.status+")."));e.status=r.status;throw e}return j})});
  };
  /* resolves true when this tab is the verified owner */
  E.init=function(){
    try{pw=sessionStorage.getItem(KEY)||""}catch(_){}
    var want=/[?&]edit\b/.test(location.search);
    if(!pw&&want){pw=window.prompt("Owner password")||""}
    if(!pw)return Promise.resolve(false);
    return E.api("/api/login",{method:"POST"}).then(function(){try{sessionStorage.setItem(KEY,pw)}catch(_){}return true},
      function(){try{sessionStorage.removeItem(KEY)}catch(_){}pw="";return false});
  };
  E.bar=function(){var b=document.createElement("div");b.className="edbar mono";document.body.appendChild(b);return b};
  E.btn=function(label,fn,cls){var b=document.createElement("button");b.type="button";b.textContent=label;if(cls)b.className=cls;b.addEventListener("click",fn);return b};
  E.say=function(el,t,k){el.textContent=t||"";el.className="st"+(k?" "+k:"")};
  E.isVideoFile=function(f){return (f.type||"").indexOf("video/")===0||/\.(mp4|webm|mov)$/i.test(f.name||"")};
  E.prepare=async function(file){
    if(file.type==="image/gif"){if(file.size>4000000)throw new Error("That GIF is over 4 MB.");return file}
    var bmp=await createImageBitmap(file),sc=Math.min(1,2400/Math.max(bmp.width,bmp.height));
    var c=document.createElement("canvas");c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);
    c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
    var q=.88,blob;
    while(q>.4){blob=await new Promise(function(r){c.toBlob(r,"image/jpeg",q)});if(blob&&blob.size<=3800000)return blob;q-=.12}
    throw new Error("Could not make that photo small enough.");
  };
  var TYPES={mp4:"video/mp4",webm:"video/webm",mov:"video/quicktime"};
  E.upload=async function(file,onProgress){
    if(E.isVideoFile(file)){
      var m=/\.(mp4|webm|mov)$/i.exec(file.name||"");if(!m)throw new Error("Use an MP4, WebM or MOV video.");
      var ext=m[1].toLowerCase(),mod=await import("/vendor/blob-client.js");
      var base=(file.name||"video").replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"video";
      var out=await mod.uploadPresigned("videos/"+base+"."+ext,file,{access:"public",handleUploadUrl:"/api/video-token",headers:{"x-admin-password":pw},multipart:true,contentType:TYPES[ext],
        onUploadProgress:function(e){if(onProgress)onProgress(Math.round(e.percentage))}});
      return out.url;
    }
    var data=await E.prepare(file),base2=(file.name||"banner").replace(/\.[^.]+$/,"");
    var up=await E.api("/api/photo?name="+encodeURIComponent(base2),{method:"POST",headers:{"Content-Type":data.type||"image/jpeg"},body:data});
    return up.url;
  };
})();
