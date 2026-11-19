import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=500&auto=format&fit=crop';

export default function ReviewImageGallery({ images = [], maxThumbnails = 6 }) {
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const isOpen = activeImageIndex !== null;

  // Ref theo dõi an toàn thao tác click outside (tránh đóng nhầm khi kéo chuột hoặc vuốt)
  const isBackdropMouseDownRef = useRef(false);

  // Ref hỗ trợ thao tác vuốt cảm ứng trên thiết bị di động (Touch Swipe)
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  const handleOpen = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveImageIndex(index);
  };

  const handleClose = () => {
    setActiveImageIndex(null);
    isBackdropMouseDownRef.current = false;
  };

  const handlePrev = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Khóa cuộn trang khi mở Lightbox và mở lại khi đóng
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Lắng nghe bàn phím ESC, Left, Right
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev]);

  // Xử lý vuốt cảm ứng trên Mobile (Swipe left/right)
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance && images.length > 1) {
      // Vuốt sang trái -> Ảnh tiếp theo
      handleNext();
    } else if (distance < -minSwipeDistance && images.length > 1) {
      // Vuốt sang phải -> Ảnh trước
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Xử lý Click Outside an toàn
  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      isBackdropMouseDownRef.current = true;
    } else {
      isBackdropMouseDownRef.current = false;
    }
  };

  const handleBackdropMouseUp = (e) => {
    if (isBackdropMouseDownRef.current && e.target === e.currentTarget) {
      handleClose();
    }
    isBackdropMouseDownRef.current = false;
  };

  if (!images || !Array.isArray(images) || images.length === 0) return null;

  const displayImages = images.slice(0, maxThumbnails);
  const remainingCount = images.length - maxThumbnails;

  // JSX của Lightbox Modal
  const lightboxModal = isOpen && (
    <div
      className="review-lightbox-portal-backdrop"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh phóng to"
    >
      {/* Nút đóng ở góc trên bên phải */}
      <button
        type="button"
        className="lightbox-close-btn"
        onClick={handleClose}
        aria-label="Đóng ảnh phóng to (ESC)"
        title="Đóng (ESC)"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Chỉ số thứ tự ảnh ở góc trên bên trái */}
      <div className="lightbox-counter-badge">
        <span>{activeImageIndex + 1} / {images.length}</span>
      </div>

      {/* Nút ảnh trước (Prev) */}
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox-nav-btn prev"
          onClick={handlePrev}
          aria-label="Ảnh trước (Mũi tên trái)"
          title="Ảnh trước (←)"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* Vùng hiển thị ảnh lớn ở giữa màn hình (chiếm 75-85% viewport, giữ nguyên tỉ lệ gốc, không méo hay cắt) */}
      <div
        className="review-lightbox-content"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="lightbox-image-stage">
          <img
            key={images[activeImageIndex]}
            src={images[activeImageIndex]}
            alt={`Ảnh đánh giá phóng to ${activeImageIndex + 1}`}
            className="lightbox-main-img"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Nút ảnh tiếp theo (Next) */}
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox-nav-btn next"
          onClick={handleNext}
          aria-label="Ảnh tiếp theo (Mũi tên phải)"
          title="Ảnh tiếp theo (→)"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {/* Hướng dẫn phím tắt & vuốt */}
      <div className="lightbox-hint-bar">
        <span className="lightbox-hint-pill">ESC hoặc chạm ngoài để đóng • Phím mũi tên ← → hoặc vuốt để chuyển ảnh</span>
      </div>

      <style>{`
        .review-lightbox-portal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(5, 6, 10, 0.95);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          animation: lbPortalFade 0.22s ease-out;
          user-select: none;
        }

        @keyframes lbPortalFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .review-lightbox-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 82vw;
          height: 84vh;
          max-width: 1400px;
          max-height: 900px;
          animation: lbZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes lbZoomIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Khung hiển thị ảnh chiếm 75–85% diện tích màn hình */
        .lightbox-image-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(12, 13, 20, 0.65);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.25);
          border: 1px solid rgba(212, 175, 55, 0.4);
        }

        .lightbox-main-img {
          width: 100%;
          height: 100%;
          max-width: 82vw;
          max-height: 84vh;
          object-fit: contain;
          display: block;
          transition: transform 0.2s ease;
        }

        /* Nút đóng cố định ở góc trên bên phải */
        .lightbox-close-btn {
          position: fixed;
          top: 22px;
          right: 28px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(22, 24, 34, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.22s ease;
          z-index: 1000001;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .lightbox-close-btn:hover {
          background: rgba(239, 68, 68, 0.9);
          border-color: #ef4444;
          transform: rotate(90deg) scale(1.08);
          color: #fff;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }

        /* Huy hiệu thứ tự ảnh cố định ở góc trên bên trái */
        .lightbox-counter-badge {
          position: fixed;
          top: 24px;
          left: 28px;
          background: rgba(20, 22, 32, 0.85);
          border: 1px solid rgba(212, 175, 55, 0.45);
          color: #f5d77f;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 6px 16px;
          border-radius: 20px;
          z-index: 1000001;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        /* Nút chuyển ảnh Prev & Next cố định 2 bên màn hình */
        .lightbox-nav-btn {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(18, 19, 28, 0.88);
          border: 1px solid rgba(212, 175, 55, 0.5);
          color: #f5d77f;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
          z-index: 1000001;
          backdrop-filter: blur(8px);
        }

        .lightbox-nav-btn.prev {
          left: 24px;
        }

        .lightbox-nav-btn.next {
          right: 24px;
        }

        .lightbox-nav-btn:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.45), rgba(168, 146, 122, 0.55));
          border-color: #d4af37;
          color: #fff;
          transform: translateY(-50%) scale(1.12);
          box-shadow: 0 0 25px rgba(212, 175, 55, 0.5);
        }

        .lightbox-hint-bar {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
          text-align: center;
          z-index: 1000001;
          pointer-events: none;
        }

        .lightbox-hint-pill {
          display: inline-block;
          background: rgba(12, 13, 20, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.78rem;
          letter-spacing: 0.4px;
          padding: 6px 18px;
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }

        /* Responsive Mobile & Tablet */
        @media (max-width: 768px) {
          .review-lightbox-content {
            width: 96vw;
            height: 80vh;
            max-width: none;
            max-height: none;
          }

          .lightbox-image-stage {
            border-radius: 10px;
          }

          .lightbox-main-img {
            max-width: 96vw;
            max-height: 80vh;
          }

          .lightbox-nav-btn {
            width: 42px;
            height: 42px;
          }

          .lightbox-nav-btn.prev {
            left: 8px;
          }

          .lightbox-nav-btn.next {
            right: 8px;
          }

          .lightbox-close-btn {
            top: 14px;
            right: 14px;
            width: 38px;
            height: 38px;
          }

          .lightbox-counter-badge {
            top: 14px;
            left: 14px;
            font-size: 0.8rem;
            padding: 4px 12px;
          }

          .lightbox-hint-bar {
            display: none;
          }
        }
      `}</style>
    </div>
  );

  return (
    <div className="review-gallery-container">
      {/* Hàng ảnh Thumbnails */}
      <div className="review-thumbnails-row">
        {displayImages.map((imgSrc, idx) => {
          const isLastWithMore = idx === maxThumbnails - 1 && remainingCount > 0;

          return (
            <div
              key={idx}
              className="review-thumb-wrapper"
              onClick={(e) => handleOpen(idx, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleOpen(idx, e);
                }
              }}
              role="button"
              tabIndex={0}
              title={`Nhấn để phóng to ảnh ${idx + 1}`}
              aria-label={`Ảnh đánh giá ${idx + 1}`}
            >
              <img
                src={imgSrc}
                alt={`Ảnh đánh giá ${idx + 1}`}
                className="review-thumb-img"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
              {isLastWithMore && (
                <div className="review-thumb-overlay">
                  +{remainingCount}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Render Lightbox Modal qua React Portal trực tiếp vào document.body */}
      {typeof document !== 'undefined' && lightboxModal && createPortal(lightboxModal, document.body)}

      <style>{`
        .review-gallery-container {
          margin-top: 10px;
          margin-bottom: 8px;
        }
        .review-thumbnails-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .review-thumb-wrapper {
          position: relative;
          width: 76px;
          height: 76px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          background: #141520;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .review-thumb-wrapper:hover {
          transform: translateY(-2px) scale(1.03);
          border-color: #d4af37;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(212, 175, 55, 0.3);
        }
        .review-thumb-wrapper:focus-visible {
          outline: 2px solid #d4af37;
          outline-offset: 2px;
        }
        .review-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }
        .review-thumb-wrapper:hover .review-thumb-img {
          transform: scale(1.06);
        }
        .review-thumb-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          color: #f5d77f;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
        }
      `}</style>
    </div>
  );
}
