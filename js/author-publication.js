// Original files are preserved. Reader readiness is separate from intake acceptance.
export const AUTHOR_CONTACT = 'agentlee2912@gmail.com';
export const IMPORT_FORMATS = ['epub','pdf','azw','azw3','kfx','mobi','cbz','cbr','djvu','djv','txt','md','html','htm','rtf','docx','fb2','iba','ibooks','mp3','m4b','opus'];
export async function inspectPublication(file) {
  if (!file || !file.size) throw new Error('Choose a non-empty ebook file.');
  if (file.size > 100 * 1024 * 1024) throw new Error('Please contact the library for files larger than 100 MB.');
  const extension = file.name.split('.').pop().toLowerCase();
  if (!IMPORT_FORMATS.includes(extension)) throw new Error('This file type needs a conversation with the library. Please email the manager.');
  const bytes = new Uint8Array(await file.slice(0,512).arrayBuffer());
  const text = new TextDecoder().decode(bytes);
  const zip = bytes[0]===0x50 && bytes[1]===0x4b;
  if (extension==='pdf' && !text.startsWith('%PDF-')) throw new Error('This file is named PDF but does not contain a PDF header.');
  if (['epub','cbz','docx'].includes(extension) && !zip) throw new Error('The file does not have the archive header expected for this format.');
  if (['txt','md','html','htm','fb2'].includes(extension) && bytes.includes(0)) throw new Error('This appears to be a binary file rather than a text publication.');
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return { format:extension, sourceFilename:file.name, bytes:file.size, sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''), drmStatus:'unknown', importStatus:'awaiting-manager-review', readerStatus:['txt','md','pdf'].includes(extension)?'standard-format-review':'reader-or-conversion-review', signatureChecked:['pdf','epub','cbz','docx','txt','md','html','htm','fb2'].includes(extension) };
}
export function validateApplication(data) {
  if (!data.title?.trim() || !data.author?.trim() || !data.description?.trim()) throw new Error('Add the title, author, and book description.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email||'')) throw new Error('Enter a valid author contact email.');
  if (!data.rightsConfirmed || !data.reviewPermission || !data.termsAcknowledged) throw new Error('Confirm ownership or authorization, review permission, and the review process.');
  if (!['listing-only','sample','full-book'].includes(data.requestedAccess)) throw new Error('Choose the reader access you want the manager to review.');
  if (data.drmDeclaration==='protected') throw new Error('Please supply an authorized, unprotected edition or contact the manager about a listing-only entry.');
  return true;
}
export function saveApplication(record) {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('leola-author-applications',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('applications',{keyPath:'id'});
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{const db=request.result,tx=db.transaction('applications','readwrite');tx.objectStore('applications').put(record);tx.oncomplete=()=>{db.close();resolve(record.id);};tx.onerror=()=>{db.close();reject(tx.error);};};
  });
}
// Portable ZIP (stored entries); originals remain byte-for-byte intact.
export async function applicationPackage(record) {
  const encoder=new TextEncoder(), parts=[], central=[];let offset=0;
  const crc32=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  const {original,cover,...manifest}=record;
  const safe=name=>name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const files=[['application.json',new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'})],['original/'+safe(original.name),original]];
  if(cover)files.push(['cover/'+safe(cover.name),cover]);
  for(const [name,file] of files){
    const n=encoder.encode(name),b=new Uint8Array(await file.arrayBuffer()),crc=crc32(b);
    const h=new Uint8Array(30),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,crc,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,n.length,true);
    parts.push(h,n,b);
    const ch=new Uint8Array(46),cv=new DataView(ch.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint32(16,crc,true);cv.setUint32(20,b.length,true);cv.setUint32(24,b.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);central.push(ch,n);offset+=h.length+n.length+b.length;
  }
  const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);
  return new Blob([...parts,...central,end],{type:'application/zip'});
}
export function latestApplication() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('leola-author-applications',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('applications',{keyPath:'id'});
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{const db=request.result,tx=db.transaction('applications','readonly'),q=tx.objectStore('applications').getAll();q.onsuccess=()=>resolve(q.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]||null);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();};
  });
}
