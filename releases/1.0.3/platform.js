(function(){
'use strict';
const key='bubble-webgl-experiment-best';
const mini=window.xhs&&window.xhs.miniTool;
let version=0,windowInfo=null,writeQueue=Promise.resolve();
function readVersion(options){return Math.floor((Number(options&&options.miniToolEnv&&options.miniToolEnv.buildVersion)||0)/1000)}
const ready=(async function(){version=readVersion(window.xhs&&window.xhs.launchOptions);if(!version&&mini&&typeof mini.getLaunchOptions==='function'){try{version=readVersion(await mini.getLaunchOptions())}catch(error){}}})();
function fitStage(){const sw=windowInfo&&windowInfo.windowWidth||window.innerWidth;const sh=windowInfo&&windowInfo.windowHeight||window.innerHeight;const width=Math.min(sw,sh/2,520),height=width*2;const stage=document.getElementById('stage');stage.style.width=width+'px';stage.style.height=height+'px';if(windowInfo){const offset=(sh-height)/2;let top=22;const safe=windowInfo.safeArea;if(safe&&Number.isFinite(safe.top))top=Math.max(top,safe.top-offset+8);const buttons=windowInfo.menuButtons||{};Object.keys(buttons).forEach(k=>{const b=buttons[k];if(b&&Number.isFinite(b.bottom))top=Math.max(top,b.bottom-offset+8)});stage.style.setProperty('--hud-top',Math.min(height*.24,top)+'px')}}
async function refreshWindow(){await ready;windowInfo=null;if(version>=9490&&mini&&typeof mini.getWindowInfo==='function'){try{windowInfo=await mini.getWindowInfo()}catch(error){}}fitStage()}
async function loadBest(){await ready;try{let value;if(version>=9460&&mini&&typeof mini.getStorage==='function'){value=(await mini.getStorage({key})).data}else{value=localStorage.getItem(key)}return Math.max(0,Number(value)||0)}catch(error){return 0}}
function saveBest(value){writeQueue=writeQueue.then(async function(){await ready;try{if(version>=9460&&mini&&typeof mini.setStorage==='function'){await mini.setStorage({key,data:JSON.stringify(value)})}else{localStorage.setItem(key,JSON.stringify(value))}return true}catch(error){return false}});return writeQueue}
window.BubblePlatform={fitStage,loadBest,saveBest};addEventListener('resize',refreshWindow);refreshWindow();
})();
