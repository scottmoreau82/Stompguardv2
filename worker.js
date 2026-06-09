addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (request.method === 'POST' && new URL(request.url).pathname === '/checkout') {
    try {
      const { items } = await request.json();

      // Create Stripe Checkout Session
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('success_url', 'https://stompguard.com/success.html');
      params.append('cancel_url', 'https://stompguard.com/');
      params.append('shipping_address_collection[allowed_countries][]', 'US');

      items.forEach((item, i) => {
        params.append(`line_items[${i}][price]`, item.price);
        params.append(`line_items[${i}][quantity]`, item.quantity);
      });

      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const session = await stripeResponse.json();

      if (session.url) {
        return new Response(JSON.stringify({ url: session.url }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      } else {
        return new Response(JSON.stringify({ error: session.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Not found', { status: 404 });
}
