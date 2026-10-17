// Faithful image pages from the supplied PDF. Page art is never reconstructed.
export function installIllustratedBookReader(world) {
  if(world?.illustratedBookReader)return world.illustratedBookReader;
  if(!document.querySelector('link[data-illustrated-reader]')){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../css/illustrated-book-reader.css',import.meta.url).href;css.dataset.illustratedReader='';document.head.append(css);}
  const root=document.createElement('div');root.className='illustrated-reader';root.hidden=true;
  const dialog=document.createElement('dialog');dialog.className='illustrated-reader-dialog illustrated-book-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Illustrated book reader');root.append(dialog);
  const head=document.createElement('header'),titles=document.createElement('div'),title=document.createElement('h2'),author=document.createElement('p');titles.append(title,author);head.append(titles);dialog.append(head);
  function button(parent,label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);parent.append(b);return b;}
  const closeButton=button(head,'Close book',close);
  const toolbar=document.createElement('div');toolbar.className='illustrated-reader-toolbar';toolbar.setAttribute('aria-label','Book reading controls');dialog.append(toolbar);
  const previous=button(toolbar,'Previous page',()=>turn(-1));
  const selector=document.createElement('select');selector.setAttribute('aria-label','Go to book page');toolbar.append(selector);
  const next=button(toolbar,'Next page',()=>turn(1));
  const magnifier=document.createElement('div');magnifier.className='illustrated-magnifier';magnifier.setAttribute('role','group');magnifier.setAttribute('aria-label','Magnify words and pictures');toolbar.append(magnifier);
  const smaller=button(magnifier,'🔍 −',()=>setZoom(zoom*100-20));smaller.setAttribute('aria-label','Make words smaller');smaller.title='Make words and pictures smaller';
  const zoomLabel=document.createElement('label');zoomLabel.append('Zoom');const zoomInput=document.createElement('input');zoomInput.type='range';zoomInput.min='100';zoomInput.max='300';zoomInput.step='10';zoomInput.value='100';zoomInput.setAttribute('aria-label','Page zoom');zoomLabel.append(zoomInput);magnifier.append(zoomLabel);
  const bigger=button(magnifier,'🔍 +',()=>setZoom(zoom*100+20));bigger.setAttribute('aria-label','Enlarge words');bigger.title='Enlarge words and pictures';
  const zoomPercent=document.createElement('output');zoomPercent.textContent='100%';zoomPercent.setAttribute('aria-live','polite');magnifier.append(zoomPercent);
  const fit=button(magnifier,'Fit page',()=>setZoom(100));fit.title='Reset magnification to fit the full page';
  let readingNarration = false;
  const listen=button(toolbar,'Listen',async()=>{
    if(!manifest)return;
    if(readingNarration) {
      readingNarration = false;
      listen.textContent = 'Listen';
      listen.setAttribute('aria-pressed', 'false');
      world?.libraryVoice?.stop?.();
      status.textContent = 'Narration stopped.';
      return;
    }
    try {
      if(typeof world?.libraryVoice?.readBook==='function') {
        readingNarration = true;
        listen.textContent = 'Stop reading';
        listen.setAttribute('aria-pressed', 'true');
        status.textContent = 'Narrating ' + (manifest.title || 'story') + '…';
        const res = await world.libraryVoice.readBook('needle-and-yarn',{pageIndex:index});
        readingNarration = false;
        listen.textContent = 'Listen';
        listen.setAttribute('aria-pressed', 'false');
        status.textContent = res?.stopped ? 'Narration stopped.' : 'Narration finished.';
      } else if(world?.libraryVoice?.openSetup) {
        status.textContent='Choose a book narration voice in Library voices.';
        world.libraryVoice.openSetup();
      } else {
        status.textContent='Book narration is not connected yet. The illustrated pages remain available to read.';
      }
    } catch(error) {
      readingNarration = false;
      listen.textContent = 'Listen';
      listen.setAttribute('aria-pressed', 'false');
      status.textContent=error.message||'Narration could not start. Check Library voices.';
    }
  });listen.title='Listen to this book using your selected library voice';listen.setAttribute('aria-label','Listen to this book');
  const sound=button(toolbar,'Page sound on',()=>{muted=!muted;sound.textContent=muted?'Page sound off':'Page sound on';sound.setAttribute('aria-pressed',String(!muted));if(muted)stopRustle();});sound.setAttribute('aria-pressed','true');
  const download=document.createElement('a');download.textContent='Download EPUB';download.setAttribute('download','');toolbar.append(download);
  const viewport=document.createElement('div');viewport.className='illustrated-reader-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','Illustrated page. Use arrow keys to turn pages.');dialog.append(viewport);
  const book=document.createElement('div');book.className='illustrated-reader-book';const image=document.createElement('img');image.className='illustrated-reader-page';image.draggable=false;book.append(image);viewport.append(book);
  const footer=document.createElement('div');footer.className='illustrated-reader-footer';const status=document.createElement('p');status.className='illustrated-reader-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');const details=document.createElement('details'),summary=document.createElement('summary'),transcript=document.createElement('p');summary.textContent='Page text';details.append(summary,transcript);footer.append(status,details);dialog.append(footer);document.body.append(root);
  let manifest=null,index=0,busy=false,muted=false,audio=null,noise=null,frame=0,epoch=0,lastFocus=null,zoom=1,baseWidth=400,gesture=null,overlay=null,finishAnimation=null;
  const cache=new Map();
  const localURL=value=>{const url=new URL(value,document.baseURI);if(url.origin!==location.origin || !['http:','https:'].includes(url.protocol))throw new Error('Book pages must use approved local files.');return url.href;};
  function updateControls(){previous.disabled=busy||!manifest||index===0;next.disabled=busy||!manifest||index===manifest.pages.length-1;selector.disabled=busy||!manifest;zoomInput.disabled=busy;smaller.disabled=busy||zoom<=1;bigger.disabled=busy||zoom>=3;fit.disabled=busy||zoom===1;listen.disabled=busy||!manifest;zoomPercent.textContent=Math.round(zoom*100)+'%';selector.value=String(index);}
  function setZoom(percent){if(busy||!manifest)return;zoom=Math.min(300,Math.max(100,percent))/100;zoomInput.value=String(Math.round(zoom*100));resize();updateControls();if(zoom===1){viewport.scrollTop=0;viewport.scrollLeft=0;}}
  function resize(){if(!manifest||root.hidden)return;const page=manifest.pages[index];const ratio=page.width/page.height;const available=Math.max(140,viewport.clientHeight-58);baseWidth=Math.max(120,Math.min(740,viewport.clientWidth-65,available*ratio));book.style.width=`${baseWidth*zoom}px`;book.style.height=`${baseWidth*zoom/ratio}px`;}
  function load(page){const src=localURL(page.src);if(!cache.has(src)){const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{cache.delete(src);reject(new Error('This illustrated page could not load. Please try again.'));};img.src=src;});cache.set(src,promise);}return cache.get(src);}
  function display(){const page=manifest.pages[index];image.src=localURL(page.src);image.alt=page.label||`${manifest.title}, ${index===0?'cover':'page '+index}`;transcript.textContent=page.text||'This illustrated page includes printed text. A selectable text transcript is not available for this edition.';status.textContent=`${page.label|| (index===0?'Cover':'Page '+index)} · ${index+1} of ${manifest.pages.length}`;resize();updateControls();if(manifest.pages[index+1])load(manifest.pages[index+1]).catch(()=>{});}
  function stopRustle(){if(noise){try{noise.stop();}catch{}noise=null;}}
  function rustle(){if(muted)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();stopRustle();const length=Math.floor(audio.sampleRate*.45),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<length;i++){last=.72*last+.28*(Math.random()*2-1);data[i]=last;}noise=audio.createBufferSource();noise.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='highpass';filter.frequency.value=650;const gain=audio.createGain();const now=audio.currentTime;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.10,now+.09);gain.gain.exponentialRampToValueAtTime(.001,now+.44);noise.connect(filter).connect(gain).connect(audio.destination);noise.start();noise.stop(now+.45);}catch{muted=true;sound.textContent='Page sound unavailable';sound.setAttribute('aria-pressed','false');}}
  function animate(oldSrc,direction,width,height){return new Promise(resolve=>{finishAnimation=resolve;const count=18,piece=width/count;overlay=document.createElement('div');overlay.className='illustrated-reader-turn';overlay.style.width=width+'px';overlay.style.height=height+'px';overlay.setAttribute('aria-hidden','true');book.append(overlay);const strips=[];for(let i=0;i<count;i++){const strip=document.createElement('div');strip.className='illustrated-reader-strip';strip.style.width=`${piece+.7}px`;const front=document.createElement('div');front.className='illustrated-reader-strip-front';front.style.backgroundImage=`url(${JSON.stringify(oldSrc)})`;front.style.backgroundSize=`${width}px ${height}px`;front.style.backgroundPosition=`${-i*piece}px 0`;const back=document.createElement('div');back.className='illustrated-reader-strip-back';strip.append(front,back);overlay.append(strip);strips.push(strip);}const started=performance.now(),duration=740;function tick(now){const p=Math.min(1,(now-started)/duration),e=p*p*(3-2*p);let x=direction>0?0:width,z=0;for(let j=0;j<count;j++){const i=direction>0?j:count-1-j;const angle=(direction>0?-1:1)*(Math.PI*e+Math.sin(Math.PI*e)*(j/count)*.8);const dx=Math.cos(angle)*piece,dz=-Math.sin(angle)*piece;if(direction<0){x-=dx;z-=dz;}strips[i].style.transform=`translate3d(${x}px,0,${z}px) rotateY(${angle}rad)`;strips[i].style.filter=`brightness(${1-.13*Math.sin(Math.PI*p)*(j/count)})`;if(direction>0){x+=dx;z+=dz;}}if(p<1)frame=requestAnimationFrame(tick);else{overlay?.remove();overlay=null;finishAnimation=null;resolve();}}frame=requestAnimationFrame(tick);});}
  async function turn(direction){if(busy||!manifest||root.hidden)return;const target=index+direction;if(target<0||target>=manifest.pages.length)return;const token=epoch;busy=true;updateControls();viewport.focus({preventScroll:true});try{await load(manifest.pages[target]);if(token!==epoch)return;const oldSrc=image.src,oldWidth=book.clientWidth,oldHeight=book.clientHeight;index=target;display();rustle();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await animate(oldSrc,direction,oldWidth,oldHeight);if(token!==epoch)return;viewport.scrollTop=0;viewport.scrollLeft=0;}catch(error){status.textContent=error.message;}finally{if(token===epoch){busy=false;updateControls();}}}
  async function goTo(target){if(busy||!manifest||target===index||target<0||target>=manifest.pages.length)return;const token=epoch;busy=true;updateControls();viewport.focus({preventScroll:true});try{await load(manifest.pages[target]);if(token!==epoch)return;index=target;display();viewport.scrollTop=0;viewport.scrollLeft=0;}catch(error){status.textContent=error.message;}finally{if(token===epoch){busy=false;updateControls();}}}
  function close(){const stopping=world?.libraryVoice?.stop?.();stopping?.catch?.(()=>{});epoch++;cancelAnimationFrame(frame);finishAnimation?.();finishAnimation=null;document.body.classList.remove('illustrated-book-open');dialog.removeAttribute('open');overlay?.remove();overlay=null;stopRustle();audio?.suspend();root.hidden=true;busy=false;lastFocus?.focus?.();}
  async function open(manifestURL='content/needle-and-yarn-illustrated.json'){const token=++epoch;cancelAnimationFrame(frame);finishAnimation?.();finishAnimation=null;document.body.classList.add('illustrated-book-open');dialog.setAttribute('open','');overlay?.remove();overlay=null;stopRustle();lastFocus=document.activeElement;root.hidden=false;title.textContent='Opening illustrated book…';author.textContent='';status.textContent='Loading original illustrated pages…';book.hidden=true;details.open=false;busy=true;manifest=null;updateControls();closeButton.focus();try{const response=await fetch(localURL(manifestURL));if(!response.ok)throw new Error('The illustrated edition is not available yet.');const data=await response.json();if(!Array.isArray(data.pages)||!data.pages.length)throw new Error('No illustrated pages are available.');for(const page of data.pages){localURL(page.src);if(!(Number.isFinite(page.width)&&page.width>0&&Number.isFinite(page.height)&&page.height>0))throw new Error('A page has invalid dimensions.');}await load(data.pages[0]);if(token!==epoch)return;manifest=data;index=0;zoom=1;zoomInput.value='100';title.textContent=data.title||'Illustrated book';author.textContent=typeof data.author==='string'?data.author:(data.author?.name||'');selector.replaceChildren(...data.pages.map((page,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=page.label||(i===0?'Cover':'Page '+i);return option;}));download.hidden=!data.epub;if(data.epub)download.href=localURL(data.epub);book.hidden=false;busy=false;display();}catch(error){if(token===epoch){status.textContent=error.message;title.textContent='Illustrated book';busy=false;updateControls();}}}
  selector.addEventListener('change',()=>goTo(Number(selector.value)));
  zoomInput.addEventListener('input',()=>setZoom(Number(zoomInput.value)));
  root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key==='Tab'){const focusable=[...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"],summary')].filter(el=>!el.hidden&&el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;}if(['INPUT','SELECT'].includes(event.target.tagName))return;if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();turn(1);}if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();turn(-1);}});
  for(const type of ['keyup','pointerdown','pointerup','click','wheel'])root.addEventListener(type,event=>event.stopPropagation());
  viewport.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'&&zoom===1)gesture={x:event.clientX,y:event.clientY};});
  viewport.addEventListener('pointerup',event=>{if(!gesture)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;gesture=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)turn(dx<0?1:-1);});
  viewport.addEventListener('pointercancel',()=>{gesture=null;});
  book.addEventListener('click',event=>{if(zoom!==1||event.detail>1||(event.pointerType&&event.pointerType!=='mouse'))return;const bounds=book.getBoundingClientRect(),fraction=(event.clientX-bounds.left)/bounds.width;if(fraction<.16)turn(-1);else if(fraction>.84)turn(1);});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
  const api={open,close,next:()=>turn(1),previous:()=>turn(-1),goTo,get pageIndex(){return index;},get isOpen(){return !root.hidden;},get manifest(){return manifest;},element:root,dispose(){close();resizeObserver.disconnect();audio?.close();root.remove();if(world)delete world.illustratedBookReader;}};
  if(world)world.illustratedBookReader=api;return api;
}
