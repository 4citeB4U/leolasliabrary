/* REGION: LEOLA.PAYMENTS | TAG: CHECKOUT.FAIL-CLOSED
WHAT: exact-amount Stripe sessions; no silent Payment Link substitution.
WHO: LeeWay; WHY: amount integrity, safe redirects, explicit verification state.
WHERE: Vercel Function; WHEN: 2026-09-16; HOW: hosted Checkout. LICENSE: MIT.
No card data is accepted. Creating a session does not confirm payment. */
const SITE='https://leolasliabrary.vercel.app';
const ORIGINS=new Set([SITE,'https://4citeb4u.github.io']);
export function validateDonation(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return {error:'invalid_body'};
 const amount=typeof body.amount==='number'?String(body.amount):body.amount;
 if(typeof amount!=='string'||!/^\d{1,4}(?:\.\d{1,2})?$/.test(amount.trim()))return {error:'invalid_amount'};
 const cents=Math.round(Number(amount)*100);if(cents<100||cents>500000)return {error:'invalid_amount'};
 const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:'invalid_email'};
 return {cents,email,name:typeof body.name==='string'?body.name.trim().slice(0,120):'',message:typeof body.message==='string'?body.message.trim().slice(0,500):''};
}
export function createHandler({getKey=()=>process.env.STRIPE_SECRET_KEY,makeStripe=async key=>new(await import('stripe')).default(key)}={}){
 return async function handler(request,response){
  response.setHeader('Cache-Control','no-store');const origin=request.headers?.origin;
  if(origin&&!ORIGINS.has(origin))return response.status(403).json({ok:false,error:'origin_not_allowed'});
  if(origin){response.setHeader('Access-Control-Allow-Origin',origin);response.setHeader('Vary','Origin');}
  response.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');response.setHeader('Access-Control-Allow-Headers','Content-Type, Idempotency-Key');
  if(request.method==='OPTIONS')return response.status(204).end();const key=getKey();
  if(request.method==='GET')return response.status(200).json({ok:true,stripeConfigured:Boolean(key),credentialState:key?'CREDENTIAL_PRESENT_UNVERIFIED':'NOT_CONFIGURED',paymentProcessingVerified:false,note:'Credential presence is not proof of successful payment processing.'});
  if(request.method!=='POST'){response.setHeader('Allow','GET, POST, OPTIONS');return response.status(405).json({ok:false,error:'method_not_allowed'});}
  const data=validateDonation(request.body);if(data.error)return response.status(400).json({ok:false,error:data.error,message:'Enter $1 to $5,000 with at most two decimal places and a valid email.'});
  if(!key)return response.status(503).json({ok:false,error:'stripe_not_configured',message:'Custom-amount checkout is not connected. No session or payment was created.'});
  if(!/^(?:sk|rk)_(?:test|live)_/.test(key))return response.status(503).json({ok:false,error:'stripe_key_invalid'});
  const requestId=request.headers?.['idempotency-key'];if(typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))return response.status(400).json({ok:false,error:'idempotency_key_required'});
  try{
   const stripe=await makeStripe(key);
   const session=await stripe.checkout.sessions.create({mode:'payment',submit_type:'donate',customer_email:data.email,line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:data.cents,product_data:{name:"Donation to Leola's Library"}}}],success_url:SITE+'/donation-success.html?session_id={CHECKOUT_SESSION_ID}',cancel_url:SITE+'/donations-v2.html?cancelled=1',metadata:{leeway_product:'leolas-library',transaction_type:'donation',donor_name:data.name||'Anonymous',donor_message:data.message}},{idempotencyKey:'leola-'+requestId});
   const url=new URL(session.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com'||url.username||url.password)throw Error('Unexpected checkout destination');
   return response.status(200).json({ok:true,mode:'stripe-checkout-session',checkoutUrl:session.url,sessionId:session.id,paymentConfirmed:false});
  }catch{return response.status(502).json({ok:false,error:'stripe_checkout_failed',message:'Checkout could not be created. No payment has been confirmed.'});}
 };
}
export default createHandler();
