import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import CompaniesPage from './pages/CompaniesPage';
import RunsPage from './pages/RunsPage';
import { RunsProvider } from './components/Runs';
import { EmptyState } from './components/common';
import { ClaudeStepsProvider } from './components/ClaudeSteps';

export default function App() {
  const location = useLocation();
  return (
    <RunsProvider>
    <ClaudeStepsProvider>
    <Layout>
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/outreach" element={<Navigate to="/applications" replace />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="*" element={<EmptyState title="Page not found" />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
    </ClaudeStepsProvider>
    </RunsProvider>
  );
}
