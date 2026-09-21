'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product }) {
  const stockCount = product.stock_count || 0;
  const isAvailable = stockCount > 0 && product.is_active;
  const isLowStock = stockCount > 0 && stockCount <= 5;

  return (
    <div className={`product-card ${!isAvailable ? 'product-card--sold-out' : ''}`}>
      <div className="product-card__header">
        <div className="product-card__icon">
          {product.icon_url ? (
            <img src={product.icon_url} alt={product.name} />
          ) : (
            <span style={{
              fontSize: 'var(--text-11)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.02em',
            }}>
              {product.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="product-card__info">
          <h3 className="product-card__name">{product.name}</h3>
          <span className="product-card__category">{product.category || 'Digital'}</span>
        </div>
      </div>

      {product.description && (
        <p className="product-card__description">{product.description}</p>
      )}

      <div className="product-card__footer">
        <div>
          <div className="product-card__price">
            {formatPrice(product.price)}
            {product.duration && (
              <span className="product-card__price-duration">/{product.duration}</span>
            )}
          </div>
          {isAvailable ? (
            <span className={`product-card__stock-badge ${isLowStock ? 'product-card__stock-badge--low' : 'product-card__stock-badge--available'}`}>
              {isLowStock ? `Sisa ${stockCount}` : 'Tersedia'}
            </span>
          ) : (
            <span className="product-card__stock-badge product-card__stock-badge--empty">
              Habis
            </span>
          )}
        </div>

        {isAvailable && (
          <Link href={`/checkout/${product.id}`} className="product-card__buy-btn">
            Beli
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
