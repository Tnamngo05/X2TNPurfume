import axios from 'axios';
import { API_BASE_URL, readJsonStorage, writeStorage, readStorage } from '../lib/api';

const STORAGE_KEYS = {
  GUEST_ID: 'x2tn_quiz_guest_id',
  ANSWERS: 'x2tn_quiz_answers',
  STATUS: 'x2tn_quiz_status', // 'completed' | 'dismissed' | null
  TIMESTAMP: 'x2tn_quiz_completed_at'
};

// --- DỮ LIỆU CẤU HÌNH 5 BƯỚC KHẢO SÁT ---
export const QUIZ_STEPS_CONFIG = [
  {
    step: 1,
    id: 'gender',
    title: 'Bạn đang tìm kiếm mùi hương cho ai?',
    subtitle: 'Hãy chọn giới tính hoặc phong cách bạn muốn thể hiện',
    type: 'single', // Chọn 1
    options: [
      {
        value: 'Nam',
        label: 'Nam giới (Pour Homme)',
        icon: '👨',
        desc: 'Mạnh mẽ, lịch lãm, phóng khoáng'
      },
      {
        value: 'Nữ',
        label: 'Nữ giới (Pour Femme)',
        icon: '👩',
        desc: 'Dịu dàng, quyến rũ, kiêu sa'
      },
      {
        value: 'Unisex',
        label: 'Unisex (Mọi giới tính)',
        icon: '✨',
        desc: 'Tự do, độc bản, phá vỡ giới hạn'
      },
      {
        value: 'Secret',
        label: 'Không muốn tiết lộ',
        icon: '🤫',
        desc: 'Tôi muốn tự do khám phá tất cả'
      }
    ]
  },
  {
    step: 2,
    id: 'fragrance_families',
    title: 'Những nhóm hương nào chạm đến cảm xúc của bạn?',
    subtitle: 'Bạn có thể chọn nhiều nhóm hương yêu thích',
    type: 'multiple', // Chọn nhiều
    options: [
      {
        value: 'Floral',
        label: 'Floral (Hương hoa cỏ)',
        icon: '🌸',
        desc: 'Hoa hồng, nhài, mẫu đơn lãng mạn & tinh khôi'
      },
      {
        value: 'Woody',
        label: 'Woody (Hương gỗ ấm)',
        icon: '🌲',
        desc: 'Trầm hương, đàn hương, tuyết tùng sâu lắng'
      },
      {
        value: 'Fresh',
        label: 'Fresh (Hương tươi mát)',
        icon: '🍃',
        desc: 'Lá xanh ngát, sương mai trong trẻo, sảng khoái'
      },
      {
        value: 'Citrus',
        label: 'Citrus (Cam chanh tươi sáng)',
        icon: '🍋',
        desc: 'Bergamot, bưởi hồng, chanh vàng căng tràn năng lượng'
      },
      {
        value: 'Oriental',
        label: 'Oriental / Amber (Phương Đông huyền bí)',
        icon: '🏺',
        desc: 'Hổ phách ấm nồng, vani đen bí ẩn mê hoặc'
      },
      {
        value: 'Fruity',
        label: 'Fruity (Hương trái cây tươi ngọt)',
        icon: '🍑',
        desc: 'Đào mọng, lê chín, dâu tây ngọt ngào vui tươi'
      },
      {
        value: 'Aquatic',
        label: 'Aquatic (Hương biển & đại dương)',
        icon: '🌊',
        desc: 'Gió biển mặn mòi, khoáng chất thanh khiết tự do'
      },
      {
        value: 'Gourmand',
        label: 'Gourmand (Hương vị ngọt ấm)',
        icon: '🧁',
        desc: 'Caramel, socola, vani kem béo bùi say đắm'
      }
    ]
  },
  {
    step: 3,
    id: 'styles',
    title: 'Phong cách cá nhân bạn muốn khẳng định?',
    subtitle: 'Chọn những tính từ mô tả khí chất riêng của bạn (chọn nhiều)',
    type: 'multiple',
    options: [
      {
        value: 'Thanh lịch',
        label: 'Thanh lịch (Chic & Elegant)',
        icon: '👔',
        desc: 'Nhã nhặn, chỉn chu, đĩnh đạc và cuốn hút ngầm'
      },
      {
        value: 'Quyến rũ',
        label: 'Quyến rũ (Sensual & Seductive)',
        icon: '💋',
        desc: 'Gợi cảm, bí ẩn, khiến người khác phải ngoái nhìn'
      },
      {
        value: 'Trẻ trung',
        label: 'Trẻ trung (Youthful & Energetic)',
        icon: '⚡',
        desc: 'Hiện đại, tích cực, ngập tràn sức sống tươi trẻ'
      },
      {
        value: 'Sang trọng',
        label: 'Sang trọng (Luxury & Noble)',
        icon: '👑',
        desc: 'Vương giả, đẳng cấp đỉnh cao của giới thượng lưu'
      },
      {
        value: 'Cá tính',
        label: 'Cá tính (Bold & Unique)',
        icon: '🕶️',
        desc: 'Độc bản, không hòa lẫn, phá cách đầy ấn tượng'
      },
      {
        value: 'Tối giản',
        label: 'Tối giản (Minimalist & Clean)',
        icon: '🌿',
        desc: 'Tinh gọn, sạch sẽ, nhẹ nhàng như hơi thở'
      }
    ]
  },
  {
    step: 4,
    id: 'occasions',
    title: 'Bạn thường sử dụng nước hoa vào dịp nào?',
    subtitle: 'Chọn hoàn cảnh chính bạn muốn tỏa sáng',
    type: 'single',
    options: [
      {
        value: 'Đi học/đi làm',
        label: 'Đi học / Đi làm',
        icon: '💼',
        desc: 'Môi trường công sở, giảng đường — thơm dịu tinh tế'
      },
      {
        value: 'Hẹn hò/đi chơi',
        label: 'Hẹn hò / Đi chơi',
        icon: '🌹',
        desc: 'Không gian lãng mạn, gần gũi và sâu lắng'
      },
      {
        value: 'Dự tiệc',
        label: 'Dự tiệc & Sự kiện cao cấp',
        icon: '🥂',
        desc: 'Dưới ánh đèn lộng lẫy, tỏa sáng giữa đám đông'
      },
      {
        value: 'Sử dụng hằng ngày',
        label: 'Sử dụng hằng ngày',
        icon: '☀️',
        desc: 'Mọi khoảnh khắc trong ngày, thoải mái tự tin'
      },
      {
        value: 'Sưu tầm',
        label: 'Sưu tầm nghệ thuật',
        icon: '🏆',
        desc: 'Mùi hương độc bản niche, tác phẩm nghệ thuật vị giác'
      }
    ]
  },
  {
    step: 5,
    id: 'budget',
    title: 'Mức ngân sách bạn dự định chi tiêu?',
    subtitle: 'Chúng tôi sẽ chọn lọc những tuyệt tác vừa vặn nhất',
    type: 'single',
    options: [
      {
        value: 'under_500k',
        label: 'Dưới 500.000 VNĐ',
        icon: '🪙',
        desc: 'Tiết kiệm, dùng thử, mini size tiện lợi',
        min: 0,
        max: 500000
      },
      {
        value: '500k_1m',
        label: '500.000 – 1.000.000 VNĐ',
        icon: '💵',
        desc: 'Phổ thông chất lượng cao, dung tích vừa',
        min: 500000,
        max: 1000000
      },
      {
        value: '1m_2m',
        label: '1.000.000 – 2.000.000 VNĐ',
        icon: '💎',
        desc: 'Dòng Designer phổ biến, thương hiệu danh tiếng',
        min: 1000000,
        max: 2000000
      },
      {
        value: '2m_5m',
        label: '2.000.000 – 5.000.000 VNĐ',
        icon: '✨',
        desc: 'Phân khúc cao cấp, lưu hương bền lâu tuyệt đối',
        min: 2000000,
        max: 5000000
      },
      {
        value: 'above_5m',
        label: 'Trên 5.000.000 VNĐ',
        icon: '👑',
        desc: 'Niche xa xỉ, kiệt tác giới hạn quý hiếm',
        min: 5000000,
        max: Infinity
      }
    ]
  }
];

export const QuizService = {
  // Lấy hoặc khởi tạo Guest ID tạm thời cho khách chưa đăng nhập
  getGuestId: () => {
    let guestId = readStorage(STORAGE_KEYS.GUEST_ID);
    if (!guestId) {
      guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      writeStorage(STORAGE_KEYS.GUEST_ID, guestId);
    }
    return guestId;
  },

  // Lấy thông tin user đăng nhập nếu có
  getAuthUser: () => {
    try {
      const user = readJsonStorage('user', null);
      const token = readStorage('token', null);
      return { user, token, isLoggedIn: Boolean(token) };
    } catch {
      return { user: null, token: null, isLoggedIn: false };
    }
  },

  // Trạng thái khảo sát: null | 'completed' | 'dismissed'
  getStatus: () => {
    return readStorage(STORAGE_KEYS.STATUS, null);
  },

  // Kiểm tra xem có nên tự động mở modal khi vào web không
  shouldAutoOpen: () => {
    const status = QuizService.getStatus();
    return !status; // Nếu chưa completed và chưa dismissed thì auto mở
  },

  // Đánh dấu bỏ qua khảo sát
  dismissQuiz: () => {
    writeStorage(STORAGE_KEYS.STATUS, 'dismissed');
  },

  // Lấy kết quả đã lưu
  getSavedAnswers: () => {
    return readJsonStorage(STORAGE_KEYS.ANSWERS, null);
  },

  // Lưu kết quả khảo sát
  saveAnswersLocally: (answers) => {
    writeStorage(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
    writeStorage(STORAGE_KEYS.STATUS, 'completed');
    writeStorage(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());
  },

  // Gửi khảo sát tới Backend (kèm fallback và chuẩn bị API)
  submitQuiz: async (answers) => {
    const { user, isLoggedIn } = QuizService.getAuthUser();
    const guestId = QuizService.getGuestId();

    const payload = {
      guest_id: guestId,
      user_id: user?.id || null,
      username: user?.username || null,
      is_authenticated: isLoggedIn,
      answers: {
        gender: answers.gender,
        fragrance_families: answers.fragrance_families || [],
        styles: answers.styles || [],
        occasions: answers.occasions,
        budget: answers.budget
      },
      submitted_at: new Date().toISOString()
    };

    // Luôn lưu local để đảm bảo UX mượt mà
    QuizService.saveAnswersLocally(answers);

    // Chuẩn bị gọi Backend API (chờ backend implement endpoint /quiz/submit hoặc /quiz/preferences)
    try {
      const response = await axios.post(`${API_BASE_URL}/quiz/preferences`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 4000
      });
      return { success: true, fromServer: true, data: response.data, payload };
    } catch (err) {
      // Backend chưa có endpoint hoặc lỗi kết nối: fallback local thành công
      console.info('[QuizService] Backend API /quiz/preferences is not yet available, saved locally:', payload);
      return { success: true, fromServer: false, data: payload, payload };
    }
  },

  // Gợi ý sản phẩm dựa trên câu trả lời khảo sát
  getRecommendations: async (answers, allProducts = []) => {
    if (!answers) return [];

    // 1. Thử gọi Backend API nếu backend đã hỗ trợ
    try {
      const response = await axios.post(`${API_BASE_URL}/quiz/recommendations`, { answers }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 3000
      });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      // Backend endpoint chưa có, tiếp tục fallback FE logic
    }

    // 2. Thuật toán gợi ý thông minh tại Frontend
    if (!allProducts || allProducts.length === 0) return [];

    const budgetConfig = QUIZ_STEPS_CONFIG.find(s => s.id === 'budget')?.options.find(b => b.value === answers.budget);
    const selectedFamilies = answers.fragrance_families || [];
    const selectedStyles = answers.styles || [];
    const selectedGender = answers.gender;

    const scoredProducts = allProducts.map(p => {
      let score = 50; // Điểm nền tảng
      const reasons = [];

      // 1. Khớp Giới tính (Tối đa +25 điểm)
      const pGender = (p.gender || '').toLowerCase();
      if (selectedGender === 'Secret' || selectedGender === 'Unisex') {
        score += 20;
        reasons.push('Phong cách phi giới tính, linh hoạt');
      } else if (selectedGender === 'Nam' && (pGender.includes('nam') || pGender.includes('men') || pGender.includes('unisex'))) {
        score += 25;
        reasons.push('Dành riêng cho phái mạnh');
      } else if (selectedGender === 'Nữ' && (pGender.includes('nữ') || pGender.includes('women') || pGender.includes('femme') || pGender.includes('unisex'))) {
        score += 25;
        reasons.push('Tôn vinh nét đẹp phái nữ');
      }

      // 2. Khớp Nhóm hương (Tối đa +35 điểm)
      const pFamily = (p.fragrance_family || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const pCategory = (p.category || '').toLowerCase();

      let matchedFamilyCount = 0;
      selectedFamilies.forEach(fam => {
        const famLower = fam.toLowerCase();
        if (pFamily.includes(famLower) || pDesc.includes(famLower) || pCategory.includes(famLower)) {
          matchedFamilyCount++;
        }
      });

      if (matchedFamilyCount > 0) {
        const bonus = Math.min(35, matchedFamilyCount * 18);
        score += bonus;
        reasons.push(`Đúng nhóm hương yêu thích (${selectedFamilies.slice(0, 2).join(', ')})`);
      }

      // 3. Khớp Phong cách (Tối đa +20 điểm)
      let matchedStyleCount = 0;
      selectedStyles.forEach(st => {
        const stLower = st.toLowerCase();
        if (pDesc.includes(stLower) || pCategory.includes(stLower) || (p.name || '').toLowerCase().includes(stLower)) {
          matchedStyleCount++;
        }
      });
      if (matchedStyleCount > 0) {
        score += Math.min(20, matchedStyleCount * 12);
        reasons.push(`Hợp phong cách ${selectedStyles[0]}`);
      }

      // 4. Khớp Ngân sách (Tối đa +20 điểm)
      const price = Number(p.price || 0);
      if (budgetConfig) {
        if (price >= budgetConfig.min && price <= budgetConfig.max) {
          score += 20;
          reasons.push(`Vừa vặn ngân sách ${budgetConfig.label}`);
        } else if (price > 0 && Math.abs(price - budgetConfig.min) < 300000) {
          score += 10;
        }
      }

      // Bonus nếu là sản phẩm nổi bật
      if (p.isFeatured) {
        score += 5;
      }

      // Chuẩn hóa điểm tương thích (75% - 99%)
      const matchPercentage = Math.min(99, Math.max(76, Math.round(score)));

      return {
        ...p,
        matchScore: matchPercentage,
        matchReasons: reasons.length > 0 ? reasons : ['Hương thơm cao cấp phù hợp tiêu chuẩn của bạn']
      };
    });

    // Sắp xếp theo matchScore giảm dần
    scoredProducts.sort((a, b) => b.matchScore - a.matchScore);

    // Trả về top 4-6 sản phẩm phù hợp nhất
    return scoredProducts.slice(0, 6);
  }
};
