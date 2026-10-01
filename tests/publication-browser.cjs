const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.LEOLA_TEST_URL || 'http://127.0.0.1:4174/';
const output = path.resolve(__dirname, '../test-evidence/publication-reader-browser.json');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const checks = [], remoteRequests = [], errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== new URL(base).origin && !['blob:', 'data:'].includes(url.protocol)) {
        remoteRequests.push(url.href);return route.abort();
      }
      if (url.pathname === '/__publication-reader-test') return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><main id="reader"></main></body></html>'});
      return route.continue();
    });
    await page.goto(new URL('/__publication-reader-test', base).href);
    const results = await page.evaluate(async () => {
      const { renderPublication } = await import('/js/publication-reader.js');
      const { zipSync, strToU8 } = await import('/js/vendor/fflate.js');
      const holder = document.getElementById('reader');
      const records = [];
      const originalCreate = URL.createObjectURL.bind(URL), originalRevoke=URL.revokeObjectURL.bind(URL);
      const activeURLs = new Set();
      URL.createObjectURL = blob => {const url=originalCreate(blob);activeURLs.add(url);return url;};
      URL.revokeObjectURL = url => {activeURLs.delete(url);originalRevoke(url);};
      const check=(name,pass)=>records.push({name,pass:Boolean(pass)});
      const png=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTQAAAABJRU5ErkJggg=='), c=>c.charCodeAt(0));
      const zip=items=>zipSync(Object.fromEntries(Object.entries(items).map(([name,value])=>[name,typeof value==='string'?strToU8(value):value])));
      const finish=cleanup=>{cleanup();check('Preview cleanup removes root and revokes every created URL',holder.children.length===0 && activeURLs.size===0);};
      const attack='<script>window.readerExploit=true</script><img src="https://reader-test.invalid/tracker.png" onerror="window.readerExploit=true"><iframe src="https://reader-test.invalid/frame"></iframe><a href="javascript:window.readerExploit=true">Safe link text</a>';
      const epub=zip({
        'META-INF/container.xml':'<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>',
        'OPS/book.opf':'<package><manifest><item id="second" href="two.xhtml" media-type="application/xhtml+xml"/><item id="first" href="one.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="first"/><itemref idref="second"/></spine></package>',
        'OPS/one.xhtml':'<html><body><h1>First chapter</h1><p>Safe EPUB text.</p><img src="images/picture.png" alt="Local illustration">'+attack+'</body></html>',
        'OPS/two.xhtml':'<html><body><h1>Second chapter</h1><p>End of the story.</p></body></html>',
        'OPS/images/picture.png':png
      });
      let cleanup=await renderPublication(new File([epub],'fixture.epub'),holder);
      check('EPUB renders spine order rather than manifest order',Array.from(holder.querySelectorAll('h1')).map(h=>h.textContent).join('|')==='First chapter|Second chapter');
      check('EPUB preserves readable text and one local image',holder.textContent.includes('Safe EPUB text.') && holder.querySelectorAll('img').length===1 && holder.querySelector('img').src.startsWith('blob:'));
      check('EPUB omits executable and remote elements',!holder.querySelector('script,iframe,[onerror],a[href^="javascript:"]') && !window.readerExploit);
      check('EPUB original file remains downloadable',holder.querySelector('a[download]').download==='fixture.epub');
      finish(cleanup);
      cleanup=await renderPublication(new File([zip({'page10.png':png,'page2.png':png,'page1.png':png})],'comic.cbz'),holder);
      check('CBZ renders all raster pages',holder.querySelectorAll('img').length===3 && holder.textContent.includes('3 image pages'));
      finish(cleanup);
      // Verify numerical ordering through unique image byte payloads captured at URL creation.
      const captured=[];
      URL.createObjectURL=blob=>{if(blob.type==='image/png')captured.push(blob);const url=originalCreate(blob);activeURLs.add(url);return url;};
      const mark=n=>{const bytes=new Uint8Array(png.length+1);bytes.set(png);bytes[png.length]=n;return bytes;};
      cleanup=await renderPublication(new File([zip({'page10.png':mark(10),'page2.png':mark(2),'page1.png':mark(1)})],'ordered.cbz'),holder);
      const order=await Promise.all(captured.map(async blob=>{const bytes=new Uint8Array(await blob.arrayBuffer());return bytes[bytes.length-1];}));
      check('CBZ pages use numerical filename order',order.join(',')==='1,2,10');finish(cleanup);
      cleanup=await renderPublication(new File([zip({'word/document.xml':'<w:document xmlns:w="urn:word"><w:body><w:p><w:r><w:t>Document chapter</w:t></w:r><w:r><w:t> six.</w:t></w:r></w:p></w:body></w:document>'})],'manuscript.docx'),holder);
      check('DOCX combines text runs into readable paragraphs',holder.textContent.includes('Document chapter six.'));finish(cleanup);
      cleanup=await renderPublication(new File(['Plain text\n<script>not executable</script>'],'book.txt'),holder);
      check('TXT preserves literal text without parsing HTML',holder.querySelector('pre').textContent.includes('<script>not executable</script>') && !holder.querySelector('script'));finish(cleanup);
      cleanup=await renderPublication(new File(['<h1>Safe HTML book</h1><p>Read this.</p>'+attack],'book.html'),holder);
      check('HTML retains prose and strips scripts, frames, remote images and event handlers',holder.textContent.includes('Read this.') && !holder.querySelector('script,iframe,img,[onerror]') && !window.readerExploit);finish(cleanup);
      cleanup=await renderPublication(new File(['<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0"><body><section><p>FB2 chapter six.</p></section></body></FictionBook>'],'book.fb2'),holder);
      check('FB2 reads namespaced paragraphs',holder.textContent.includes('FB2 chapter six.'));finish(cleanup);
      cleanup=await renderPublication(new File(['legacy'],'book.azw3'),holder);
      check('Legacy files explicitly require conversion and retain original download',holder.querySelector('[data-reader-status="conversion-required"]') && holder.textContent.includes('Conversion required') && holder.querySelector('a[download]').download==='book.azw3');finish(cleanup);
      const encrypted=zip({'META-INF/encryption.xml':'<encryption/>','OPS/text.xhtml':'<p>Protected</p>'});
      cleanup=await renderPublication(new File([encrypted],'protected.epub'),holder);
      check('Encrypted EPUB preview rejected without discarding original',holder.textContent.includes('encrypted resources') && holder.querySelector('a[download]'));finish(cleanup);
      cleanup=await renderPublication(new File(['%PDF-1.4\n%%EOF'],'book.pdf',{type:'application/pdf'}),holder);
      check('PDF delegates to browser viewer with original download fallback',holder.querySelector('object[type="application/pdf"]')?.data.startsWith('blob:') && holder.querySelector('a[download]'));finish(cleanup);
      return records;
    });
    checks.push(...results);
    // Give accidental remote resource requests an event-loop opportunity to surface.
    await page.waitForTimeout(150);
    checks.push({name:'No remote resource requests from hostile EPUB/HTML fixtures',pass:remoteRequests.length===0});
    checks.push({name:'No uncaught browser errors',pass:errors.length===0});
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,JSON.stringify({time:new Date().toISOString(),base,checks,remoteRequests,errors},null,2));
    for(const check of checks)assert.ok(check.pass,check.name);
    console.log(`${checks.length}/${checks.length} publication browser checks passed. Evidence: ${output}`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
