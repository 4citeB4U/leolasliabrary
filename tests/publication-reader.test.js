import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from '../js/vendor/fflate.js';
import { inspectPublicationZip, readPublicationZip, resolvePublicationPath, publicationFormat, READER_LIMITS } from '../js/publication-reader.js';

test('publication archive preserves local chapter bytes', () => {
  const bytes=zipSync({'OPS/chapter.xhtml':strToU8('<p>Chapter six</p>')});
  assert.equal(inspectPublicationZip(bytes).length,1);
  assert.equal(new TextDecoder().decode(readPublicationZip(bytes)['OPS/chapter.xhtml']),'<p>Chapter six</p>');
});
test('publication archives reject encryption and dangerous paths', () => {
  const bytes=zipSync({'chapter.html':strToU8('read')});
  bytes[6] |= 1;
  assert.throws(()=>inspectPublicationZip(bytes),/Encrypted/);
  assert.throws(()=>inspectPublicationZip(zipSync({'../chapter.html':strToU8('read')})),/path/);
  assert.throws(()=>readPublicationZip(zipSync({'META-INF/encryption.xml':strToU8('<encryption/>')})),/encrypted resources/);
});
test('publication archives enforce expanded entry and total limits', () => {
  const bytes=zipSync({'one.txt':strToU8('12345'),'two.txt':strToU8('12345')});
  assert.throws(()=>inspectPublicationZip(bytes,{...READER_LIMITS,entry:4}),/limits/);
  assert.throws(()=>inspectPublicationZip(bytes,{...READER_LIMITS,total:9}),/limits/);
  assert.throws(()=>inspectPublicationZip(bytes,{...READER_LIMITS,entries:1}),/too many/);
});
test('publication paths allow book-relative resources but never remote or escaped paths', () => {
  assert.equal(resolvePublicationPath('OPS/Text/chapter.xhtml','../Images/cover.jpg'),'OPS/Images/cover.jpg');
  assert.equal(resolvePublicationPath('OPS/book.opf','Text/chapter.xhtml#start'),'OPS/Text/chapter.xhtml');
  for(const value of ['https://example.org/cover.jpg','//evil/image.jpg','data:image/svg+xml,test','../../../escape','%2Fexternal','%68ttps%3Aevil','\\evil'])assert.equal(resolvePublicationPath('OPS/book.opf',value),null);
  assert.equal(publicationFormat('A BOOK.EPUB'),'epub');
});
test('malformed archive headers fail before decompression',()=>{
  const bytes=zipSync({'one.txt':strToU8('test')});bytes[0]=0;
  assert.throws(()=>inspectPublicationZip(bytes),/entry/);
  assert.throws(()=>inspectPublicationZip(new Uint8Array(22)),/complete ZIP/);
});
