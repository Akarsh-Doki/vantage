import { Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/auth/ProtectedRoute'
import Dashboard from '@/pages/Dashboard'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import NewReport from '@/pages/NewReport'
import NotFound from '@/pages/NotFound'
import Report from '@/pages/Report'
import Review from '@/pages/Review'
import Sample from '@/pages/Sample'
import ThemePreview from '@/pages/ThemePreview'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sample" element={<Sample />} />
      <Route path="/theme-preview" element={<ThemePreview />} />

      {/* Authenticated routes — gated by the session in ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new" element={<NewReport />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="/review/:id" element={<Review />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
