import { useState } from 'react';
import StarRating from './StarRating.jsx';
import ReviewImageGallery from './ReviewImageGallery.jsx';
import { ReviewService } from '../../services/reviewService';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=500&auto=format&fit=crop';

export default function ReviewItem({
  review,
  onVoteHelpful,
  showProduct = false,
  onSelectProduct
}) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [hasVoted, setHasVoted] = useState(() => ReviewService.hasVotedHelpful(review.id));
  const [isVoting, setIsVoting] = useState(false);

  // QUY TẮC BẮT BUỘC: FE tuyệt đối không tự gán nhãn "Đã mua hàng".
  // Chỉ hiển thị khi Backend trả về trạng thái xác thực hợp lệ.
  const isVerifiedBuyer = Boolean(review.is_verified_buyer || review.is_purchased);

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Tạo ký tự avatar
  const getInitials = (name) => {
    if (!name) return 'KH';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleHelpfulClick = async () => {
    if (hasVoted || isVoting) return;

    setIsVoting(true);
    try {
      const result = await ReviewService.voteHelpful(review.product_id, review.id);
      if (result.success) {
        setHelpfulCount(prev => prev + 1);
        setHasVoted(true);
        if (onVoteHelpful) onVoteHelpful(review.id);
      }
    } catch (err) {
      console.error('Lỗi vote hữu ích:', err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleProductClick = (e) => {
    e.stopPropagation();
    if (onSelectProduct && review.product_id) {
      onSelectProduct(review.product_id);
    }
  };

  return (
    <div className="review-item-card">
      <div className="review-item-header">
        {/* Avatar */}
        <div className="review-avatar">
          {review.author_avatar ? (
            <img src={review.author_avatar} alt={review.author_name} />
          ) : (
            <div className="review-avatar-fallback">
              {getInitials(review.author_name)}
            </div>
          )}
        </div>

        {/* User Info & Rating */}
        <div className="review-user-info">
          <div className="review-author-line">
            <h4 className="review-author-name">{review.author_name || 'Khách hàng'}</h4>

            {/* CHỈ HIỂN THỊ KHI BACKEND TRẢ VỀ TRẠNG THÁI XÁC THỰC */}
            {isVerifiedBuyer && (
              <span className="review-verified-badge" title="Đã xác thực đơn hàng thành công từ hệ thống">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Đã mua hàng
              </span>
            )}
          </div>

          <div className="review-meta-row">
            <StarRating value={review.rating} size={15} readOnly={true} />
            <span className="review-date-dot">•</span>
            <span className="review-date">{formatDate(review.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Nội dung đánh giá */}
      <div className="review-comment-body">
        <p>{review.comment}</p>
      </div>

      {/* Hình ảnh thực tế đính kèm */}
      {Array.isArray(review.images) && review.images.length > 0 && (
        <ReviewImageGallery images={review.images} />
      )}

      {/* KHỐI SẢN PHẨM ĐƯỢC ĐÁNH GIÁ (DÀNH CHO TAB TẤT CẢ ĐÁNH GIÁ KIỂU SHOPEE) */}
      {showProduct && (review.product_name || review.product_id) && (
        <div 
          className="review-product-box"
          onClick={handleProductClick}
          role="button"
          tabIndex={0}
          title={`Xem chi tiết sản phẩm: ${review.product_name || `Nước hoa #${review.product_id}`}`}
        >
          <div className="review-product-thumb">
            <img
              src={review.product_image || DEFAULT_PRODUCT_IMAGE}
              alt={review.product_name || 'Sản phẩm'}
              onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
            />
          </div>
          <div className="review-product-meta">
            <div className="review-product-label">Sản phẩm đánh giá:</div>
            <div className="review-product-name">{review.product_name || `Nước hoa #${review.product_id}`}</div>
            {review.brand && <div className="review-product-brand">{review.brand}</div>}
          </div>
          <div className="review-product-action">
            <span>Xem chi tiết</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      )}

      {/* Footer tương tác: Nút Hữu ích */}
      <div className="review-item-footer">
        <button
          type="button"
          className={`btn-helpful ${hasVoted ? 'voted' : ''}`}
          onClick={handleHelpfulClick}
          disabled={hasVoted || isVoting}
          title={hasVoted ? 'Bạn đã đánh giá nhận xét này hữu ích' : 'Nhận xét này hữu ích với bạn?'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span>Hữu ích ({helpfulCount})</span>
        </button>
      </div>

      <style>{`
        .review-item-card {
          background: rgba(22, 23, 34, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 14px;
          transition: border-color 0.2s, background 0.2s;
        }
        .review-item-card:hover {
          border-color: rgba(212, 175, 55, 0.25);
          background: rgba(28, 29, 42, 0.7);
        }
        .review-item-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .review-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 1.5px solid rgba(212, 175, 55, 0.4);
        }
        .review-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .review-avatar-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1f2030, #2c2918);
          color: #f5d77f;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0.5px;
        }
        .review-user-info {
          flex: 1;
        }
        .review-author-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 3px;
          flex-wrap: wrap;
        }
        .review-author-name {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #f2f2f3;
        }
        .review-verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(46, 125, 50, 0.18);
          border: 1px solid rgba(74, 222, 128, 0.35);
          color: #4ade80;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 12px;
          letter-spacing: 0.2px;
        }
        .review-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .review-date-dot {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.8rem;
        }
        .review-date {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .review-comment-body {
          color: rgba(255, 255, 255, 0.88);
          font-size: 0.9rem;
          line-height: 1.55;
          margin-bottom: 12px;
        }
        .review-comment-body p {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Shopee-style Attached Product Box */
        .review-product-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(16, 17, 26, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 3px solid #d4af37;
          border-radius: 8px;
          padding: 8px 12px;
          margin-top: 10px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .review-product-box:hover {
          background: rgba(25, 27, 40, 0.95);
          border-color: rgba(212, 175, 55, 0.5);
          transform: translateX(3px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        }
        .review-product-thumb {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          background: #0b0c12;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .review-product-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .review-product-meta {
          flex: 1;
          min-width: 0;
        }
        .review-product-label {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .review-product-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #f5d77f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .review-product-brand {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .review-product-action {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          color: #a8927a;
          font-weight: 500;
          flex-shrink: 0;
        }
        .review-product-box:hover .review-product-action {
          color: #d4af37;
        }

        .review-item-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .btn-helpful {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.65);
          border-radius: 18px;
          padding: 4px 12px;
          font-size: 0.78rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-helpful:hover:not(:disabled) {
          border-color: #d4af37;
          color: #f5d77f;
          background: rgba(212, 175, 55, 0.08);
        }
        .btn-helpful.voted {
          background: rgba(212, 175, 55, 0.16);
          border-color: #d4af37;
          color: #f5d77f;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
