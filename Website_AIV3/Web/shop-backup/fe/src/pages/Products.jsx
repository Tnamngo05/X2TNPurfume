import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductsAPI, TrendAPI, readJsonStorage, resolveImageUrl, writeStorage } from '../lib/api';
import { genderOptions, categoryOptions, normalizeGender, formatPrice } from '../lib/productUtils';
import { useNavigate, useParams } from 'react-router-dom';
import RelatedProducts from '../components/RelatedProducts.jsx';
import AIRecommendation from '../components/AIRecommendation.jsx';
import SmartSearchBar from '../components/SmartSearchBar.jsx';
import { recordBehavior, rankProducts, getHistory } from '../lib/rankingEngine.js';
import ProductReviewSection from '../components/reviews/ProductReviewSection.jsx';
import QuizTriggerButton from '../components/quiz/QuizTriggerButton.jsx';

// --- Constants & Helpers ---
const PAGE_SIZE = 12;
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=500&auto=format&fit=crop';

const handleImageError = (event) => {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = DEFAULT_IMAGE;
};

const normalizeSizes = (product) => {
  const source = Array.isArray(product.variants)
    ? product.variants
    : Array.isArray(product.sizes)
      ? product.sizes
      : Array.isArray(product.volumes)
        ? product.volumes
        : Array.isArray(product.capacities)
          ? product.capacities
          : [];

  return source.map((variant) => {
    if (typeof variant === 'string' || typeof variant === 'number') {
      return { size: String(variant), price: null, stock: null };
    }
    const size = variant?.size || variant?.volume || variant?.capacity || variant?.name;
    if (!size) return null;
    return {
      size: String(size),
      price: Number.isFinite(Number(variant.price)) ? Number(variant.price) : null,
      stock: Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : null,
    };
  }).filter(Boolean);
};

export default function Products(){
  const navigate = useNavigate();
  const { productId } = useParams();

  const normalizeProduct = (p) => ({
    id: p.id,
    name: p.name || '',
    brand: p.brand || '',
    price: Number(p.price || 0),
    image: resolveImageUrl(p.image_url || p.imageUrl || p.image || p.thumbnail) || DEFAULT_IMAGE,
    image_url: resolveImageUrl(p.image_url || p.imageUrl || p.image || p.thumbnail) || DEFAULT_IMAGE,
    category: p.category || 'Nước hoa',
    gender: normalizeGender(p.gender),
    description: p.description || '',
    stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : 0,
    isFeatured: !!p.is_featured || !!p.isFeatured,
    concentration: p.concentration || '',
    longevity: p.longevity || '',
    origin: p.origin || '',
    fragrance_family: p.fragrance_family || '',
    sizes: normalizeSizes(p),
    rating: Number.isFinite(Number(p.rating_average ?? p.rating)) ? Number(p.rating_average ?? p.rating) : null,
    reviewCount: Number.isFinite(Number(p.reviews_count ?? p.review_count)) ? Number(p.reviews_count ?? p.review_count) : null,
    originalPrice: Number.isFinite(Number(p.compare_at_price ?? p.original_price))
      ? Number(p.compare_at_price ?? p.original_price)
      : null
  });

  // --- STATE MANAGEMENT ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Filtering & Sorting State
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [gender, setGender] = useState('All');
  const [sortKey, setSortKey] = useState('newest');
  const [sortDir, setSortDir] = useState('desc');
  
  // Pagination State
  const [page, setPage] = useState(1);

  // PRODUCT DETAIL MODAL STATE
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState('');

  // Sản phẩm vừa xem gần nhất trong phiên hiện tại (dùng để gợi ý tag kiểu Shopee, không cần đăng nhập)
  const [lastViewedProduct, setLastViewedProduct] = useState(() => {
    try {
      return readJsonStorage('lastViewedProduct', null, sessionStorage);
    } catch (error) {
      return null;
    }
  });

  // Tăng counter này mỗi khi hành vi mới được ghi nhận → trigger useMemo re-rank
  const [rankingVersion, setRankingVersion] = useState(0);
  const trackedViewsRef = useRef(new Set());
  const trackedSearchesRef = useRef(new Set());
  const bumpRanking = () => setRankingVersion(v => v + 1);

  // --- FUNCTIONS ---
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const load = (withDelay = true) => {
    setLoading(true);
    const doLoad = async () => {
      try {
        const stored = await ProductsAPI.list();
        const normalized = stored.map(normalizeProduct);
        setItems(normalized);
      } catch (error) {
        showNotification('Lỗi khi tải danh sách sản phẩm', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (withDelay) setTimeout(doLoad, 600); else doLoad();
  };
  
  useEffect(() => {
    load(false);
  }, []);

  const addToCart = (product, qty = 1, size = product.sizes?.[0]?.size || '', redirect = false) => {
    const variant = product.sizes?.find(option => option.size === size);
    const availableStock = variant?.stock ?? product.stock;
    const selectedPrice = variant?.price ?? product.price;
    if (availableStock <= 0) {
      showNotification('Sản phẩm đã hết hàng', 'error');
      return;
    }

    const storedCart = readJsonStorage('cart', []);
    const cart = Array.isArray(storedCart) ? storedCart : [];
    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.size === size);

    if (existingItemIndex > -1) {
      cart[existingItemIndex].qty += qty;
    } else {
      cart.push({ 
        id: product.id, 
        name: product.name, 
        price: selectedPrice, 
        image: product.image, 
        brand: product.brand, 
        qty: qty,
        size: size
      });
    }
    
    writeStorage('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    if (redirect) {
      navigate('/cart');
    } else {
      showNotification(`Đã thêm ${qty} "${product.name}" (${size}) vào giỏ hàng`);
    }
  };

  const resetFilters = () => {
    setQ(''); 
    setCategory('All'); 
    setGender('All'); 
    setSortKey('newest'); 
    setSortDir('desc'); 
    setPage(1);
  };

  const openDetailState = (product) => {
    const normalizedProduct = normalizeProduct(product);
    setSelectedProduct(normalizedProduct);
    setQuantity(1);
    setSelectedSize(normalizedProduct.sizes[0]?.size || '');
    setActiveTab('description');
    setActiveImage(normalizedProduct.image);

    // Ghi nhận lượt xem để gợi ý xu hướng (ẩn danh) + lưu tạm cho phiên hiện tại
    setLastViewedProduct(normalizedProduct);
    try {
      writeStorage('lastViewedProduct', JSON.stringify(normalizedProduct), sessionStorage);
    } catch (error) {
      // Bỏ qua nếu sessionStorage không khả dụng
    }
    if (!trackedViewsRef.current.has(normalizedProduct.id)) {
      trackedViewsRef.current.add(normalizedProduct.id);
      TrendAPI.trackView(normalizedProduct.id);
    }

    // Ghi nhận hành vi XEM vào rankingEngine để re-rank danh sách
    recordBehavior('view', {
      product_id: normalizedProduct.id,
      brand: normalizedProduct.brand,
      fragrance_family: normalizedProduct.fragrance_family,
      gender: normalizedProduct.gender,
      category: normalizedProduct.category,
      price: normalizedProduct.price,
    });
    bumpRanking();
  };

  const openDetail = (product) => {
    const normalizedProduct = normalizeProduct(product);
    openDetailState(normalizedProduct);
    navigate(`/products/${normalizedProduct.id}`);
  };
  
  const closeDetail = () => {
    setSelectedProduct(null);
    navigate('/products');
  };

  // --- MEMOIZED CALCULATIONS ---
  const filtered = useMemo(() => {
    let list = items.slice();
    if (q) {
      const key = q.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(key) ||
        (p.brand && p.brand.toLowerCase().includes(key)) ||
        (p.fragrance_family && p.fragrance_family.toLowerCase().includes(key)) ||
        (p.concentration && p.concentration.toLowerCase().includes(key)) ||
        (p.category && p.category.toLowerCase().includes(key))
      );
    }
    if (category !== 'All') list = list.filter(p => p.category === category);
    if (gender !== 'All') list = list.filter(p => p.gender === gender);

    const getVal = (p) => {
      switch (sortKey) {
        case 'price': return p.price;
        case 'stock': return p.stock;
        case 'newest': return p.id;
        default: return p.name?.toLowerCase();
      }
    };

    list.sort((a, b) => {
      const valA = getVal(a);
      const valB = getVal(b);
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [items, q, category, gender, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Ranking layer: áp dụng sau khi đã filter & sort thường.
  // rankingVersion đảm bảo re-rank mỗi khi có hành vi mới.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ranked = useMemo(() => rankProducts(filtered), [filtered, rankingVersion]);

  const pageItems = useMemo(() => ranked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [ranked, page]);

  // Ghi nhận từ khóa tìm kiếm (ẩn danh, debounce để không spam backend)
  // Đồng thời ghi vào rankingEngine để re-rank danh sách theo hành vi search
  useEffect(() => {
    const keyword = q.trim();
    if (keyword.length < 2) return;
    const timer = setTimeout(() => {
      if (trackedSearchesRef.current.has(keyword.toLowerCase())) return;
      trackedSearchesRef.current.add(keyword.toLowerCase());
      TrendAPI.trackSearch(keyword);
      recordBehavior('search', { keyword });
      bumpRanking();
    }, 700);
    return () => clearTimeout(timer);
  }, [q]);

  // Tag gợi ý kiểu Shopee: tính hoàn toàn ở client từ dữ liệu đã tải sẵn, không gọi thêm API
  const suggestedTags = useMemo(() => {
    const tags = [];
    const seen = new Set();
    const pushTag = (rawValue, type) => {
      const value = (rawValue || '').toString().trim();
      if (!value) return;
      const dedupeKey = `${type}:${value.toLowerCase()}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      tags.push({ label: value, type, value });
    };

    // Ưu tiên từ lịch sử hành vi rankingEngine (tối đa 10 hành vi, mới nhất trước)
    const history = getHistory();
    if (!q.trim()) {
      history.slice(0, 5).forEach((entry) => {
        if (entry.brand) pushTag(entry.brand, 'q');
        if (entry.fragrance_family) pushTag(entry.fragrance_family, 'q');
        if (entry.gender) pushTag(entry.gender, 'gender');
        if (entry.keyword && !entry.brand) pushTag(entry.keyword, 'q');
      });
    }

    // Bổ sung từ sản phẩm vừa xem nếu chưa có
    if (!q.trim() && lastViewedProduct) {
      pushTag(lastViewedProduct.brand, 'q');
      pushTag(lastViewedProduct.fragrance_family, 'q');
      pushTag(lastViewedProduct.gender, 'gender');
      pushTag(lastViewedProduct.concentration, 'q');
    }

    const pool = q.trim() ? filtered : items;
    const countBy = (getter) => {
      const map = new Map();
      pool.forEach((p) => {
        const value = (getter(p) || '').toString().trim();
        if (!value) return;
        map.set(value, (map.get(value) || 0) + 1);
      });
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };

    countBy((p) => p.brand).slice(0, 4).forEach(([value]) => pushTag(value, 'q'));
    countBy((p) => p.fragrance_family).slice(0, 3).forEach(([value]) => pushTag(value, 'q'));
    countBy((p) => p.gender).slice(0, 3).forEach(([value]) => pushTag(value, 'gender'));
    countBy((p) => p.concentration).slice(0, 3).forEach(([value]) => pushTag(value, 'q'));

    return tags.slice(0, 10);
  }, [q, filtered, items, lastViewedProduct, rankingVersion]);

  const handleTagClick = (tag) => {
    if (tag.type === 'gender') {
      setGender(tag.value);
    } else {
      setQ(tag.value);
    }
    setPage(1);
  };

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  useEffect(() => {
    if (!productId) {
      if (selectedProduct) setSelectedProduct(null);
      return;
    }

    const targetId = Number(productId);
    if (!Number.isFinite(targetId)) {
      navigate('/products', { replace: true });
      return;
    }

    if (!items.length || loading) return;

    const targetProduct = items.find((item) => Number(item.id) == targetId);
    if (!targetProduct) {
      showNotification('Không tìm thấy sản phẩm đang xem', 'error');
      navigate('/products', { replace: true });
      return;
    }

    if (!selectedProduct || Number(selectedProduct.id) !== Number(targetProduct.id)) {
      openDetailState(targetProduct);
    }
  }, [productId, items, loading]);

  // --- RENDER ---
  return (
    <div className="luxury-page-wrapper">
      {/* NOTIFICATION */}
      {notification.show && (
        <div className={`luxury-toast luxury-toast-${notification.type} ${notification.show ? 'show' : ''}`}>
          <div className="luxury-toast-icon">{notification.type === 'success' ? '✓' : '✕'}</div>
          <div className="luxury-toast-content">
            <h4 className="luxury-toast-title">{notification.type === 'success' ? 'Thành công' : 'Thông báo'}</h4>
            <p className="luxury-toast-message">{notification.message}</p>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <div className="luxury-modal-overlay" onClick={closeDetail}>
          <div className="luxury-modal-container" onClick={e => e.stopPropagation()}>
            <button className="luxury-modal-close" onClick={closeDetail}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="luxury-breadcrumb">
              <span>Trang chủ</span>
              <span className="luxury-breadcrumb-separator">/</span>
              <span>{selectedProduct.category}</span>
              <span className="luxury-breadcrumb-separator">/</span>
              <span className="luxury-breadcrumb-current">{selectedProduct.name}</span>
            </div>

            <div className="luxury-product-detail">
              {/* Gallery Section */}
              <div className="luxury-gallery-section">
                 <div className="luxury-main-image">
                  <img
                    src={activeImage || DEFAULT_IMAGE}
                    alt={selectedProduct.name}
                    onError={handleImageError}
                  />
                  {selectedProduct.isFeatured && (
                    <span className="luxury-badge-premium">Premium</span>
                  )}
                </div>              
              </div>

              {/* Info Section */}
              <div className="luxury-info-section">
                <div className="luxury-brand-tag">{selectedProduct.brand}</div>
                <h1 className="luxury-product-title">{selectedProduct.name}</h1>
                
                {selectedProduct.rating !== null && (
                  <div className="luxury-rating">
                    <div className="luxury-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} width="20" height="20" viewBox="0 0 20 20" fill={star <= selectedProduct.rating ? 'currentColor' : 'none'}>
                          <path d="M10 15L4.122 18.09L5.5 11.545L0 7.091L6.561 6.318L10 0L13.439 6.318L20 7.091L14.5 11.545L15.878 18.09L10 15Z"/>
                        </svg>
                      ))}
                    </div>
                    {selectedProduct.reviewCount !== null && (
                      <span className="luxury-review-count">{selectedProduct.reviewCount} đánh giá</span>
                    )}
                  </div>
                )}

                <div className="luxury-price-section">
                  <div className="luxury-current-price">
                    {formatPrice(selectedProduct.sizes.find(option => option.size === selectedSize)?.price ?? selectedProduct.price)}
                  </div>
                  {selectedProduct.originalPrice !== null && (
                    <div className="luxury-old-price">{formatPrice(selectedProduct.originalPrice)}</div>
                  )}
                </div>

                <div className="luxury-availability">
                  <span className="luxury-availability-label">Tình trạng:</span>
                  <span className={`luxury-availability-value ${(selectedProduct.sizes.find(option => option.size === selectedSize)?.stock ?? selectedProduct.stock) > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {(selectedProduct.sizes.find(option => option.size === selectedSize)?.stock ?? selectedProduct.stock) > 0 ? 'Còn hàng' : 'Tạm hết hàng'}
                  </span>
                </div>

                <div className="luxury-variants">
                  <h3 className="luxury-variants-title">Dung tích</h3>
                  <div className="luxury-size-options">
                    {selectedProduct.sizes.map(option => (
                      <button
                        key={option.size}
                        className={`luxury-size-btn ${selectedSize === option.size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(option.size)}
                      >
                        {option.size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="luxury-actions">
                  <div className="luxury-quantity">
                    <button 
                      className="luxury-quantity-btn"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <input 
                      type="text" 
                      value={quantity} 
                      readOnly 
                      className="luxury-quantity-input"
                    />
                    <button 
                      className="luxury-quantity-btn"
                      onClick={() => setQuantity(q => Math.min(
                        selectedProduct.sizes.find(option => option.size === selectedSize)?.stock ?? selectedProduct.stock,
                        q + 1
                      ))}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="luxury-add-to-cart"
                    onClick={() => addToCart(selectedProduct, quantity, selectedSize, false)}
                    disabled={(selectedProduct.sizes.find(option => option.size === selectedSize)?.stock ?? selectedProduct.stock) <= 0}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7 18C7.55228 18 8 17.5523 8 17C8 16.4477 7.55228 16 7 16C6.44772 16 6 16.4477 6 17C6 17.5523 6.44772 18 7 18Z" fill="currentColor"/>
                      <path d="M15 18C15.5523 18 16 17.5523 16 17C16 16.4477 15.5523 16 15 16C14.4477 16 14 16.4477 14 17C14 17.5523 14.4477 18 15 18Z" fill="currentColor"/>
                      <path d="M2 2H4L4.5 4H18L16 12H6L4 4H2V2Z" fill="currentColor"/>
                    </svg>
                    Thêm vào giỏ
                  </button>
                  <button 
                    className="luxury-buy-now"
                    onClick={() => addToCart(selectedProduct, quantity, selectedSize, true)}
                    disabled={(selectedProduct.sizes.find(option => option.size === selectedSize)?.stock ?? selectedProduct.stock) <= 0}
                  >
                    Mua ngay
                  </button>
                </div>

                <div className="luxury-benefits">
                  <div className="luxury-benefit-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L22 7V12C22 17 12 22 12 22C12 22 2 17 2 12V7L12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 7V13" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                    <div>
                      <strong>Bảo hành chính hãng</strong>
                      <p>100% sản phẩm authentic</p>
                    </div>
                  </div>
                  <div className="luxury-benefit-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12C4 7.58172 7.58172 4 12 4C15.5 4 18.5 6.5 19.5 10" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M19 5V10H14" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M20 12C20 16.4183 16.4183 20 12 20C8.5 20 5.5 17.5 4.5 14" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 19V14H10" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <div>
                      <strong>Đổi trả dễ dàng</strong>
                      <p>Trong vòng 30 ngày</p>
                    </div>
                  </div>
                  <div className="luxury-benefit-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="8" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="16" y="11" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="7" cy="18" r="2" fill="currentColor"/>
                      <circle cx="19" cy="18" r="2" fill="currentColor"/>
                    </svg>
                    <div>
                      <strong>Giao hàng siêu tốc</strong>
                      <p>Freeship toàn quốc</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <RelatedProducts
              productId={selectedProduct.id}
              onViewDetail={(product) => openDetail(product)}
              onAddToCart={(product) => {
                const normalized = normalizeProduct(product);
                addToCart(normalized, 1, normalized.sizes[0]?.size || '', false);
              }}
              onBackToList={() => closeDetail()}
            />

            <AIRecommendation
              productId={selectedProduct.id}
              onViewDetail={(product) => openDetail(product)}
            />

            {/* Tabs Section */}
            <div className="luxury-tabs">
              <div className="luxury-tabs-header">
                <button 
                  className={`luxury-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveTab('description')}
                >
                  Mô tả sản phẩm
                </button>
                <button 
                  className={`luxury-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Chi tiết & thông số
                </button>
              </div>
              
              <div className="luxury-tab-content">
                {activeTab === 'description' ? (
                  <div className="luxury-description">
                    <p>{selectedProduct.description}</p>
                    <p>Sản phẩm được nhập khẩu chính hãng từ Pháp, với thiết kế sang trọng và tinh tế, phù hợp với những khách hàng yêu thích sự đẳng cấp và khác biệt.</p>
                  </div>
                ) : (
                  <div className="luxury-specs">
                    <div className="luxury-specs-grid">
                      <div className="luxury-spec-item">
                        <span className="luxury-spec-label">Thương hiệu</span>
                        <span className="luxury-spec-value">{selectedProduct.brand || 'Đang cập nhật'}</span>
                      </div>
                      <div className="luxury-spec-item">
                        <span className="luxury-spec-label">Xuất xứ</span>
                        <span className="luxury-spec-value">{selectedProduct.origin || 'Đang cập nhật'}</span>
                      </div>
                      <div className="luxury-spec-item">
                        <span className="luxury-spec-label">Nồng độ</span>
                        <span className="luxury-spec-value">{selectedProduct.concentration || 'Đang cập nhật'}</span>
                      </div>
                      <div className="luxury-spec-item">
                        <span className="luxury-spec-label">Phong cách</span>
                        <span className="luxury-spec-value">{selectedProduct.category}</span>
                      </div>
                      <div className="luxury-spec-item">
                        <span className="luxury-spec-label">Đối tượng</span>
                        <span className="luxury-spec-value">{selectedProduct.gender}</span>
                      </div>
                      <div className="luxury-spec-item">
                        <span className="luxury-spec-label">Độ lưu hương</span>
                        <span className="luxury-spec-value">{selectedProduct.longevity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KHU VỰC ĐÁNH GIÁ SẢN PHẨM (Mỗi sản phẩm có đánh giá riêng theo productId) */}
            <ProductReviewSection
              productId={selectedProduct.id}
              productName={selectedProduct.name}
              onViewProduct={(targetId) => {
                const found = items.find(it => Number(it.id) === Number(targetId));
                if (found) {
                  openDetail(found);
                } else {
                  navigate(`/products/${targetId}`);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="luxury-hero">
        <div className="luxury-hero-content">
          <h1 className="luxury-hero-title">PERFUME LIST</h1>
          <p className="luxury-hero-subtitle">Khám phá những hương thơm đẳng cấp từ các thương hiệu danh tiếng</p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <QuizTriggerButton variant="banner" />
          </div>
        </div>
      </section>

      {/* Thanh tìm kiếm nhanh kiểu Shopee/Lazada — độc lập với ô tìm kiếm trong bộ lọc bên trái */}
      <SmartSearchBar
        items={items}
        onSelectProduct={(product) => openDetail(product)}
        onSubmitKeyword={(keyword) => { setQ(keyword); setPage(1); }}
      />

      <div className="luxury-container">
        {/* Sidebar Filters */}
        <aside className="luxury-sidebar">
          <div className="luxury-sidebar-header">
            <h3>Bộ lọc</h3>
            <button onClick={resetFilters} className="luxury-reset-filters">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Xóa lọc
            </button>
          </div>
          
          <div className="luxury-filter-section">
            <input 
              type="text" 
              className="luxury-search-input" 
              placeholder="Tìm kiếm sản phẩm..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
          </div>

          <div className="luxury-filter-section">
            <h4 className="luxury-filter-title">Danh mục</h4>
            <div className="luxury-filter-options">
              {['All', ...categoryOptions].map(cat => (
                <label key={cat} className="luxury-radio">
                  <input 
                    type="radio" 
                    name="category" 
                    value={cat} 
                    checked={category === cat} 
                    onChange={e => { setCategory(e.target.value); setPage(1); }} 
                  />
                  <span className="luxury-radio-custom"></span>
                  <span className="luxury-radio-label">{cat === 'All' ? 'Tất cả' : cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="luxury-filter-section">
            <h4 className="luxury-filter-title">Giới tính</h4>
            <div className="luxury-filter-options">
              {['All', ...genderOptions].map(g => (
                <label key={g} className="luxury-radio">
                  <input 
                    type="radio" 
                    name="gender" 
                    value={g} 
                    checked={gender === g} 
                    onChange={e => { setGender(e.target.value); setPage(1); }} 
                  />
                  <span className="luxury-radio-custom"></span>
                  <span className="luxury-radio-label">{g === 'All' ? 'Tất cả' : g}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="luxury-main">
          {/* Tag gợi ý kiểu Shopee */}
          {suggestedTags.length > 0 && (
            <div className="luxury-suggested-tags" aria-label="Gợi ý tìm kiếm liên quan">
              {suggestedTags.map((tag) => (
                <button
                  key={`${tag.type}-${tag.value}`}
                  type="button"
                  className="luxury-suggested-tag"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="luxury-toolbar">
            <div className="luxury-results">
              <span className="luxury-results-count">{filtered.length}</span>
              <span className="luxury-results-label">sản phẩm</span>
            </div>
            <div className="luxury-sort">
              <span className="luxury-sort-label">Sắp xếp:</span>
              <select 
                className="luxury-sort-select" 
                value={sortKey} 
                onChange={e => setSortKey(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="price">Giá</option>
                <option value="name">Tên A-Z</option>
              </select>
              <button 
                className="luxury-sort-direction"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="luxury-loading">
              <div className="luxury-spinner"></div>
              <p>Đang tải sản phẩm...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="luxury-empty">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="30" stroke="#333" strokeWidth="2"/>
                <path d="M30 30L50 50M50 30L30 50" stroke="#333" strokeWidth="2"/>
              </svg>
              <p>Không tìm thấy sản phẩm phù hợp</p>
            </div>
          ) : (
            <>
              <div className="luxury-grid">
                {pageItems.map(p => (
                  <article key={p.id} className="luxury-product-card" onClick={() => openDetail(p)}>
                    <div className="luxury-card-image">
                      {p.isFeatured && <span className="luxury-card-badge">Hot</span>}
                      <img src={p.image || DEFAULT_IMAGE} alt={p.name} loading="lazy" onError={handleImageError} />
                    </div>
                    <div className="luxury-card-content">
                      <div className="luxury-card-brand">{p.brand}</div>
                      <h3 className="luxury-card-title">{p.name}</h3>
                      <div className="luxury-card-price">{formatPrice(p.price)}</div>
                    </div>
                    <div className="luxury-card-footer">
                      <button 
                        className="luxury-card-btn"
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        disabled={p.stock <= 0}
                      >
                        {p.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="luxury-pagination">
                  <button 
                    className="luxury-pagination-btn"
                    disabled={page === 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  
                  <span className="luxury-pagination-info">
                    Trang <strong>{page}</strong> / {totalPages}
                  </span>
                  
                  <button 
                    className="luxury-pagination-btn"
                    disabled={page === totalPages} 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        /* Variables & Reset */
        .luxury-page-wrapper {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          min-height: 100vh;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Typography */
        .luxury-text-gold { color: #c5a572; }
        .luxury-text-green { color: #4caf92; }
        .luxury-text-red { color: #ff6b6b; }

        /* Toast Notifications */
        .luxury-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          background: rgba(20, 20, 20, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(197, 165, 114, 0.2);
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          transform: translateX(120%);
          transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          z-index: 10000;
          min-width: 320px;
        }

        .luxury-toast.show { transform: translateX(0); }

        .luxury-toast-success .luxury-toast-icon { color: #4caf92; }
        .luxury-toast-error .luxury-toast-icon { color: #ff6b6b; }

        .luxury-toast-icon {
          font-size: 24px;
          font-weight: 600;
        }

        .luxury-toast-title {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .luxury-toast-message {
          margin: 0;
          font-size: 13px;
          color: #999;
        }

        /* Hero Section */
        .luxury-hero {
          background: linear-gradient(180deg, #000 0%, #0a0a0a 100%);
          padding: 120px 20px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .luxury-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 50%, rgba(197, 165, 114, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .luxury-hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
        }

        .luxury-hero-title {
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 400;
          letter-spacing: 4px;
          margin: 0 0 20px;
          background: linear-gradient(135deg, #fff 0%, #c5a572 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-transform: uppercase;
        }

        .luxury-hero-subtitle {
          font-size: 16px;
          color: #999;
          letter-spacing: 1px;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Main Container */
        .luxury-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 24px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
        }

        /* Sidebar */
        .luxury-sidebar {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 24px;
          height: fit-content;
          position: sticky;
          top: 24px;
        }

        .luxury-sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .luxury-sidebar-header h3 {
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 1px;
          margin: 0;
          color: #c5a572;
        }

        .luxury-reset-filters {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .luxury-reset-filters:hover {
          color: #c5a572;
          background: rgba(197, 165, 114, 0.1);
        }

        .luxury-filter-section {
          margin-bottom: 32px;
        }

        .luxury-filter-title {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          margin: 0 0 16px;
          letter-spacing: 0.5px;
        }

        .luxury-search-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          transition: all 0.3s;
        }

        .luxury-search-input:focus {
          outline: none;
          border-color: #c5a572;
          background: rgba(0, 0, 0, 0.5);
        }

        .luxury-filter-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .luxury-radio {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: #999;
          font-size: 14px;
          transition: color 0.2s;
        }

        .luxury-radio:hover { color: #fff; }

        .luxury-radio input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .luxury-radio-custom {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          position: relative;
          transition: all 0.2s;
        }

        .luxury-radio input:checked + .luxury-radio-custom {
          border-color: #c5a572;
          background: #c5a572;
        }

        .luxury-radio input:checked + .luxury-radio-custom::after {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          width: 6px;
          height: 6px;
          background: #000;
          border-radius: 50%;
        }

        /* Tag gợi ý kiểu Shopee */
        .luxury-suggested-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }

        .luxury-suggested-tag {
          border: 1px solid rgba(197, 165, 114, 0.4);
          background: rgba(197, 165, 114, 0.08);
          color: #c5a572;
          border-radius: 999px;
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.22s ease;
          white-space: nowrap;
        }

        .luxury-suggested-tag:hover {
          background: rgba(197, 165, 114, 0.2);
          border-color: rgba(197, 165, 114, 0.85);
          transform: translateY(-1px);
        }

        /* Toolbar */
        .luxury-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 16px 20px;
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }

        .luxury-results {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .luxury-results-count {
          font-size: 24px;
          font-weight: 600;
          color: #c5a572;
        }

        .luxury-results-label {
          font-size: 14px;
          color: #666;
        }

        .luxury-sort {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .luxury-sort-label {
          font-size: 14px;
          color: #999;
        }

        .luxury-sort-select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px 32px 8px 12px;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23999' strokeWidth='1.5'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .luxury-sort-select:focus {
          outline: none;
          border-color: #c5a572;
        }

        .luxury-sort-direction {
          width: 36px;
          height: 36px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: #999;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .luxury-sort-direction:hover {
          border-color: #c5a572;
          color: #c5a572;
        }

        /* Products Grid */
        .luxury-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .luxury-product-card {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .luxury-product-card:hover {
          transform: translateY(-8px);
          border-color: rgba(197, 165, 114, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .luxury-card-image {
          position: relative;
          aspect-ratio: 1;
          background: #fff;
          padding: 24px;
        }

        .luxury-card-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
          transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .luxury-product-card:hover .luxury-card-image img {
          transform: scale(1.1);
        }

        .luxury-card-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: linear-gradient(135deg, #c5a572, #a58b5a);
          color: #000;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 30px;
          z-index: 1;
          letter-spacing: 0.5px;
        }

        .luxury-card-content {
          padding: 20px;
          flex: 1;
        }

        .luxury-card-brand {
          color: #c5a572;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .luxury-card-title {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 12px;
          color: #fff;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .luxury-card-price {
          font-size: 20px;
          font-weight: 600;
          color: #c5a572;
        }

        .luxury-card-footer {
          padding: 0 20px 20px;
        }

        .luxury-card-btn {
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 1px solid rgba(197, 165, 114, 0.3);
          border-radius: 12px;
          color: #c5a572;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .luxury-card-btn:hover:not(:disabled) {
          background: #c5a572;
          color: #000;
        }

        .luxury-card-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: #333;
          color: #666;
        }

        /* Pagination */
        .luxury-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 40px;
        }

        .luxury-pagination-btn {
          width: 44px;
          height: 44px;
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          color: #999;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .luxury-pagination-btn:hover:not(:disabled) {
          border-color: #c5a572;
          color: #c5a572;
        }

        .luxury-pagination-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .luxury-pagination-info {
          font-size: 14px;
          color: #999;
        }

        .luxury-pagination-info strong {
          color: #c5a572;
        }

        /* Modal */
        .luxury-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          justify-content: center;
          padding: 40px 20px;
          overflow-y: auto;
        }

        .luxury-modal-container {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          width: 100%;
          max-width: 1200px;
          border-radius: 30px;
          padding: 40px;
          position: relative;
          margin: auto;
          border: 1px solid rgba(197, 165, 114, 0.2);
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8);
          animation: luxuryFadeUp 0.5s ease;
        }

        @keyframes luxuryFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .luxury-modal-close {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          cursor: pointer;
          transition: all 0.3s;
          z-index: 10;
        }

        .luxury-modal-close:hover {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
        }

        .luxury-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          color: #666;
          font-size: 13px;
        }

        .luxury-breadcrumb-separator {
          color: #333;
        }

        .luxury-breadcrumb-current {
          color: #c5a572;
        }

        .luxury-product-detail {
          display: grid;
          grid-template-columns: 450px 1fr;
          gap: 50px;
          margin-bottom: 40px;
        }

        .luxury-gallery-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .luxury-main-image {
          position: relative;
          background: #fff;
          border-radius: 20px;
          aspect-ratio: 1;
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .luxury-main-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .luxury-badge-premium {
          position: absolute;
          top: 20px;
          left: 20px;
          background: linear-gradient(135deg, #c5a572, #a58b5a);
          color: #000;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 30px;
          letter-spacing: 0.5px;
        }

        .luxury-thumbnails {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .luxury-thumb-item {
          flex-shrink: 0;
          width: 80px;
          height: 80px;
          background: #fff;
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .luxury-thumb-item img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .luxury-thumb-item.active {
          border-color: #c5a572;
          transform: scale(1.05);
        }

        .luxury-info-section {
          display: flex;
          flex-direction: column;
        }

        .luxury-brand-tag {
          display: inline-block;
          background: rgba(197, 165, 114, 0.1);
          color: #c5a572;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 30px;
          margin-bottom: 16px;
          width: fit-content;
        }

        .luxury-product-title {
          font-size: 32px;
          font-weight: 400;
          color: #fff;
          margin: 0 0 16px;
          line-height: 1.3;
        }

        .luxury-rating {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .luxury-stars {
          display: flex;
          gap: 4px;
          color: #c5a572;
        }

        .luxury-review-count {
          font-size: 13px;
          color: #666;
        }

        .luxury-price-section {
          margin-bottom: 24px;
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .luxury-current-price {
          font-size: 36px;
          font-weight: 600;
          color: #c5a572;
        }

        .luxury-old-price {
          font-size: 20px;
          color: #666;
          text-decoration: line-through;
        }

        .luxury-availability {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .luxury-availability-label {
          color: #999;
          font-size: 14px;
        }

        .luxury-availability-value {
          font-size: 14px;
          font-weight: 500;
        }

        .luxury-availability-value.in-stock {
          color: #4caf92;
        }

        .luxury-availability-value.out-of-stock {
          color: #ff6b6b;
        }

        .luxury-variants {
          margin-bottom: 32px;
        }

        .luxury-variants-title {
          font-size: 14px;
          color: #fff;
          margin: 0 0 16px;
        }

        .luxury-size-options {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .luxury-size-btn {
          padding: 12px 24px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          color: #999;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .luxury-size-btn:hover {
          border-color: #c5a572;
          color: #c5a572;
        }

        .luxury-size-btn.active {
          background: rgba(197, 165, 114, 0.1);
          border-color: #c5a572;
          color: #c5a572;
        }

        .luxury-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .luxury-quantity {
          display: flex;
          width: 140px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }

        .luxury-quantity-btn {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: none;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .luxury-quantity-btn:hover {
          background: rgba(197, 165, 114, 0.1);
          color: #c5a572;
        }

        .luxury-quantity-input {
          width: 50px;
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
          border: none;
          border-left: 1px solid rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          font-weight: 500;
        }

        .luxury-add-to-cart {
          flex: 1;
          background: transparent;
          border: 1px solid #c5a572;
          border-radius: 12px;
          color: #c5a572;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .luxury-add-to-cart:hover:not(:disabled) {
          background: rgba(197, 165, 114, 0.1);
        }

        .luxury-buy-now {
          flex: 1;
          background: #c5a572;
          border: none;
          border-radius: 12px;
          color: #000;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .luxury-buy-now:hover:not(:disabled) {
          background: #d4b88c;
        }

        .luxury-add-to-cart:disabled,
        .luxury-buy-now:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .luxury-benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .luxury-benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #c5a572;
        }

        .luxury-benefit-item strong {
          display: block;
          color: #fff;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .luxury-benefit-item p {
          margin: 0;
          color: #666;
          font-size: 12px;
        }

        /* Tabs */
        .luxury-tabs {
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          overflow: hidden;
        }

        .luxury-tabs-header {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
        }

        .luxury-tab-btn {
          padding: 16px 32px;
          background: none;
          border: none;
          color: #999;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .luxury-tab-btn::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #c5a572;
          transition: width 0.3s;
        }

        .luxury-tab-btn:hover {
          color: #fff;
        }

        .luxury-tab-btn.active {
          color: #c5a572;
        }

        .luxury-tab-btn.active::after {
          width: 100%;
        }

        .luxury-tab-content {
          padding: 32px;
          background: rgba(0, 0, 0, 0.2);
        }

        .luxury-description {
          color: #999;
          line-height: 1.8;
          font-size: 15px;
        }

        .luxury-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .luxury-spec-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .luxury-spec-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .luxury-spec-value {
          font-size: 15px;
          color: #fff;
          font-weight: 500;
        }

        /* Loading & Empty States */
        .luxury-loading {
          text-align: center;
          padding: 100px 0;
        }

        .luxury-spinner {
          width: 50px;
          height: 50px;
          border: 2px solid rgba(197, 165, 114, 0.1);
          border-top-color: #c5a572;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: luxurySpin 1s linear infinite;
        }

        @keyframes luxurySpin {
          to { transform: rotate(360deg); }
        }

        .luxury-empty {
          text-align: center;
          padding: 100px 0;
        }

        .luxury-empty svg {
          margin-bottom: 20px;
          stroke: #333;
        }

        .luxury-empty p {
          color: #666;
          font-size: 16px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .luxury-container {
            grid-template-columns: 1fr;
          }

          .luxury-sidebar {
            position: static;
          }

          .luxury-product-detail {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .luxury-main-image {
            max-width: 500px;
            margin: 0 auto;
          }
        }

        @media (max-width: 768px) {
          .luxury-container {
            padding: 20px 16px;
          }

          .luxury-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .luxury-hero {
            padding: 80px 16px 60px;
          }

          .luxury-toolbar {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .luxury-sort {
            width: 100%;
            justify-content: space-between;
          }

          .luxury-actions {
            flex-direction: column;
          }

          .luxury-quantity {
            width: 100%;
          }

          .luxury-benefits {
            grid-template-columns: 1fr;
          }

          .luxury-specs-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .luxury-grid {
            gap: 8px;
          }

          .luxury-card-title {
            font-size: 14px;
          }

          .luxury-card-price {
            font-size: 16px;
          }

          .luxury-card-btn {
            padding: 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}