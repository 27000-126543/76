import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Tasks from './pages/Orders/Tasks';
import Sorting from './pages/Sorting';
import SortingExceptions from './pages/Sorting/Exceptions';
import Inventory from './pages/Inventory';
import Replenish from './pages/Inventory/Replenish';
import Putaway from './pages/Inventory/Putaway';
import Equipment from './pages/Equipment';
import Maintenance from './pages/Equipment/Maintenance';
import Employees from './pages/Employees';
import Performance from './pages/Employees/Performance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="orders"
            element={
              <ProtectedRoute requiredRole="leader">
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="orders/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />

          <Route
            path="sorting"
            element={
              <ProtectedRoute requiredRole="leader">
                <Sorting />
              </ProtectedRoute>
            }
          />

          <Route
            path="sorting/exceptions"
            element={
              <ProtectedRoute>
                <SortingExceptions />
              </ProtectedRoute>
            }
          />

          <Route
            path="inventory"
            element={
              <ProtectedRoute requiredRole="leader">
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="inventory/replenish"
            element={
              <ProtectedRoute requiredRole="leader">
                <Replenish />
              </ProtectedRoute>
            }
          />

          <Route
            path="inventory/putaway"
            element={
              <ProtectedRoute>
                <Putaway />
              </ProtectedRoute>
            }
          />

          <Route
            path="equipment"
            element={
              <ProtectedRoute requiredRole="leader">
                <Equipment />
              </ProtectedRoute>
            }
          />

          <Route
            path="equipment/maintenance"
            element={
              <ProtectedRoute requiredRole="manager">
                <Maintenance />
              </ProtectedRoute>
            }
          />

          <Route
            path="employees"
            element={
              <ProtectedRoute requiredRole="leader">
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="employees/performance"
            element={
              <ProtectedRoute>
                <Performance />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports"
            element={
              <ProtectedRoute requiredRole="manager">
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="settings"
            element={
              <ProtectedRoute requiredRole="director">
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
