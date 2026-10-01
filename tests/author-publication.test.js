import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPublication,validateApplication,applicationPackage} from '../js/author-publication.js';
test('intake rejects renamed or empty publications',async()=>{
  await assert.rejects(inspectPublication(new File(['bad'],'book.pdf')),/PDF header/);
  await assert.rejects(inspectPublication(new File(['bad'],'book.epub')),/archive header/);
  await assert.rejects(inspectPublication(new File([],'empty.txt')),/non-empty/);
  await assert.rejects(inspectPublication(new File(['code'],'run.exe')),/file type/);
});
test('original content is hashed and intake never grants publication approval',async()=>{
  const result=await inspectPublication(new File(['Hello reader'],'book.txt'));
  assert.equal(result.importStatus,'awaiting-manager-review');assert.equal(result.drmStatus,'unknown');assert.equal(result.sha256.length,64);
});
test('rights and permission must be complete before intake',()=>{
  const data={title:'A Book',author:'Writer',description:'Story',email:'writer@example.com',requestedAccess:'full-book',rightsConfirmed:true,reviewPermission:true,termsAcknowledged:true,drmDeclaration:'none'};
  assert.equal(validateApplication(data),true);
  assert.throws(()=>validateApplication({...data,reviewPermission:false}),/Confirm/);
  assert.throws(()=>validateApplication({...data,drmDeclaration:'protected'}),/unprotected/);
});
test('portable package keeps original bytes and manifest without binary duplication',async()=>{
  const original=new File(['A complete book\n\u2665'],'book.txt');
  const blob=await applicationPackage({id:'test',status:'saved-locally-not-sent',original,cover:null});
  const b=new Uint8Array(await blob.arrayBuffer()),v=new DataView(b.buffer);let offset=0;const entries={};
  while(v.getUint32(offset,true)===0x04034b50){const size=v.getUint32(offset+18,true),len=v.getUint16(offset+26,true),start=offset+30+len,name=new TextDecoder().decode(b.slice(offset+30,start));entries[name]=b.slice(start,start+size);offset=start+size;}
  assert.deepEqual(entries['original/book.txt'],new Uint8Array(await original.arrayBuffer()));
  const manifest=JSON.parse(new TextDecoder().decode(entries['application.json']));assert.equal(manifest.status,'saved-locally-not-sent');assert.equal('original' in manifest,false);
  assert.equal(v.getUint32(offset,true),0x02014b50);assert.equal(v.getUint32(b.length-22,true),0x06054b50);
});
