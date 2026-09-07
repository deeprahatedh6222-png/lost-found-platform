import { Link } from 'react-router-dom';

export default function ItemCard({ item }) {
  const date = new Date(item.event_date).toLocaleDateString();

  return (
    <article className="item-card">
      <div className="card-image-wrap">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="card-image" />
        ) : (
          <div className="image-placeholder">No image</div>
        )}
        <span className={`badge type-${item.item_type}`}>{item.item_type}</span>
      </div>
      <div className="card-body">
        <div className="card-row">
          <span className="category-chip">{item.category}</span>
          <span className={`status status-${item.status}`}>{item.status}</span>
        </div>
        <h3>{item.title}</h3>
        <p className="muted line-clamp">{item.description}</p>
        <div className="meta-list">
          <span>📍 {item.location}</span>
          <span>📅 {date}</span>
        </div>
        <Link className="text-link" to={`/items/${item.id}`}>View details →</Link>
      </div>
    </article>
  );
}
