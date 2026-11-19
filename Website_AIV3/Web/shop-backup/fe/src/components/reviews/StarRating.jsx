import { useState } from 'react';

export default function StarRating({
  value = 5,
  onChange,
  size = 18,
  readOnly = true,
  showLabel = false,
  className = ''
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const starLabels = {
    1: 'Rất thất vọng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Cực kỳ hài lòng'
  };

  const displayValue = hoverValue || value || 0;

  return (
    <div className={`star-rating-container ${className} ${readOnly ? 'readonly' : 'interactive'}`}>
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              className={`star-btn ${isFilled ? 'filled' : 'empty'}`}
              disabled={readOnly}
              onClick={() => {
                if (!readOnly && onChange) {
                  onChange(star);
                }
              }}
              onMouseEnter={() => {
                if (!readOnly) setHoverValue(star);
              }}
              onMouseLeave={() => {
                if (!readOnly) setHoverValue(0);
              }}
              aria-label={`${star} sao`}
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={isFilled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          );
        })}
      </div>

      {showLabel && !readOnly && displayValue > 0 && (
        <span className="star-feedback-label">
          {starLabels[displayValue]}
        </span>
      )}

      <style>{`
        .star-rating-container {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .stars-row {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .star-btn {
          background: none;
          border: none;
          padding: 0;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.25);
          transition: transform 0.15s ease, color 0.15s ease;
        }
        .star-rating-container.interactive .star-btn {
          cursor: pointer;
        }
        .star-rating-container.interactive .star-btn:hover {
          transform: scale(1.22);
        }
        .star-btn.filled {
          color: #d4af37;
          filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.4));
        }
        .star-btn:disabled {
          cursor: default;
        }
        .star-feedback-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #f5d77f;
          animation: fadeIn 0.2s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
