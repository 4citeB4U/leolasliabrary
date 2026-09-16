import Stripe from 'stripe';

const MIN_DONATION_CENTS = 100;
const MAX_DONATION_CENTS = 500000;
const LEGACY_PAYMENT_LINK = 'https://buy.stripe.com/7sI0282DR9075u87sw';
const FALLBACK_SITE = 'https://leolasliabrary.vercel.app';

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function getBaseUrl(request) {
  const configured = process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const proto = request.headers['x-forwarded-proto'] || 'https';
  return host ? `${proto}://${host}` : FALLBACK_SITE;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    return response.status(200).json({
      ok: true,
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      dynamicCheckout: Boolean(process.env.STRIPE_SECRET_KEY),
      legacyFallbackAvailable: true
    });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = request.body || {};
  const amount = Number(body.amount);
  const amountCents = Math.round(amount * 100);
  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 254).toLowerCase();
  const message = cleanText(body.message, 500);

  if (!Number.isFinite(amount) || amountCents < MIN_DONATION_CENTS || amountCents > MAX_DONATION_CENTS) {
    return response.status(400).json({
      ok: false,
      error: 'invalid_amount',
      message: 'Donation must be between $1 and $5,000.'
    });
  }

  if (!email || !email.includes('@')) {
    return response.status(400).json({
      ok: false,
      error: 'invalid_email',
      message: 'A valid email address is required.'
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return response.status(200).json({
      ok: true,
      mode: 'legacy-payment-link',
      checkoutUrl: LEGACY_PAYMENT_LINK,
      warning: 'Dynamic Stripe Checkout is not configured on this deployment yet.'
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const site = getBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'donate',
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: "Donation to Leola's Library",
              description: "Supports Leola's books, crochet education, videos, games, and community learning."
            }
          }
        }
      ],
      success_url: `${site}/donation-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/donations-v2.html?cancelled=1`,
      metadata: {
        leeway_product: 'leolas-library',
        transaction_type: 'donation',
        donor_name: name || 'Anonymous',
        donor_message: message || ''
      }
    });

    return response.status(200).json({
      ok: true,
      mode: 'stripe-checkout-session',
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Leola donation checkout creation failed', {
      type: error?.type || 'unknown',
      code: error?.code || 'unknown'
    });

    return response.status(502).json({
      ok: false,
      error: 'stripe_checkout_failed',
      message: 'Stripe could not create the checkout session.'
    });
  }
}
