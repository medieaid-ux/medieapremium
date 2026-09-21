/**
 * Generate order number: MP-YYYYMMDD-XXXXX
 */
export function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MP-${date}-${random}`;
}

/**
 * Format price to IDR currency
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate Indonesian phone number
 */
export function isValidWhatsApp(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Parse bulk stock text input into array of accounts
 * Format: email|password|extra_info (one per line)
 */
export function parseBulkStock(text) {
  const lines = text.trim().split('\n').filter((line) => line.trim());
  const accounts = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = line.trim().split('|');
    if (parts.length < 2) {
      errors.push(`Baris ${index + 1}: Format tidak valid (min: email|password)`);
      return;
    }

    const email = parts[0].trim();
    const password = parts[1].trim();
    const extra = parts[2]?.trim() || null;

    if (!email || !password) {
      errors.push(`Baris ${index + 1}: Email atau password kosong`);
      return;
    }

    accounts.push({ email, password, extra });
  });

  return { accounts, errors };
}

/**
 * Get relative time string (e.g., "2 menit lalu")
 */
export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID');
}

/**
 * Status badge color mapping
 */
export function getStatusColor(status) {
  const colors = {
    pending: { bg: 'rgba(255, 193, 7, 0.15)', text: '#FFC107' },
    paid: { bg: 'rgba(0, 230, 118, 0.15)', text: '#00E676' },
    delivered: { bg: 'rgba(0, 230, 118, 0.15)', text: '#00E676' },
    expired: { bg: 'rgba(255, 82, 82, 0.15)', text: '#FF5252' },
    failed: { bg: 'rgba(255, 82, 82, 0.15)', text: '#FF5252' },
    available: { bg: 'rgba(0, 230, 118, 0.15)', text: '#00E676' },
    reserved: { bg: 'rgba(255, 193, 7, 0.15)', text: '#FFC107' },
    sold: { bg: 'rgba(102, 102, 102, 0.15)', text: '#666666' },
  };
  return colors[status] || colors.pending;
}
