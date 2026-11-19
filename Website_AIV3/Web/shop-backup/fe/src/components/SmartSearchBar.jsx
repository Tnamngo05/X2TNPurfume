import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice } from '../lib/productUtils';
import { recordBehavior } from '../lib/rankingEngine.js';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=500&auto=format&fit=crop';
const MAX_RESULTS = 6;
const DEBOUNCE_MS = 280;

// Bỏ dấu tiếng Việt để so khớp không phân biệt dấu (ví dụ "hương" ~ "huong")
function removeDiacritics(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, (m) => (m === 'Đ' ? 'D' : 'd'))
    .toLowerCase();
}

/**
 * Thanh tìm kiếm nhanh (autocomplete) kiểu Shopee/Lazada, đặt ngay dưới hero.
 * Hoạt động độc lập với ô tìm kiếm trong bộ lọc bên trái — không sửa/không dùng lại state q của bộ lọc,
 * chỉ gọi onSubmitKeyword khi người dùng nhấn Enter để đồng bộ danh sách Products.
 */
export default function SmartSearchBar({ items, onSelectProduct, onSubmitKeyword }) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Debounce 280ms trước khi lọc — tránh xử lý mỗi lần gõ
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const keyword = removeDiacritics(debouncedValue);
    if (!keyword) return [];

    const scoreMatch = (product) => {
      const name = removeDiacritics(product.name);
      const brand = removeDiacritics(product.brand);
      const family = removeDiacritics(product.fragrance_family);
      const category = removeDiacritics(product.category);
      const gender = removeDiacritics(product.gender);

      if (name.includes(keyword)) return 4; // Ưu tiên 1: tên sản phẩm
      if (brand.includes(keyword)) return 3; // Ưu tiên 2: thương hiệu
      if (family.includes(keyword)) return 2; // Ưu tiên 3: nhóm mùi
      if (category.includes(keyword)) return 1; // Ưu tiên 4: category
      if (gender.includes(keyword)) return 1;
      return 0;
    };

    return items
      .map((product) => ({ product, matchScore: scoreMatch(product) }))
      .filter((row) => row.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((row) => row.product);
  }, [debouncedValue, items]);

  const visibleResults = results.slice(0, MAX_RESULTS);
  const hasMore = results.length > MAX_RESULTS;

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedValue]);

  const handleChange = (event) => {
    setInputValue(event.target.value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setInputValue('');
    setDebouncedValue('');
    setIsOpen(false);
  };

  const selectProduct = (product) => {
    // Ghi nhận cả search + view để rankingEngine phản ánh đúng hành vi thực tế
    recordBehavior('search', { keyword: debouncedValue });
    recordBehavior('view', {
      product_id: product.id,
      brand: product.brand,
      fragrance_family: product.fragrance_family,
      gender: product.gender,
      category: product.category,
      price: product.price,
    });
    onSelectProduct?.(product);
    setIsOpen(false);
    setInputValue('');
    setDebouncedValue('');
  };

  const submitKeyword = () => {
    const keyword = inputValue.trim();
    if (!keyword) return;
    // Không gọi recordBehavior ở đây — onSubmitKeyword sẽ set q, và effect debounce
    // sẵn có trong Products.jsx sẽ tự ghi nhận hành vi search (tránh ghi trùng 2 lần).
    onSubmitKeyword?.(keyword);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex((prev) => Math.min(prev + 1, visibleResults.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }
    if (event.key === 'Enter') {
      if (activeIndex >= 0 && visibleResults[activeIndex]) {
        selectProduct(visibleResults[activeIndex]);
      } else {
        submitKeyword();
      }
    }
  };

  const showDropdown = isOpen && debouncedValue.length > 0;

  return (
    <div className="smart-search-wrap" ref={wrapperRef}>
      <div className="smart-search-box">
        <svg className="smart-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          className="smart-search-input"
          placeholder="Tìm nước hoa, thương hiệu, nhóm mùi..."
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Tìm kiếm sản phẩm nhanh"
        />
        {inputValue && (
          <button type="button" className="smart-search-clear" onClick={handleClear} aria-label="Xóa tìm kiếm">
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="smart-search-dropdown">
          {visibleResults.length === 0 ? (
            <div className="smart-search-empty">Không tìm thấy sản phẩm phù hợp.</div>
          ) : (
            <>
              {visibleResults.map((product, index) => (
                <button
                  type="button"
                  key={product.id}
                  className={`smart-search-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => selectProduct(product)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <img
                    src={product.image_url || product.image || FALLBACK_IMAGE}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                  <div className="smart-search-item-info">
                    <div className="smart-search-item-name">{product.name}</div>
                    <div className="smart-search-item-meta">
                      <span className="smart-search-item-brand">{product.brand}</span>
                      {product.fragrance_family && (
                        <span className="smart-search-item-badge">{product.fragrance_family}</span>
                      )}
                    </div>
                  </div>
                  <div className="smart-search-item-price">{formatPrice(product.price)}</div>
                </button>
              ))}
              {hasMore && (
                <button type="button" className="smart-search-viewall" onClick={submitKeyword}>
                  Xem tất cả kết quả
                </button>
              )}
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .smart-search-wrap {
          position: relative;
          max-width: 640px;
          margin: 0 auto 28px;
          padding: 0 20px;
        }

        .smart-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(20, 20, 20, 0.75);
          border: 1px solid rgba(197, 165, 114, 0.4);
          border-radius: 999px;
          padding: 12px 18px;
          transition: border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .smart-search-box:focus-within {
          border-color: rgba(197, 165, 114, 0.9);
          box-shadow: 0 0 0 3px rgba(197, 165, 114, 0.15);
        }

        .smart-search-icon {
          color: #c5a572;
          flex: 0 0 auto;
        }

        .smart-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f2f2f3;
          font-size: 15px;
        }

        .smart-search-input::placeholder {
          color: #7a7a80;
        }

        .smart-search-clear {
          flex: 0 0 auto;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: #c9c9cf;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .smart-search-clear:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        .smart-search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 20px;
          right: 20px;
          background: rgba(18, 18, 20, 0.98);
          border: 1px solid rgba(197, 165, 114, 0.35);
          border-radius: 16px;
          overflow: hidden;
          z-index: 40;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.55);
          max-height: 420px;
          overflow-y: auto;
        }

        .smart-search-empty {
          padding: 18px 20px;
          color: #9ca3af;
          font-size: 14px;
          text-align: center;
        }

        .smart-search-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          text-align: left;
          transition: background 0.18s ease;
        }

        .smart-search-item:last-of-type {
          border-bottom: none;
        }

        .smart-search-item:hover,
        .smart-search-item.active {
          background: rgba(197, 165, 114, 0.14);
        }

        .smart-search-item img {
          width: 46px;
          height: 46px;
          object-fit: contain;
          background: #fff;
          border-radius: 10px;
          flex: 0 0 auto;
          padding: 4px;
        }

        .smart-search-item-info {
          flex: 1;
          min-width: 0;
        }

        .smart-search-item-name {
          color: #f2f2f3;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .smart-search-item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 3px;
        }

        .smart-search-item-brand {
          color: #c5a572;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .smart-search-item-badge {
          font-size: 10.5px;
          color: #d8c3a3;
          border: 1px solid rgba(197, 165, 114, 0.32);
          border-radius: 999px;
          padding: 2px 7px;
          background: rgba(197, 165, 114, 0.08);
        }

        .smart-search-item-price {
          flex: 0 0 auto;
          color: #c5a572;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .smart-search-viewall {
          width: 100%;
          padding: 12px 16px;
          background: rgba(197, 165, 114, 0.08);
          border: none;
          color: #c5a572;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .smart-search-viewall:hover {
          background: rgba(197, 165, 114, 0.2);
        }

        @media (max-width: 639px) {
          .smart-search-wrap {
            padding: 0 14px;
          }

          .smart-search-item img {
            width: 40px;
            height: 40px;
          }

          .smart-search-item-price {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
