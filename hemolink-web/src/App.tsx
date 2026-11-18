import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Solicitacoes from './pages/Solicitacoes';
import NovaSolicitacao from './pages/NovaSolicitacao';
import DetalhesSolicitacao from './pages/DetalhesSolicitacao';
import Perfil from './pages/Perfil';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitacoes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Solicitacoes />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitacoes/nova"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NovaSolicitacao />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitacoes/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DetalhesSolicitacao />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Perfil />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
