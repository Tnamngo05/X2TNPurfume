import axios from 'axios';
import { API_BASE_URL, readJsonStorage, writeStorage } from '../lib/api';

// Key lưu trữ tạm thời cho demo FE khi backend chưa hoàn thiện API
const LOCAL_REVIEWS_STORAGE_PREFIX = 'x2tn_reviews_product_';
const HELPFUL_VOTES_KEY = 'x2tn_reviews_helpful_voted';

// Mock seed reviews ban đầu cho các sản phẩm tiêu biểu (mỗi sản phẩm có review riêng biệt)
const SEED_PRODUCT_REVIEWS = {
  // Sản phẩm 1
  1: [
    {
      id: 101,
      product_id: 1,
      user_id: 201,
      author_name: 'Hoàng Long',
      author_avatar: '',
      rating: 5,
      comment: 'Mùi hương cực kỳ sang trọng, tông gỗ tuyết tùng và hổ phách bám tỏa rất tốt. Mình xịt từ 8h sáng đi làm đến 6h chiều đồng nghiệp vẫn khen thơm. Xứng đáng từng đồng!',
      images: [
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop'
      ],
      is_verified_buyer: true, // Backend xác thực đơn hàng
      helpful_count: 14,
      created_at: '2026-11-10T14:30:00Z'
    },
    {
      id: 102,
      product_id: 1,
      user_id: 202,
      author_name: 'Ngọc Anh',
      author_avatar: '',
      rating: 5,
      comment: 'Đóng gói hàng rất kỹ lưỡng, hộp cứng cáp sang chảnh có tem niêm phong. Mua tặng sinh nhật bạn trai mà người yêu mê tít. Sẽ ủng hộ shop dài dài!',
      images: [
        'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop'
      ],
      is_verified_buyer: true,
      helpful_count: 9,
      created_at: '2026-11-05T09:15:00Z'
    },
    {
      id: 103,
      product_id: 1,
      user_id: null,
      author_name: 'Minh Quân',
      author_avatar: '',
      rating: 4,
      comment: 'Mùi tươi mát ban đầu, tầng hương sau đằm lại ấm áp. Duy chỉ có vòi xịt hơi mạnh tay một chút nhưng không sao, tổng thể 9/10.',
      images: [],
      is_verified_buyer: false, // Chưa mua hàng hoặc đánh giá ẩn danh
      helpful_count: 4,
      created_at: '2026-10-28T16:45:00Z'
    }
  ],
  // Sản phẩm 2
  2: [
    {
      id: 201,
      product_id: 2,
      user_id: 305,
      author_name: 'Thu Hương',
      author_avatar: '',
      rating: 5,
      comment: 'Hương hoa cỏ nhẹ nhàng, thanh tao cực kỳ nữ tính mà không bị nồng gắt. Thích hợp dùng cả mùa hè lẫn thời tiết mát mẻ. Rất yêu thích sản phẩm này!',
      images: [
        'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=600&auto=format&fit=crop'
      ],
      is_verified_buyer: true,
      helpful_count: 12,
      created_at: '2026-11-12T10:20:00Z'
    },
    {
      id: 202,
      product_id: 2,
      user_id: null,
      author_name: 'Phương Uyên',
      author_avatar: '',
      rating: 4,
      comment: 'Thiết kế chai đẹp mắt, cầm chắc tay. Mùi ngọt ngào nhẹ dịu lưu tầm 6-7 tiếng trên áo.',
      images: [],
      is_verified_buyer: false,
      helpful_count: 3,
      created_at: '2026-11-02T11:00:00Z'
    }
  ],
  // Sản phẩm 3
  3: [
    {
      id: 301,
      product_id: 3,
      user_id: 402,
      author_name: 'Đức Trí',
      author_avatar: '',
      rating: 5,
      comment: 'Tuyệt tác hương Citrus và biển sâu. Xịt vào cảm giác như đang đứng trước bờ biển Địa Trung Hải. Shop tư vấn nhiệt tình, giao hàng hoả tốc rất ưng ý!',
      images: [
        'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=600&auto=format&fit=crop'
      ],
      is_verified_buyer: true,
      helpful_count: 8,
      created_at: '2026-11-08T15:10:00Z'
    }
  ],
  // Sản phẩm 4
  4: [
    {
      id: 401,
      product_id: 4,
      user_id: 415,
      author_name: 'Khánh Linh',
      author_avatar: '',
      rating: 5,
      comment: 'Chai nước hoa Gourmand ngọt ngào nhất mình từng sở hữu! Vị vani và caramel ấm áp rất thích hợp cho những ngày se lạnh cuối năm.',
      images: [
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop'
      ],
      is_verified_buyer: true,
      helpful_count: 15,
      created_at: '2026-11-14T18:40:00Z'
    }
  ]
};

// Helper tính toán thống kê (Tổng quan)
const calculateReviewStats = (reviews = []) => {
  const total = reviews.length;
  if (total === 0) {
    return {
      average_rating: 0,
      total_reviews: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach(rev => {
    const r = Math.round(rev.rating);
    if (r >= 1 && r <= 5) {
      breakdown[r] = (breakdown[r] || 0) + 1;
      sum += rev.rating;
    }
  });

  const avg = parseFloat((sum / total).toFixed(1));
  const percentages = {
    5: Math.round(((breakdown[5] || 0) / total) * 100),
    4: Math.round(((breakdown[4] || 0) / total) * 100),
    3: Math.round(((breakdown[3] || 0) / total) * 100),
    2: Math.round(((breakdown[2] || 0) / total) * 100),
    1: Math.round(((breakdown[1] || 0) / total) * 100),
  };

  return {
    average_rating: avg,
    total_reviews: total,
    breakdown,
    percentages
  };
};

export const ReviewService = {
  // 1. Lấy danh sách đánh giá của sản phẩm theo product_id (Tab "Đánh giá sản phẩm này")
  getReviews: async (productId, options = {}) => {
    const {
      ratingFilter = 'all', // 'all', 5, 4, 3, 2, 1
      hasImageFilter = false, // boolean
      sortBy = 'newest', // 'newest' | 'helpful' | 'highest' | 'lowest'
      page = 1,
      limit = 5
    } = options;

    const numericId = Number(productId);

    // 1. Chuẩn bị gọi API Backend chính thức
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${numericId}/reviews`, {
        params: {
          rating: ratingFilter !== 'all' ? ratingFilter : undefined,
          has_image: hasImageFilter || undefined,
          sort: sortBy,
          page,
          limit
        },
        timeout: 3000
      });

      if (response.data && Array.isArray(response.data.reviews)) {
        return {
          fromServer: true,
          productId: numericId,
          reviews: response.data.reviews,
          stats: response.data.stats || calculateReviewStats(response.data.reviews),
          total: response.data.total || response.data.reviews.length,
          page: response.data.page || page,
          totalPages: response.data.total_pages || Math.ceil(response.data.reviews.length / limit)
        };
      }
    } catch (err) {
      // Backend endpoint chưa sẵn sàng -> fallback demo data lưu trữ độc lập theo product_id
    }

    // 2. Fallback xử lý ở FE theo từng product_id độc lập
    const storageKey = `${LOCAL_REVIEWS_STORAGE_PREFIX}${numericId}`;
    let productReviews = readJsonStorage(storageKey, null);

    if (!productReviews) {
      // Nếu chưa có trong local, kiểm tra seed reviews tương ứng hoặc khởi tạo mảng rỗng
      productReviews = SEED_PRODUCT_REVIEWS[numericId] ? [...SEED_PRODUCT_REVIEWS[numericId]] : [];
      writeStorage(storageKey, JSON.stringify(productReviews));
    }

    // Tính toán stats tổng quan cho toàn bộ review của sản phẩm này
    const stats = calculateReviewStats(productReviews);

    // Lọc theo số sao
    let filtered = [...productReviews];
    if (ratingFilter !== 'all') {
      const star = Number(ratingFilter);
      filtered = filtered.filter(item => Math.round(item.rating) === star);
    }

    // Lọc có hình ảnh
    if (hasImageFilter) {
      filtered = filtered.filter(item => Array.isArray(item.images) && item.images.length > 0);
    }

    // Sắp xếp
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'helpful') {
      filtered.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    // Phân trang
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
    const startIndex = (page - 1) * limit;
    const paginatedReviews = filtered.slice(startIndex, startIndex + limit);

    return {
      fromServer: false,
      productId: numericId,
      reviews: paginatedReviews,
      stats,
      total: totalFiltered,
      page,
      totalPages
    };
  },

  // 2. Lấy TẤT CẢ đánh giá của toàn bộ shop (Tab "Tất cả đánh giá")
  getAllReviews: async (options = {}, allProducts = []) => {
    const {
      ratingFilter = 'all',
      hasImageFilter = false,
      productNameFilter = '',
      sortBy = 'newest',
      page = 1,
      limit = 5
    } = options;

    // 1. Chuẩn bị gọi API Backend chính thức
    try {
      const response = await axios.get(`${API_BASE_URL}/reviews`, {
        params: {
          rating: ratingFilter !== 'all' ? ratingFilter : undefined,
          has_image: hasImageFilter || undefined,
          search_product: productNameFilter.trim() || undefined,
          sort: sortBy,
          page,
          limit
        },
        timeout: 3000
      });

      if (response.data && Array.isArray(response.data.reviews)) {
        return {
          fromServer: true,
          reviews: response.data.reviews,
          stats: response.data.stats || calculateReviewStats(response.data.reviews),
          total: response.data.total || response.data.reviews.length,
          page: response.data.page || page,
          totalPages: response.data.total_pages || Math.ceil(response.data.reviews.length / limit)
        };
      }
    } catch (err) {
      // Backend endpoint /reviews chưa sẵn sàng -> Fallback tổng hợp từ các sản phẩm của shop
    }

    // 2. Fallback: Tổng hợp toàn bộ review của các sản phẩm
    // Tạo map sản phẩm để gán tên và hình ảnh cho review
    const productMap = {};
    if (Array.isArray(allProducts)) {
      allProducts.forEach(p => {
        productMap[p.id] = p;
      });
    }

    // Gom review từ SEED và từ localStorage
    let allReviewsList = [];
    const seenReviewIds = new Set();

    // 2.1 Từ SEED
    Object.keys(SEED_PRODUCT_REVIEWS).forEach(pId => {
      const numericId = Number(pId);
      const storageKey = `${LOCAL_REVIEWS_STORAGE_PREFIX}${numericId}`;
      const savedInStorage = readJsonStorage(storageKey, null);
      const itemsToUse = savedInStorage || SEED_PRODUCT_REVIEWS[numericId] || [];

      itemsToUse.forEach(rev => {
        if (!seenReviewIds.has(rev.id)) {
          seenReviewIds.add(rev.id);
          const p = productMap[rev.product_id];
          allReviewsList.push({
            ...rev,
            product_name: p ? p.name : `Nước hoa #${rev.product_id}`,
            product_image: p ? (p.image || p.image_url) : '',
            brand: p ? p.brand : 'X2TN Selection'
          });
        }
      });
    });

    // 2.2 Quét các key khác trong localStorage nếu có
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_REVIEWS_STORAGE_PREFIX)) {
            const pId = Number(key.replace(LOCAL_REVIEWS_STORAGE_PREFIX, ''));
            if (!isNaN(pId)) {
              const list = readJsonStorage(key, []);
              if (Array.isArray(list)) {
                list.forEach(rev => {
                  if (!seenReviewIds.has(rev.id)) {
                    seenReviewIds.add(rev.id);
                    const p = productMap[rev.product_id];
                    allReviewsList.push({
                      ...rev,
                      product_name: p ? p.name : `Nước hoa #${rev.product_id}`,
                      product_image: p ? (p.image || p.image_url) : '',
                      brand: p ? p.brand : 'X2TN Selection'
                    });
                  }
                });
              }
            }
          }
        }
      } catch (e) {
        // Ignored
      }
    }

    // Tính toán thống kê toàn bộ shop
    const stats = calculateReviewStats(allReviewsList);

    // Lọc theo số sao
    let filtered = [...allReviewsList];
    if (ratingFilter !== 'all') {
      const star = Number(ratingFilter);
      filtered = filtered.filter(item => Math.round(item.rating) === star);
    }

    // Lọc có hình ảnh
    if (hasImageFilter) {
      filtered = filtered.filter(item => Array.isArray(item.images) && item.images.length > 0);
    }

    // Lọc theo tên sản phẩm
    if (productNameFilter && productNameFilter.trim()) {
      const q = productNameFilter.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const pName = (item.product_name || '').toLowerCase();
        const pBrand = (item.brand || '').toLowerCase();
        return pName.includes(q) || pBrand.includes(q) || String(item.product_id) === q;
      });
    }

    // Sắp xếp
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'helpful') {
      filtered.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    // Phân trang
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
    const startIndex = (page - 1) * limit;
    const paginatedReviews = filtered.slice(startIndex, startIndex + limit);

    return {
      fromServer: false,
      reviews: paginatedReviews,
      stats,
      total: totalFiltered,
      page,
      totalPages
    };
  },

  // 3. Gửi đánh giá mới cho sản phẩm
  submitReview: async (productId, reviewData) => {
    const numericId = Number(productId);
    const user = readJsonStorage('user', null);

    const payload = {
      product_id: numericId,
      rating: Number(reviewData.rating),
      author_name: reviewData.author_name || (user ? user.username : 'Khách hàng ẩn danh'),
      comment: reviewData.comment || '',
      images: reviewData.images || []
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/products/${numericId}/reviews`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        timeout: 4000
      });

      return {
        success: true,
        fromServer: true,
        data: response.data
      };
    } catch (err) {
      const storageKey = `${LOCAL_REVIEWS_STORAGE_PREFIX}${numericId}`;
      let productReviews = readJsonStorage(storageKey, null);
      if (!productReviews) {
        productReviews = SEED_PRODUCT_REVIEWS[numericId] ? [...SEED_PRODUCT_REVIEWS[numericId]] : [];
      }

      // FE tuyệt đối không tự gán is_verified_buyer: true
      const newReview = {
        id: Date.now(),
        product_id: numericId,
        user_id: user?.id || null,
        author_name: payload.author_name,
        author_avatar: '',
        rating: payload.rating,
        comment: payload.comment,
        images: payload.images,
        is_verified_buyer: false, // FE mặc định false, chỉ Backend mới có quyền xác thực
        helpful_count: 0,
        created_at: new Date().toISOString()
      };

      const updatedReviews = [newReview, ...productReviews];
      writeStorage(storageKey, JSON.stringify(updatedReviews));

      return {
        success: true,
        fromServer: false,
        data: newReview
      };
    }
  },

  // 4. Bấm nút Hữu ích cho 1 đánh giá
  voteHelpful: async (productId, reviewId) => {
    const votedReviews = readJsonStorage(HELPFUL_VOTES_KEY, []);
    if (votedReviews.includes(reviewId)) {
      return { success: false, alreadyVoted: true };
    }

    try {
      await axios.post(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {}, { timeout: 2000 });
    } catch (err) {
      // Backend chưa có API
    }

    const numericId = Number(productId);
    const storageKey = `${LOCAL_REVIEWS_STORAGE_PREFIX}${numericId}`;
    const productReviews = readJsonStorage(storageKey, null) || SEED_PRODUCT_REVIEWS[numericId] || [];

    const updated = productReviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, helpful_count: (r.helpful_count || 0) + 1 };
      }
      return r;
    });

    writeStorage(storageKey, JSON.stringify(updated));
    votedReviews.push(reviewId);
    writeStorage(HELPFUL_VOTES_KEY, JSON.stringify(votedReviews));

    return { success: true, alreadyVoted: false };
  },

  // 5. Kiểm tra đã vote hữu ích chưa
  hasVotedHelpful: (reviewId) => {
    const votedReviews = readJsonStorage(HELPFUL_VOTES_KEY, []);
    return votedReviews.includes(reviewId);
  }
};
