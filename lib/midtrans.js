import crypto from 'crypto';

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const BASE_URL = isProduction
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com';

/**
 * Create a Snap transaction and return the token
 * Uses Midtrans REST API directly (no midtrans-client dependency)
 */
export async function createSnapTransaction({ orderId, amount, productName, buyer }) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const authString = Buffer.from(serverKey + ':').toString('base64');

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: [
      {
        id: orderId,
        price: amount,
        quantity: 1,
        name: productName,
      },
    ],
    customer_details: {
      first_name: buyer.name,
      email: buyer.email,
      phone: buyer.whatsapp,
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/success/${orderId}`,
    },
  };

  const response = await fetch(`${BASE_URL}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(parameter),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Midtrans Snap API error:', response.status, errorBody);
    throw new Error(`Midtrans API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    token: data.token,
    redirect_url: data.redirect_url,
  };
}

/**
 * Verify Midtrans webhook notification signature
 * Signature = SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifySignature({ orderId, statusCode, grossAmount, signatureKey }) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const payload = orderId + statusCode + grossAmount + serverKey;
  const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');
  return expectedSignature === signatureKey;
}
