import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StarRating from './StarRating.jsx';
import { ReviewService } from '../../services/reviewService';
import { readJsonStorage } from '../../lib/api';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export default function ReviewForm({ productId, isOpen, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const mouseDownOnBackdropRef = useRef(false);

  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]); // mảng base64 url
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  // Khởi tạo và đồng bộ form khi Modal được mở
  useEffect(() => {
    if (isOpen) {
      const currentUser = readJsonStorage('user', null);
      setAuthorName(currentUser?.username || '');
      setRating(5);
      setComment('');
      setImages([]);
      setErrors({});
      setNotification(null);
      setIsSubmitting(false);
      mouseDownOnBackdropRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Cơ chế phát hiện Outside Click an toàn (chống lỗi đóng modal khi bôi đen text)
  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      mouseDownOnBackdropRef.current = true;
    } else {
      mouseDownOnBackdropRef.current = false;
    }
  };

  const handleBackdropMouseUp = (e) => {
    // Chỉ đóng modal khi CẢ mousedown và mouseup đều diễn ra trực tiếp trên backdrop
    // Nếu mousedown bên trong ô input (để bôi đen text) rồi nhả chuột ở ngoài, TUYỆT ĐỐI KHÔNG ĐÓNG!
    if (mouseDownOnBackdropRef.current && e.target === e.currentTarget) {
      onClose();
    }
    mouseDownOnBackdropRef.current = false;
  };

  const handleBackdropClick = (e) => {
    // Chặn sự kiện click tổng hợp từ trình duyệt khi kéo chuột từ trong card ra ngoài
    e.stopPropagation();
  };

  // Xử lý chọn ảnh
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setErrors(prev => ({
        ...prev,
        images: `Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} hình ảnh.`
      }));
      return;
    }

    const newErrors = [];
    const validFiles = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        newErrors.push(`Tệp "${file.name}" không phải định dạng ảnh hợp lệ.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        newErrors.push(`Ảnh "${file.name}" vượt quá dung lượng tối đa ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      validFiles.push(file);
    });

    if (newErrors.length > 0) {
      setErrors(prev => ({ ...prev, images: newErrors[0] }));
    } else {
      setErrors(prev => ({ ...prev, images: '' }));
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setImages(prev => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [...prev, uploadEvent.target.result];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
    setErrors(prev => ({ ...prev, images: '' }));
  };

  // Validate form
  const validateForm = () => {
    const errs = {};

    if (!rating || rating < 1 || rating > 5) {
      errs.rating = 'Vui lòng chọn số sao đánh giá (1 - 5 sao).';
    }

    if (!authorName.trim()) {
      errs.authorName = 'Vui lòng nhập họ và tên của bạn.';
    }

    if (!comment.trim()) {
      errs.comment = 'Vui lòng chia sẻ cảm nhận của bạn về sản phẩm.';
    } else if (comment.trim().length < 10) {
      errs.comment = 'Nội dung nhận xét tối thiểu phải có 10 ký tự.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const reviewPayload = {
        rating,
        author_name: authorName.trim(),
        comment: comment.trim(),
        images
      };

      const result = await ReviewService.submitReview(productId, reviewPayload);

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Cảm ơn bạn! Đánh giá của bạn đã được gửi thành công.'
        });

        setTimeout(() => {
          if (onSuccess) onSuccess(result.data);
          onClose();
        }, 1500);
      } else {
        setNotification({
          type: 'error',
          message: 'Không thể gửi đánh giá. Vui lòng thử lại sau.'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Đã có lỗi xảy ra khi gửi đánh giá.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      className="review-modal-backdrop"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      onClick={handleBackdropClick}
    >
      <div 
        className="review-modal-card" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button 
          type="button" 
          className="review-form-close" 
          onClick={onClose}
          aria-label="Đóng form"
        >
          ✕
        </button>

        <div className="review-form-header">
          <span className="review-form-subtitle">CHIA SẺ TRẢI NGHIỆM</span>
          <h3 className="review-form-title">Đánh Giá Sản Phẩm</h3>
          <p className="review-form-desc">
            Ý kiến của bạn là nguồn cảm hứng giúp X2TN Perfume hoàn thiện và mang đến những trải nghiệm hương thơm tinh tế nhất.
          </p>
        </div>

        {notification && (
          <div className={`review-notification ${notification.type}`}>
            {notification.type === 'success' ? '✓ ' : '✕ '}
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form-body">
          {/* Chọn số sao */}
          <div className="review-form-group rating-group">
            <label className="review-form-label">Chất lượng mùi hương & sản phẩm:</label>
            <div className="star-picker-wrap">
              <StarRating
                value={rating}
                onChange={(newVal) => {
                  setRating(newVal);
                  setErrors(prev => ({ ...prev, rating: '' }));
                }}
                size={26}
                readOnly={false}
                showLabel={true}
              />
            </div>
            {errors.rating && <span className="review-form-error">{errors.rating}</span>}
          </div>

          {/* Họ tên */}
          <div className="review-form-group">
            <label className="review-form-label">
              Họ và tên của bạn <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Nguyễn Văn Anh"
              value={authorName}
              onChange={(e) => {
                setAuthorName(e.target.value);
                setErrors(prev => ({ ...prev, authorName: '' }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Tránh bấm Enter trong ô tên kích hoạt submit ngoài ý muốn
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className={`review-form-input ${errors.authorName ? 'has-error' : ''}`}
              maxLength={60}
              autoComplete="off"
            />
            {errors.authorName && <span className="review-form-error">{errors.authorName}</span>}
          </div>

          {/* Nội dung đánh giá */}
          <div className="review-form-group">
            <div className="label-with-counter">
              <label className="review-form-label">
                Nội dung nhận xét <span className="required">*</span>
              </label>
              <span className="char-counter">{comment.length}/500 ký tự</span>
            </div>
            <textarea
              placeholder="Chia sẻ cảm nhận của bạn về tầng hương, độ lưu hương, độ tỏa hương, thiết kế chai hay dịch vụ đóng gói giao hàng..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setErrors(prev => ({ ...prev, comment: '' }));
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className={`review-form-textarea ${errors.comment ? 'has-error' : ''}`}
              rows={4}
              maxLength={500}
            />
            {errors.comment && <span className="review-form-error">{errors.comment}</span>}
          </div>

          {/* Upload hình ảnh thực tế */}
          <div className="review-form-group">
            <label className="review-form-label">
              Hình ảnh thực tế (Tối đa {MAX_IMAGES} ảnh, dung lượng dưới {MAX_FILE_SIZE_MB}MB):
            </label>

            <div className="image-upload-zone">
              {/* Preview các ảnh đã chọn */}
              <div className="preview-images-grid">
                {images.map((imgSrc, idx) => (
                  <div key={idx} className="preview-img-box">
                    <img src={imgSrc} alt={`Ảnh xem trước ${idx + 1}`} />
                    <button
                      type="button"
                      className="btn-remove-preview"
                      onClick={() => handleRemoveImage(idx)}
                      title="Xóa ảnh này"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Nút bấm chọn ảnh */}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    className="btn-select-images"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>+ Thêm ảnh</span>
                    <small>{images.length}/{MAX_IMAGES}</small>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            {errors.images && <span className="review-form-error">{errors.images}</span>}
          </div>

          {/* Action buttons */}
          <div className="review-form-actions">
            <button
              type="button"
              className="btn-review-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-review-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi đánh giá...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .review-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(8, 8, 12, 0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: rfFade 0.25s ease-out;
        }
        @keyframes rfFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .review-modal-card {
          position: relative;
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          background: linear-gradient(165deg, rgba(24, 25, 36, 0.98), rgba(14, 15, 22, 0.98));
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 20px;
          padding: 28px 30px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(212, 175, 55, 0.15);
          color: #f2f2f3;
        }
        .review-modal-card::-webkit-scrollbar {
          width: 5px;
        }
        .review-modal-card::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }
        .review-form-close {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .review-form-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          transform: rotate(90deg);
        }
        .review-form-header {
          text-align: center;
          margin-bottom: 22px;
        }
        .review-form-subtitle {
          font-size: 0.75rem;
          color: #d4af37;
          letter-spacing: 2px;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }
        .review-form-title {
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0 0 6px 0;
          color: #fff;
          background: linear-gradient(135deg, #ffffff 40%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .review-form-desc {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
          line-height: 1.4;
        }
        .review-notification {
          padding: 10px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.85rem;
          font-weight: 500;
          animation: fadeIn 0.25s;
        }
        .review-notification.success {
          background: rgba(46, 125, 50, 0.2);
          border: 1px solid #2e7d32;
          color: #8ce196;
        }
        .review-notification.error {
          background: rgba(211, 47, 47, 0.2);
          border: 1px solid #d32f2f;
          color: #ff8a80;
        }
        .review-form-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .review-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .review-form-label {
          font-size: 0.86rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        .required {
          color: #f87171;
        }
        .rating-group {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 16px;
        }
        .star-picker-wrap {
          margin-top: 4px;
        }
        .label-with-counter {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .char-counter {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .review-form-input,
        .review-form-textarea {
          background: #0f1018;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-size: 0.88rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .review-form-input:focus,
        .review-form-textarea:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
        }
        .review-form-input.has-error,
        .review-form-textarea.has-error {
          border-color: #ef4444;
        }
        .review-form-error {
          font-size: 0.75rem;
          color: #f87171;
          margin-top: 2px;
        }
        .preview-images-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 4px;
        }
        .preview-img-box {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .preview-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .btn-remove-preview {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.75);
          border: none;
          color: #fff;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .btn-remove-preview:hover {
          background: #ef4444;
        }
        .btn-select-images {
          width: 72px;
          height: 72px;
          border-radius: 8px;
          border: 1.5px dashed rgba(212, 175, 55, 0.4);
          background: rgba(212, 175, 55, 0.05);
          color: #f5d77f;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          transition: all 0.2s;
        }
        .btn-select-images:hover {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.12);
          transform: translateY(-1px);
        }
        .btn-select-images span {
          font-size: 0.72rem;
          font-weight: 600;
        }
        .btn-select-images small {
          font-size: 0.65rem;
          opacity: 0.7;
        }
        .review-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-review-cancel {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.75);
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-review-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .btn-review-submit {
          background: linear-gradient(135deg, #a8927a 0%, #d4af37 100%);
          border: none;
          color: #0b0b0c;
          padding: 9px 24px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
        }
        .btn-review-submit:hover:not(:disabled) {
          box-shadow: 0 6px 18px rgba(212, 175, 55, 0.5);
          transform: translateY(-1px);
        }
        .btn-review-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 600px) {
          .review-modal-card {
            padding: 20px 16px;
          }
          .review-form-actions {
            flex-direction: column-reverse;
          }
          .review-form-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
