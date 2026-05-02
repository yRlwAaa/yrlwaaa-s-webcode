import{o as Ct,a as St,p as Z,b as F,f as Ht,s as B,c as Tt}from"./props.CXytkPzo.js";import{i as Bt}from"./legacy.BhMlVTjN.js";import{a as At,a5 as Ft,bl as Nt,bm as jt,e as Kt,u as Xt,bn as Ot,bo as Wt,_ as qt,bk as nt,bp as Et,d as tt,ab as pt,a6 as Ut,g as d,j as o,i as w,h as c,b as P,p as et,s as bt,f as T,ah as ot,af as $,t as R,ae as Y,ag as D,aj as gt,m as Yt,aa as Gt,bq as Jt,aq as Qt,O as mt}from"./utils.D1QHMVGK.js";import{a as Zt,s as O}from"./render.Dmh-DyMr.js";import{i as A}from"./if.CLvyT-4B.js";import{I as V}from"./Icon.BWbAL8Sn.js";import{m as ft}from"./config.Cq49oFN1.js";import{m as _}from"./musicPlayerStore.DFnj9vhx.js";import{S as $t,a as te,b as ee,c as re,d as ie,C as yt,P as ne,e as ae,N as oe}from"./SidebarTrackInfo.BIFk0uzz.js";import{I as J}from"./zh_TW.CABTBg9K.js";import{i as Q}from"./translation.C3vHy2oY.js";import{s as le}from"./snippet.DyTJ8w46.js";import{a as se}from"./actions.Bz_Kn1R_.js";import{e as ue,i as ce}from"./each.BCY_4LMD.js";const de=()=>performance.now(),U={tick:r=>requestAnimationFrame(r),now:()=>de(),tasks:new Set};function Mt(){const r=U.now();U.tasks.forEach(t=>{t.c(r)||(U.tasks.delete(t),t.f())}),U.tasks.size!==0&&U.tick(Mt)}function ge(r){let t;return U.tasks.size===0&&U.tick(Mt),{promise:new Promise(e=>{U.tasks.add(t={c:r,f:e})}),abort(){U.tasks.delete(t)}}}function dt(r,t){Et(()=>{r.dispatchEvent(new CustomEvent(t))})}function ve(r){if(r==="float")return"cssFloat";if(r==="offset")return"cssOffset";if(r.startsWith("--"))return r;const t=r.split("-");return t.length===1?t[0]:t[0]+t.slice(1).map(e=>e[0].toUpperCase()+e.slice(1)).join("")}function wt(r){const t={},e=r.split(";");for(const s of e){const[a,l]=s.split(":");if(!a||l===void 0)break;const m=ve(a.trim());t[m]=l.trim()}return t}const me=r=>r;function Lt(r,t,e,s){var a=(r&Ot)!==0,l="both",m,g=t.inert,p=t.style.overflow,i,u;function v(){return Et(()=>m??=e()(t,s?.()??{},{direction:l}))}var f={is_global:a,in(){t.inert=g,i=ht(t,v(),u,1,()=>{dt(t,"introend"),i?.abort(),i=m=void 0,t.style.overflow=p})},out(S){t.inert=!0,u=ht(t,v(),i,0,()=>{dt(t,"outroend"),S?.()})},stop:()=>{i?.abort(),u?.abort()}},b=At;if((b.nodes.t??=[]).push(f),Zt){var x=a;if(!x){for(var n=b.parent;n&&(n.f&Ft)!==0;)for(;(n=n.parent)&&(n.f&Nt)===0;);x=!n||(n.f&jt)!==0}x&&Kt(()=>{Xt(()=>f.in())})}}function ht(r,t,e,s,a){var l=s===1;if(Wt(t)){var m,g=!1;return qt(()=>{if(!g){var S=t({direction:l?"in":"out"});m=ht(r,S,e,s,a)}}),{abort:()=>{g=!0,m?.abort()},deactivate:()=>m.deactivate(),reset:()=>m.reset(),t:()=>m.t()}}if(e?.deactivate(),!t?.duration&&!t?.delay)return dt(r,l?"introstart":"outrostart"),a(),{abort:nt,deactivate:nt,reset:nt,t:()=>s};const{delay:p=0,css:i,tick:u,easing:v=me}=t;var f=[];if(l&&e===void 0&&(u&&u(0,1),i)){var b=wt(i(0,1));f.push(b,b)}var x=()=>1-s,n=r.animate(f,{duration:p,fill:"forwards"});return n.onfinish=()=>{n.cancel(),dt(r,l?"introstart":"outrostart");var S=e?.t()??1-s;e?.abort();var h=s-S,I=t.duration*Math.abs(h),C=[];if(I>0){var y=!1;if(i)for(var E=Math.ceil(I/16.666666666666668),z=0;z<=E;z+=1){var rt=S+h*v(z/E),lt=wt(i(rt,1-rt));C.push(lt),y||=lt.overflow==="hidden"}y&&(r.style.overflow="hidden"),x=()=>{var it=n.currentTime;return S+h*v(it/I)},u&&ge(()=>{if(n.playState!=="running")return!1;var it=x();return u(it,1-it),!0})}n=r.animate(C,{duration:I,fill:"forwards"}),n.onfinish=()=>{x=()=>s,u?.(s,1-s),a()}},{abort:()=>{n&&(n.cancel(),n.effect=null,n.onfinish=nt)},deactivate:()=>{a=nt},reset:()=>{s===0&&u?.(1,0)},t:()=>x()}}function fe(r){const t=r-1;return t*t*t+1}function It(r){const t=r-1;return t*t*t+1}function kt(r){const t=typeof r=="string"&&r.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);return t?[parseFloat(t[1]),t[2]||"px"]:[r,"px"]}function be(r,{delay:t=0,duration:e=400,easing:s=It,x:a=0,y:l=0,opacity:m=0}={}){const g=getComputedStyle(r),p=+g.opacity,i=g.transform==="none"?"":g.transform,u=p*(1-m),[v,f]=kt(a),[b,x]=kt(l);return{delay:t,duration:e,easing:s,css:(n,S)=>`
			transform: ${i} translate(${(1-n)*v}${f}, ${(1-n)*b}${x});
			opacity: ${p-u*S}`}}function ye(r,{delay:t=0,duration:e=400,easing:s=It,axis:a="y"}={}){const l=getComputedStyle(r),m=+l.opacity,g=a==="y"?"height":"width",p=parseFloat(l[g]),i=a==="y"?["top","bottom"]:["left","right"],u=i.map(h=>`${h[0].toUpperCase()}${h.slice(1)}`),v=parseFloat(l[`padding${u[0]}`]),f=parseFloat(l[`padding${u[1]}`]),b=parseFloat(l[`margin${u[0]}`]),x=parseFloat(l[`margin${u[1]}`]),n=parseFloat(l[`border${u[0]}Width`]),S=parseFloat(l[`border${u[1]}Width`]);return{delay:t,duration:e,easing:s,css:h=>`overflow: hidden;opacity: ${Math.min(h*20,1)*m};${g}: ${h*p}px;padding-${i[0]}: ${h*v}px;padding-${i[1]}: ${h*f}px;margin-${i[0]}: ${h*b}px;margin-${i[1]}: ${h*x}px;border-${i[0]}-width: ${h*n}px;border-${i[1]}-width: ${h*S}px;min-${g}: 0`}}var he=T('<div class="fab-music-panel card-base shadow-xl rounded-2xl p-4 w-[20rem] max-w-[80vw] svelte-1lty5dg"><div class="fab-music-header svelte-1lty5dg"><!> <!></div> <!> <!> <!></div>');function xe(r,t){tt(t,!0);let e=pt(Ut(_.getState())),s=pt(!1);function a(E){const z=E;z.detail&&bt(e,z.detail,!0)}Ct(()=>{window.addEventListener("music-sidebar:state",a)}),St(()=>{typeof window<"u"&&window.removeEventListener("music-sidebar:state",a)});function l(){_.toggle()}function m(){_.prev()}function g(){_.next()}function p(){_.toggleMode()}function i(){bt(s,!o(s))}function u(E){_.playIndex(E)}function v(E){_.seek(E)}function f(){_.toggleMute()}function b(E){_.setVolume(E)}var x=he(),n=d(x),S=d(n);$t(S,{get currentSong(){return o(e).currentSong},get isPlaying(){return o(e).isPlaying},get isLoading(){return o(e).isLoading}});var h=w(S,2);te(h,{get currentSong(){return o(e).currentSong},get currentTime(){return o(e).currentTime},get duration(){return o(e).duration},get volume(){return o(e).volume},get isMuted(){return o(e).isMuted},onToggleMute:f,onSetVolume:b}),c(n);var I=w(n,2);ee(I,{get currentTime(){return o(e).currentTime},get duration(){return o(e).duration},onSeek:v});var C=w(I,2);re(C,{get isPlaying(){return o(e).isPlaying},get isShuffled(){return o(e).isShuffled},get repeatMode(){return o(e).isRepeating},onToggleMode:p,onPrev:m,onNext:g,onTogglePlay:l,onTogglePlaylist:i});var y=w(C,2);ie(y,{get playlist(){return o(e).playlist},get currentIndex(){return o(e).currentIndex},get isPlaying(){return o(e).isPlaying},get show(){return o(s)},onClose:i,onPlaySong:u}),c(x),P(r,x),et()}var pe=T('<div class="flex-1 min-w-0"><div class="text-sm font-medium text-90 truncate"> </div> <div class="text-xs text-50 truncate"> </div></div>'),we=T('<div class="text-xs text-30 mt-1"> </div>'),ke=T('<div class="flex-1 min-w-0"><div class="song-title text-lg font-bold text-90 truncate mb-1"> </div> <div class="song-artist text-sm text-50 truncate"> </div> <!></div>');function _t(r,t){tt(t,!0);const e=Z(t,"showTime",3,!1),s=Z(t,"size",3,"mini");function a(i){if(!Number.isFinite(i)||i<0)return"0:00";const u=Math.floor(i/60),v=Math.floor(i%60);return`${u}:${v.toString().padStart(2,"0")}`}var l=ot(),m=$(l);{var g=i=>{var u=pe(),v=d(u),f=d(v,!0);c(v);var b=w(v,2),x=d(b,!0);c(b),c(u),R(()=>{O(f,t.song.title),O(x,t.song.artist)}),P(i,u)},p=i=>{var u=ke(),v=d(u),f=d(v,!0);c(v);var b=w(v,2),x=d(b,!0);c(b);var n=w(b,2);{var S=h=>{var I=we(),C=d(I);c(I),R((y,E)=>O(C,`${y??""} / ${E??""}`),[()=>a(t.currentTime),()=>a(t.duration)]),P(h,I)};A(n,h=>{e()&&h(S)})}c(u),R(()=>{O(f,t.song.title),O(x,t.song.artist)}),P(i,u)};A(m,i=>{s()==="mini"?i(g):i(p,-1)})}P(r,l),et()}var _e=T('<!> <div class="flex-1 min-w-0 cursor-pointer" role="button" tabindex="0"><!></div> <div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button> <button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button></div>',1),Pe=T('<div class="flex items-center gap-1"><button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button> <button><!></button></div>'),Ce=T("<!> <!> <!>",1),Se=T("<div><!></div>");function zt(r,t){tt(t,!0);const e=Z(t,"size",3,"mini"),s=Z(t,"showControls",3,!1),a=Z(t,"showPlaylist",3,!1);var l=Se(),m=d(l);{var g=i=>{var u=_e(),v=$(u);yt(v,{get cover(){return t.song.cover},get isPlaying(){return t.isPlaying},get isLoading(){return t.isLoading},size:"mini",interactive:!0,get onclick(){return t.onCoverClick}});var f=w(v,2),b=d(f);_t(b,{get song(){return t.song},get currentTime(){return t.currentTime},get duration(){return t.duration},size:"mini"}),c(f);var x=w(f,2),n=d(x),S=d(n);V(S,{icon:"material-symbols:visibility-off",class:"text-lg"}),c(n);var h=w(n,2),I=d(h);V(I,{icon:"material-symbols:expand-less",class:"text-lg"}),c(h),c(x),R((C,y)=>{B(f,"aria-label",C),B(n,"title",y)},[()=>Q(J.musicPlayerExpand),()=>Q(J.musicPlayerHide)]),D("click",f,function(...C){t.onInfoClick?.apply(this,C)}),D("keydown",f,C=>{(C.key==="Enter"||C.key===" ")&&(C.preventDefault(),t.onInfoClick?.())}),D("click",n,C=>{C.stopPropagation(),t.onHideClick?.()}),D("click",h,C=>{C.stopPropagation(),t.onExpandClick?.()}),P(i,u)},p=i=>{var u=Ce(),v=$(u);yt(v,{get cover(){return t.song.cover},get isPlaying(){return t.isPlaying},get isLoading(){return t.isLoading},size:"expanded"});var f=w(v,2);_t(f,{get song(){return t.song},get currentTime(){return t.currentTime},get duration(){return t.duration},showTime:!0,size:"expanded"});var b=w(f,2);{var x=n=>{var S=Pe(),h=d(S),I=d(h);V(I,{icon:"material-symbols:visibility-off",class:"text-lg"}),c(h);var C=w(h,2);let y;var E=d(C);V(E,{icon:"material-symbols:queue-music",class:"text-lg"}),c(C),c(S),R((z,rt)=>{B(h,"title",z),y=F(C,1,"btn-plain w-8 h-8 rounded-lg flex items-center justify-center",null,y,{"text-[var(--primary)]":a()}),B(C,"title",rt)},[()=>Q(J.musicPlayerHide),()=>Q(J.musicPlayerPlaylist)]),D("click",h,function(...z){t.onHideClick?.apply(this,z)}),D("click",C,function(...z){t.onPlaylistClick?.apply(this,z)}),P(n,S)};A(b,n=>{s()&&n(x)})}P(i,u)};A(m,i=>{e()==="mini"?i(g):i(p,-1)})}c(l),R(()=>F(l,1,Ht(e()==="mini"?"flex items-center gap-3 mb-0":"flex items-center gap-4 mb-4"))),P(r,l),et()}Y(["click","keydown"]);var Te=T("<div><!></div>");function Ee(r,t){var e=Te();let s;var a=d(e);zt(a,{get song(){return t.song},get currentTime(){return t.currentTime},get duration(){return t.duration},get isPlaying(){return t.isPlaying},get isLoading(){return t.isLoading},size:"mini",get onCoverClick(){return t.onCoverClick},get onInfoClick(){return t.onInfoClick},get onHideClick(){return t.onHideClick},get onExpandClick(){return t.onExpandClick}}),c(e),R(()=>s=F(e,1,"mini-player card-base shadow-xl rounded-2xl p-3 absolute bottom-0 right-0 w-[17.5rem] svelte-g9ac72",null,s,{"mini-enter":!t.isHidden,"mini-leave":t.isHidden,"pointer-events-none":t.isHidden})),P(r,e)}var Me=T("<button><!></button>"),Le=T("<button><!></button>");function Pt(r,t){const e=Z(t,"repeatMode",3,0),s=Z(t,"disabled",3,!1);var a=ot(),l=$(a);{var m=p=>{var i=Me();let u;var v=d(i);V(v,{icon:"material-symbols:shuffle",class:"text-lg"}),c(i),R(()=>{u=F(i,1,"w-10 h-10 rounded-lg",null,u,{"btn-regular":t.isActive,"btn-plain":!t.isActive}),i.disabled=s()}),D("click",i,function(...f){t.onclick?.apply(this,f)}),P(p,i)},g=p=>{var i=Le();let u;var v=d(i);{var f=n=>{V(n,{icon:"material-symbols:repeat-one",class:"text-lg"})},b=n=>{V(n,{icon:"material-symbols:repeat",class:"text-lg"})},x=n=>{V(n,{icon:"material-symbols:repeat",class:"text-lg opacity-50"})};A(v,n=>{e()===1?n(f):e()===2?n(b,1):n(x,-1)})}c(i),R(()=>u=F(i,1,"w-10 h-10 rounded-lg",null,u,{"btn-regular":t.isActive,"btn-plain":!t.isActive})),D("click",i,function(...n){t.onclick?.apply(this,n)}),P(p,i)};A(l,p=>{t.mode==="shuffle"?p(m):p(g,-1)})}P(r,a)}Y(["click"]);var Ie=T('<div class="controls flex items-center justify-center gap-2 mb-4"><!> <!> <!> <!> <!></div>');function ze(r,t){var e=Ie(),s=d(e);Pt(s,{mode:"shuffle",get isActive(){return t.isShuffled},get onclick(){return t.onShuffleClick}});var a=w(s,2);ne(a,{get onclick(){return t.onPrevClick},disabled:!1});var l=w(a,2);ae(l,{get isPlaying(){return t.isPlaying},get isLoading(){return t.isLoading},get onclick(){return t.onPlayClick}});var m=w(l,2);oe(m,{get onclick(){return t.onNextClick},disabled:!1});var g=w(m,2);{let p=gt(()=>t.isRepeating>0);Pt(g,{mode:"repeat",get isActive(){return o(p)},get repeatMode(){return t.isRepeating},get onclick(){return t.onRepeatClick}})}c(e),P(r,e)}var De=T('<div class="progress-bar flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100"><div class="h-full bg-[var(--primary)] rounded-full transition-all duration-100"></div></div>');function Re(r,t){tt(t,!0);var e=De(),s=d(e);c(e),R(a=>{B(e,"aria-label",a),B(e,"aria-valuenow",t.duration>0?t.currentTime/t.duration*100:0),Tt(s,`width: ${t.duration>0?t.currentTime/t.duration*100:0}%`)},[()=>Q(J.musicPlayerProgress)]),D("click",e,function(...a){t.onclick?.apply(this,a)}),D("keydown",e,function(...a){t.onkeydown?.apply(this,a)}),P(r,e),et()}Y(["click","keydown"]);var Ve=T('<div class="progress-section mb-4"><!></div>');function He(r,t){var e=Ve(),s=d(e);Re(s,{get currentTime(){return t.currentTime},get duration(){return t.duration},get onclick(){return t.onProgressClick},get onkeydown(){return t.onProgressKeyDown}}),c(e),P(r,e)}var Be=T('<button class="btn-plain w-8 h-8 rounded-lg"><!></button>');function Ae(r,t){var e=Be(),s=d(e);{var a=g=>{V(g,{icon:"material-symbols:volume-off",class:"text-lg"})},l=g=>{V(g,{icon:"material-symbols:volume-down",class:"text-lg"})},m=g=>{V(g,{icon:"material-symbols:volume-up",class:"text-lg"})};A(s,g=>{t.isMuted||t.volume===0?g(a):t.volume<.5?g(l,1):g(m,-1)})}c(e),D("click",e,function(...g){t.onclick?.apply(this,g)}),P(r,e)}Y(["click"]);var Fe=T('<div class="flex-1 h-2 bg-[var(--btn-regular-bg)] rounded-full cursor-pointer touch-none" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100"><div></div></div>');function Ne(r,t){var e=Fe(),s=d(e);let a;c(e),se(e,l=>t.volumeBarRef?.(l)),R(()=>{B(e,"aria-label",t.ariaLabel),B(e,"aria-valuenow",t.volume*100),a=F(s,1,"h-full bg-[var(--primary)] rounded-full transition-all",null,a,{"duration-100":!t.isVolumeDragging,"duration-0":t.isVolumeDragging}),Tt(s,`width: ${t.volume*100}%`)}),D("pointerdown",e,function(...l){t.onpointerdown?.apply(this,l)}),D("keydown",e,function(...l){t.onkeydown?.apply(this,l)}),P(r,e)}Y(["pointerdown","keydown"]);var je=T('<div class="bottom-controls flex items-center gap-2"><!> <!> <!></div>');function Ke(r,t){var e=je(),s=d(e);Ae(s,{get volume(){return t.volume},get isMuted(){return t.isMuted},get onclick(){return t.onVolumeButtonClick}});var a=w(s,2);{let m=gt(()=>t.isMuted?0:t.volume);Ne(a,{get volume(){return o(m)},get isVolumeDragging(){return t.isVolumeDragging},get volumeBarRef(){return t.volumeBarRef},get onpointerdown(){return t.onSliderPointerDown},get onkeydown(){return t.onSliderKeyDown},get ariaLabel(){return t.ariaLabel}})}var l=w(a,2);le(l,()=>t.children??nt),c(e),P(r,e)}var Xe=T('<button class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"><!></button>'),Oe=T("<div><!> <!> <!> <!></div>");function We(r,t){tt(t,!0);var e=Oe();let s;var a=d(e);zt(a,{get song(){return t.song},get currentTime(){return t.currentTime},get duration(){return t.duration},get isPlaying(){return t.isPlaying},get isLoading(){return t.isLoading},size:"expanded",showControls:!0,get showPlaylist(){return t.showPlaylist},get onHideClick(){return t.onHideClick},get onPlaylistClick(){return t.onPlaylistClick}});var l=w(a,2);He(l,{get currentTime(){return t.currentTime},get duration(){return t.duration},get onProgressClick(){return t.onProgressClick},get onProgressKeyDown(){return t.onProgressKeyDown}});var m=w(l,2);ze(m,{get isPlaying(){return t.isPlaying},get isLoading(){return t.isLoading},get isShuffled(){return t.isShuffled},get isRepeating(){return t.isRepeating},get onPlayClick(){return t.onPlayClick},get onPrevClick(){return t.onPrevClick},get onNextClick(){return t.onNextClick},get onShuffleClick(){return t.onShuffleClick},get onRepeatClick(){return t.onRepeatClick}});var g=w(m,2);{let p=gt(()=>Q(J.musicPlayerVolume));Ke(g,{get volume(){return t.volume},get isMuted(){return t.isMuted},get isVolumeDragging(){return t.isVolumeDragging},get volumeBarRef(){return t.volumeBarRef},get onVolumeButtonClick(){return t.onVolumeButtonClick},get onSliderPointerDown(){return t.onSliderPointerDown},get onSliderKeyDown(){return t.onSliderKeyDown},get ariaLabel(){return o(p)},children:(i,u)=>{var v=Xe(),f=d(v);V(f,{icon:"material-symbols:expand-more",class:"text-lg"}),c(v),R(b=>B(v,"title",b),[()=>Q(J.musicPlayerCollapse)]),D("click",v,function(...b){t.onCollapseClick?.apply(this,b)}),P(i,v)}})}c(e),R(()=>s=F(e,1,"expanded-player card-base shadow-xl rounded-2xl p-4 transition-all duration-500 ease-in-out absolute bottom-0 right-0 w-80",null,s,{"opacity-0":t.isHidden,"scale-95":t.isHidden,"pointer-events-none":t.isHidden})),P(r,e),et()}Y(["click"]);var qe=T('<span class="text-sm text-[var(--content-meta)]"> </span>'),Ue=T('<div role="button" tabindex="0"><div class="w-6 h-6 flex items-center justify-center"><!></div> <div class="w-10 h-10 rounded-lg overflow-hidden bg-[var(--btn-regular-bg)] flex-shrink-0"><img decoding="async" class="w-full h-full object-cover"/></div> <div class="flex-1 min-w-0"><div> </div> <div> </div></div></div>');function Ye(r,t){tt(t,!0);const e=Z(t,"lazy",3,!0);function s(y){return y.startsWith("http://")||y.startsWith("https://")||y.startsWith("/")?y:`/${y}`}var a=Ue();let l;var m=d(a),g=d(m);{var p=y=>{V(y,{icon:"material-symbols:graphic-eq",class:"text-[var(--primary)] animate-pulse"})},i=y=>{V(y,{icon:"material-symbols:pause",class:"text-[var(--primary)]"})},u=y=>{var E=qe(),z=d(E,!0);c(E),R(()=>O(z,t.index+1)),P(y,E)};A(g,y=>{t.isCurrent&&t.isPlaying?y(p):t.isCurrent?y(i,1):y(u,-1)})}c(m);var v=w(m,2),f=d(v);c(v);var b=w(v,2),x=d(b);let n;var S=d(x,!0);c(x);var h=w(x,2);let I;var C=d(h,!0);c(h),c(b),c(a),R(y=>{l=F(a,1,"playlist-item flex items-center gap-3 p-3 hover:bg-[var(--btn-plain-bg-hover)] cursor-pointer transition-colors",null,l,{"bg-[var(--btn-plain-bg)]":t.isCurrent,"text-[var(--primary)]":t.isCurrent}),B(a,"aria-label",`播放 ${t.song.title??""} - ${t.song.artist??""}`),B(f,"src",y),B(f,"alt",t.song.title),B(f,"loading",e()?"lazy":"eager"),n=F(x,1,"font-medium truncate",null,n,{"text-[var(--primary)]":t.isCurrent,"text-90":!t.isCurrent}),O(S,t.song.title),I=F(h,1,"text-sm text-[var(--content-meta)] truncate",null,I,{"text-[var(--primary)]":t.isCurrent}),O(C,t.song.artist)},[()=>s(t.song.cover)]),D("click",a,function(...y){t.onclick?.apply(this,y)}),D("keydown",a,y=>{(y.key==="Enter"||y.key===" ")&&(y.preventDefault(),t.onclick())}),P(r,a),et()}Y(["click","keydown"]);var Ge=T('<div class="playlist-panel card-base-transparent fixed bottom-70 right-4 w-80 max-h-96 overflow-hidden z-50 svelte-1v267om"><div class="playlist-header flex items-center justify-between p-4 border-b border-[var(--line-divider)]"><h3 class="text-lg font-semibold text-90"> </h3> <button class="btn-plain w-8 h-8 rounded-lg"><!></button></div> <div class="playlist-content overflow-y-auto max-h-80 hide-scrollbar" role="presentation"></div></div>');function Je(r,t){tt(t,!0);var e=ot(),s=$(e);{var a=l=>{var m=Ge(),g=d(m),p=d(g),i=d(p,!0);c(p);var u=w(p,2),v=d(u);V(v,{icon:"material-symbols:close",class:"text-lg"}),c(u),c(g);var f=w(g,2);ue(f,21,()=>t.playlist,ce,(b,x,n)=>{{let S=gt(()=>n===t.currentIndex);Ye(b,{get song(){return o(x)},index:n,get isCurrent(){return o(S)},get isPlaying(){return t.isPlaying},onclick:()=>t.onPlaySong(n),lazy:n!==0})}}),c(f),c(m),R(b=>O(i,b),[()=>Q(J.musicPlayerPlaylist)]),D("click",u,function(...b){t.onClose?.apply(this,b)}),Lt(3,m,()=>ye,()=>({duration:300,axis:"y"})),P(l,m)};A(s,l=>{t.show&&l(a)})}P(r,e),et()}Y(["click"]);var Qe=T('<div class="fixed bottom-20 right-4 z-[60] max-w-sm"><div class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"><!> <span class="text-sm flex-1"> </span> <button class="text-white/80 hover:text-white transition-colors"><!></button></div></div>'),Ze=T('<div class="music-player-fab-anchor fixed z-[55]"><div class="music-player-fab-shell"><!></div></div>'),$e=T("<div><div><!></div> <!> <!> <!></div>"),tr=T(`<!> <!> <style>.music-player-fab-anchor {
			right: var(--fab-group-right, 1.5rem);
			bottom: calc(
				var(--fab-group-bottom, 10rem) +
					(
						var(--fab-button-size, 3rem) *
							var(--fab-visible-count, 1)
					) +
					(
						var(--fab-group-gap, 0.5rem) *
							(var(--fab-visible-count, 1) - 1)
					)
			);
			width: 0;
			height: 0;
			pointer-events: none;
		}

		.music-player-fab-shell {
			position: absolute;
			right: 0;
			bottom: 0.75rem;
			transform-origin: bottom right;
			pointer-events: auto;
			will-change: transform, opacity;
		}

		.orb-player-container {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		.orb-enter {
			animation: orbElasticIn 460ms cubic-bezier(0.22, 1.25, 0.36, 1)
				forwards;
		}

		.orb-leave {
			animation: orbElasticOut 360ms cubic-bezier(0.4, 0, 1, 1) forwards;
		}

		@keyframes orbElasticIn {
			0% {
				opacity: 0;
				transform: translateX(0) scale(0.55);
			}
			70% {
				opacity: 1;
				transform: translateX(0) scale(1.12);
			}
			100% {
				opacity: 1;
				transform: translateX(0) scale(1);
			}
		}

		@keyframes orbElasticOut {
			0% {
				opacity: 1;
				transform: translateX(0) scale(1);
			}
			100% {
				opacity: 0;
				transform: translateX(0) scale(0.6);
			}
		}

		.music-player.hidden-mode {
			width: 3rem;
			height: 3rem;
		}

		.music-player {
			width: 20rem;
			max-width: 20rem;
			min-width: 20rem;
			user-select: none;
		}

		:global(.mini-player) {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		:global(.expanded-player) {
			position: absolute;
			bottom: 0;
			right: 0;
		}

		:global(.orb-player) {
			position: relative;
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
		}

		:global(.orb-player::before) {
			content: "";
			position: absolute;
			inset: -0.125rem;
			background: linear-gradient(
				45deg,
				var(--primary),
				transparent,
				var(--primary)
			);
			border-radius: 50%;
			z-index: -1;
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		:global(.orb-player:hover::before) {
			opacity: 0.3;
			animation: rotate 2s linear infinite;
		}

		:global(.orb-player .animate-pulse) {
			animation: musicWave 1.5s ease-in-out infinite;
		}

		@keyframes rotate {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		@keyframes musicWave {
			0%,
			100% {
				transform: scaleY(0.5);
			}
			50% {
				transform: scaleY(1);
			}
		}

		:global(.animate-pulse) {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}

		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.5;
			}
		}

		:global(.progress-section div:hover),
		:global(.bottom-controls > div:hover) {
			transform: scaleY(1.2);
			transition: transform 0.2s ease;
		}

		@media (max-width: 768px) {
			.music-player-fab-anchor {
				right: var(--fab-group-right, 0.75rem) !important;
				bottom: calc(
					var(--fab-group-bottom, 5rem) +
						(
							var(--fab-button-size, 2.75rem) *
								var(--fab-visible-count, 1)
						) +
						(
							var(--fab-group-gap, 0.5rem) *
								(var(--fab-visible-count, 1) - 1)
						)
				) !important;
			}

			.music-player-fab-shell {
				right: 0 !important;
				bottom: 0.75rem !important;
			}

			.music-player {
				width: 280px !important;
				min-width: 280px !important;
				max-width: 280px !important;
				bottom: 0.5rem !important;
				right: 0.5rem !important;
			}
			:global(.mini-player) {
				width: 280px !important;
			}
			:global(.expanded-player) {
				width: 280px !important;
				max-width: 280px !important;
			}
			.music-player.expanded {
				width: 280px !important;
				min-width: 280px !important;
				max-width: 280px !important;
				right: 0.5rem !important;
			}
			:global(.playlist-panel) {
				width: 280px !important;
				right: 0.5rem !important;
				max-width: 280px !important;
			}
			:global(.controls) {
				gap: 8px;
			}
			:global(.controls button) {
				width: 36px;
				height: 36px;
			}
			:global(.controls button:nth-child(3)) {
				width: 44px;
				height: 44px;
			}
		}

		@media (max-width: 480px) {
			.music-player-fab-anchor {
				right: var(--fab-group-right, 0.5rem) !important;
				bottom: calc(
					var(--fab-group-bottom, 4.5rem) +
						(
							var(--fab-button-size, 2.5rem) *
								var(--fab-visible-count, 1)
						) +
						(
							var(--fab-group-gap, 0.5rem) *
								(var(--fab-visible-count, 1) - 1)
						)
				) !important;
			}

			.music-player-fab-shell {
				right: 0 !important;
				bottom: 0.75rem !important;
			}

			.music-player {
				width: 260px !important;
				min-width: 260px !important;
				max-width: 260px !important;
			}
			:global(.expanded-player) {
				width: 260px !important;
				max-width: 260px !important;
			}
			:global(.playlist-panel) {
				width: 260px !important;
				max-width: 260px !important;
				right: 0.5rem !important;
			}
			:global(.song-title) {
				font-size: 14px;
			}
			:global(.song-artist) {
				font-size: 12px;
			}
			:global(.controls) {
				gap: 6px;
				margin-bottom: 12px;
			}
			:global(.controls button) {
				width: 32px;
				height: 32px;
			}
			:global(.controls button:nth-child(3)) {
				width: 40px;
				height: 40px;
			}
			:global(.playlist-item) {
				padding: 8px 12px;
			}
			:global(.playlist-item .w-10) {
				width: 32px;
				height: 32px;
			}
		}

		@keyframes slide-up {
			from {
				transform: translateY(100%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		.animate-slide-up {
			animation: slide-up 0.3s ease-out;
		}

		@media (hover: none) and (pointer: coarse) {
			:global(.music-player button),
			:global(.playlist-item) {
				min-height: 44px;
			}
			:global(.progress-section > div),
			:global(.bottom-controls > div:nth-child(2)) {
				height: 12px;
			}
		}

		@keyframes spin-continuous {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		:global(.cover-container img) {
			animation: spin-continuous 3s linear infinite;
			animation-play-state: paused;
		}

		:global(.cover-container img.spinning) {
			animation-play-state: running;
		}

		:global(button.bg-\\\\[var\\\\(--primary\\\\)\\\\]) {
			box-shadow: 0 0 0 2px var(--primary);
			border: none;
		}</style>`,1);function fr(r,t){tt(t,!1);let e=Yt(_.getState());const s=ft.showFloatingPlayer,l=(ft.floatingEntryMode??"default")==="fab",m=s&&ft.enable;let g;function p(){_.toggle()}function i(){_.prev()}function u(){_.next()}function v(){_.toggleShuffle()}function f(){_.toggleRepeat()}function b(k){_.playIndex(k)}function x(k){const M=k.currentTarget;if(!M)return;const W=M.getBoundingClientRect(),K=(k.clientX-W.left)/W.width;_.setProgress(K)}function n(k){(k.key==="Enter"||k.key===" ")&&(k.preventDefault(),_.setProgress(.5))}function S(){_.toggleMute()}function h(){_.toggleMute()}function I(k){const M=k.currentTarget;if(!M)return;const W=L=>{const N=M.getBoundingClientRect();if(N.width<=0)return;const j=Math.max(0,Math.min(1,(L-N.left)/N.width));_.setVolume(j)};W(k.clientX);const K=k.pointerId;M.setPointerCapture(K);const st=L=>{L.pointerId===K&&W(L.clientX)},ut=()=>{M.removeEventListener("pointermove",st),M.removeEventListener("pointerup",ct),M.removeEventListener("pointercancel",H),M.hasPointerCapture(K)&&M.releasePointerCapture(K)},ct=L=>{L.pointerId===K&&(W(L.clientX),ut())},H=L=>{L.pointerId===K&&ut()};M.addEventListener("pointermove",st),M.addEventListener("pointerup",ct),M.addEventListener("pointercancel",H)}function C(k){const M=k.target;if(!(M?.tagName==="INPUT"||M?.tagName==="TEXTAREA"||M?.contentEditable==="true")){if(k.key==="ArrowLeft"||k.key==="ArrowDown"){k.preventDefault(),_.setVolume(o(e).volume-.05);return}if(k.key==="ArrowRight"||k.key==="ArrowUp"){k.preventDefault(),_.setVolume(o(e).volume+.05);return}(k.key==="Enter"||k.key===" "||k.key==="m"||k.key==="M")&&(k.preventDefault(),S())}}function y(){_.togglePlaylist()}function E(){_.toggleExpanded()}function z(){_.toggleHidden()}function rt(){_.hideError()}function lt(k){}function it(){return _.canSkip()}Ct(()=>{g=_.subscribe(k=>{bt(e,k)}),_.initialize()}),St(()=>{g&&g(),_.destroy()}),Bt();var xt=ot();Gt("keydown",Jt,C);var Dt=$(xt);{var Rt=k=>{var M=tr(),W=$(M);{var K=H=>{var L=Qe(),N=d(L),j=d(N);V(j,{icon:"material-symbols:error",class:"text-xl flex-shrink-0"});var q=w(j,2),G=d(q,!0);c(q);var X=w(q,2),at=d(X);V(at,{icon:"material-symbols:close",class:"text-lg"}),c(X),c(N),c(L),R(()=>O(G,o(e).errorMessage)),D("click",X,rt),P(H,L)};A(W,H=>{o(e).showError&&H(K)})}var st=w(W,2);{var ut=H=>{var L=ot(),N=$(L);{var j=q=>{var G=Ze(),X=d(G),at=d(X);xe(at,{}),c(X),c(G),Lt(3,X,()=>be,()=>({y:16,duration:280,opacity:.12,easing:fe})),P(q,G)};A(N,q=>{o(e).isExpanded&&q(j)})}P(H,L)},ct=H=>{var L=$e();let N;var j=d(L),q=d(j);yt(q,{get cover(){return o(e).currentSong.cover},get isPlaying(){return o(e).isPlaying},get isLoading(){return o(e).isLoading},size:"orb",onclick:z}),c(j);var G=w(j,2);{let vt=mt(()=>o(e).isExpanded||o(e).isHidden);Ee(G,{get song(){return o(e).currentSong},get currentTime(){return o(e).currentTime},get duration(){return o(e).duration},get isPlaying(){return o(e).isPlaying},get isLoading(){return o(e).isLoading},get isHidden(){return o(vt)},onCoverClick:p,onInfoClick:E,onHideClick:z,onExpandClick:E})}var X=w(G,2);{let vt=mt(it),Vt=mt(()=>!o(e).isExpanded);We(X,{get song(){return o(e).currentSong},get currentTime(){return o(e).currentTime},get duration(){return o(e).duration},get isPlaying(){return o(e).isPlaying},get isLoading(){return o(e).isLoading},get isShuffled(){return o(e).isShuffled},get isRepeating(){return o(e).isRepeating},get showPlaylist(){return o(e).showPlaylist},get canSkip(){return o(vt)},get volume(){return o(e).volume},get isMuted(){return o(e).isMuted},isVolumeDragging:!1,get isHidden(){return o(Vt)},volumeBarRef:lt,onPlayClick:p,onPrevClick:i,onNextClick:()=>u(),onShuffleClick:v,onRepeatClick:f,onProgressClick:x,onProgressKeyDown:n,onVolumeButtonClick:h,onSliderPointerDown:I,onSliderKeyDown:C,onHideClick:z,onPlaylistClick:y,onCollapseClick:E})}var at=w(X,2);Je(at,{get playlist(){return o(e).playlist},get currentIndex(){return o(e).currentIndex},get isPlaying(){return o(e).isPlaying},get show(){return o(e).showPlaylist},onClose:y,onPlaySong:b}),c(L),R(()=>{N=F(L,1,"music-player fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",null,N,{expanded:o(e).isExpanded,"hidden-mode":o(e).isHidden}),F(j,1,`orb-player-container ${o(e).isHidden?"orb-enter pointer-events-auto":"orb-leave pointer-events-none"}`)}),P(H,L)};A(st,H=>{l?H(ut):H(ct,-1)})}Qt(2),P(k,M)};A(Dt,k=>{m&&k(Rt)})}P(r,xt),et()}Y(["click"]);export{fr as default};
