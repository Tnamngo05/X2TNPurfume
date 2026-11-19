import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating.jsx';
import ReviewForm from './ReviewForm.jsx';
import ReviewList from './ReviewList.jsx';
import { ReviewService } from '../../services/reviewService';
import { ProductsAPI } from '../../lib/api';

export default function ProductReviewSection({ productId, productName, onViewProduct }) {
  const navigate = useNavigate();

  // 1. Quản lý Tab chính: 'current' (Đánh giá sản phẩm này) | 'all' (Tất cả đánh giá)
  const [activeMainTab, setActiveMainTab] = useState('current');

  // Danh sách toàn bộ sản phẩm của shop (dùng cho map ảnh/tên & dropdown lọc)
  const [productList, setProductList] = useState([]);

  // Modal viết đánh giá
  const [isFormOpen, setIsFormOpen] = useState(false);

  // -------------------------------------------------------------
  // STATE CHO TAB 1: ĐÁNH GIÁ SẢN PHẨM NÀY (current_product)
  // -------------------------------------------------------------
  const [currentReviewsData, setCurrentReviewsData] = useState({
    reviews: [],
    stats: {
      average_rating: 0,
      total_reviews: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    },
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [currentIsLoading, setCurrentIsLoading] = useState(true);
  const [currentRatingFilter, setCurrentRatingFilter] = useState('all');
  const [currentHasImageFilter, setCurrentHasImageFilter] = useState(false);
  const [currentSortBy, setCurrentSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // -------------------------------------------------------------
  // STATE CHO TAB 2: TẤT CẢ ĐÁNH GIÁ (all_reviews)
  // -------------------------------------------------------------
  const [allReviewsData, setAllReviewsData] = useState({
    reviews: [],
    stats: {
      average_rating: 0,
      total_reviews: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    },
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [allIsLoading, setAllIsLoading] = useState(true);
  const [allRatingFilter, setAllRatingFilter] = useState('all');
  const [allHasImageFilter, setAllHasImageFilter] = useState(false);
  const [allProductNameFilter, setAllProductNameFilter] = useState('');
  const [allSortBy, setAllSortBy] = useState('newest');
  const [allPage, setAllPage] = useState(1);

  // Tải danh sách sản phẩm phục vụ map thông tin và dropdown lọc
  useEffect(() => {
    ProductsAPI.list().then(list => {
      if (Array.isArray(list)) setProductList(list);
    }).catch(() => {});
  }, []);

  // 1. Fetch data cho Tab "Đánh giá sản phẩm này" (gắn theo productId)
  const loadCurrentReviews = useCallback(async () => {
    if (!productId) return;
    setCurrentIsLoading(true);
    try {
      const data = await ReviewService.getReviews(productId, {
        ratingFilter: currentRatingFilter,
        hasImageFilter: currentHasImageFilter,
        sortBy: currentSortBy,
        page: currentPage,
        limit: 5
      });
      setCurrentReviewsData(data);
    } catch (err) {
      console.error('Lỗi tải đánh giá sản phẩm hiện tại:', err);
    } finally {
      setCurrentIsLoading(false);
    }
  }, [productId, currentRatingFilter, currentHasImageFilter, currentSortBy, currentPage]);

  useEffect(() => {
    loadCurrentReviews();
  }, [loadCurrentReviews]);

  // 2. Fetch data cho Tab "Tất cả đánh giá" (tổng hợp toàn shop)
  const loadAllReviews = useCallback(async () => {
    setAllIsLoading(true);
    try {
      const data = await ReviewService.getAllReviews({
        ratingFilter: allRatingFilter,
        hasImageFilter: allHasImageFilter,
        productNameFilter: allProductNameFilter,
        sortBy: allSortBy,
        page: allPage,
        limit: 5
      }, productList);
      setAllReviewsData(data);
    } catch (err) {
      console.error('Lỗi tải tất cả đánh giá:', err);
    } finally {
      setAllIsLoading(false);
    }
  }, [allRatingFilter, allHasImageFilter, allProductNameFilter, allSortBy, allPage, productList]);

  useEffect(() => {
    loadAllReviews();
  }, [loadAllReviews]);

  // Khi gửi đánh giá mới thành công cho sản phẩm này
  const handleReviewSuccess = () => {
    setCurrentPage(1);
    setAllPage(1);
    loadCurrentReviews();
    loadAllReviews();
  };

  // Điều hướng khi người dùng nhấn vào sản phẩm được đánh giá (trong tab Tất cả đánh giá)
  const handleProductSelect = (targetProductId) => {
    if (onViewProduct) {
      onViewProduct(targetProductId);
    } else {
      navigate(`/products/${targetProductId}`);
    }
  };

  // Thống kê Tab 1 (Sản phẩm này)
  const currentStats = currentReviewsData.stats;
  const currentAvgScore = currentStats?.average_rating || 0;
  const currentTotal = currentStats?.total_reviews || 0;
  const currentBreakdown = currentStats?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const currentPercentages = currentStats?.percentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  // Thống kê Tab 2 (Tất cả đánh giá)
  const allStats = allReviewsData.stats;
  const allAvgScore = allStats?.average_rating || 0;
  const allTotal = allStats?.total_reviews || 0;
  const allBreakdown = allStats?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const allPercentages = allStats?.percentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <section className="product-reviews-section">
      {/* Header khu vực Đánh giá */}
      <div className="reviews-section-header">
        <div>
          <span className="reviews-section-subtitle">ĐÁNH GIÁ & NHẬN XÉT</span>
          <h2 className="reviews-section-title">Trải Nghiệm Khách Hàng</h2>
        </div>
        <button
          type="button"
          className="btn-open-review-form"
          onClick={() => setIsFormOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Viết đánh giá
        </button>
      </div>

      {/* 1. HAI TAB CHÍNH: ĐÁNH GIÁ SẢN PHẨM NÀY & TẤT CẢ ĐÁNH GIÁ */}
      <div className="reviews-main-tabs-bar">
        <button
          type="button"
          className={`reviews-main-tab-btn ${activeMainTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('current')}
        >
          <span className="tab-icon">🧴</span>
          <span className="tab-title">Đánh giá sản phẩm này</span>
          <span className="tab-badge">{currentTotal}</span>
        </button>

        <button
          type="button"
          className={`reviews-main-tab-btn ${activeMainTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('all')}
        >
          <span className="tab-icon">🌟</span>
          <span className="tab-title">Tất cả đánh giá</span>
          <span className="tab-badge gold">{allTotal}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ĐÁNH GIÁ SẢN PHẨM NÀY */}
      {/* ============================================================== */}
      {activeMainTab === 'current' && (
        <div className="reviews-tab-content tab-current-content">
          {/* Tổng quan sản phẩm này */}
          <div className="reviews-overview-card">
            <div className="overview-score-box">
              <div className="score-big">{currentTotal > 0 ? currentAvgScore : '5.0'}</div>
              <StarRating value={currentTotal > 0 ? currentAvgScore : 5} size={22} readOnly={true} />
              <div className="score-total">
                Dựa trên {currentTotal} lượt đánh giá
              </div>
            </div>

            <div className="overview-breakdown-box">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = currentBreakdown[starNum] || 0;
                const pct = currentPercentages[starNum] || 0;
                return (
                  <div 
                    key={starNum} 
                    className="breakdown-row"
                    onClick={() => { setCurrentRatingFilter(String(starNum)); setCurrentPage(1); }}
                    role="button"
                    tabIndex={0}
                    title={`Lọc đánh giá ${starNum} sao (${count} lượt)`}
                  >
                    <div className="breakdown-star-label">
                      <span>{starNum}</span>
                      <span className="star-icon">★</span>
                    </div>
                    <div className="breakdown-bar-track">
                      <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="breakdown-count">
                      {count} <span className="pct">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overview-cta-box">
              <p className="cta-heading">Bạn đã trải nghiệm {productName || 'mùi hương này'}?</p>
              <p className="cta-desc">
                Hãy chia sẻ cảm nhận chân thực để cộng đồng yêu nước hoa cùng tham khảo.
              </p>
              <button
                type="button"
                className="btn-cta-write"
                onClick={() => setIsFormOpen(true)}
              >
                Đánh giá ngay
              </button>
            </div>
          </div>

          {/* Danh sách review của riêng sản phẩm này */}
          <ReviewList
            reviews={currentReviewsData.reviews}
            total={currentReviewsData.total}
            page={currentReviewsData.page}
            totalPages={currentReviewsData.totalPages}
            ratingFilter={currentRatingFilter}
            hasImageFilter={currentHasImageFilter}
            sortBy={currentSortBy}
            onRatingFilterChange={(val) => { setCurrentRatingFilter(val); setCurrentPage(1); }}
            onHasImageFilterChange={(val) => { setCurrentHasImageFilter(val); setCurrentPage(1); }}
            onSortChange={(val) => { setCurrentSortBy(val); setCurrentPage(1); }}
            onPageChange={(p) => setCurrentPage(p)}
            onOpenForm={() => setIsFormOpen(true)}
            isLoading={currentIsLoading}
            onVoteHelpful={loadCurrentReviews}
            showProduct={false}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TẤT CẢ ĐÁNH GIÁ (TOÀN BỘ SẢN PHẨM CỦA SHOP) */}
      {/* ============================================================== */}
      {activeMainTab === 'all' && (
        <div className="reviews-tab-content tab-all-content">
          {/* Tổng quan toàn bộ shop */}
          <div className="reviews-overview-card all-shop-overview">
            <div className="overview-score-box">
              <div className="all-shop-badge">⭐ ĐÁNH GIÁ TOÀN SHOP</div>
              <div className="score-big">{allTotal > 0 ? allAvgScore : '5.0'}</div>
              <StarRating value={allTotal > 0 ? allAvgScore : 5} size={22} readOnly={true} />
              <div className="score-total">
                Tổng hợp {allTotal} lượt nhận xét từ khách hàng
              </div>
            </div>

            <div className="overview-breakdown-box">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = allBreakdown[starNum] || 0;
                const pct = allPercentages[starNum] || 0;
                return (
                  <div 
                    key={starNum} 
                    className="breakdown-row"
                    onClick={() => { setAllRatingFilter(String(starNum)); setAllPage(1); }}
                    role="button"
                    tabIndex={0}
                    title={`Lọc tất cả đánh giá ${starNum} sao (${count} lượt)`}
                  >
                    <div className="breakdown-star-label">
                      <span>{starNum}</span>
                      <span className="star-icon">★</span>
                    </div>
                    <div className="breakdown-bar-track">
                      <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="breakdown-count">
                      {count} <span className="pct">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overview-cta-box all-shop-highlight">
              <p className="cta-heading">Cộng Đồng Yêu Hương X2TN</p>
              <p className="cta-desc">
                Khám phá phản hồi thực tế từ những người yêu hương đã trải nghiệm sản phẩm tại X2TN Perfume.
              </p>
              <div className="community-stat-pill">
                ✨ 100% Đánh giá thực tế từ người dùng
              </div>
            </div>
          </div>

          {/* Danh sách Tất cả đánh giá (có gắn thẻ sản phẩm kiểu Shopee, lọc tên sản phẩm) */}
          <ReviewList
            reviews={allReviewsData.reviews}
            total={allReviewsData.total}
            page={allReviewsData.page}
            totalPages={allReviewsData.totalPages}
            ratingFilter={allRatingFilter}
            hasImageFilter={allHasImageFilter}
            sortBy={allSortBy}
            productNameFilter={allProductNameFilter}
            productList={productList}
            onRatingFilterChange={(val) => { setAllRatingFilter(val); setAllPage(1); }}
            onHasImageFilterChange={(val) => { setAllHasImageFilter(val); setAllPage(1); }}
            onSortChange={(val) => { setAllSortBy(val); setAllPage(1); }}
            onProductNameFilterChange={(val) => { setAllProductNameFilter(val); setAllPage(1); }}
            onPageChange={(p) => setAllPage(p)}
            isLoading={allIsLoading}
            onVoteHelpful={loadAllReviews}
            showProduct={true}
            onSelectProduct={handleProductSelect}
          />
        </div>
      )}

      {/* Modal Viết đánh giá cho sản phẩm hiện tại */}
      <ReviewForm
        productId={productId}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleReviewSuccess}
      />

      <style>{`
        .product-reviews-section {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          animation: fadeIn 0.3s ease-out;
        }
        .reviews-section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .reviews-section-subtitle {
          font-size: 0.78rem;
          color: #d4af37;
          letter-spacing: 2px;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }
        .reviews-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f2f2f3;
          margin: 0;
          background: linear-gradient(135deg, #ffffff 40%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .btn-open-review-form {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(168, 146, 122, 0.3));
          border: 1px solid rgba(212, 175, 55, 0.5);
          color: #f5d77f;
          padding: 9px 18px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
        }
        .btn-open-review-form:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.35), rgba(168, 146, 122, 0.45));
          border-color: #d4af37;
          color: #fff;
          box-shadow: 0 0 16px rgba(212, 175, 55, 0.3);
          transform: translateY(-1px);
        }

        /* 1. Hai Tab chính */
        .reviews-main-tabs-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
          flex-wrap: wrap;
        }
        .reviews-main-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .reviews-main-tab-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border-color: rgba(212, 175, 55, 0.3);
        }
        .reviews-main-tab-btn.active {
          background: linear-gradient(135deg, rgba(42, 37, 23, 0.95), rgba(24, 25, 36, 0.95));
          border-color: #d4af37;
          color: #f5d77f;
          box-shadow: 0 0 16px rgba(212, 175, 55, 0.25);
        }
        .tab-icon {
          font-size: 1rem;
        }
        .tab-badge {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .reviews-main-tab-btn.active .tab-badge {
          background: rgba(212, 175, 55, 0.25);
          color: #f5d77f;
          border: 1px solid rgba(212, 175, 55, 0.4);
        }
        .tab-badge.gold {
          background: rgba(212, 175, 55, 0.18);
          color: #f5d77f;
        }

        /* Overview Card */
        .reviews-overview-card {
          background: rgba(22, 23, 34, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 24px;
          display: grid;
          grid-template-columns: 200px 1fr 220px;
          gap: 28px;
          align-items: center;
          margin-bottom: 24px;
        }
        .all-shop-overview {
          background: linear-gradient(165deg, rgba(28, 29, 44, 0.75) 0%, rgba(18, 19, 28, 0.85) 100%);
          border-color: rgba(212, 175, 55, 0.2);
        }
        .all-shop-badge {
          font-size: 0.7rem;
          color: #d4af37;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .overview-score-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          padding-right: 20px;
        }
        .score-big {
          font-size: 3.4rem;
          font-weight: 800;
          color: #f5d77f;
          line-height: 1;
          letter-spacing: -1px;
        }
        .score-total {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .overview-breakdown-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .breakdown-row {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .breakdown-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .breakdown-star-label {
          display: flex;
          align-items: center;
          gap: 2px;
          width: 32px;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }
        .breakdown-star-label .star-icon {
          color: #d4af37;
          font-size: 0.9rem;
        }
        .breakdown-bar-track {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .breakdown-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #a8927a, #d4af37);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .breakdown-count {
          width: 75px;
          text-align: right;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.65);
        }
        .breakdown-count .pct {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .overview-cta-box {
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .cta-heading {
          font-size: 0.92rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 6px 0;
        }
        .cta-desc {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 14px 0;
          line-height: 1.4;
        }
        .btn-cta-write {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cta-write:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #d4af37;
          color: #f5d77f;
        }
        .community-stat-pill {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #f5d77f;
          font-size: 0.74rem;
          padding: 6px 10px;
          border-radius: 8px;
          text-align: center;
        }

        .reviews-tab-content {
          animation: fadeIn 0.25s ease-out;
        }

        @media (max-width: 900px) {
          .reviews-overview-card {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .overview-score-box {
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 16px;
          }
          .overview-cta-box {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 16px;
            text-align: center;
          }
          .btn-cta-write {
            align-self: center;
          }
        }
      `}</style>
    </section>
  );
}
