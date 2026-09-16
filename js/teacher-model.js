/* REGION: LEOLA.MODEL | TAG: BROWSER.1B
WHAT: optional Llama 3.2 1B explanations. WHO: LeeWay; WHY: bounded lesson dialogue.
WHERE: browser worker; WHEN: 2026-09-16; HOW: explicit user-triggered model load.
LICENSE: MIT for this adapter; model uses the Llama 3.2 Community License.
No tools, scoring, progression mutation, or model training is exposed here. */
export class BrowserTeacher{
 constructor(){this.ready=false;this.worker=null;this.pending=new Map();this.counter=0;this.busy=false;}
 async load(onProgress){if(this.ready)return;if(!navigator.gpu)throw new Error('WebGPU is unavailable on this browser.');const adapter=await navigator.gpu.requestAdapter();if(!adapter?.features.has('shader-f16'))throw new Error('This model requires WebGPU with shader-f16.');this.worker=new Worker(new URL('./teacher-worker.js',import.meta.url),{type:'module'});this.worker.onmessage=({data})=>{if(data.type==='progress'){onProgress(data.message);return;}const p=this.pending.get(data.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(data.id);data.type==='error'?p.reject(new Error(data.message)):p.resolve(data.text);};this.worker.onerror=()=>{this.ready=false;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('The model worker failed.'));}this.pending.clear();this.worker?.terminate();};try{await this.send('load',{},600000);this.ready=true;}catch(e){this.worker.terminate();this.worker=null;throw e;}}
 send(type,data,timeout){return new Promise((resolve,reject)=>{const id=++this.counter;const timer=setTimeout(()=>{this.pending.delete(id);this.ready=false;this.worker?.terminate();reject(new Error('Model request timed out; reference mode remains available.'));},timeout);this.pending.set(id,{resolve,reject,timer});this.worker.postMessage({type,id,...data});});}
 async ask(question,context){if(!this.ready||this.busy)throw new Error('Model is not ready for another response.');this.busy=true;try{return await this.send('ask',{question:question.slice(0,600),context:context.slice(0,3000)},90000);}finally{this.busy=false;}}
}
