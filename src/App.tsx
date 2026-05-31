
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';

import ProductManager from './pages/Products/ProductManager';
import AddressManager from './pages/Addresses/AddressManager';
import WorkOrderList from './pages/WorkOrders/WorkOrderList';
import WorkOrderForm from './pages/WorkOrders/WorkOrderForm';
import Dashboard from './pages/Dashboard';
import WorkOrderDetail from './pages/WorkOrders/WorkOrderDetail';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<AuthGuard />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/work-orders" element={<WorkOrderList />} />
                  <Route path="/work-orders/new" element={<WorkOrderForm />} />
                  <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
                  <Route path="/products" element={<ProductManager />} />
                  <Route path="/addresses" element={<AddressManager />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer position="top-right" autoClose={3000} />
        </ErrorBoundary>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
