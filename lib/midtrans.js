import midtransClient from 'midtrans-client';
import crypto from 'crypto';

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Create Snap API instance
export function createSnapClient() {
  return new midtransClient.Snap({
    isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  });
}

/**
 * Create a Snap transaction and return the token
 */
export async function createSnapTransaction({ orderId, amount, productName, buyer }) {
  const snap = createSnapClient();

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

  const transaction = await snap.createTransaction(parameter);
  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
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
