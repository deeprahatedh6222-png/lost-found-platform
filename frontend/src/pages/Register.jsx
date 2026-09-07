import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">JOIN THE COMMUNITY</p>
        <h1>Create account</h1>
        {error && <div className="alert error">{error}</div>}
        <label>Full name</label>
        <input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Email</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Password</label>
        <input type="password" required minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label>Confirm password</label>
        <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <button className="btn btn-full" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        <p className="auth-switch">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
