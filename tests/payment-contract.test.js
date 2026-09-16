/* REGION: LEOLA.TEST | TAG: PAYMENT.CONTRACT
WHAT: deterministic failure paths; Stripe is injected, no network or payment.
WHO: LeeWay; WHERE: tests; WHEN: 2026-09-16; WHY: preserve amount integrity.
HOW: node:test; LICENSE: MIT. Does not verify live Stripe credentials. */
import test from 'node:test';import assert from 'node:assert/strict';
import {validateDonation,createHandler} from '../api/create-donation-session.js';
const donation={amount:'12.34',email:'reader@example.com',name:'Reader'};
function response(){return {headers:{},code:null,body:null,setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(b){this.body=b;return this},end(){return this}};}
async function invoke({key='',method='POST',body=donation,headers={},client=null}={}){const r=response();const handler=createHandler({getKey:()=>key,makeStripe:async()=>{if(!client)throw Error('Network forbidden by test');return client}});await handler({method,body,headers},r);return r;}
test('exact amount converted without dropping cents',()=>assert.equal(validateDonation(donation).cents,1234));
for(const amount of ['0','0.99','5000.01','-10','1.001','1e3','Infinity',true,null,{},''])test('reject invalid amount '+String(amount),()=>assert.equal(validateDonation({...donation,amount}).error,'invalid_amount'));
test('both permitted donation boundaries accepted',()=>{assert.equal(validateDonation({...donation,amount:1}).cents,100);assert.equal(validateDonation({...donation,amount:5000}).cents,500000)});
test('reject malformed email',()=>assert.equal(validateDonation({...donation,email:'a@b'}).error,'invalid_email'));
test('reject non-object request body',()=>{for(const b of [null,undefined,[],true,'hi'])assert.equal(validateDonation(b).error,'invalid_body')});
test('missing credential never silently redirects amount to Payment Link',async()=>{const r=await invoke();assert.equal(r.code,503);assert.equal(r.body.checkoutUrl,undefined);assert.equal(r.body.error,'stripe_not_configured')});
test('status never reports credential presence as payment verification',async()=>{const r=await invoke({method:'GET',key:'sk_test_mock'});assert.equal(r.code,200);assert.equal(r.body.credentialState,'CREDENTIAL_PRESENT_UNVERIFIED');assert.equal(r.body.paymentProcessingVerified,false)});
test('unknown origin rejected',async()=>{const r=await invoke({headers:{origin:'https://not-leola.invalid'}});assert.equal(r.code,403)});
test('known Pages origin accepted for preflight',async()=>{const r=await invoke({method:'OPTIONS',headers:{origin:'https://4citeb4u.github.io'}});assert.equal(r.code,204);assert.equal(r.headers['Access-Control-Allow-Origin'],'https://4citeb4u.github.io')});
test('unsupported HTTP method rejected',async()=>assert.equal((await invoke({method:'DELETE'})).code,405));
test('missing idempotency key rejected before client invocation',async()=>assert.equal((await invoke({key:'sk_test_mock'})).body.error,'idempotency_key_required'));
test('valid session preserves cents and cannot use attacker host for redirects',async()=>{let args,options;const client={checkout:{sessions:{create:async(a,o)=>{args=a;options=o;return {id:'cs_test_mock',url:'https://checkout.stripe.com/c/pay/mock'}}}}};const r=await invoke({key:'sk_test_mock',headers:{'idempotency-key':'test-attempt-00000001','x-forwarded-host':'evil.invalid'},client});assert.equal(r.code,200);assert.equal(args.line_items[0].price_data.unit_amount,1234);assert.equal(options.idempotencyKey,'leola-test-attempt-00000001');assert.match(args.success_url,/^https:\/\/leolasliabrary\.vercel\.app\//);assert.equal(r.body.paymentConfirmed,false)});
test('upstream exception does not expose details',async()=>{const client={checkout:{sessions:{create:async()=>{throw Error('secret-value-private')}}}};const r=await invoke({key:'sk_test_mock',headers:{'idempotency-key':'test-attempt-00000001'},client});assert.equal(r.code,502);assert.ok(!JSON.stringify(r.body).includes('secret-value-private'))});
test('untrusted checkout destination rejected',async()=>{const client={checkout:{sessions:{create:async()=>({url:'https://evil.invalid/',id:'bad'})}}};const r=await invoke({key:'sk_test_mock',headers:{'idempotency-key':'test-attempt-00000001'},client});assert.equal(r.code,502)});
