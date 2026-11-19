/**
 * rankingEngine.js
 * Hệ thống ranking sản phẩm dựa trên lịch sử hành vi người dùng trong phiên hiện tại.
 * Hoàn toàn client-side, không gọi API, không ảnh hưởng các chức năng khác.
 *
 * Thứ tự ưu tiên tín hiệu: Brand(+100) > Fragrance Family(+80) > Gender(+60)
 *   > Category(+40) > Price(+20) > Trend(+10) > Newest(+5)
 * Hành vi SEARCH có trọng số cao hơn hành vi VIEW (Brand +150/+120/+80 so với +100/+80/+60).
 */

const HISTORY_KEY = 'user_behavior_history';
const MAX_PER_TYPE = 5; // Tối đa 5 search + 5 view gần nhất, tách biệt nhau

// Trọng số cơ bản theo từng loại hành vi (điểm khi khớp 100% - decay index 0)
const WEIGHTS = {
  search: { brand: 150, family: 120, gender: 80 },
  view: { brand: 100, family: 80, gender: 60 },
};
const CATEGORY_WEIGHT = 40;
const PRICE_WEIGHT = 20;
const TREND_WEIGHT = 10;
const NEWEST_WEIGHT = 5;

// ==============================
// LỊCH SỬ HÀNH VI (sessionStorage)
// ==============================

function readRaw() {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.searches) && Array.isArray(parsed.views)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return { searches: [], views: [] };
}

function writeRaw(data) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(data));
  } catch {
    // Bỏ qua nếu sessionStorage đầy/không khả dụng
  }
}

/**
 * Đọc lịch sử hành vi (đã gộp search + view, mới nhất trước) — dùng cho các nơi
 * cần hiển thị lịch sử gần đây (ví dụ tag gợi ý).
 * @returns {Array} Mảng hành vi, tối đa 10 phần tử (5 search + 5 view), mới nhất ở đầu.
 */
export function getHistory() {
  const { searches, views } = readRaw();
  return [...searches, ...views].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Ghi một hành vi mới vào lịch sử.
 * Search và View được lưu tách biệt, mỗi loại tối đa MAX_PER_TYPE (5) hành vi gần nhất,
 * để không loại nào ghi đè hoàn toàn loại còn lại.
 *
 * @param {'search'|'view'} type  - Loại hành vi.
 * @param {object} payload        - Dữ liệu hành vi (keyword, product_id, brand, v.v.)
 */
export function recordBehavior(type, payload = {}) {
  const entry = {
    type,
    timestamp: Date.now(),
    product_id: payload.product_id || null,
    keyword: (payload.keyword || '').trim().toLowerCase() || null,
    brand: normStr(payload.brand),
    fragrance_family: normStr(payload.fragrance_family),
    gender: normStr(payload.gender),
    category: normStr(payload.category),
    price: Number(payload.price || 0) || null,
  };

  const data = readRaw();

  if (type === 'view') {
    // Bỏ qua nếu trùng sản phẩm vừa xem liền kề trước đó
    if (data.views.length > 0 && data.views[0].product_id === entry.product_id) {
      return;
    }
    data.views = [entry, ...data.views].slice(0, MAX_PER_TYPE);
  } else if (type === 'search') {
    data.searches = [entry, ...data.searches].slice(0, MAX_PER_TYPE);
  }

  writeRaw(data);
}

// ==============================
// RANKING
// ==============================

/**
 * Xếp hạng lại danh sách sản phẩm dựa trên lịch sử hành vi.
 * Không sửa mảng gốc. Nếu chưa có lịch sử hành vi nào thì giữ nguyên thứ tự hiện tại.
 *
 * @param {Array} products - Danh sách sản phẩm đã qua filter & sort thường.
 * @returns {Array} Danh sách đã được xếp hạng (hoặc giữ nguyên nếu không có lịch sử).
 */
export function rankProducts(products) {
  if (!products || products.length === 0) return products;

  const { searches, views } = readRaw();
  if (searches.length === 0 && views.length === 0) {
    // Chưa có hành vi nào → giữ nguyên thứ tự sản phẩm như hiện tại
    return products;
  }

  const signals = buildSignals(searches, views);

  // Gắn kèm index gốc để đảm bảo stable sort khi điểm bằng nhau
  const scored = products.map((product, index) => ({
    product,
    index,
    score: calcScore(product, signals),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index; // giữ thứ tự gốc khi điểm bằng nhau
  });

  return scored.map((s) => s.product);
}

// ==============================
// PRIVATE HELPERS
// ==============================

function normStr(value) {
  return (value || '').toString().trim().toLowerCase() || null;
}

/**
 * Tổng hợp tín hiệu brand/family/gender/category/price riêng cho search và view,
 * mỗi hành vi có decay theo vị trí trong danh sách tối đa 5 phần tử của loại đó:
 * mới nhất = 100%, giảm dần 20%/bước (100%, 80%, 60%, 40%, 20%).
 */
function buildSignals(searches, views) {
  const brandScore = {};
  const familyScore = {};
  const genderScore = {};
  const categoryScore = {};
  const priceRanges = [];

  const accumulate = (list, type) => {
    const weights = WEIGHTS[type];
    list.forEach((entry, index) => {
      const decay = Math.max(0.2, 1 - index * 0.2); // 1.0, 0.8, 0.6, 0.4, 0.2

      if (entry.brand) {
        brandScore[entry.brand] = (brandScore[entry.brand] || 0) + weights.brand * decay;
      } else if (type === 'search' && entry.keyword) {
        // Từ khóa tìm kiếm có thể chính là tên thương hiệu (ví dụ "dior", "chanel")
        brandScore[entry.keyword] = (brandScore[entry.keyword] || 0) + weights.brand * decay * 0.6;
      }

      if (entry.fragrance_family) {
        familyScore[entry.fragrance_family] = (familyScore[entry.fragrance_family] || 0) + weights.family * decay;
      }
      if (entry.gender) {
        genderScore[entry.gender] = (genderScore[entry.gender] || 0) + weights.gender * decay;
      }
      if (entry.category) {
        categoryScore[entry.category] = (categoryScore[entry.category] || 0) + CATEGORY_WEIGHT * decay;
      }
      if (entry.price && entry.price > 0) {
        priceRanges.push({ price: entry.price, weight: decay });
      }
    });
  };

  accumulate(searches, 'search');
  accumulate(views, 'view');

  return { brandScore, familyScore, genderScore, categoryScore, priceRanges };
}

/**
 * Tính điểm cho một sản phẩm dựa trên signals đã tổng hợp.
 * Thứ tự ưu tiên: Brand > Fragrance Family > Gender > Category > Price > Trend > Newest.
 */
function calcScore(product, signals) {
  let score = 0;

  const pBrand = normStr(product.brand);
  const pFamily = normStr(product.fragrance_family);
  const pGender = normStr(product.gender);
  const pCategory = normStr(product.category);
  const pPrice = Number(product.price || 0);
  const pId = Number(product.id || 0);

  // 1. Thương hiệu — khớp chính xác hoặc khớp một phần với từ khóa tìm kiếm
  if (pBrand) {
    if (signals.brandScore[pBrand]) {
      score += signals.brandScore[pBrand];
    } else {
      Object.entries(signals.brandScore).forEach(([kw, weight]) => {
        if (pBrand.includes(kw) || kw.includes(pBrand)) {
          score += weight * 0.7; // Giảm 30% khi chỉ khớp một phần
        }
      });
    }
  }

  // 2. Nhóm mùi (fragrance_family)
  if (pFamily && signals.familyScore[pFamily]) {
    score += signals.familyScore[pFamily];
  }

  // 3. Giới tính
  if (pGender && signals.genderScore[pGender]) {
    score += signals.genderScore[pGender];
  }

  // 4. Danh mục
  if (pCategory && signals.categoryScore[pCategory]) {
    score += signals.categoryScore[pCategory];
  }

  // 5. Khoảng giá gần nhau — so với trung bình giá có trọng số trong lịch sử
  if (pPrice > 0 && signals.priceRanges.length > 0) {
    const totalWeight = signals.priceRanges.reduce((sum, r) => sum + r.weight, 0);
    const avgPrice = signals.priceRanges.reduce((sum, r) => sum + r.price * r.weight, 0) / totalWeight;
    const ratio = Math.abs(pPrice - avgPrice) / avgPrice;
    if (ratio <= 0.2) {
      score += PRICE_WEIGHT;
    } else if (ratio <= 0.4) {
      score += PRICE_WEIGHT * 0.5;
    }
  }

  // 6. Xu hướng — dùng cờ isFeatured có sẵn (không gọi thêm API TrendEvent) làm tín hiệu phổ biến
  if (product.isFeatured) {
    score += TREND_WEIGHT;
  }

  // 7. Sản phẩm mới hơn — điểm rất nhỏ, chỉ để phân biệt khi các điểm trên bằng nhau
  if (pId > 0) {
    score += NEWEST_WEIGHT * (pId / 100000);
  }

  return score;
}
