import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="nav-shell">
      <nav className="navbar container">
        <Link to="/" className="brand">
          <span className="brand-icon">LF</span>
          <span>Lost & Found</span>
        </Link>

        <div className="nav-links">
          <NavLink to="/">Browse</NavLink>
          {user && <NavLink to="/report">Report Item</NavLink>}
          {user && <NavLink to="/my-reports">My Reports</NavLink>}
          {user && <NavLink to="/claims-inbox">Claim Inbox</NavLink>}
          {user && <NavLink to="/my-claims">My Claims</NavLink>}
        </div>

        <div className="nav-user">
          {user ? (
            <>
              <span className="welcome">Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn-small btn-outline" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-small btn-outline" to="/login">Login</Link>
              <Link className="btn btn-small" to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
