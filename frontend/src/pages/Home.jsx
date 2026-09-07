import { useEffect, useState } from 'react';
import api from '../api/axios';
import ItemCard from '../components/ItemCard';

const categories = ['all', 'Electronics', 'Documents', 'Wallet / Bag', 'Keys', 'Clothing', 'Jewelry', 'Other'];

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    itemType: 'all',
    category: 'all',
    status: 'open',
    location: ''
  });

  const loadItems = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/items', { params: { ...filters, page, limit: 9 } });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(1);
  }, [filters.itemType, filters.category, filters.status]);

  const update = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    loadItems(1);
  };

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">COMMUNITY LOST & FOUND</p>
            <h1>Help lost belongings find their way home.</h1>
            <p className="hero-copy">Report a lost or found item, search verified community posts, and safely connect through a claim workflow.</p>
          </div>
          <div className="hero-panel">
            <div><strong>1.</strong> Report</div>
            <div><strong>2.</strong> Search & Match</div>
            <div><strong>3.</strong> Claim</div>
            <div><strong>4.</strong> Reunite</div>
          </div>
        </div>
      </section>

      <section className="container section">
        <form className="filter-panel" onSubmit={submitSearch}>
          <div className="search-wide">
            <label>Search</label>
            <input name="search" value={filters.search} onChange={update} placeholder="Phone, wallet, ID card, location..." />
          </div>
          <div>
            <label>Type</label>
            <select name="itemType" value={filters.itemType} onChange={update}>
              <option value="all">All</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          <div>
            <label>Category</label>
            <select name="category" value={filters.category} onChange={update}>
              {categories.map((category) => <option key={category} value={category}>{category === 'all' ? 'All categories' : category}</option>)}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select name="status" value={filters.status} onChange={update}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="claimed">Claimed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label>Location</label>
            <input name="location" value={filters.location} onChange={update} placeholder="Campus, area..." />
          </div>
          <button className="btn" type="submit">Search</button>
        </form>

        <div className="section-heading">
          <div>
            <p className="eyebrow">LATEST REPORTS</p>
            <h2>Browse items</h2>
          </div>
          <span className="muted">{pagination.total || 0} report(s)</span>
        </div>

        {error && <div className="alert error">{error}</div>}
        {loading ? (
          <div className="center-message">Loading reports...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No reports match these filters.</div>
        ) : (
          <div className="item-grid">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="btn btn-outline" disabled={pagination.page <= 1} onClick={() => loadItems(pagination.page - 1)}>Previous</button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button className="btn btn-outline" disabled={pagination.page >= pagination.pages} onClick={() => loadItems(pagination.page + 1)}>Next</button>
          </div>
        )}
      </section>
    </main>
  );
}
