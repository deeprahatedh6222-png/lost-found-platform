import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/items/mine');
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your reports');
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/items/${id}/status`, { status });
      setItems((prev) => prev.map((item) => item.id === id ? data : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await api.delete(`/items/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete report');
    }
  };

  return (
    <main className="container section">
      <div className="section-heading"><div><p className="eyebrow">DASHBOARD</p><h1>My reports</h1></div></div>
      {error && <div className="alert error">{error}</div>}
      {items.length === 0 ? <div className="empty-state">You have not published any reports yet.</div> : (
        <div className="dashboard-list">
          {items.map((item) => (
            <article className="dashboard-row" key={item.id}>
              <div className="thumb">{item.image_url ? <img src={item.image_url} alt="" /> : 'No image'}</div>
              <div className="grow">
                <div className="card-row"><span className={`badge static type-${item.item_type}`}>{item.item_type}</span><span className="category-chip">{item.category}</span></div>
                <h3>{item.title}</h3>
                <p className="muted">{item.location} • {new Date(item.event_date).toLocaleDateString()}</p>
              </div>
              <div className="manage-actions">
                <Link className="btn btn-small btn-outline" to={`/items/${item.id}/edit`}>Edit</Link>
                <select value={item.status} onChange={(e) => changeStatus(item.id, e.target.value)}>
                  <option value="open">Open</option>
                  <option value="claimed">Claimed</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button className="btn btn-danger btn-small" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
