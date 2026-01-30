import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import KakaoCallbackPage from './pages/KakaoCallbackPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import TripCreatePage from './pages/TripCreatePage'
import CompanionsPage from './pages/CompanionsPage'
import CompanionDetailPage from './pages/CompanionDetailPage'
import CompanionCreatePage from './pages/CompanionCreatePage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import ProfileEditPage from './pages/ProfileEditPage'
import AIPlannerPage from './pages/MultiAgentPlannerPage'
import ExplorePage from './pages/ExplorePage'
import ExploreDetailPage from './pages/ExploreDetailPage'
import NearbyPage from './pages/NearbyPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/nearby" element={<NearbyPage />} />
        <Route path="explore/:contentId" element={<ExploreDetailPage />} />

        <Route path="trips" element={<PrivateRoute><TripsPage /></PrivateRoute>} />
        <Route path="trips/create" element={<PrivateRoute><TripCreatePage /></PrivateRoute>} />
        <Route path="trips/ai-planner" element={<PrivateRoute><AIPlannerPage /></PrivateRoute>} />
        <Route path="trips/:id" element={<PrivateRoute><TripDetailPage /></PrivateRoute>} />

        <Route path="companions" element={<CompanionsPage />} />
        <Route path="companions/create" element={<PrivateRoute><CompanionCreatePage /></PrivateRoute>} />
        <Route path="companions/:id" element={<CompanionDetailPage />} />

        <Route path="chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="chat/:roomId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

        <Route path="profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="profile/edit" element={<PrivateRoute><ProfileEditPage /></PrivateRoute>} />
      </Route>
    </Routes>
  )
}
