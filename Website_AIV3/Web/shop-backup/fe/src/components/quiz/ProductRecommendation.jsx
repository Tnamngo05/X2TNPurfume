import { useState } from 'react';
import { formatPrice } from '../../lib/productUtils';
import { useNavigate } from 'react-router-dom';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=500&auto=format&fit=crop';

export default function ProductRecommendation({
  answers,
  recommendations = [],
  onRetakeQuiz,
  onClose,
  onAddToCart,
  onViewProduct
}) {
  const navigate = useNavigate();
  const [addedIds, setAddedIds] = useState([]);

  const handleAdd = (product, e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
    setAddedIds(prev => [...prev, product.id]);
    setTimeout(() => {
      setAddedIds(prev => prev.filter(id => id !== product.id));
    }, 2000);
  };

  const handleProductClick = (product) => {
    if (onViewProduct) {
      onViewProduct(product);
    } else {
      if (onClose) onClose();
      navigate(`/products/${product.id}`);
    }
  };

  return (
    <div className="recommendation-container">
      {/* Header & Lời cảm ơn */}
      <div className="recommendation-header">
        <div className="recommendation-badge-gold">
          <span>✨ Gợi ý độc bản dành riêng cho bạn</span>
        </div>
        <h2 className="recommendation-title">Hương Thơm Định Hình Phong Cách Của Bạn</h2>
        <p className="recommendation-desc">
          Dựa trên câu trả lời khảo sát, chuyên gia mùi hương của X2TN Perfume đã chọn lọc những chai nước hoa hòa hợp nhất với cảm xúc, khí chất và ngân sách của bạn.
        </p>

        {/* Tóm tắt profile cá nhân */}
        <div className="recommendation-profile-tags">
          {answers?.gender && (
            <span className="profile-tag">👤 {answers.gender}</span>
          )}
          {Array.isArray(answers?.fragrance_families) && answers.fragrance_families.length > 0 && (
            <span className="profile-tag">🌸 {answers.fragrance_families.join(', ')}</span>
          )}
          {Array.isArray(answers?.styles) && answers.styles.length > 0 && (
            <span className="profile-tag">💎 {answers.styles.join(', ')}</span>
          )}
          {answers?.occasions && (
            <span className="profile-tag">🎯 {answers.occasions}</span>
          )}
        </div>
      </div>

      {/* Danh sách gợi ý */}
      <div className="recommendation-list">
        {recommendations.length === 0 ? (
          <div className="recommendation-empty">
            <p>Đang tải danh sách gợi ý phù hợp...</p>
          </div>
        ) : (
          recommendations.map((item) => {
            const isAdded = addedIds.includes(item.id);

            return (
              <div 
                key={item.id} 
                className="recommendation-card"
                onClick={() => handleProductClick(item)}
              >
                <div className="card-image-wrap">
                  <img
                    src={item.image || item.image_url || DEFAULT_IMAGE}
                    alt={item.name}
                    onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
                  />
                  {item.matchScore && (
                    <div className="card-match-badge">
                      <span className="match-num">{item.matchScore}%</span>
                      <span className="match-label">Tương thích</span>
                    </div>
                  )}
                </div>

                <div className="card-body-wrap">
                  <div className="card-brand">{item.brand || 'X2TN Selection'}</div>
                  <h4 className="card-name">{item.name}</h4>
                  
                  <div className="card-match-reasons">
                    {item.matchReasons?.slice(0, 2).map((reason, rIdx) => (
                      <span key={rIdx} className="match-reason-pill">
                        ✓ {reason}
                      </span>
                    ))}
                  </div>

                  <div className="card-footer-wrap">
                    <div className="card-price">
                      {formatPrice(item.price)}
                    </div>
                    
                    <div className="card-actions-group">
                      <button
                        type="button"
                        className="btn-card-detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(item);
                        }}
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        className={`btn-card-add ${isAdded ? 'added' : ''}`}
                        onClick={(e) => handleAdd(item, e)}
                        disabled={isAdded}
                      >
                        {isAdded ? '✓ Đã thêm' : '+ Giỏ hàng'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="recommendation-footer">
        <button
          type="button"
          className="btn-quiz-retake"
          onClick={onRetakeQuiz}
        >
          🔄 Làm lại khảo sát
        </button>
        <button
          type="button"
          className="btn-quiz-finish"
          onClick={onClose}
        >
          Khám phá thêm sản phẩm khác
        </button>
      </div>

      <style>{`
        .recommendation-container {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .recommendation-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .recommendation-badge-gold {
          display: inline-block;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #f5d77f;
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .recommendation-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #f2f2f3;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #ffffff 40%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .recommendation-desc {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 620px;
          margin: 0 auto 16px auto;
          line-height: 1.45;
        }
        .recommendation-profile-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .profile-tag {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.76rem;
          padding: 4px 10px;
          border-radius: 14px;
        }
        .recommendation-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          max-height: 380px;
          overflow-y: auto;
          padding: 4px;
          margin-bottom: 24px;
        }
        .recommendation-list::-webkit-scrollbar {
          width: 6px;
        }
        .recommendation-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .recommendation-list::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }
        .recommendation-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px;
          color: rgba(255, 255, 255, 0.5);
        }
        .recommendation-card {
          background: rgba(24, 25, 36, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
        }
        .recommendation-card:hover {
          border-color: rgba(212, 175, 55, 0.45);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }
        .card-image-wrap {
          position: relative;
          height: 140px;
          background: #0f1017;
          overflow: hidden;
        }
        .card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .recommendation-card:hover .card-image-wrap img {
          transform: scale(1.05);
        }
        .card-match-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(11, 11, 12, 0.85);
          backdrop-filter: blur(6px);
          border: 1px solid #d4af37;
          padding: 3px 8px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .match-num {
          color: #f5d77f;
          font-weight: 800;
          font-size: 0.82rem;
          line-height: 1;
        }
        .match-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.65rem;
          text-transform: uppercase;
        }
        .card-body-wrap {
          padding: 12px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .card-brand {
          font-size: 0.75rem;
          color: #a8927a;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .card-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 6px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-match-reasons {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }
        .match-reason-pill {
          font-size: 0.72rem;
          color: #8ce196;
          background: rgba(46, 125, 50, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-footer-wrap {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .card-price {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f5d77f;
        }
        .card-actions-group {
          display: flex;
          gap: 6px;
        }
        .btn-card-detail {
          padding: 5px 9px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-card-detail:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .btn-card-add {
          padding: 5px 10px;
          border-radius: 8px;
          background: linear-gradient(135deg, #a8927a, #d4af37);
          border: none;
          color: #0b0b0c;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-card-add:hover {
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
        }
        .btn-card-add.added {
          background: #2e7d32;
          color: #fff;
        }
        .recommendation-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 16px;
        }
        .btn-quiz-retake {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-quiz-retake:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .btn-quiz-finish {
          background: linear-gradient(135deg, #a8927a, #d4af37);
          border: none;
          color: #0b0b0c;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-quiz-finish:hover {
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.4);
        }
        @media (max-width: 600px) {
          .recommendation-list {
            grid-template-columns: 1fr;
            max-height: 320px;
          }
          .recommendation-footer {
            flex-direction: column;
          }
          .recommendation-footer button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
