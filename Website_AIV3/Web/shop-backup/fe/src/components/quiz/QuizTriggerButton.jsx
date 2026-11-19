export default function QuizTriggerButton({ variant = 'nav', className = '', style = {} }) {
  const handleClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('openPerfumeQuiz'));
  };

  if (variant === 'banner') {
    return (
      <button 
        type="button" 
        className={`quiz-trigger-banner ${className}`} 
        onClick={handleClick}
        style={style}
      >
        <span className="quiz-trigger-icon">✨</span>
        <span className="quiz-trigger-text">
          <strong>Khám phá sở thích mùi hương</strong>
          <small>Trắc nghiệm 1 phút tìm hương thơm định hình phong cách</small>
        </span>
        <span className="quiz-trigger-arrow">→</span>
        <style>{`
          .quiz-trigger-banner {
            display: inline-flex;
            align-items: center;
            gap: 14px;
            background: linear-gradient(135deg, rgba(42, 37, 23, 0.9), rgba(24, 25, 36, 0.95));
            border: 1px solid rgba(212, 175, 55, 0.5);
            border-radius: 16px;
            padding: 12px 22px;
            color: #fff;
            cursor: pointer;
            text-align: left;
            transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(212, 175, 55, 0.15);
          }
          .quiz-trigger-banner:hover {
            transform: translateY(-2px);
            border-color: #d4af37;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), 0 0 25px rgba(212, 175, 55, 0.35);
          }
          .quiz-trigger-icon {
            font-size: 1.6rem;
          }
          .quiz-trigger-text {
            display: flex;
            flex-direction: column;
          }
          .quiz-trigger-text strong {
            font-size: 0.95rem;
            color: #f5d77f;
          }
          .quiz-trigger-text small {
            font-size: 0.78rem;
            color: rgba(255, 255, 255, 0.65);
          }
          .quiz-trigger-arrow {
            font-size: 1.2rem;
            color: #d4af37;
            margin-left: 8px;
            transition: transform 0.2s;
          }
          .quiz-trigger-banner:hover .quiz-trigger-arrow {
            transform: translateX(4px);
          }
        `}</style>
      </button>
    );
  }

  // Mặc định kiểu Navigation Pill
  return (
    <button 
      type="button" 
      className={`quiz-trigger-nav-btn ${className}`}
      onClick={handleClick}
      title="Khảo sát sở thích nước hoa"
      style={style}
    >
      <span className="sparkle-icon">✨</span>
      <span>Khám phá sở thích</span>

      <style>{`
        .quiz-trigger-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(168, 146, 122, 0.28) 100%);
          border: 1px solid rgba(212, 175, 55, 0.45);
          color: #f5d77f;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.3px;
        }
        .quiz-trigger-nav-btn:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(168, 146, 122, 0.45) 100%);
          border-color: #d4af37;
          color: #ffffff;
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.35);
          transform: translateY(-1px);
        }
        .sparkle-icon {
          font-size: 0.95rem;
          animation: sparkleGlow 2s infinite alternate;
        }
        @keyframes sparkleGlow {
          from { opacity: 0.7; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </button>
  );
}
