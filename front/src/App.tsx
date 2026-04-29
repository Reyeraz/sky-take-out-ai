import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import UserAiChat from './pages/UserAiChat';
import UserHome from './pages/UserHome';
import UserBrowse from './pages/UserBrowse';
import UserCart from './pages/UserCart';
import UserOrders from './pages/UserOrders';
import UserProfile from './pages/UserProfile';
import UserOrderDetail from './pages/UserOrderDetail';
import UserCheckout from './pages/UserCheckout';
import UserAddressBook from './pages/UserAddressBook';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmployee from './pages/admin/AdminEmployee';
import AdminCategory from './pages/admin/AdminCategory';
import AdminDish from './pages/admin/AdminDish';
import AdminSetmeal from './pages/admin/AdminSetmeal';
import AdminOrder from './pages/admin/AdminOrder';
import AdminReport from './pages/admin/AdminReport';
import AdminAi from './pages/admin/AdminAi';
import AdminShop from './pages/admin/AdminShop';
import LoginPage from './pages/LoginPage';

function AuthGuard({ children }: { children?: React.ReactNode }) {
  const token = localStorage.getItem('sky_token');
  if (!token) {
    const isAdmin = window.location.pathname.startsWith('/admin');
    return <Navigate to={isAdmin ? '/admin/login' : '/login'} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin Routes - Protected */}
        <Route element={<AuthGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="employee" element={<AdminEmployee />} />
            <Route path="category" element={<AdminCategory />} />
            <Route path="dish" element={<AdminDish />} />
            <Route path="setmeal" element={<AdminSetmeal />} />
            <Route path="order" element={<AdminOrder />} />
            <Route path="report" element={<AdminReport />} />
            <Route path="ai" element={<AdminAi />} />
            <Route path="shop" element={<AdminShop />} />
          </Route>
        </Route>

        {/* User Routes - Protected */}
        <Route element={<AuthGuard />}>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<UserHome />} />
            <Route path="browse" element={<UserBrowse />} />
            <Route path="ai" element={<UserAiChat />} />
            <Route path="cart" element={<UserCart />} />
            <Route path="orders" element={<UserOrders />} />
            <Route path="order/:id" element={<UserOrderDetail />} />
            <Route path="checkout" element={<UserCheckout />} />
            <Route path="address" element={<UserAddressBook />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </Route>

        {/* Home redirects to user */}
        <Route path="/" element={<Navigate to="/user" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
