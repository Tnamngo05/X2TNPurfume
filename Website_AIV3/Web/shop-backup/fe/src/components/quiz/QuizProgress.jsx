export default function QuizProgress({ currentStep, totalSteps, stepTitles = [] }) {
  const percentage = Math.round(((currentStep) / totalSteps) * 100);

  return (
    <div className="quiz-progress-wrapper">
      <div className="quiz-progress-header">
        <span className="quiz-step-badge">
          Bước {currentStep} / {totalSteps}
        </span>
        <span className="quiz-step-name">
          {stepTitles[currentStep - 1] || ''}
        </span>
        <span className="quiz-percentage">{percentage}%</span>
      </div>

      <div className="quiz-progress-track">
        <div 
          className="quiz-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="quiz-step-dots">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div 
              key={idx}
              className={`quiz-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
              title={stepTitles[idx] || `Bước ${stepNum}`}
            >
              {isCompleted ? '✓' : stepNum}
            </div>
          );
        })}
      </div>

      <style>{`
        .quiz-progress-wrapper {
          margin-bottom: 24px;
        }
        .quiz-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 0.85rem;
        }
        .quiz-step-badge {
          background: rgba(168, 146, 122, 0.15);
          color: #d4af37;
          border: 1px solid rgba(212, 175, 55, 0.3);
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.78rem;
          letter-spacing: 0.5px;
        }
        .quiz-step-name {
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
        }
        .quiz-percentage {
          color: #a8927a;
          font-weight: 700;
        }
        .quiz-progress-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        .quiz-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a8927a, #d4af37);
          border-radius: 999px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }
        .quiz-step-dots {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          padding: 0 4px;
        }
        .quiz-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          background: #15161f;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.4);
          transition: all 0.3s ease;
        }
        .quiz-dot.completed {
          background: #2a2517;
          border-color: #d4af37;
          color: #d4af37;
        }
        .quiz-dot.active {
          background: linear-gradient(135deg, #d4af37, #a8927a);
          border-color: #f5d77f;
          color: #0b0b0c;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.6);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
