import { useEffect, useState } from 'react';
import { ProductsAPI } from '../lib/api';
import { formatPrice } from '../lib/productUtils';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=500&auto=format&fit=crop';
const MAX_RELATED_SCORE = 155;
const REASON_PRIORITY = {
  'Cùng thương hiệu': 1,
  'Cùng nhóm mùi': 2,
  'Cùng giới tính': 3,
  'Cùng danh mục': 4,
  'Cùng khoảng giá': 5,
  'Giá tương đương': 5,
};
const REASON_LABEL = {
  'Cùng thương hiệu': 'Cùng thương hiệu',
  'Cùng nhóm mùi': 'Cùng nhóm mùi',
  'Cùng giới tính': 'Cùng giới tính',
  'Cùng danh mục': 'Cùng danh mục',
  'Cùng khoảng giá': 'Giá tương đương',
  'Giá tương đương': 'Giá tương đương',
};

const sortReasonsByPriority = (reasons = []) => {
  return [...reasons].sort((a, b) => {
    const pa = REASON_PRIORITY[a] || 999;
    const pb = REASON_PRIORITY[b] || 999;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
};

const getRelevancePercent = (score = 0) => {
  const safeScore = Number(score || 0);
  const percent = Math.round((safeScore / MAX_RELATED_SCORE) * 100);
  return Math.max(1, Math.min(100, percent));
};

const getSaleBadge = (product) => {
  if (product?.sale_label) return String(product.sale_label);

  const discountPercent = Number(product?.discount_percent || 0);
  if (Number.isFinite(discountPercent) && discountPercent > 0) {
    return `-${Math.round(discountPercent)}%`;
  }

  const originalPrice = Number(product?.original_price || 0);
  const price = Number(product?.price || 0);
  if (originalPrice > price && price > 0) {
    const percent = Math.round(((originalPrice - price) / originalPrice) * 100);
    if (percent > 0) return `-${percent}%`;
  }

  return '';
};

export default function RelatedProducts({ productId, onViewDetail, onAddToCart, onBackToList }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setItems([]);
      return;
    }

    const loadRelated = async () => {
      setLoading(true);
      try {
        const data = await ProductsAPI.related(productId);
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadRelated();
  }, [productId]);

  const handleCardClick = (product) => {
    onViewDetail?.(product);
  };

  const handleViewDetailClick = (event, product) => {
    event.stopPropagation();
    onViewDetail?.(product);
  };

  const handleAddToCartClick = (event, product) => {
    event.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <section className="related-products-section">
      <h3 className="related-products-title">Sản phẩm liên quan</h3>

      {loading ? (
        <div className="related-products-grid" aria-label="Đang tải sản phẩm liên quan">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="related-card related-card-skeleton">
              <div className="related-image-skeleton shimmer" />
              <div className="related-content-skeleton">
                <div className="skeleton-line skeleton-brand shimmer" />
                <div className="skeleton-line skeleton-title shimmer" />
                <div className="skeleton-line skeleton-title-short shimmer" />
                <div className="skeleton-line skeleton-price shimmer" />
                <div className="skeleton-badges">
                  <span className="skeleton-badge shimmer" />
                  <span className="skeleton-badge shimmer" />
                </div>
                <div className="skeleton-actions">
                  <span className="skeleton-btn shimmer" />
                  <span className="skeleton-btn shimmer" />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="related-empty-state">
          <div className="related-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M10 3H4a1 1 0 000 2h1.26l1.9 8.1A2 2 0 009.1 15h8.38a2 2 0 001.95-1.55L21 7H8.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="19" r="1.5" fill="currentColor"/>
              <circle cx="17" cy="19" r="1.5" fill="currentColor"/>
              <path d="M7 9h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p>Không tìm thấy sản phẩm liên quan</p>
          <button
            type="button"
            className="related-back-btn"
            onClick={() => onBackToList?.()}
          >
            Quay lại danh sách
          </button>
        </div>
      ) : (
        <div className="related-products-grid">
          {items.map((p, index) => {
            const reasons = sortReasonsByPriority(p.reason || []);
            const saleBadge = getSaleBadge(p);
            const relevancePercent = getRelevancePercent(p.score);
            return (
            <article
              key={p.id}
              className="related-card related-fade-up"
              style={{ '--delay': `${index * 70}ms` }}
              onClick={() => handleCardClick(p)}
            >
              <div className="related-image-wrap">
                {saleBadge && <span className="related-sale-badge">{saleBadge || 'SALE'}</span>}
                <img
                  src={p.image_url || FALLBACK_IMAGE}
                  alt={p.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
              <div className="related-card-content">
                <div className="related-brand">{p.brand || 'Luxury Brand'}</div>
                <h4 className="related-title">{p.name}</h4>
                <div className="related-price">{formatPrice(p.price)}</div>
              </div>
              <div className="related-reason-list">
                {reasons.map((reason) => (
                  <span key={reason} className="related-reason-tag">
                    ✓ {REASON_LABEL[reason] || reason}
                  </span>
                ))}
              </div>
              <div className="related-score">⭐ Độ liên quan: {relevancePercent}%</div>
              <div className="related-actions">
                <button
                  type="button"
                  className="related-action-btn"
                  onClick={(event) => handleViewDetailClick(event, p)}
                >
                  Xem chi tiết
                </button>
                <button
                  type="button"
                  className="related-action-btn"
                  onClick={(event) => handleAddToCartClick(event, p)}
                  disabled={Number(p.stock || 0) <= 0}
                >
                  {Number(p.stock || 0) > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                </button>
              </div>
            </article>
          )})}
        </div>
      )}

      <style jsx>{`
        .related-products-section {
          margin-bottom: 36px;
        }

        .related-products-title {
          font-size: 24px;
          color: #f2f2f3;
          margin: 0 0 18px;
          letter-spacing: 0.3px;
        }

        .related-products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .related-card {
          background: rgba(20, 20, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
          display: flex;
          flex-direction: column;
          min-height: 100%;
        }

        .related-card:hover {
          transform: translateY(-6px);
          border-color: rgba(197, 165, 114, 0.5);
          box-shadow: 0 20px 36px rgba(0, 0, 0, 0.45);
        }

        .related-image-wrap {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #fff;
          padding: 18px;
          overflow: hidden;
        }

        .related-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.35s ease;
        }

        .related-card:hover .related-image-wrap img {
          transform: scale(1.05);
        }

        .related-sale-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          background: linear-gradient(135deg, #d44b4b, #b91c1c);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 999px;
          letter-spacing: 0.3px;
        }

        .related-card-content {
          padding: 14px 14px 8px;
        }

        .related-brand {
          font-size: 12px;
          color: #c5a572;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .related-title {
          margin: 0;
          color: #fff;
          font-size: 14px;
          line-height: 1.45;
          min-height: 40px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .related-price {
          margin-top: 10px;
          color: #c5a572;
          font-size: 18px;
          font-weight: 600;
        }

        .related-reason-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 14px 8px;
        }

        .related-reason-tag {
          font-size: 11px;
          color: #d8c3a3;
          border: 1px solid rgba(197, 165, 114, 0.32);
          border-radius: 999px;
          padding: 4px 8px;
          line-height: 1.2;
          background: rgba(197, 165, 114, 0.08);
        }

        .related-score {
          padding: 0 14px 10px;
          font-size: 12px;
          color: #a6adb9;
        }

        .related-actions {
          padding: 0 14px 14px;
          margin-top: auto;
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr;
        }

        .related-action-btn {
          width: 100%;
          min-height: 38px;
          border: 1px solid rgba(197, 165, 114, 0.4);
          color: #c5a572;
          background: transparent;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.24s ease;
        }

        .related-action-btn:hover:not(:disabled) {
          background: rgba(197, 165, 114, 0.18);
          border-color: rgba(197, 165, 114, 0.8);
        }

        .related-action-btn:disabled {
          border-color: rgba(255, 255, 255, 0.12);
          color: #626872;
          cursor: not-allowed;
        }

        .related-empty-state {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.2);
          text-align: center;
          padding: 26px 20px;
        }

        .related-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(197, 165, 114, 0.1);
          color: #c5a572;
        }

        .related-empty-icon svg {
          width: 28px;
          height: 28px;
        }

        .related-empty-state p {
          margin: 0 0 14px;
          color: #9ca3af;
        }

        .related-back-btn {
          border: 1px solid rgba(197, 165, 114, 0.4);
          background: transparent;
          color: #c5a572;
          border-radius: 10px;
          padding: 9px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.24s ease;
        }

        .related-back-btn:hover {
          background: rgba(197, 165, 114, 0.18);
        }

        .related-fade-up {
          opacity: 0;
          transform: translateY(12px);
          animation: relatedFadeUp 0.45s ease forwards;
          animation-delay: var(--delay);
        }

        @keyframes relatedFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .related-card-skeleton {
          cursor: default;
          pointer-events: none;
        }

        .related-image-skeleton {
          aspect-ratio: 1/1;
          background: #20222b;
        }

        .related-content-skeleton {
          padding: 14px;
        }

        .skeleton-line {
          height: 10px;
          border-radius: 999px;
          background: #20222b;
          margin-bottom: 10px;
        }

        .skeleton-brand { width: 42%; }
        .skeleton-title { width: 94%; }
        .skeleton-title-short { width: 76%; }
        .skeleton-price { width: 38%; height: 12px; margin-top: 14px; }

        .skeleton-badges {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .skeleton-badge {
          width: 68px;
          height: 20px;
          border-radius: 999px;
          background: #20222b;
        }

        .skeleton-actions {
          margin-top: 14px;
          display: grid;
          gap: 8px;
        }

        .skeleton-btn {
          width: 100%;
          height: 36px;
          border-radius: 10px;
          background: #20222b;
        }

        .shimmer {
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 220% 100%;
          animation: relatedShimmer 1.25s linear infinite;
        }

        @keyframes relatedShimmer {
          from { background-position: 100% 0; }
          to { background-position: -120% 0; }
        }

        @media (max-width: 1279px) {
          .related-products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 991px) {
          .related-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 639px) {
          .related-products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
