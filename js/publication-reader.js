import { unzipSync } from './vendor/fflate.js';

export const READER_LIMITS = Object.freeze({ file: 64 * 1024 * 1024, entry: 16 * 1024 * 1024, total: 96 * 1024 * 1024, entries: 2500 });
const decoder = new TextDecoder('utf-8');
const raster = /\.(png|jpe?g|gif|webp)$/i;

export function publicationFormat(name = '') {
  return name.split('.').pop().toLowerCase();
}

// ZIPs are inspected before decompression, including the local headers fflate reads.
export function inspectPublicationZip(bytes, limits = READER_LIMITS) {
  if (bytes.length < 22 || bytes.length > limits.file) throw new Error('Archive is empty, incomplete, or larger than the 64 MB reading limit.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = offset => view.getUint16(offset, true);
  const u32 = offset => view.getUint32(offset, true);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (u32(offset) === 0x06054b50 && offset + 22 + u16(offset + 20) === bytes.length) { end = offset; break; }
  }
  if (end < 0) throw new Error('This is not a complete ZIP-based publication.');
  if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10)) throw new Error('Multi-part archives require conversion first.');
  const count = u16(end + 10), directorySize = u32(end + 12), directoryStart = u32(end + 16);
  if (count === 65535 || directoryStart === 0xffffffff || directorySize === 0xffffffff || (end >= 20 && u32(end - 20) === 0x07064b50)) throw new Error('ZIP64 publications require a smaller reading copy.');
  if (!count || count > limits.entries || directoryStart + directorySize > end) throw new Error('Archive has too many entries or an invalid directory.');
  let offset = directoryStart, total = 0;
  const entries = [], names = new Set();
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || u32(offset) !== 0x02014b50) throw new Error('Invalid archive directory.');
    const flags = u16(offset + 8), method = u16(offset + 10), size = u32(offset + 20), originalSize = u32(offset + 24);
    const nameSize = u16(offset + 28), extraSize = u16(offset + 30), commentSize = u16(offset + 32), local = u32(offset + 42);
    const next = offset + 46 + nameSize + extraSize + commentSize;
    if (next > directoryStart + directorySize || local + 30 > directoryStart || u32(local) !== 0x04034b50) throw new Error('Invalid archive entry.');
    if ((flags | u16(local + 6)) & 0x41) throw new Error('Encrypted publications cannot be read here. Supply an authorized, unencrypted reading copy.');
    if (![0, 8].includes(method) || u16(local + 8) !== method) throw new Error('This archive compression requires conversion first.');
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameSize));
    if (!name || /[\x00-\x1f\\]/.test(name) || name.startsWith('/') || /^[a-z]:/i.test(name) || name.split('/').includes('..') || names.has(name)) throw new Error('Archive contains an invalid or duplicate path.');
    const localNameSize = u16(local + 26), localExtraSize = u16(local + 28), start = local + 30 + localNameSize + localExtraSize;
    if (start + size > directoryStart || decoder.decode(bytes.subarray(local + 30, local + 30 + localNameSize)) !== name) throw new Error('Archive entry data does not match its directory.');
    total += originalSize;
    if (originalSize > limits.entry || total > limits.total || (method === 0 && size !== originalSize)) throw new Error('Publication exceeds safe reading limits (16 MB per entry; 96 MB expanded).');
    names.add(name); entries.push({ name, size, originalSize, compression: method }); offset = next;
  }
  if (offset !== directoryStart + directorySize) throw new Error('Invalid archive directory length.');
  return entries;
}

export function readPublicationZip(bytes) {
  const entries = inspectPublicationZip(bytes);
  if (entries.some(entry => /(^|\/)encryption\.xml$/i.test(entry.name))) throw new Error('This EPUB declares encrypted resources. Supply an authorized reading copy without encryption.');
  const files = unzipSync(bytes, { filter: entry => /\.(xml|opf|xhtml|html?|txt|png|jpe?g|gif|webp)$/i.test(entry.name) });
  for (const entry of entries) {
    if (files[entry.name] && files[entry.name].length !== entry.originalSize) throw new Error('A publication entry is damaged.');
  }
  return files;
}

export function resolvePublicationPath(base, href) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/|\\)/i.test(href)) return null;
  let value;
  try { value = decodeURIComponent(href.split(/[?#]/)[0]); } catch { return null; }
  if (/[\x00-\x1f\\]/.test(value) || /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(value)) return null;
  const parts = base.split('/').slice(0, -1);
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') { if (!parts.length) return null; parts.pop(); }
    else parts.push(part);
  }
  return parts.join('/');
}

function xml(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('This document requires conversion to remove external entity declarations.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('The publication contains invalid document markup.');
  return doc;
}
const elements = (node, name) => Array.from(node.getElementsByTagNameNS('*', name));

function rasterType(bytes) {
  if (bytes.length >= 8 && bytes[0] === 137 && decoder.decode(bytes.subarray(1, 4)) === 'PNG') return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (decoder.decode(bytes.subarray(0, 6)).match(/^GIF8[79]a$/)) return 'image/gif';
  if (decoder.decode(bytes.subarray(0, 4)) === 'RIFF' && decoder.decode(bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

// Parse in inert template content, which does not load remote image/iframe URLs.
// Only newly created allow-listed nodes reach the live document; source markup
// is never assigned to a live element's innerHTML.
export function appendPublicationMarkup(source, target, imageForPath = () => null, base = '') {
  const parsed = document.createElement('template');parsed.innerHTML=source;
  const allowed = new Set(['p','div','section','article','h1','h2','h3','h4','h5','h6','br','hr','strong','b','em','i','u','s','small','sup','sub','blockquote','pre','code','ul','ol','li','dl','dt','dd','table','thead','tbody','tr','td','th','caption','figure','figcaption','span']);
  const dropped = new Set(['script','style','title','head','iframe','object','embed','link','meta','form','input','button','textarea','select','svg','math','template','noscript','audio','video']);
  let visited = 0;
  function copy(node, parent, depth = 0) {
    if (++visited > 100000 || depth > 100) throw new Error('Publication markup is too complex for this reader.');
    if (node.nodeType === 3) { parent.append(document.createTextNode(node.textContent)); return; }
    if (node.nodeType !== 1) return;
    const tag = node.localName.toLowerCase();
    if (dropped.has(tag)) return;
    if (tag === 'img') {
      const path = resolvePublicationPath(base, node.getAttribute('src'));
      const src = path && imageForPath(path);
      if (src) {
        const image = document.createElement('img');image.src=src;image.alt=node.getAttribute('alt') || 'Book illustration';image.loading='lazy';image.style.maxWidth='100%';image.style.height='auto';parent.append(image);
      } else if (node.getAttribute('alt')) { parent.append(document.createTextNode(`[${node.getAttribute('alt')}]`)); }
      return;
    }
    const next = allowed.has(tag) ? document.createElement(tag) : document.createDocumentFragment();
    for (const child of node.childNodes) copy(child, next, depth + 1);
    parent.append(next);
  }
  for (const child of parsed.content.childNodes) copy(child, target);
}

/** Local reading preview; no upload, publishing, DRM bypass or remote conversion. */
export async function renderPublication(file, container) {
  const urls = new Set();
  const root = document.createElement('section');root.className='publication-reader';
  root.style.cssText='line-height:1.65;overflow-wrap:anywhere;max-width:100%;color:inherit';
  container.replaceChildren(root);
  const makeURL = blob => { const url = URL.createObjectURL(blob);urls.add(url);return url; };
  const cleanup = () => { for(const url of urls) URL.revokeObjectURL(url);urls.clear();root.remove(); };
  const heading = document.createElement('h3');heading.textContent=file.name || 'Book preview';root.append(heading);
  const original=document.createElement('a');original.href=makeURL(file);original.download=file.name || 'publication';original.textContent='Download original file';root.append(original);
  const status=document.createElement('p');status.setAttribute('role','status');root.append(status);
  const content=document.createElement('div');content.className='publication-reader-content';root.append(content);
  const extension=publicationFormat(file.name);
  try {
    if(file.size > READER_LIMITS.file) throw new Error('Reading previews are limited to 64 MB. Your original file is unchanged.');
    if(extension==='pdf') {
      const viewer=document.createElement('object');viewer.type='application/pdf';viewer.data=makeURL(new Blob([file],{type:'application/pdf'}));viewer.style.cssText='width:100%;height:70vh;min-height:360px';
      const note=document.createElement('p');note.textContent='If your browser cannot display this PDF, use Download original file above.';viewer.append(note);content.append(viewer);
      status.textContent='PDF · Browser document viewer';root.dataset.readerStatus='readable';return cleanup;
    }
    if(['txt','md','markdown','html','htm','fb2'].includes(extension)) {
      const text=await file.text();
      if(['txt','md','markdown'].includes(extension)) {
        const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;font:inherit';pre.textContent=text;content.append(pre);
        status.textContent='Plain-text reading preview';
      } else if(extension==='fb2') {
        const doc=xml(text);
        for(const body of elements(doc,'body')) for(const child of elements(body,'p')) {const p=document.createElement('p');p.textContent=child.textContent;content.append(p);}
        if(!content.childNodes.length) throw new Error('No readable paragraphs were found in this FB2 book.');
        status.textContent='FB2 · Text reading preview';
      } else {appendPublicationMarkup(text,content);status.textContent='HTML · Safe reading preview (remote images and active content omitted)';}
      root.dataset.readerStatus='readable';return cleanup;
    }
    if(!['epub','docx','cbz'].includes(extension)) {
      status.textContent='Conversion required for browser reading. Keep this original and supply an authorized EPUB or PDF reading copy. Kindle/AZW/AZW3/KF8/KFX/MOBI, CBR, DJVU, RTF, IBA and other legacy formats are not decoded by this reader.';
      root.dataset.readerStatus='conversion-required';return cleanup;
    }
    const files=readPublicationZip(new Uint8Array(await file.arrayBuffer()));
    const imageCache=new Map();
    const imageForPath=path=>{
      if(imageCache.has(path))return imageCache.get(path);
      const bytes=files[path],type=bytes && rasterType(bytes);
      if(!type)return null;
      const url=makeURL(new Blob([bytes],{type}));imageCache.set(path,url);return url;
    };
    if(extension==='cbz') {
      const pages=Object.keys(files).filter(path=>raster.test(path) && !path.startsWith('__MACOSX/')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      for(const [index,path] of pages.entries()) {
        const src=imageForPath(path);if(!src)continue;
        const image=document.createElement('img');image.src=src;image.alt=`Page ${index+1}`;image.loading='lazy';image.style.cssText='display:block;max-width:100%;height:auto;margin:1rem auto';content.append(image);
      }
      if(!content.childNodes.length)throw new Error('No supported raster image pages were found in this comic.');
      status.textContent=`CBZ · ${content.childNodes.length} image pages`;
    } else if(extension==='docx') {
      if(!files['word/document.xml'])throw new Error('This DOCX has no readable document part.');
      const doc=xml(decoder.decode(files['word/document.xml']));
      for(const para of elements(doc,'p')) {
        const p=document.createElement('p');p.textContent=elements(para,'t').map(node=>node.textContent).join('');content.append(p);
      }
      status.textContent='DOCX · Text reading preview (page layout and illustrations omitted)';
    } else {
      if(!files['META-INF/container.xml'])throw new Error('This EPUB has no container manifest.');
      const containerDoc=xml(decoder.decode(files['META-INF/container.xml']));
      const packagePath=elements(containerDoc,'rootfile')[0]?.getAttribute('full-path');
      if(!packagePath || !files[packagePath])throw new Error('The EPUB package could not be found.');
      const opf=xml(decoder.decode(files[packagePath]));
      const manifest=new Map(elements(opf,'item').map(item=>[item.getAttribute('id'),item]));
      const spine=elements(opf,'itemref').filter(item=>item.getAttribute('linear')!=='no');
      let chapterCount=0;
      for(const reference of spine) {
        const item=manifest.get(reference.getAttribute('idref'));
        const path=item && resolvePublicationPath(packagePath,item.getAttribute('href'));
        if(!path || !files[path] || !/^(application\/xhtml\+xml|text\/html)$/.test(item.getAttribute('media-type') || '')) continue;
        const chapter=document.createElement('section');chapter.className='publication-chapter';chapter.style.cssText='padding:1rem 0;border-bottom:1px solid #b99c6e';
        appendPublicationMarkup(decoder.decode(files[path]),chapter,imageForPath,path);content.append(chapter);chapterCount++;
      }
      if(!chapterCount)throw new Error('No readable EPUB spine chapters were found.');
      status.textContent=`EPUB · ${chapterCount} sections in book order. Publisher styling and active content are omitted.`;
    }
    root.dataset.readerStatus='readable';
  } catch(error) {
    content.replaceChildren();root.dataset.readerStatus='conversion-required';
    status.textContent=`Reading preview unavailable: ${error.message || 'The file could not be decoded.'} Download the original above or supply an authorized EPUB/PDF reading copy.`;
  }
  return cleanup;
}
