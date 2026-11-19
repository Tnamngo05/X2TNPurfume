import { useEffect, useRef, useState } from 'react';
import { ChatAPI } from '../lib/api';
import { formatPrice } from '../lib/productUtils';

// Component AI gợi ý sản phẩm khi xem chi tiết.
// Không tự động gọi API — chỉ chạy khi người dùng bấm nút, tránh làm chậm trang.
export default function AIRecommendation({ productId, onViewDetail }) {
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | empty | error
  const [data, setData] = useState({ intro: '', items: [] });
  const trackRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setStatus('idle');
    setData({ intro: '', items: [] });
    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
  }, [productId]);

  const handleAskAI = async () => {
    if (!productId) return;
    const requestId = ++requestIdRef.current;
    setStatus('loading');
    try {
      const result = await ChatAPI.getRecommendation(productId);
      if (requestId !== requestIdRef.current) return;
      const items = Array.isArray(result?.items)
        ? result.items.filter(item => item && item.id && item.name && Number.isFinite(Number(item.price)))
        : [];
      setData({ intro: typeof result?.intro === 'string' ? result.intro.trim() : '', items });
      setStatus(items.length > 0 ? 'loaded' : 'empty');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setStatus('error');
    }
  };

  const handleViewDetail = (product) => {
    ChatAPI.trackRecommendationClick(product.id, productId);
    onViewDetail?.(product);
  };

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.querySelector('.ai-reco-card')?.offsetWidth || 260;
    track.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
  };

  return (
    <section className="ai-reco-section">
      {status === 'idle' && (
        <button type="button" className="ai-reco-trigger-btn" onClick={handleAskAI}>
          ✨ Hỏi AI về sản phẩm này
        </button>
      )}

      {status === 'loading' && (
        <div>
          <div className="ai-reco-skeleton-intro shimmer" />
          <div className="ai-reco-track">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="ai-reco-card ai-reco-card-skeleton">
                <div className="ai-reco-image-skeleton shimmer" />
                <div className="ai-reco-skeleton-line shimmer" style={{ width: '60%' }} />
                <div className="ai-reco-skeleton-line shimmer" style={{ width: '85%' }} />
                <div className="ai-reco-skeleton-line shimmer" style={{ width: '45%' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="ai-reco-empty">
          <p>Không thể lấy gợi ý AI lúc này. Vui lòng thử lại sau.</p>
          <button type="button" className="ai-reco-retry-btn" onClick={handleAskAI}>Thử lại</button>
        </div>
      )}

      {status === 'empty' && (
        <div className="ai-reco-empty">
          <p>AI chưa tìm thấy sản phẩm phù hợp để gợi ý thêm.</p>
        </div>
      )}

      {status === 'loaded' && (
        <div className="ai-reco-loaded">
          {data.intro && <div className="ai-reco-intro">🤖 {data.intro}</div>}
          <div className="ai-reco-carousel">
            {data.items.length > 3 && (
              <button type="button" className="ai-reco-nav ai-reco-nav-prev" onClick={() => scrollByCard(-1)} aria-label="Xem trước">
                ‹
              </button>
            )}
            <div className="ai-reco-track" ref={trackRef}>
              {data.items.map((item) => (
                <article key={item.id} className="ai-reco-card" onClick={() => handleViewDetail(item)}>
                  <div className="ai-reco-image-wrap">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="ai-reco-content">
                    {item.brand && <div className="ai-reco-brand">{item.brand}</div>}
                    <h4 className="ai-reco-title">{item.name}</h4>
                    {item.fragrance_family && (
                      <div className="ai-reco-family">Nhóm mùi: {item.fragrance_family}</div>
                    )}
                    <div className="ai-reco-price">{formatPrice(item.price)}</div>
                    <p className="ai-reco-short-intro">{item.short_intro}</p>
                    {Array.isArray(item.reason) && item.reason.length > 0 && (
                      <div className="ai-reco-reason-list">
                        {item.reason.map((reason) => (
                          <span key={reason} className="ai-reco-reason-tag">✓ {reason}</span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className="ai-reco-view-btn"
                      onClick={(event) => { event.stopPropagation(); handleViewDetail(item); }}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {data.items.length > 3 && (
              <button type="button" className="ai-reco-nav ai-reco-nav-next" onClick={() => scrollByCard(1)} aria-label="Xem tiếp">
                ›
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .ai-reco-section {
          margin: 24px 0 36px;
        }

        .ai-reco-trigger-btn {
          border: 1px solid rgba(197, 165, 114, 0.5);
          background: rgba(197, 165, 114, 0.1);
          color: #c5a572;
          border-radius: 999px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.24s ease;
        }

        .ai-reco-trigger-btn:hover {
          background: rgba(197, 165, 114, 0.22);
          border-color: rgba(197, 165, 114, 0.9);
        }

        .ai-reco-intro {
          color: #e5d9c3;
          background: rgba(197, 165, 114, 0.08);
          border: 1px solid rgba(197, 165, 114, 0.25);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.55;
        }

        .ai-reco-carousel {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-reco-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          padding-bottom: 6px;
          flex: 1;
          scrollbar-width: thin;
        }

        .ai-reco-nav {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(197, 165, 114, 0.4);
          background: rgba(20, 20, 20, 0.8);
          color: #c5a572;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .ai-reco-nav:hover {
          background: rgba(197, 165, 114, 0.2);
        }

        .ai-reco-card {
          scroll-snap-align: start;
          flex: 0 0 auto;
          width: 260px;
          background: rgba(20, 20, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
          display: flex;
          flex-direction: column;
        }

        .ai-reco-card:hover {
          transform: translateY(-6px);
          border-color: rgba(197, 165, 114, 0.5);
          box-shadow: 0 20px 36px rgba(0, 0, 0, 0.45);
        }

        .ai-reco-image-wrap {
          aspect-ratio: 1 / 1;
          background: #fff;
          padding: 16px;
          overflow: hidden;
        }

        .ai-reco-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.35s ease;
        }

        .ai-reco-card:hover .ai-reco-image-wrap img {
          transform: scale(1.05);
        }

        .ai-reco-content {
          padding: 12px 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ai-reco-brand {
          font-size: 11px;
          color: #c5a572;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-reco-title {
          margin: 0;
          color: #fff;
          font-size: 14px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ai-reco-family {
          font-size: 12px;
          color: #9ca3af;
        }

        .ai-reco-price {
          color: #c5a572;
          font-size: 16px;
          font-weight: 600;
        }

        .ai-reco-short-intro {
          margin: 2px 0 4px;
          color: #a6adb9;
          font-size: 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ai-reco-reason-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 4px;
        }

        .ai-reco-reason-tag {
          font-size: 10.5px;
          color: #d8c3a3;
          border: 1px solid rgba(197, 165, 114, 0.32);
          border-radius: 999px;
          padding: 3px 7px;
          background: rgba(197, 165, 114, 0.08);
        }

        .ai-reco-view-btn {
          margin-top: 4px;
          width: 100%;
          min-height: 36px;
          border: 1px solid rgba(197, 165, 114, 0.4);
          color: #c5a572;
          background: transparent;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.24s ease;
        }

        .ai-reco-view-btn:hover {
          background: rgba(197, 165, 114, 0.18);
          border-color: rgba(197, 165, 114, 0.8);
        }

        .ai-reco-empty {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.2);
          padding: 18px 20px;
          color: #9ca3af;
          text-align: center;
        }

        .ai-reco-retry-btn {
          margin-top: 10px;
          border: 1px solid rgba(197, 165, 114, 0.4);
          background: transparent;
          color: #c5a572;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 13px;
          cursor: pointer;
        }

        .ai-reco-skeleton-intro {
          height: 44px;
          border-radius: 12px;
          background: #20222b;
          margin-bottom: 16px;
        }

        .ai-reco-card-skeleton {
          cursor: default;
          pointer-events: none;
          padding-bottom: 14px;
        }

        .ai-reco-image-skeleton {
          aspect-ratio: 1/1;
          background: #20222b;
        }

        .ai-reco-skeleton-line {
          height: 10px;
          border-radius: 999px;
          background: #20222b;
          margin: 10px 14px 0;
        }

        .shimmer {
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 220% 100%;
          animation: aiRecoShimmer 1.25s linear infinite;
        }

        @keyframes aiRecoShimmer {
          from { background-position: 100% 0; }
          to { background-position: -120% 0; }
        }

        @media (max-width: 639px) {
          .ai-reco-card {
            width: 220px;
          }
          .ai-reco-nav {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
