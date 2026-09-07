import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/items/${id}`)
      .then(({ data }) => {
        if (data.user_id !== user.id) {
          setError('You can edit only your own report.');
          return;
        }
        setForm({
          itemType: data.item_type,
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          eventDate: new Date(data.event_date).toISOString().slice(0, 10)
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load report'));
  }, [id, user.id]);

  if (error && !form) {
    return <main className="container section"><div className="alert error">{error}</div></main>;
  }
  if (!form) return <div className="center-message">Loading report...</div>;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (image) body.append('image', image);
      await api.put(`/items/${id}`, body);
      navigate('/my-reports');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container section narrow">
      <div className="section-heading"><div><p className="eyebrow">UPDATE REPORT</p><h1>Edit item details</h1></div></div>
      <form className="form-card" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        <div className="form-grid two">
          <div>
            <label>Report type</label>
            <select name="itemType" value={form.itemType} onChange={update}>
              <option value="lost">Lost item</option>
              <option value="found">Found item</option>
            </select>
          </div>
          <div>
            <label>Category</label>
            <select name="category" value={form.category} onChange={update}>
              {['Electronics','Documents','Wallet / Bag','Keys','Clothing','Jewelry','Other'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <label>Title</label>
        <input name="title" required value={form.title} onChange={update} />
        <label>Description</label>
        <textarea name="description" rows="5" required value={form.description} onChange={update} />
        <div className="form-grid two">
          <div>
            <label>Location</label>
            <input name="location" required value={form.location} onChange={update} />
          </div>
          <div>
            <label>Date lost/found</label>
            <input type="date" name="eventDate" required value={form.eventDate} onChange={update} />
          </div>
        </div>
        <label>Replace image (optional)</label>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <button className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
      </form>
    </main>
  );
}
