import { useState, useEffect, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ProductsAPI, AdminOrdersAPI, CouponAPI, ChatAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { genderOptions, categoryOptions, normalizeGender, formatPrice } from '../lib/productUtils';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  // --- STATE MANAGEMENT ---
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [products, setProducts] = useState([]);
  const [isSyncingAi, setIsSyncingAi] = useState(false);
  
  // CẬP NHẬT: Thêm concentration, longevity, origin vào form mặc định
  const [form, setForm] = useState({ 
    name: '', 
    brand: '', 
    price: '', 
    image_url: '', 
    category: 'Nước hoa',
    gender: 'Unisex', 
    description: '', 
    stock: 0, 
    is_featured: false,
    fragrance_family: '',
    concentration: '',
    longevity: '',
    origin: ''
  });
  
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [errors, setErrors] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: () => {}, title: '', message: '' });

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortKey, setSortKey] = useState('newest');

  const navigate = useNavigate();

  // --- TAB: Sản phẩm / Đơn hàng ---
  const [activeTab, setActiveTab] = useState('products');

  // --- ORDERS STATE ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilters, setOrderFilters] = useState({ payment_status: '', payment_method: '', customer_name: '', date_from: '', date_to: '' });
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponLoadError, setCouponLoadError] = useState('');
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState('all');
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponErrors, setCouponErrors] = useState({});
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: 0,
    max_discount: '',
    usage_limit: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
  });

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = {};
      Object.entries(orderFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const data = await AdminOrdersAPI.list(params);
      setOrders(data);
    } catch (error) {
      showNotification('Lỗi khi tải danh sách đơn hàng', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'coupons') fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  // --- FUNCTIONS ---
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      setCouponLoadError('');
      const data = await CouponAPI.list();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      setCoupons([]);
      setCouponLoadError(error.response?.data?.detail || 'Không thể tải danh sách mã giảm giá từ API.');
      showNotification('Lỗi khi tải danh sách mã giảm giá', 'error');
    } finally {
      setCouponsLoading(false);
    }
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: 0,
      max_discount: '',
      usage_limit: '',
      starts_at: '',
      ends_at: '',
      is_active: true,
    });
    setEditingCouponId(null);
    setCouponErrors({});
  };

  const validateCouponForm = () => {
    const errors = {};
    const value = Number(couponForm.discount_value);
    const minOrder = Number(couponForm.min_order_amount);
    const maxDiscount = couponForm.max_discount === '' ? null : Number(couponForm.max_discount);
    const usageLimit = couponForm.usage_limit === '' ? null : Number(couponForm.usage_limit);
    if (!couponForm.code.trim()) errors.code = 'Mã giảm giá không được để trống';
    if (!Number.isFinite(value) || value <= 0) errors.discount_value = 'Giá trị giảm phải lớn hơn 0';
    if (couponForm.discount_type === 'percentage' && value > 100) errors.discount_value = 'Phần trăm không được vượt quá 100';
    if (!Number.isFinite(minOrder) || minOrder < 0) errors.min_order_amount = 'Đơn tối thiểu không hợp lệ';
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) errors.max_discount = 'Giảm tối đa không hợp lệ';
    if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 0)) errors.usage_limit = 'Giới hạn lượt dùng không hợp lệ';
    if (couponForm.starts_at && couponForm.ends_at && couponForm.ends_at < couponForm.starts_at) {
      errors.ends_at = 'Ngày kết thúc không được trước ngày bắt đầu';
    }
    setCouponErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCouponSubmit = async (event) => {
    event.preventDefault();
    if (!validateCouponForm()) return;
    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      discount_type: couponForm.discount_type,
      discount_value: Number(couponForm.discount_value),
      min_order_amount: Number(couponForm.min_order_amount),
      max_discount: couponForm.max_discount === '' ? null : Number(couponForm.max_discount),
      usage_limit: couponForm.usage_limit === '' ? null : Number(couponForm.usage_limit),
      starts_at: couponForm.starts_at || null,
      ends_at: couponForm.ends_at || null,
      is_active: couponForm.is_active,
    };
    try {
      if (editingCouponId) {
        await CouponAPI.update(editingCouponId, payload);
        showNotification('Cập nhật mã giảm giá thành công!');
      } else {
        await CouponAPI.create(payload);
        showNotification('Thêm mã giảm giá thành công!');
      }
      resetCouponForm();
      await fetchCoupons();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Không thể lưu mã giảm giá', 'error');
    }
  };

  const handleCouponEdit = (coupon) => {
    const toInputDate = (value) => value ? value.slice(0, 16) : '';
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount: coupon.max_discount ?? '',
      usage_limit: coupon.usage_limit ?? '',
      starts_at: toInputDate(coupon.starts_at),
      ends_at: toInputDate(coupon.ends_at),
      is_active: coupon.is_active,
    });
    setEditingCouponId(coupon.id);
    setCouponErrors({});
  };

  const handleCouponDelete = (coupon) => {
    const hasUsage = Number(coupon.used_count) > 0;
    setConfirmModal({
      isOpen: true,
      title: hasUsage ? 'Tắt mã giảm giá' : 'Xóa mã giảm giá',
      message: hasUsage
        ? `Mã ${coupon.code} đã được sử dụng trong Order và không thể xóa. Bạn có muốn tắt mã này không?`
        : `Bạn có chắc muốn xóa mã ${coupon.code}?`,
      onConfirm: async () => {
        try {
          if (hasUsage) {
            await CouponAPI.update(coupon.id, { is_active: false });
            showNotification(`Đã tắt mã ${coupon.code}.`);
          } else {
            await CouponAPI.remove(coupon.id);
            showNotification('Xóa mã giảm giá thành công!');
          }
          await fetchCoupons();
        } catch (error) {
          showNotification(error.response?.data?.detail || 'Không thể xóa mã giảm giá', 'error');
        } finally {
          setConfirmModal({ isOpen: false, onConfirm: () => {}, title: '', message: '' });
        }
      },
    });
  };

  const toggleCoupon = async (coupon) => {
    try {
      await CouponAPI.update(coupon.id, { is_active: !coupon.is_active });
      showNotification(`${coupon.code} đã được ${coupon.is_active ? 'tắt' : 'bật'}.`);
      await fetchCoupons();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Không thể thay đổi trạng thái mã', 'error');
    }
  };

  const isCouponExpired = (coupon) => coupon.ends_at && new Date(coupon.ends_at) < new Date();
  const isCouponExhausted = (coupon) => coupon.usage_limit !== null && coupon.usage_limit !== undefined
    && Number(coupon.used_count) >= Number(coupon.usage_limit);
  const getCouponStatus = (coupon) => {
    if (isCouponExpired(coupon)) return { label: 'Hết hạn', className: 'expired' };
    if (isCouponExhausted(coupon)) return { label: 'Hết lượt', className: 'exhausted' };
    if (!coupon.is_active) return { label: 'Đã tắt', className: 'inactive' };
    return { label: 'Hoạt động', className: 'active' };
  };

  const couponStats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(coupon => coupon.is_active && !isCouponExpired(coupon)).length,
    expired: coupons.filter(isCouponExpired).length,
    exhausted: coupons.filter(isCouponExhausted).length,
  }), [coupons]);

  const filteredCoupons = useMemo(() => {
    const query = couponSearch.trim().toLowerCase();
    return coupons.filter(coupon => {
      const matchesSearch = !query || coupon.code.toLowerCase().includes(query);
      const matchesStatus = couponStatusFilter === 'all'
        || (couponStatusFilter === 'active' && coupon.is_active && !isCouponExpired(coupon))
        || (couponStatusFilter === 'inactive' && !coupon.is_active)
        || (couponStatusFilter === 'expired' && isCouponExpired(coupon))
        || (couponStatusFilter === 'exhausted' && isCouponExhausted(coupon));
      return matchesSearch && matchesStatus;
    });
  }, [coupons, couponSearch, couponStatusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductsAPI.list();
      setProducts(data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      } else {
        showNotification('Lỗi khi tải danh sách sản phẩm', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Tên sản phẩm không được để trống';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) newErrors.price = 'Giá phải là số lớn hơn 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification('Vui lòng kiểm tra lại thông tin', 'error');
      return;
    }
    
    // Đã bao gồm các trường mới do dùng spread operator (...form)
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    
    try {
      if (editingId) {
        await ProductsAPI.update(editingId, payload);
        showNotification('Cập nhật thành công!');
      } else {
        await ProductsAPI.create(payload);
        showNotification('Thêm sản phẩm thành công!');
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Lỗi khi lưu sản phẩm', 'error');
    }
  };

  // CẬP NHẬT: Load thêm dữ liệu mới khi nhấn Sửa
  const handleEdit = (p) => {
    setForm({ 
      name: p.name, 
      brand: p.brand || '', 
      price: p.price, 
      image_url: p.image_url || '', 
      category: p.category || 'Nước hoa',
      gender: p.gender || 'Unisex', 
      description: p.description || '', 
      stock: p.stock || 0, 
      is_featured: p.is_featured || false,
      fragrance_family: p.fragrance_family || '',
      concentration: p.concentration || '',
      longevity: p.longevity || '',
      origin: p.origin || ''
    });
    setEditingId(p.id);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Sản Phẩm',
      message: 'Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          await ProductsAPI.remove(id);
          showNotification('Xóa thành công!');
          fetchProducts();
          if(selectedProduct?.id === id) setSelectedProduct(null);
        } catch (error) {
          showNotification('Lỗi khi xóa', 'error');
        } finally {
          setConfirmModal({ isOpen: false });
        }
      }
    });
  };

  // CẬP NHẬT: Reset thêm các trường mới
  const resetForm = () => {
    setForm({ 
      name: '', brand: '', price: '', image_url: '', 
      category: 'Nước hoa', gender: 'Unisex', description: '', 
      stock: 0, is_featured: false,
      fragrance_family: '',
      concentration: '', longevity: '', origin: ''
    });
    setEditingId(null);
    setErrors({});
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Nhiều Sản Phẩm',
      message: `Bạn có chắc muốn xóa ${selectedIds.size} sản phẩm đã chọn?`,
      onConfirm: async () => {
        try {
          await Promise.all(Array.from(selectedIds).map(id => ProductsAPI.remove(id)));
          showNotification(`Đã xóa ${selectedIds.size} sản phẩm!`);
          setSelectedIds(new Set());
          fetchProducts();
          if(selectedProduct && selectedIds.has(selectedProduct.id)) setSelectedProduct(null);
        } catch (error) {
          showNotification('Có lỗi khi xóa một số sản phẩm', 'error');
        } finally {
          setConfirmModal({ isOpen: false });
        }
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerSearch) || 
        (p.brand && p.brand.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterGender !== 'All') {
      const normFilter = normalizeGender(filterGender);
      result = result.filter(p => normalizeGender(p.gender) === normFilter);
    }

    if (filterCategory !== 'All') {
      result = result.filter(p => p.category === filterCategory);
    }

    switch (sortKey) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': default: result.sort((a, b) => b.id - a.id); break;
    }

    return result;
  }, [products, searchTerm, filterGender, filterCategory, sortKey]);

  // --- DASHBOARD STATS ---
  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    const featured = products.filter(p => p.is_featured).length;
    return { total, outOfStock, totalValue, featured };
  }, [products]);

  const genderChartData = useMemo(() => {
    const counts = products.reduce((acc, p) => {
      const g = normalizeGender(p.gender);
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#a8927a', '#3b82f6', '#ec4899', '#8b5cf6'],
        borderColor: '#1a1b28',
        borderWidth: 2,
      }]
    };
  }, [products]);

  if (loading && products.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* HEADER */}
      <div className="admin-header-bar">
        <div className="admin-header-left">
          <h1>X2TN Perfume Admin</h1>
          <span className="admin-badge">Quản trị viên</span>
        </div>
        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Sản Phẩm</button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Đơn Hàng</button>
          <button className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>Mã Giảm Giá</button>
        </div>
      </div>

      {activeTab === 'products' && (
      <>
      {/* STATS WIDGETS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
          <div className="stat-info">
            <h3>Tổng Sản Phẩm</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
          <div className="stat-info">
            <h3>Hết Hàng</h3>
            <p className="stat-value">{stats.outOfStock}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <div className="stat-info">
            <h3>Tổng Giá Trị Kho</h3>
            <p className="stat-value">{formatPrice(stats.totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {/* LEFT COLUMN: FORM & CHARTS */}
        <div className="admin-left-col">
          <div className="admin-panel">
            <div className="panel-header">
              <h2>{editingId ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
              {editingId && (
                <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Hủy Sửa</button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên sản phẩm</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={errors.name ? 'error-input' : ''} placeholder="VD: Chanel Bleu..." />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Thương hiệu</label>
                  <input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="VD: Chanel" />
                </div>
                <div className="form-group">
                  <label>Giá (VNĐ)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className={errors.price ? 'error-input' : ''} placeholder="VD: 3500000" />
                  {errors.price && <span className="error-text">{errors.price}</span>}
                </div>
                <div className="form-group">
                  <label>Tồn kho</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} min="0" />
                </div>
                <div className="form-group">
                  <label>Danh mục</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {categoryOptions.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    {genderOptions.filter(g => g !== 'All').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                
                {/* --- 3 TRƯỜNG MỚI ĐƯỢC THÊM VÀO ĐÂY --- */}
                <div className="form-group">
                  <label>Nhóm mùi hương (VD: Woody, Floral)</label>
                  <input type="text" value={form.fragrance_family} onChange={e => setForm({...form, fragrance_family: e.target.value})} placeholder="Woody" />
                </div>
                <div className="form-group">
                  <label>Nồng độ (VD: Eau de Parfum)</label>
                  <input type="text" value={form.concentration} onChange={e => setForm({...form, concentration: e.target.value})} placeholder="Eau de Parfum" />
                </div>
                <div className="form-group">
                  <label>Độ lưu hương (VD: 8-12 giờ)</label>
                  <input type="text" value={form.longevity} onChange={e => setForm({...form, longevity: e.target.value})} placeholder="8-12 giờ" />
                </div>
                <div className="form-group">
                  <label>Xuất xứ (VD: Pháp)</label>
                  <input type="text" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} placeholder="Pháp" />
                </div>
                {/* --- END TRƯỜNG MỚI --- */}

              </div>
              
              <div className="form-group full-width" style={{ marginTop: '15px' }}>
                <label>Link ảnh (URL)</label>
                <input type="text" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://example.com/image.jpg" />
                {form.image_url && (
                  <div className="image-preview-small">
                    <img src={form.image_url} alt="Preview" onError={(e) => e.target.style.display='none'} />
                  </div>
                )}
              </div>
              
              <div className="form-group full-width" style={{ marginTop: '15px' }}>
                <label>Mô tả chi tiết</label>
                <textarea rows="4" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Mô tả các tầng hương..."></textarea>
              </div>
              
              <div className="form-group checkbox-group" style={{ marginTop: '15px' }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
                  <span className="checkbox-custom"></span>
                  Sản phẩm nổi bật (Hiển thị trang chủ)
                </label>
              </div>
              
              <button type="submit" className="btn btn-primary btn-submit">
                {editingId ? 'Lưu Thay Đổi' : 'Thêm Sản Phẩm'}
              </button>
            </form>
          </div>

          <div className="admin-panel chart-panel">
            <h2>Phân Bố Sản Phẩm</h2>
            <div className="chart-container">
              {products.length > 0 ? (
                <Doughnut data={genderChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#E5E7EB' } } } }} />
              ) : (
                <p className="no-data-text">Chưa có dữ liệu thống kê</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DATA TABLE */}
        <div className="admin-panel table-panel">
          <div className="panel-header table-header">
            <h2>Danh Sách Sản Phẩm</h2>
            <div className="table-actions">
              {selectedIds.size > 0 && (
                <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                  Xóa ({selectedIds.size})
                </button>
              )}
              <span className="count-badge">{filteredProducts.length} SP</span>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="filters-toolbar">
            <div className="search-box">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Tìm theo tên, thương hiệu..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="filter-group">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {categoryOptions.map(c => <option key={`cat-${c}`} value={c}>{c === 'All' ? 'Tất cả Danh mục' : c}</option>)}
              </select>
              
              <select value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                {genderOptions.map(g => <option key={`gen-${g}`} value={g}>{g === 'All' ? 'Tất cả Giới tính' : g}</option>)}
              </select>
              
              <select value={sortKey} onChange={e => setSortKey(e.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="name-asc">Tên: A - Z</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input type="checkbox" onChange={toggleSelectAll} checked={products.length > 0 && selectedIds.size === filteredProducts.length} />
                  </th>
                  <th>Sản Phẩm</th>
                  <th>Giới Tính</th>
                  <th>Giá Bán</th>
                  <th>Tồn Kho</th>
                  <th className="th-actions">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center empty-state">Không tìm thấy sản phẩm nào phù hợp.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className={selectedIds.has(p.id) ? 'selected-row' : ''}>
                      <td className="td-checkbox">
                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelectOne(p.id)} />
                      </td>
                      <td>
                        <div className="td-product-info">
                          <div className="td-img">
                            {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="img-placeholder"></div>}
                          </div>
                          <div>
                            <strong>{p.name}</strong>
                            <div className="td-brand">{p.brand || 'No Brand'} {p.is_featured && <span className="badge-featured">★</span>}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge-gender badge-${normalizeGender(p.gender).toLowerCase()}`}>{p.gender}</span></td>
                      <td className="font-medium">{formatPrice(p.price)}</td>
                      <td>
                        <span className={`stock-status ${p.stock > 10 ? 'stock-ok' : p.stock > 0 ? 'stock-low' : 'stock-out'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button className="action-btn edit-btn" title="Sửa" onClick={() => handleEdit(p)}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button className="action-btn delete-btn" title="Xóa" onClick={() => handleDelete(p.id)}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}

      {activeTab === 'orders' && (
        <div className="admin-panel table-panel orders-panel">
          <div className="panel-header table-header">
            <h2>Danh Sách Đơn Hàng</h2>
            <span className="count-badge">{orders.length} đơn</span>
          </div>

          <div className="filters-toolbar">
            <div className="search-box">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Tìm theo tên khách hàng..."
                value={orderFilters.customer_name}
                onChange={(e) => setOrderFilters({ ...orderFilters, customer_name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchOrders(); }}
              />
            </div>

            <div className="filter-group">
              <select value={orderFilters.payment_status} onChange={(e) => setOrderFilters({ ...orderFilters, payment_status: e.target.value })}>
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ thanh toán</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="FAILED">Thất bại</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="REFUNDED">Đã hoàn tiền</option>
              </select>

              <select value={orderFilters.payment_method} onChange={(e) => setOrderFilters({ ...orderFilters, payment_method: e.target.value })}>
                <option value="">Tất cả phương thức</option>
                <option value="COD">COD</option>
                <option value="VNPAY">VNPay</option>
                <option value="MOMO">MoMo</option>
              </select>

              <input type="date" value={orderFilters.date_from} onChange={(e) => setOrderFilters({ ...orderFilters, date_from: e.target.value })} />
              <input type="date" value={orderFilters.date_to} onChange={(e) => setOrderFilters({ ...orderFilters, date_to: e.target.value })} />

              <button type="button" className="btn btn-primary btn-sm" onClick={fetchOrders}>Lọc</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Khách Hàng</th>
                  <th>Ngày Đặt</th>
                  <th>Phương Thức</th>
                  <th>Trạng Thái</th>
                  <th>Tổng Tiền</th>
                  <th>Transaction ID</th>
                  <th>Bank</th>
                  <th>Response Code</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr><td colSpan="9" className="text-center empty-state">Đang tải danh sách đơn hàng...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="9" className="text-center empty-state">Không có đơn hàng nào phù hợp.</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-medium">#{o.id}</td>
                      <td>{o.full_name}</td>
                      <td>{o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : ''}</td>
                      <td>{o.payment_method}</td>
                      <td><span className={`order-status-badge status-${o.payment_status?.toLowerCase()}`}>{o.payment_status}</span></td>
                      <td className="font-medium">{formatPrice(o.total_price)}</td>
                      <td>{o.transaction_id || '-'}</td>
                      <td>{o.bank_code || '-'}</td>
                      <td>{o.response_code || '-'}</td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="admin-panel table-panel">
          <div className="panel-header table-header">
            <h2>Quản lý mã giảm giá</h2>
            <button type="button" className="btn btn-primary" onClick={resetCouponForm}>+ Thêm mã giảm giá</button>
          </div>
          <div className="coupon-stats-grid">
            <div className="coupon-stat-card"><span>Tổng coupon</span><strong>{couponStats.total}</strong></div>
            <div className="coupon-stat-card active"><span>Đang hoạt động</span><strong>{couponStats.active}</strong></div>
            <div className="coupon-stat-card expired"><span>Hết hạn</span><strong>{couponStats.expired}</strong></div>
            <div className="coupon-stat-card exhausted"><span>Hết lượt</span><strong>{couponStats.exhausted}</strong></div>
          </div>
          <form className="coupon-form admin-form" onSubmit={handleCouponSubmit}>
            <div className="form-grid">
              <label>Mã giảm giá<input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="SUMMER20" />{couponErrors.code && <small className="field-error">{couponErrors.code}</small>}</label>
              <label>Loại giảm<select value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}><option value="percentage">Phần trăm (%)</option><option value="fixed">Số tiền cố định</option></select></label>
              <label>Giá trị giảm<input type="number" min="0" step="any" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} />{couponErrors.discount_value && <small className="field-error">{couponErrors.discount_value}</small>}</label>
              <label>Đơn hàng tối thiểu<input type="number" min="0" step="any" value={couponForm.min_order_amount} onChange={e => setCouponForm({ ...couponForm, min_order_amount: e.target.value })} />{couponErrors.min_order_amount && <small className="field-error">{couponErrors.min_order_amount}</small>}</label>
              <label>Giảm tối đa<input type="number" min="0" step="any" value={couponForm.max_discount} onChange={e => setCouponForm({ ...couponForm, max_discount: e.target.value })} disabled={couponForm.discount_type !== 'percentage'} />{couponErrors.max_discount && <small className="field-error">{couponErrors.max_discount}</small>}</label>
              <label>Giới hạn lượt dùng<input type="number" min="0" step="1" value={couponForm.usage_limit} onChange={e => setCouponForm({ ...couponForm, usage_limit: e.target.value })} />{couponErrors.usage_limit && <small className="field-error">{couponErrors.usage_limit}</small>}</label>
              <label>Ngày bắt đầu<input type="datetime-local" value={couponForm.starts_at} onChange={e => setCouponForm({ ...couponForm, starts_at: e.target.value })} /></label>
              <label>Ngày kết thúc<input type="datetime-local" value={couponForm.ends_at} onChange={e => setCouponForm({ ...couponForm, ends_at: e.target.value })} />{couponErrors.ends_at && <small className="field-error">{couponErrors.ends_at}</small>}</label>
              <label className="checkbox-label"><input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm({ ...couponForm, is_active: e.target.checked })} /> Hoạt động</label>
            </div>
            <div className="form-actions"><button type="submit" className="btn btn-primary">{editingCouponId ? 'Lưu thay đổi' : 'Thêm mã'}</button>{editingCouponId && <button type="button" className="btn btn-secondary" onClick={resetCouponForm}>Hủy</button>}</div>
          </form>
          <div className="filters-toolbar">
            <div className="search-box"><input type="text" placeholder="Tìm mã giảm giá..." value={couponSearch} onChange={e => setCouponSearch(e.target.value)} /></div>
            <div className="coupon-filter-buttons">
              {[
                ['all', 'Tất cả'],
                ['active', 'Hoạt động'],
                ['inactive', 'Đã tắt'],
                ['expired', 'Hết hạn'],
                ['exhausted', 'Hết lượt'],
              ].map(([value, label]) => (
                <button type="button" key={value} className={`coupon-filter-btn ${couponStatusFilter === value ? 'selected' : ''}`} onClick={() => setCouponStatusFilter(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>Mã giảm giá</th><th>Loại giảm</th><th>Giá trị giảm</th><th>Đơn tối thiểu</th><th>Lượt sử dụng</th><th>Thời hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {couponsLoading ? <tr><td colSpan="8" className="text-center empty-state">Đang tải mã giảm giá...</td></tr> : couponLoadError ? <tr><td colSpan="8" className="text-center empty-state">{couponLoadError}</td></tr> : filteredCoupons.length === 0 ? <tr><td colSpan="8" className="text-center empty-state">Chưa có mã giảm giá hoặc không tìm thấy kết quả.</td></tr> : filteredCoupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td className="font-medium">{coupon.code}</td>
                    <td>{coupon.discount_type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}</td>
                    <td>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)}</td>
                    <td>{formatPrice(coupon.min_order_amount)}</td>
                    <td>{coupon.used_count}{coupon.usage_limit === null ? '' : ` / ${coupon.usage_limit}`}</td>
                    <td>{coupon.starts_at ? new Date(coupon.starts_at).toLocaleDateString('vi-VN') : 'Ngay'} - {coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString('vi-VN') : 'Không hạn'}</td>
                    <td><button type="button" className={`status-toggle ${getCouponStatus(coupon).className}`} onClick={() => toggleCoupon(coupon)}>{getCouponStatus(coupon).label}</button></td>
                    <td><button type="button" className="action-btn edit-btn" onClick={() => handleCouponEdit(coupon)}>Sửa</button><button type="button" className="action-btn delete-btn" onClick={() => handleCouponDelete(coupon)}>{Number(coupon.used_count) > 0 ? 'Tắt' : 'Xóa'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style jsx>{`
        .admin-container { padding: 120px 30px 30px; max-width: 1400px; margin: 0 auto; color: #E5E7EB; }
        .admin-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .admin-header-left { display: flex; align-items: center; gap: 15px; }
        .admin-header-bar h1 { font-size: 2.2rem; margin: 0; background: linear-gradient(135deg, #f2f2f3 0%, #a8927a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .admin-badge { background: rgba(168, 146, 122, 0.2); color: #a8927a; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; border: 1px solid rgba(168, 146, 122, 0.3); }
        .admin-tabs { display: flex; gap: 8px; background: #1a1b28; padding: 6px; border-radius: 10px; border: 1px solid #374151; }
        .tab-btn { padding: 8px 20px; border-radius: 8px; background: transparent; border: none; color: #9CA3AF; cursor: pointer; font-weight: 600; transition: 0.2s; }
        .tab-btn:hover { color: #E5E7EB; }
        .tab-btn.active { background: #a8927a; color: #0b0b0c; }
        .orders-panel { width: 100%; }
        .order-status-badge { padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
        .status-pending { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
        .status-processing { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
        .status-paid { background: rgba(16, 185, 129, 0.15); color: #10B981; }
        .status-failed { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
        .status-cancelled { background: rgba(156, 163, 175, 0.15); color: #9CA3AF; }
        .status-refunded { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }
        .btn-logout { display: flex; align-items: center; gap: 8px; color: #ef4444; border-color: #ef4444; padding: 8px 16px; border-radius: 8px; background: transparent; cursor: pointer; transition: 0.2s; }
        .btn-logout:hover { background: rgba(239, 68, 68, 0.1); }
        .btn-logout svg { width: 18px; height: 18px; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #1a1b28; border: 1px solid #374151; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 20px; }
        .stat-icon { width: 50px; height: 50px; border-radius: 12px; background: rgba(168, 146, 122, 0.1); color: #a8927a; display: flex; align-items: center; justify-content: center; }
        .stat-icon svg { width: 26px; height: 26px; }
        .stat-icon.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .stat-icon.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-info h3 { margin: 0 0 5px 0; font-size: 0.95rem; color: #9CA3AF; font-weight: 500; }
        .stat-value { margin: 0; font-size: 1.8rem; font-weight: bold; color: #f2f2f3; }
        .coupon-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .coupon-stat-card { background: #0f111a; border: 1px solid #374151; border-radius: 10px; padding: 14px 16px; }
        .coupon-stat-card span { display: block; color: #9CA3AF; font-size: 0.85rem; margin-bottom: 6px; }
        .coupon-stat-card strong { color: #f2f2f3; font-size: 1.5rem; }
        .coupon-stat-card.active { border-color: rgba(16, 185, 129, 0.45); }
        .coupon-stat-card.active strong { color: #10B981; }
        .coupon-stat-card.expired { border-color: rgba(245, 158, 11, 0.45); }
        .coupon-stat-card.expired strong { color: #F59E0B; }
        .coupon-stat-card.exhausted { border-color: rgba(239, 68, 68, 0.45); }
        .coupon-stat-card.exhausted strong { color: #EF4444; }

        .admin-content { display: grid; grid-template-columns: 350px 1fr; gap: 25px; align-items: start; }
        @media (min-width: 1200px) { .admin-content { grid-template-columns: 400px 1fr; } }
        
        .admin-panel { background: #1a1b28; border: 1px solid #374151; border-radius: 12px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #374151; padding-bottom: 15px; }
        .panel-header h2 { margin: 0; font-size: 1.4rem; color: #f2f2f3; }
        
        .admin-left-col { display: flex; flex-direction: column; gap: 25px; }
        .chart-panel { height: 300px; display: flex; flex-direction: column; }
        .chart-container { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; }
        .no-data-text { color: #6B7280; font-style: italic; }

        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { font-size: 0.9rem; color: #D1D5DB; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { background: #0f111a; border: 1px solid #4B5563; color: white; padding: 10px 12px; border-radius: 8px; transition: 0.2s; font-family: inherit; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #a8927a; box-shadow: 0 0 0 2px rgba(168, 146, 122, 0.2); }
        .error-input { border-color: #ef4444 !important; }
        .error-text { color: #ef4444; font-size: 0.8rem; margin-top: 2px; }
        .image-preview-small { margin-top: 10px; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid #374151; }
        .image-preview-small img { width: 100%; height: 100%; object-fit: cover; }
        
        .checkbox-group label { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
        .checkbox-group input { display: none; }
        .checkbox-custom { width: 20px; height: 20px; border: 2px solid #4B5563; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .checkbox-group input:checked + .checkbox-custom { background: #a8927a; border-color: #a8927a; }
        .checkbox-group input:checked + .checkbox-custom::after { content: '✓'; color: #0b0b0c; font-weight: bold; font-size: 14px; }
        
        .btn-submit { width: 100%; margin-top: 25px; padding: 14px; font-size: 1.05rem; background: #a8927a; color: #0b0b0c; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .btn-submit:hover { background: #bca68e; transform: translateY(-2px); }

        .filters-toolbar { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; background: #0f111a; padding: 15px; border-radius: 10px; border: 1px solid #374151; }
        .search-box { flex: 1; min-width: 250px; position: relative; }
        .search-box svg { position: absolute; left: 12px; top: 13%; transform: translateY(-50%); width: 20px; height: 20px; color: #6B7280; }
        .search-box input { width: 100%; pl-padding: 40px; padding: 10px 10px 10px 40px; background: transparent; border: 1px solid #4B5563; border-radius: 8px; color: white; }
        .filter-group { display: flex; gap: 10px; flex-wrap: wrap; }
        .filter-group select { padding: 10px; background: #1a1b28; border: 1px solid #4B5563; color: white; border-radius: 8px; cursor: pointer; }
        .coupon-filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .coupon-filter-btn { padding: 9px 12px; border: 1px solid #4B5563; border-radius: 8px; background: #1a1b28; color: #D1D5DB; cursor: pointer; }
        .coupon-filter-btn:hover, .coupon-filter-btn.selected { background: #a8927a; border-color: #a8927a; color: #0b0b0c; }
        .coupon-form label { display: flex; flex-direction: column; gap: 6px; color: #D1D5DB; font-size: 0.9rem; font-weight: 500; }
        .coupon-form input, .coupon-form select { background: #0f111a; border: 1px solid #4B5563; color: white; padding: 10px 12px; border-radius: 8px; font-family: inherit; }
        .coupon-form input:focus, .coupon-form select:focus { outline: none; border-color: #a8927a; }
        .coupon-form input:disabled { opacity: 0.55; cursor: not-allowed; }
        .coupon-form .checkbox-label { flex-direction: row; align-items: center; align-self: end; }
        .coupon-form .form-actions { display: flex; gap: 10px; margin-top: 18px; }
        .field-error { color: #EF4444; font-weight: 400; }
        .status-toggle { border: 1px solid currentColor; border-radius: 999px; padding: 5px 10px; cursor: pointer; background: transparent; font-size: 0.8rem; }
        .status-toggle.active { color: #10B981; background: rgba(16, 185, 129, 0.12); }
        .status-toggle.inactive { color: #9CA3AF; background: rgba(156, 163, 175, 0.12); }
        .status-toggle.expired { color: #F59E0B; background: rgba(245, 158, 11, 0.12); }
        .status-toggle.exhausted { color: #EF4444; background: rgba(239, 68, 68, 0.12); }

        .table-responsive { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .admin-table th, .admin-table td { padding: 14px 12px; text-align: left; border-bottom: 1px solid #374151; }
        .admin-table th { color: #9CA3AF; font-weight: 500; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .admin-table tr { transition: 0.2s; }
        .admin-table tbody tr:hover { background: rgba(255, 255, 255, 0.02); }
        .selected-row { background: rgba(168, 146, 122, 0.05) !important; }
        
        .td-checkbox, .th-checkbox { width: 40px; }
        .td-product-info { display: flex; align-items: center; gap: 12px; }
        .td-img { width: 45px; height: 45px; border-radius: 8px; overflow: hidden; background: #0f111a; flex-shrink: 0; }
        .td-img img { width: 100%; height: 100%; object-fit: cover; }
        .td-brand { font-size: 0.85rem; color: #9CA3AF; display: flex; align-items: center; gap: 5px; }
        .badge-featured { color: #f59e0b; font-size: 1rem; }
        
        .badge-gender { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
        .badge-nam, .badge-Nam { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-nu, .badge-nữ, .badge-Nữ { background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }
        .badge-unisex, .badge-Unisex { background: rgba(168, 146, 122, 0.15); color: #a8927a; border: 1px solid rgba(168, 146, 122, 0.3); }
        
        .stock-status { padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; }
        .stock-ok { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .stock-low { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .stock-out { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        
        .td-actions { display: flex; gap: 8px; }
        .action-btn { width: 45px; height: 45px; border-radius: 25px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .edit-btn { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
        .edit-btn:hover { background: #3b82f6; color: white; }
        .delete-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .delete-btn:hover { background: #ef4444; color: white; }
        .action-btn svg { width: 16px; height: 16px; }

        .btn-sm { padding: 6px 12px; font-size: 0.9rem; }
        .btn-danger { background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; }
        .btn-danger:hover { background: #dc2626; }
        .count-badge { background: #374151; padding: 4px 10px; border-radius: 12px; font-size: 0.9rem; color: #D1D5DB; }

        /* Modal & Notification logic remain same */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: #1a1b28; border: 1px solid #374151; padding: 30px; border-radius: 16px; max-width: 400px; width: 90%; text-align: center; animation: slideUp 0.3s ease; }
        .modal-icon { width: 60px; height: 60px; color: #ef4444; margin: 0 auto 20px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .modal-content h3 { margin: 0 0 10px; font-size: 1.5rem; color: white; }
        .modal-content p { color: #9CA3AF; margin-bottom: 20px; line-height: 1.5; }
        .modal-actions { display: flex; gap: 15px; justify-content: center; }
        .modal-actions button { flex: 1; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; }
        .btn-cancel { background: #374151; color: white; }
        .btn-cancel:hover { background: #4B5563; }
        .btn-confirm { background: #ef4444; color: white; }
        .btn-confirm:hover { background: #dc2626; }

        .notification-toast { position: fixed; top: 20px; right: 20px; background: #1a1b28; border: 1px solid #374151; padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 15px; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: slideIn 0.3s ease; overflow: hidden; }
        .notification-icon { width: 24px; height: 24px; }
        .notification-success .notification-icon { color: #10b981; }
        .notification-error .notification-icon { color: #ef4444; }
        .notification-toast p { margin: 0; color: white; font-weight: 500; font-size: 1rem; }
        .notification-progress { position: absolute; bottom: 0; left: 0; height: 4px; animation: progress 3s linear forwards; }
        .notification-success .notification-progress { background: linear-gradient(90deg, rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0.4)); }
        .notification-error .notification-progress { background: linear-gradient(90deg, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.4)); }
        
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        @media (max-width: 1024px){ .admin-content { grid-template-columns: 1fr; } }
        @media (max-width: 768px){
          .admin-header-bar h1{ font-size: 1.8rem; }
          .stats-grid { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .filters-toolbar { flex-direction: column; }
          .admin-container { padding: 15px; }
          .coupon-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
                    /* ===== FIX TABLE BORDER BROKEN LINE ===== */
          .admin-table {
            border-collapse: collapse !important;
          }

          .admin-table th,
          .admin-table td {
            border-bottom: none !important;
          }

          .admin-table tbody tr {
            border-bottom: 1px solid #374151;
          }

          .admin-table tbody tr:last-child {
            border-bottom: none;
          }
      `}</style>

      {/* MODAL XÁC NHẬN XÓA */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmModal({ isOpen: false })}>Hủy</button>
              <button className="btn-confirm" onClick={confirmModal.onConfirm}>{confirmModal.title === 'Tắt mã giảm giá' ? 'Tắt mã' : 'Xóa'}</button>
            </div>
          </div>
        </div>
      )}

      {/* THÔNG BÁO TOAST */}
      {notification.show && (
        <div className={`notification-toast notification-${notification.type}`}>
          {notification.type === 'success' ? (
            <svg className="notification-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="notification-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <p>{notification.message}</p>
          <div className="notification-progress"></div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;