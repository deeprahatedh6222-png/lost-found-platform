import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [contacts, setContacts] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/claims/mine');
      setClaims(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your claims');
    }
  };

  useEffect(() => { load(); }, []);

  const withdraw = async (id) => {
    try {
      await api.delete(`/claims/${id}`);
      setClaims((prev) => prev.filter((claim) => claim.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to withdraw claim');
    }
  };

  const contact = async (id) => {
    try {
      const { data } = await api.get(`/claims/${id}/contact`);
      setContacts((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to show contact details');
    }
  };

  return (
    <main className="container section">
      <div className="section-heading"><div><p className="eyebrow">MY REQUESTS</p><h1>Claims I submitted</h1></div></div>
      {error && <div className="alert error">{error}</div>}
      {claims.length === 0 ? <div className="empty-state">You have not submitted any claims.</div> : (
        <div className="dashboard-list">
          {claims.map((claim) => (
            <article className="claim-row" key={claim.id}>
              <div className="grow">
                <h3>{claim.item?.title || 'Deleted item'}</h3>
                <p className="muted">Reported by {claim.item?.user?.name || 'Unknown'} • {claim.item?.location}</p>
                <p>{claim.message}</p>
                <span className={`status status-${claim.status}`}>{claim.status}</span>
                {contacts[claim.id] && (
                  <div className="contact-box">
                    Reporter: {contacts[claim.id].reporter.name} — {contacts[claim.id].reporter.email}
                  </div>
                )}
              </div>
              <div className="action-row">
                {claim.status === 'accepted' && <button className="btn btn-small" onClick={() => contact(claim.id)}>Contact reporter</button>}
                {claim.status !== 'accepted' && <button className="btn btn-small btn-outline" onClick={() => withdraw(claim.id)}>Withdraw</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
