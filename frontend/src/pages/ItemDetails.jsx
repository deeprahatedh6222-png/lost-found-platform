import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [myClaim, setMyClaim] = useState(null);
  const [contact, setContact] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isOwner = useMemo(() => user && item && item.user_id === user.id, [user, item]);

  const load = async () => {
    try {
      const { data } = await api.get(`/items/${id}`);
      setItem(data);
      if (user) {
        const claims = await api.get('/claims/mine');
        setMyClaim(claims.data.find((c) => c.item?.id === id) || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load item');
    }
  };

  useEffect(() => { load(); }, [id, user?.id]);

  const submitClaim = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/claims', { itemId: id, message: claimMessage });
      setMyClaim(data);
      setClaimMessage('');
      setNotice('Claim request submitted. The reporter can now review it.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit claim');
    }
  };

  const showContact = async () => {
    try {
      const { data } = await api.get(`/claims/${myClaim.id}/contact`);
      setContact(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reveal contact details');
    }
  };

  if (error && !item) return <main className="container section"><div className="alert error">{error}</div></main>;
  if (!item) return <div className="center-message">Loading item...</div>;

  return (
    <main className="container section">
      <div className="details-grid">
        <div className="details-image-panel">
          {item.image_url ? <img src={item.image_url} alt={item.title} /> : <div className="details-placeholder">No image uploaded</div>}
        </div>
        <div className="details-content">
          <div className="card-row">
            <span className={`badge static type-${item.item_type}`}>{item.item_type}</span>
            <span className={`status status-${item.status}`}>{item.status}</span>
          </div>
          <h1>{item.title}</h1>
          <p className="muted">Reported by {item.user?.name || 'User'} • {new Date(item.created_at).toLocaleDateString()}</p>
          <div className="detail-box">
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Location:</strong> {item.location}</p>
            <p><strong>Date:</strong> {new Date(item.event_date).toLocaleDateString()}</p>
          </div>
          <h3>Description</h3>
          <p className="description">{item.description}</p>

          {isOwner && (
            <div className="action-row">
              <Link className="btn" to="/my-reports">Manage this report</Link>
              <Link className="btn btn-outline" to="/claims-inbox">Review claims</Link>
            </div>
          )}

          {!user && <div className="alert info">Login to submit a claim request for this item.</div>}

          {user && !isOwner && item.status !== 'resolved' && !myClaim && (
            <form className="claim-box" onSubmit={submitClaim}>
              <h3>Think this item is yours?</h3>
              <p className="muted">Give identifying information. Avoid posting sensitive details publicly.</p>
              <textarea required rows="4" value={claimMessage} onChange={(e) => setClaimMessage(e.target.value)} placeholder="Describe why you believe this item belongs to you..." />
              <button className="btn">Send claim request</button>
            </form>
          )}

          {myClaim && (
            <div className="claim-box">
              <h3>Your claim: <span className={`status status-${myClaim.status}`}>{myClaim.status}</span></h3>
              <p>{myClaim.message}</p>
              {myClaim.status === 'accepted' && <button className="btn" onClick={showContact}>Show contact details</button>}
            </div>
          )}

          {contact && (
            <div className="alert success">
              <strong>Contact exchange unlocked</strong><br />
              Reporter: {contact.reporter.name} — {contact.reporter.email}<br />
              Claimant: {contact.claimant.name} — {contact.claimant.email}
            </div>
          )}
          {notice && <div className="alert success">{notice}</div>}
          {error && <div className="alert error">{error}</div>}
        </div>
      </div>
    </main>
  );
}
