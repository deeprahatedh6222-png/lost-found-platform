import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ClaimsInbox() {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data: items } = await api.get('/items/mine');
      const responses = await Promise.all(
        items.map(async (item) => ({ item, claims: (await api.get(`/claims/item/${item.id}`)).data }))
      );
      setGroups(responses.filter((group) => group.claims.length > 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load claim requests');
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (claimId, status) => {
    try {
      await api.patch(`/claims/${claimId}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update claim');
    }
  };

  return (
    <main className="container section">
      <div className="section-heading"><div><p className="eyebrow">CLAIM WORKFLOW</p><h1>Claims on my reports</h1></div></div>
      {error && <div className="alert error">{error}</div>}
      {groups.length === 0 ? <div className="empty-state">No one has submitted a claim on your reports yet.</div> : groups.map(({ item, claims }) => (
        <section className="claim-group" key={item.id}>
          <div className="claim-group-title">
            <div><span className={`badge static type-${item.item_type}`}>{item.item_type}</span><h2>{item.title}</h2></div>
            <span className={`status status-${item.status}`}>{item.status}</span>
          </div>
          {claims.map((claim) => (
            <article className="claim-row" key={claim.id}>
              <div className="grow">
                <h3>{claim.claimant?.name || 'User'}</h3>
                <p>{claim.message}</p>
                <span className={`status status-${claim.status}`}>{claim.status}</span>
              </div>
              {claim.status === 'pending' && (
                <div className="action-row">
                  <button className="btn btn-small" onClick={() => decide(claim.id, 'accepted')}>Accept</button>
                  <button className="btn btn-small btn-outline" onClick={() => decide(claim.id, 'rejected')}>Reject</button>
                </div>
              )}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
