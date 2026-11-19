export default function QuizStep({ stepConfig, selectedValue, onChange }) {
  if (!stepConfig) return null;

  const isMultiple = stepConfig.type === 'multiple';

  const isSelected = (value) => {
    if (isMultiple) {
      return Array.isArray(selectedValue) && selectedValue.includes(value);
    }
    return selectedValue === value;
  };

  const handleSelect = (value) => {
    if (isMultiple) {
      const currentList = Array.isArray(selectedValue) ? [...selectedValue] : [];
      const index = currentList.indexOf(value);
      if (index > -1) {
        currentList.splice(index, 1);
      } else {
        currentList.push(value);
      }
      onChange(currentList);
    } else {
      onChange(value);
    }
  };

  return (
    <div className="quiz-step-container">
      <div className="quiz-step-title-block">
        <h3 className="quiz-step-title">{stepConfig.title}</h3>
        {stepConfig.subtitle && (
          <p className="quiz-step-subtitle">{stepConfig.subtitle}</p>
        )}
      </div>

      <div className={`quiz-options-grid ${stepConfig.options.length > 4 ? 'grid-dense' : ''}`}>
        {stepConfig.options.map((opt) => {
          const active = isSelected(opt.value);

          return (
            <div
              key={opt.value}
              className={`quiz-option-card ${active ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(opt.value);
                }
              }}
            >
              <div className="quiz-option-indicator">
                {isMultiple ? (
                  <div className={`quiz-checkbox ${active ? 'checked' : ''}`}>
                    {active && '✓'}
                  </div>
                ) : (
                  <div className={`quiz-radio ${active ? 'checked' : ''}`}>
                    {active && <span className="quiz-radio-dot" />}
                  </div>
                )}
              </div>

              <div className="quiz-option-icon">{opt.icon}</div>

              <div className="quiz-option-text">
                <h4 className="quiz-option-label">{opt.label}</h4>
                {opt.desc && (
                  <p className="quiz-option-desc">{opt.desc}</p>
                )}
              </div>

              {active && <div className="quiz-option-glow" />}
            </div>
          );
        })}
      </div>

      <style>{`
        .quiz-step-container {
          animation: fadeInSlide 0.35s ease-out;
        }
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .quiz-step-title-block {
          text-align: center;
          margin-bottom: 22px;
        }
        .quiz-step-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #f2f2f3;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #ffffff 40%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .quiz-step-subtitle {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
        }
        .quiz-options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .quiz-options-grid.grid-dense {
          grid-template-columns: repeat(2, 1fr);
        }
        @media (max-width: 640px) {
          .quiz-options-grid,
          .quiz-options-grid.grid-dense {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .quiz-step-title {
            font-size: 1.15rem;
          }
        }
        .quiz-option-card {
          position: relative;
          background: rgba(25, 26, 38, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
          overflow: hidden;
          user-select: none;
        }
        .quiz-option-card:hover {
          background: rgba(35, 37, 54, 0.85);
          border-color: rgba(212, 175, 55, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
        }
        .quiz-option-card.selected {
          background: linear-gradient(135deg, rgba(42, 37, 23, 0.85), rgba(24, 25, 36, 0.95));
          border-color: #d4af37;
          box-shadow: 0 0 16px rgba(212, 175, 55, 0.3), inset 0 0 10px rgba(212, 175, 55, 0.1);
        }
        .quiz-option-glow {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          pointer-events: none;
          box-shadow: inset 0 0 14px rgba(212, 175, 55, 0.2);
        }
        .quiz-option-indicator {
          margin-top: 2px;
          flex-shrink: 0;
        }
        .quiz-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .quiz-radio.checked {
          border-color: #d4af37;
        }
        .quiz-radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d4af37;
          box-shadow: 0 0 6px #d4af37;
        }
        .quiz-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: #0b0b0c;
          transition: all 0.2s;
        }
        .quiz-checkbox.checked {
          background: #d4af37;
          border-color: #d4af37;
        }
        .quiz-option-icon {
          font-size: 1.6rem;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .quiz-option-text {
          flex: 1;
        }
        .quiz-option-label {
          margin: 0 0 4px 0;
          font-size: 0.96rem;
          font-weight: 600;
          color: #f2f2f3;
        }
        .quiz-option-card.selected .quiz-option-label {
          color: #f5d77f;
        }
        .quiz-option-desc {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.35;
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
}
