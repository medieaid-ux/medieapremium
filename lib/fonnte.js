/**
 * Send WhatsApp message via Fonnte API
 */
export async function sendAccountWhatsApp({ phone, buyerName, productName, email, password, extra, orderNumber }) {
  // Format phone number (ensure starts with 62)
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('62')) {
    formattedPhone = '62' + formattedPhone;
  }

  const message = `✅ *MEDIEA PREMIUM*
━━━━━━━━━━━━━━━━

Halo *${buyerName}*! 👋
Pembayaran kamu untuk *${productName}* telah berhasil.

📦 *Data Akun Kamu:*
━━━━━━━━━━━━━━━━
📧 Email: \`${email}\`
🔑 Password: \`${password}\`${extra ? `\n📌 Info Tambahan: \`${extra}\`` : ''}
━━━━━━━━━━━━━━━━

🧾 Order: ${orderNumber}

⚠️ _Jangan bagikan data akun ini kepada siapapun._
💬 _Ada kendala? Balas pesan ini._

Terima kasih! 🙏
_Mediea Premium — Akun Premium, Instan & Terpercaya_`;

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: process.env.FONNTE_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message,
        delay: '1',
      }),
    });

    const data = await response.json();

    if (data.status) {
      return { success: true, data };
    } else {
      console.error('Fonnte error:', data);
      return { success: false, error: data.reason || 'Unknown error' };
    }
  } catch (err) {
    console.error('WhatsApp send failed:', err);
    return { success: false, error: err.message };
  }
}
