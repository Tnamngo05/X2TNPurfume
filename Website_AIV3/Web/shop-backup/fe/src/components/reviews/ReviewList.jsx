import ReviewItem from './ReviewItem.jsx';

export default function ReviewList({
  reviews = [],
  total = 0,
  page = 1,
  totalPages = 1,
  ratingFilter = 'all',
  hasImageFilter = false,
  sortBy = 'newest',
  productNameFilter = '',
  productList = [],
  showProduct = false,
  onRatingFilterChange,
  onHasImageFilterChange,
  onSortChange,
  onProductNameFilterChange,
  onPageChange,
  onOpenForm,
  onSelectProduct,
  isLoading = false,
  onVoteHelpful
}) {
  const filterTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: '5', label: '5 Sao' },
    { key: '4', label: '4 Sao' },
    { key: '3', label: '3 Sao' },
    { key: '2', label: '2 Sao' },
    { key: '1', label: '1 Sao' },
  ];

  return (
    <div className="review-list-wrapper">
      {/* Bộ lọc và Sắp xếp */}
      <div className="review-filter-toolbar">
        <div className="review-filter-pills">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`filter-pill ${ratingFilter === tab.key ? 'active' : ''}`}
              onClick={() => onRatingFilterChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            className={`filter-pill pill-image ${hasImageFilter ? 'active' : ''}`}
            onClick={() => onHasImageFilterChange(!hasImageFilter)}
          >
            📷 Có hình ảnh
          </button>
        </div>

        <div className="review-sort-box">
          <label htmlFor="review-sort-select">Sắp xếp:</label>
          <select
            id="review-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="review-sort-select"
          >
            <option value="newest">Mới nhất</option>
            <option value="helpful">Hữu ích nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>

      {/* BỘ LỌC THEO TÊN SẢN PHẨM (DÀNH CHO TAB TẤT CẢ ĐÁNH GIÁ) */}
      {showProduct && onProductNameFilterChange && (
        <div className="review-product-filter-bar">
          <div className="product-search-input-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Lọc đánh giá theo tên sản phẩm hoặc thương hiệu..."
              value={productNameFilter}
              onChange={(e) => onProductNameFilterChange(e.target.value)}
              className="product-search-input"
            />
            {productNameFilter && (
              <button
                type="button"
                className="btn-clear-product-filter"
                onClick={() => onProductNameFilterChange('')}
                title="Xóa bộ lọc tên sản phẩm"
              >
                ✕
              </button>
            )}
          </div>

          {Array.isArray(productList) && productList.length > 0 && (
            <div className="product-quick-select-wrap">
              <select
                className="product-quick-select"
                value={productNameFilter}
                onChange={(e) => onProductNameFilterChange(e.target.value)}
              >
                <option value="">-- Tất cả sản phẩm ({productList.length}) --</option>
                {productList.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} {p.brand ? `(${p.brand})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="review-loading-state">
          <div className="review-spinner" />
          <p>Đang tải danh sách đánh giá...</p>
        </div>
      ) : reviews.length === 0 ? (
        /* Empty State */
        <div className="review-empty-state">
          <div className="empty-icon">✨</div>
          <h4 className="empty-title">Chưa có đánh giá phù hợp</h4>
          <p className="empty-desc">
            {ratingFilter !== 'all' || hasImageFilter || productNameFilter
              ? 'Không tìm thấy đánh giá nào theo các tiêu chí đã chọn. Hãy thử điều chỉnh bộ lọc.'
              : 'Hãy là người đầu tiên chia sẻ cảm nhận về kiệt tác hương thơm này!'}
          </p>
          {onOpenForm && !showProduct && (
            <button
              type="button"
              className="btn-empty-write"
              onClick={onOpenForm}
            >
              Viết đánh giá ngay
            </button>
          )}
        </div>
      ) : (
        /* Danh sách reviews */
        <div className="review-items-container">
          {reviews.map((rev) => (
            <ReviewItem
              key={rev.id}
              review={rev}
              showProduct={showProduct}
              onSelectProduct={onSelectProduct}
              onVoteHelpful={onVoteHelpful}
            />
          ))}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && !isLoading && (
        <div className="review-pagination">
          <button
            type="button"
            className="btn-page-nav"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ‹ Trang trước
          </button>

          <div className="page-numbers">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pNum = idx + 1;
              return (
                <button
                  key={pNum}
                  type="button"
                  className={`page-num-btn ${page === pNum ? 'active' : ''}`}
                  onClick={() => onPageChange(pNum)}
                >
                  {pNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn-page-nav"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Trang sau ›
          </button>
        </div>
      )}

      <style>{`
        .review-list-wrapper {
          margin-top: 16px;
        }
        .review-filter-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .review-filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .filter-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.75);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.25);
        }
        .filter-pill.active {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(168, 146, 122, 0.35));
          border-color: #d4af37;
          color: #f5d77f;
          font-weight: 600;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
        }
        .pill-image {
          border-style: dashed;
        }
        .review-sort-box {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.65);
        }
        .review-sort-select {
          background: #141520;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.84rem;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }
        .review-sort-select:focus {
          border-color: #d4af37;
        }

        /* Lọc theo tên sản phẩm */
        .review-product-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .product-search-input-wrap {
          position: relative;
          flex: 1;
          min-width: 240px;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: rgba(212, 175, 55, 0.7);
          pointer-events: none;
        }
        .product-search-input {
          width: 100%;
          background: rgba(18, 19, 28, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 34px 8px 36px;
          color: #fff;
          font-size: 0.85rem;
          transition: border-color 0.2s;
        }
        .product-search-input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
        }
        .btn-clear-product-filter {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          font-size: 12px;
          padding: 4px;
        }
        .btn-clear-product-filter:hover {
          color: #fff;
        }
        .product-quick-select-wrap {
          min-width: 200px;
        }
        .product-quick-select {
          width: 100%;
          background: rgba(18, 19, 28, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 12px;
          color: #f5d77f;
          font-size: 0.84rem;
          cursor: pointer;
          outline: none;
        }
        .product-quick-select:focus {
          border-color: #d4af37;
        }

        .review-loading-state {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.6);
        }
        .review-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(212, 175, 55, 0.2);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .review-empty-state {
          text-align: center;
          padding: 42px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .empty-icon {
          font-size: 2.2rem;
          margin-bottom: 8px;
        }
        .empty-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f2f2f3;
          margin: 0 0 6px 0;
        }
        .empty-desc {
          font-size: 0.86rem;
          color: rgba(255, 255, 255, 0.6);
          max-width: 420px;
          margin: 0 auto 16px auto;
        }
        .btn-empty-write {
          background: linear-gradient(135deg, #a8927a 0%, #d4af37 100%);
          border: none;
          color: #0b0b0c;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-empty-write:hover {
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.4);
        }
        .review-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
        }
        .btn-page-nav {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-page-nav:hover:not(:disabled) {
          border-color: #d4af37;
          color: #fff;
          background: rgba(212, 175, 55, 0.1);
        }
        .btn-page-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-numbers {
          display: flex;
          gap: 6px;
        }
        .page-num-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-num-btn:hover {
          border-color: rgba(212, 175, 55, 0.5);
          color: #fff;
        }
        .page-num-btn.active {
          background: #d4af37;
          border-color: #d4af37;
          color: #0b0b0c;
        }
      `}</style>
    </div>
  );
}
