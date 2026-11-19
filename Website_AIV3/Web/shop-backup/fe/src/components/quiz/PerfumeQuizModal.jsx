import { useState, useEffect, useRef } from 'react';
import QuizProgress from './QuizProgress.jsx';
import QuizStep from './QuizStep.jsx';
import ProductRecommendation from './ProductRecommendation.jsx';
import { QUIZ_STEPS_CONFIG, QuizService } from '../../services/quizService';
import { ProductsAPI } from '../../lib/api';

export default function PerfumeQuizModal({ isOpen: externalIsOpen, onClose: externalOnClose }) {
  const mouseDownOnBackdropRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0 -> 4: 5 bước, 5: màn hình kết quả
  const [answers, setAnswers] = useState({
    gender: '',
    fragrance_families: [],
    styles: [],
    occasions: '',
    budget: ''
  });
  const [validationError, setValidationError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tự động mở khi truy cập lần đầu hoặc khi được gọi từ prop / event
  useEffect(() => {
    // Tải danh sách sản phẩm phục vụ gợi ý
    ProductsAPI.list().then(list => {
      if (Array.isArray(list)) setAllProducts(list);
    }).catch(() => {});

    // Kiểm tra đã hoàn thành trước đó chưa
    const saved = QuizService.getSavedAnswers();
    if (saved) {
      setAnswers(saved);
    }

    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
      return;
    }

    // Tự động mở nếu là lần đầu vào web (chưa hoàn thành và chưa bỏ qua)
    if (QuizService.shouldAutoOpen()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200); // Mở êm dịu sau khi web load xong
      return () => clearTimeout(timer);
    }
  }, [externalIsOpen]);

  // Lắng nghe sự kiện toàn cục mở Quiz từ NavBar hoặc CTA khác
  useEffect(() => {
    const handleOpenQuiz = () => {
      // Nếu đã có kết quả trước đó, mở trực tiếp màn hình kết quả hoặc bước 1
      const saved = QuizService.getSavedAnswers();
      if (saved) {
        setAnswers(saved);
        // Nếu đã từng làm xong, mở màn hình kết quả để xem lại, có nút làm lại
        setCurrentStepIndex(5);
        generateRecommendations(saved);
      } else {
        setCurrentStepIndex(0);
      }
      setIsOpen(true);
    };

    window.addEventListener('openPerfumeQuiz', handleOpenQuiz);
    return () => window.removeEventListener('openPerfumeQuiz', handleOpenQuiz);
  }, [allProducts]);

  const stepTitles = QUIZ_STEPS_CONFIG.map(s => {
    if (s.id === 'gender') return 'Giới tính';
    if (s.id === 'fragrance_families') return 'Nhóm hương';
    if (s.id === 'styles') return 'Phong cách';
    if (s.id === 'occasions') return 'Dịp sử dụng';
    if (s.id === 'budget') return 'Ngân sách';
    return '';
  });

  const currentStepConfig = QUIZ_STEPS_CONFIG[currentStepIndex];

  // Kiểm tra tính hợp lệ của câu trả lời trước khi chuyển bước
  const validateStep = () => {
    if (!currentStepConfig) return true;
    const stepId = currentStepConfig.id;

    if (stepId === 'gender' && !answers.gender) {
      setValidationError('Vui lòng chọn giới tính hoặc đối tượng bạn muốn tìm hương thơm.');
      return false;
    }

    if (stepId === 'fragrance_families' && (!answers.fragrance_families || answers.fragrance_families.length === 0)) {
      setValidationError('Vui lòng chọn ít nhất 1 nhóm hương yêu thích.');
      return false;
    }

    if (stepId === 'styles' && (!answers.styles || answers.styles.length === 0)) {
      setValidationError('Vui lòng chọn ít nhất 1 phong cách cá nhân.');
      return false;
    }

    if (stepId === 'occasions' && !answers.occasions) {
      setValidationError('Vui lòng chọn mục đích sử dụng chính của bạn.');
      return false;
    }

    if (stepId === 'budget' && !answers.budget) {
      setValidationError('Vui lòng chọn khoảng ngân sách dự kiến.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStepIndex < QUIZ_STEPS_CONFIG.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setValidationError('');
    } else {
      // Đã tới bước cuối -> Hoàn thành khảo sát
      handleCompleteQuiz();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setValidationError('');
    }
  };

  const handleSkip = () => {
    QuizService.dismissQuiz();
    closeModal();
  };

  const closeModal = () => {
    setIsOpen(false);
    if (externalOnClose) externalOnClose();
  };

  const handleOptionChange = (value) => {
    if (!currentStepConfig) return;
    const stepId = currentStepConfig.id;
    setAnswers(prev => ({
      ...prev,
      [stepId]: value
    }));
    setValidationError('');
  };

  const generateRecommendations = async (finalAnswers) => {
    let products = allProducts;
    if (!products || products.length === 0) {
      try {
        products = await ProductsAPI.list();
        setAllProducts(products);
      } catch (e) {
        products = [];
      }
    }
    const recs = await QuizService.getRecommendations(finalAnswers, products);
    setRecommendations(recs);
  };

  const handleCompleteQuiz = async () => {
    setIsSubmitting(true);
    try {
      await QuizService.submitQuiz(answers);
      await generateRecommendations(answers);
      setCurrentStepIndex(5); // Chuyển sang màn hình Gợi ý nước hoa
    } catch (err) {
      console.error('Lỗi hoàn thành khảo sát:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentStepIndex(0);
    setValidationError('');
  };

  const handleAddToCart = (product) => {
    try {
      const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existing = storedCart.find(item => item.id === product.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        storedCart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image || product.image_url,
          qty: 1,
          size: product.sizes?.[0]?.size || '100ml'
        });
      }
      localStorage.setItem('cart', JSON.stringify(storedCart));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Lỗi thêm giỏ hàng:', err);
    }
  };

  if (!isOpen) return null;

  const isLastStep = currentStepIndex === QUIZ_STEPS_CONFIG.length - 1;
  const isResultScreen = currentStepIndex >= QUIZ_STEPS_CONFIG.length;

  const handleBackdropMouseDown = (e) => {
    mouseDownOnBackdropRef.current = (e.target === e.currentTarget);
  };

  const handleBackdropMouseUp = (e) => {
    if (mouseDownOnBackdropRef.current && e.target === e.currentTarget) {
      closeModal();
    }
    mouseDownOnBackdropRef.current = false;
  };

  return (
    <div 
      className="quiz-modal-backdrop" 
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="quiz-modal-card" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Nút đóng / Bỏ qua */}
        <button 
          type="button" 
          className="quiz-btn-close"
          onClick={handleSkip}
          title="Bỏ qua khảo sát"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Nội dung chính */}
        {!isResultScreen ? (
          <div className="quiz-content-step">
            {/* Header thương hiệu */}
            <div className="quiz-brand-header">
              <span className="quiz-brand-name">X2TN <span className="quiz-brand-sub">PERFUME QUIZ</span></span>
              <p className="quiz-brand-tagline">Trắc nghiệm sở thích — Khám phá mùi hương dành riêng cho bạn</p>
            </div>

            {/* Thanh tiến trình */}
            <QuizProgress
              currentStep={currentStepIndex + 1}
              totalSteps={QUIZ_STEPS_CONFIG.length}
              stepTitles={stepTitles}
            />

            {/* Bước câu hỏi */}
            <QuizStep
              stepConfig={currentStepConfig}
              selectedValue={answers[currentStepConfig.id]}
              onChange={handleOptionChange}
            />

            {/* Thông báo lỗi validation */}
            {validationError && (
              <div className="quiz-validation-error">
                <span>⚠️ {validationError}</span>
              </div>
            )}

            {/* Điều hướng Next / Back / Complete / Skip */}
            <div className="quiz-actions-bar">
              <div className="quiz-actions-left">
                {currentStepIndex > 0 ? (
                  <button
                    type="button"
                    className="quiz-btn-secondary"
                    onClick={handleBack}
                  >
                    ← Quay lại
                  </button>
                ) : (
                  <button
                    type="button"
                    className="quiz-btn-text"
                    onClick={handleSkip}
                  >
                    Bỏ qua khảo sát
                  </button>
                )}
              </div>

              <div className="quiz-actions-right">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    className="quiz-btn-text"
                    onClick={handleSkip}
                  >
                    Bỏ qua
                  </button>
                )}

                <button
                  type="button"
                  className={`quiz-btn-primary ${isLastStep ? 'quiz-btn-complete' : ''}`}
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Đang phân tích...'
                  ) : isLastStep ? (
                    '✨ Hoàn thành & Xem gợi ý'
                  ) : (
                    'Tiếp tục →'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Màn hình kết quả & gợi ý sản phẩm */
          <ProductRecommendation
            answers={answers}
            recommendations={recommendations}
            onRetakeQuiz={handleRetakeQuiz}
            onClose={closeModal}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>

      <style>{`
        .quiz-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 8, 12, 0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: backdropFade 0.3s ease-out;
        }
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .quiz-modal-card {
          position: relative;
          width: 100%;
          max-width: 680px;
          max-height: 92vh;
          overflow-y: auto;
          background: linear-gradient(165deg, rgba(22, 23, 34, 0.96) 0%, rgba(13, 14, 20, 0.98) 100%);
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 24px;
          padding: 32px 36px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.12);
          color: #f2f2f3;
          animation: cardScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cardScaleUp {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(16px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .quiz-modal-card::-webkit-scrollbar {
          width: 6px;
        }
        .quiz-modal-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .quiz-modal-card::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.25);
          border-radius: 4px;
        }
        .quiz-btn-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 10;
        }
        .quiz-btn-close:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: rotate(90deg);
        }
        .quiz-brand-header {
          text-align: center;
          margin-bottom: 20px;
          padding-top: 4px;
        }
        .quiz-brand-name {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 2px;
          color: #fff;
        }
        .quiz-brand-sub {
          color: #d4af37;
          font-weight: 400;
          letter-spacing: 3px;
          font-size: 0.95rem;
        }
        .quiz-brand-tagline {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.55);
          margin: 4px 0 0 0;
        }
        .quiz-validation-error {
          margin-top: 14px;
          padding: 8px 14px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          font-size: 0.82rem;
          text-align: center;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .quiz-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 26px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .quiz-actions-left,
        .quiz-actions-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .quiz-btn-text {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 8px 12px;
          transition: color 0.2s;
        }
        .quiz-btn-text:hover {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: underline;
        }
        .quiz-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f2f2f3;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quiz-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.14);
        }
        .quiz-btn-primary {
          background: linear-gradient(135deg, #a8927a 0%, #d4af37 100%);
          border: none;
          color: #0b0b0c;
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
        }
        .quiz-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.45);
        }
        .quiz-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .quiz-btn-complete {
          background: linear-gradient(135deg, #d4af37 0%, #f5d77f 100%);
          color: #111;
          box-shadow: 0 4px 18px rgba(212, 175, 55, 0.45);
        }
        @media (max-width: 640px) {
          .quiz-modal-card {
            padding: 24px 18px;
            border-radius: 18px;
          }
          .quiz-actions-bar {
            flex-direction: column-reverse;
            gap: 12px;
          }
          .quiz-actions-left,
          .quiz-actions-right {
            width: 100%;
            justify-content: space-between;
          }
          .quiz-btn-primary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
