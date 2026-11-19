export default function ProductCard({ p, onAdd }){
  return (
    <div className="card">
      <img src={p.image_url || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop'} alt={p.name} />
      <div className="card-body">
        <div className="card-title">{p.name}</div>
        <div className="muted">{p.brand}</div>
        <div className="price">{p.price.toLocaleString('vi-VN')} VND</div>
        <div style={{marginTop:8}}>
          <button className="btn" onClick={() => onAdd?.(p)}>Thêm vào giỏ</button>
        </div>
      </div>
    </div>
  )
}
