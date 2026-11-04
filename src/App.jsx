import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlayersPage from './pages/PlayersPage';
import PaidPlayersPage from './pages/PaidPlayersPage';
import TeamsPage from './pages/TeamsPage';
import TeamStatsPage from './pages/TeamStatsPage';
import UsersPage from './pages/UsersPage';
import AuctionScreen from './pages/AuctionScreen';
import NotFoundPage from './pages/NotFoundPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ArchivedPlayersPage from './pages/ArchivedPlayersPage';
import { ROLES } from './utils/constants';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/registerplayer" element={<RegisterPage />} />
      <Route path="/register" element={<Navigate to="/registerplayer" replace />} />

      {/* Admin & Auctioneer */}
      <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.AUCTIONEER]} />}>
        <Route path="/auction/:id" element={<AuctionScreen />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="paid-players" element={<PaidPlayersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="team-stats" element={<TeamStatsPage />} />
          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path="players" element={<PlayersPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="archived-players" element={<ArchivedPlayersPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
