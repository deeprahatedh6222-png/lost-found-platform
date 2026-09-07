import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const initial = {
  itemType: 'lost',
  title: '',
  description: '',
  category: 'Electronics',
  location: '',
  eventDate: ''
};

export default function ReportItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (image) body.append('image', image);
      const { data } = await api.post('/items', body);
      navigate(`/items/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container section narrow">
      <div className="section-heading"><div><p className="eyebrow">CREATE REPORT</p><h1>Report a lost or found item</h1></div></div>
      <form className="form-card" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        <div className="form-grid two">
          <div>
            <label>Report type *</label>
            <select name="itemType" value={form.itemType} onChange={update}>
              <option value="lost">Lost item</option>
              <option value="found">Found item</option>
            </select>
          </div>
          <div>
            <label>Category *</label>
            <select name="category" value={form.category} onChange={update}>
              {['Electronics','Documents','Wallet / Bag','Keys','Clothing','Jewelry','Other'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <label>Item title *</label>
        <input name="title" required maxLength="100" value={form.title} onChange={update} placeholder="Example: Black Samsung Galaxy phone" />
        <label>Description *</label>
        <textarea name="description" required maxLength="1000" rows="5" value={form.description} onChange={update} placeholder="Color, identifying details, where you last saw it, etc." />
        <div className="form-grid two">
          <div>
            <label>Location *</label>
            <input name="location" required value={form.location} onChange={update} placeholder="Library, Block A, Pune..." />
          </div>
          <div>
            <label>Date lost/found *</label>
            <input type="date" name="eventDate" required value={form.eventDate} onChange={update} />
          </div>
        </div>
        <label>Image (optional, max 5 MB)</label>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <button className="btn" disabled={loading}>{loading ? 'Submitting...' : 'Publish report'}</button>
      </form>
    </main>
  );
}
