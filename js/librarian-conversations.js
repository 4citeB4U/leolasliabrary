export async function installLibrarianConversations(world, api) {
  const response=await fetch('content/librarian-conversations.json');
  if(!response.ok) throw new Error('Librarian topics unavailable');
  const {topics}=await response.json();
  // LibraryGuide answers derive from the implemented library and author intake.
  // Voice Fabric renders these answers; they are not NotebookLM recordings.
  const LibraryGuide = {
    library: 'Welcome to Leola’s Learning Library. You can read, learn, play, and discover stories here. The two Premier Books are displayed on artist’s easels before my desk. Writers are welcome too. I can introduce the books or help you begin an ebook application.',
    books: 'Our Premier Books are Needle & Yarn: A Love Stitched in Time and Crochet Mastery: A Complete Guide by Leola Lee. Pick up a book from its easel, then choose a reading seat. Needle & Yarn is an illustrated story about creating and learning together. Crochet Mastery teaches tools, basic stitches, patterns, colorwork, amigurumi, and finishing techniques. Reading aloud uses the book’s own text and the voices you choose in Library voices.',
    tour: 'You can read Leola’s books, play at the arcade on the right, or visit the video area behind the desk. The globe is in the far-left rear corner; drag it to turn it. There are reading seats and an outdoor park beside the waterfront. To leave, walk back through the entrance doorway. Ask the roaming assistant for more details about the spaces.',
    authors: 'Take an author clipboard and choose either writing seat marked with an arrow. Add your book details, original ebook, optional cover, and permissions. Your application saves on this device. Download its ZIP and attach it to the prepared email to agentlee2912@gmail.com. The form does not upload or publish your book automatically. The library manager reviews your submission and permissions before approval.',
    details: 'Start at the two book easels before the central desk. The arcade is to the right, the video area is behind the desk, and the draggable globe is in the rear-left corner. Choose a reading seat to settle in with a book. Authors use either arrow-marked writing seat after collecting a clipboard. Outside, explore the children’s park and waterfront. New books can appear after the library manager approves their listing and reading permissions; submitting a file does not immediately put it on display.'
  };
  topics.forEach(topic=>{topic.answer=LibraryGuide[topic.id]||'';topic.source={provider:'LibraryGuide',references:['docs/author-library-workflow.md','content/publishing/catalog.json']};});
  const panel=document.createElement('section');panel.id='librarian-conversation';panel.hidden=true;panel.setAttribute('aria-label','Talk with the librarian');
  const choices=document.createElement('div');choices.className='npc-questions';
  const reply=document.createElement('div');reply.className='npc-reply';reply.setAttribute('aria-live','polite');
  const heading=document.createElement('span');heading.className='npc-tray-label';heading.textContent='Ask the library guide';panel.append(heading,choices,reply);document.body.append(panel);
  let role='leola',turn=0;
  const stop=()=>{turn++;world.libraryVoice?.stop().catch(()=>{});world.librarianNarrating=false;};
  const close=()=>{stop();panel.hidden=true;document.body.classList.remove('npc-conversation-open');reply.replaceChildren();world.leola?.hideDialogue?.();if(world.librarianHelper?.speechBillboard)world.librarianHelper.speechBillboard.visible=false;};
  const action=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b;};
  async function select(topic){
    stop();api.stopSpeech();reply.replaceChildren();
    for(const b of choices.querySelectorAll('[data-topic]'))b.setAttribute('aria-pressed',String(b.dataset.topic===topic.id));
    const selectedTurn=turn;
    const p=document.createElement('p');p.textContent=topic.answer||'I do not have verified information for that topic yet.';reply.append(p);
    if(topic.id==='books'){
      reply.append(action('Pick up Needle & Yarn',()=>{close();world.bookCarry?.pickup('needle-and-yarn');}),action('Pick up Crochet Mastery',()=>{close();world.bookCarry?.pickup('crochet-mastery');}));
    }
    if(topic.id==='authors')reply.append(action('Take an author clipboard',()=>{close();world.authorIntakePending=true;world.authorLibrary?.handoff();}));
    reply.append(action('Stop voice',stop));
    if(topic.answer&&world.libraryVoice){
      try{world.librarianNarrating=true;await world.libraryVoice.speak(topic.answer,role==='helper'?'helper':'desk');}
      catch(error){if(turn===selectedTurn){const message=document.createElement('p');message.textContent=error.message;reply.append(message);}}
      finally{if(turn===selectedTurn)world.librarianNarrating=false;}
    }
  }
  function open(nextRole='leola'){
    close();api.stopSpeech();role=nextRole;panel.hidden=false;document.body.classList.add('npc-conversation-open');document.querySelector('#world-interaction-badge').style.opacity='0';choices.replaceChildren();
    for(const topic of topics.filter(t=>!t.roles||t.roles.includes(role))){const labels={library:'About the library',books:'Leola’s books',tour:'Things to do',authors:'Register a book',details:'Explore the library'};const b=action(labels[topic.id]||topic.label,()=>select(topic));b.title=topic.label;b.dataset.topic=topic.id;b.setAttribute('aria-pressed','false');choices.append(b);}
    choices.append(action('Close',close));
  }
  world.addEventListener('talk_helper',()=>open('helper'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.querySelectorAll('[data-teleport]').forEach(b=>b.addEventListener('click',close));
  world.librarianConversations={topics,select,stop,open,close,panel};
}
