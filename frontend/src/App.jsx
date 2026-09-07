import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportItem from './pages/ReportItem';
import ItemDetails from './pages/ItemDetails';
import MyReports from './pages/MyReports';
import ClaimsInbox from './pages/ClaimsInbox';
import MyClaims from './pages/MyClaims';
import EditItem from './pages/EditItem';

const Private = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items/:id" element={<ItemDetails />} />
          <Route path="/report" element={<Private><ReportItem /></Private>} />
          <Route path="/my-reports" element={<Private><MyReports /></Private>} />
          <Route path="/items/:id/edit" element={<Private><EditItem /></Private>} />
          <Route path="/claims-inbox" element={<Private><ClaimsInbox /></Private>} />
          <Route path="/my-claims" element={<Private><MyClaims /></Private>} />
          <Route path="*" element={<main className="container section"><div className="empty-state">Page not found.</div></main>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
