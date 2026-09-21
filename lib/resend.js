import { Resend } from 'resend';

let resend;
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
  }
  return resend;
}

/**
 * Send account credentials via email
 */
export async function sendAccountEmail({ to, buyerName, productName, email, password, extra, orderNumber }) {
  try {
    const { data, error } = await getResend().emails.send({
      from: 'Mediea Premium <noreply@mediapremium.com>',
      to: [to],
      subject: `✅ Akun ${productName} Kamu Sudah Siap! — ${orderNumber}`,
      html: generateEmailTemplate({ buyerName, productName, email, password, extra, orderNumber }),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email send failed:', err);
    return { success: false, error: err.message };
  }
}

function generateEmailTemplate({ buyerName, productName, email, password, extra, orderNumber }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Montserrat',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#00E676;font-size:24px;margin:0;">MEDIEA PREMIUM</h1>
          <p style="color:#666;font-size:14px;margin-top:8px;">Akun Premium, Instan & Terpercaya</p>
        </div>
        
        <!-- Main Card -->
        <div style="background:#111111;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.08);">
          <p style="color:#fff;font-size:16px;margin:0 0 8px;">Halo <strong>${buyerName}</strong>,</p>
          <p style="color:#a0a0a0;font-size:14px;margin:0 0 24px;">Pembayaran kamu untuk <strong style="color:#00E676;">${productName}</strong> telah berhasil! Berikut data akun kamu:</p>
          
          <!-- Account Box -->
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border-left:4px solid #00E676;">
            <div style="margin-bottom:16px;">
              <p style="color:#666;font-size:12px;text-transform:uppercase;margin:0 0 4px;">Email / Username</p>
              <p style="color:#fff;font-size:16px;font-weight:600;margin:0;font-family:monospace;background:#0a0a0a;padding:8px 12px;border-radius:6px;">${email}</p>
            </div>
            <div style="margin-bottom:${extra ? '16px' : '0'};">
              <p style="color:#666;font-size:12px;text-transform:uppercase;margin:0 0 4px;">Password</p>
              <p style="color:#fff;font-size:16px;font-weight:600;margin:0;font-family:monospace;background:#0a0a0a;padding:8px 12px;border-radius:6px;">${password}</p>
            </div>
            ${extra ? `
            <div>
              <p style="color:#666;font-size:12px;text-transform:uppercase;margin:0 0 4px;">Info Tambahan</p>
              <p style="color:#fff;font-size:14px;margin:0;font-family:monospace;background:#0a0a0a;padding:8px 12px;border-radius:6px;">${extra}</p>
            </div>
            ` : ''}
          </div>
          
          <!-- Order Info -->
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="color:#666;font-size:12px;margin:0;">Order Number: <span style="color:#a0a0a0;">${orderNumber}</span></p>
          </div>
        </div>
        
        <!-- Warning -->
        <div style="margin-top:24px;padding:16px;background:rgba(255,82,82,0.1);border-radius:12px;border:1px solid rgba(255,82,82,0.2);">
          <p style="color:#FF5252;font-size:13px;margin:0;">⚠️ Jangan bagikan data akun ini kepada siapapun. Simpan email ini sebagai bukti pembelian.</p>
        </div>
        
        <!-- Footer -->
        <div style="text-align:center;margin-top:32px;">
          <p style="color:#666;font-size:12px;margin:0;">© ${new Date().getFullYear()} Mediea Premium. All rights reserved.</p>
          <p style="color:#666;font-size:12px;margin:4px 0 0;">Butuh bantuan? Hubungi kami via WhatsApp.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
