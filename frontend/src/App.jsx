import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import { AuthProvider } from './auth/AuthContext';
import Home from './pages/home';
import Appointment from './pages/appointment';
import LiveQueue from './pages/Live_queue';
import AIAssistant from './pages/AI_assistance';
import Departments from './pages/depertment';
import Header from './pages/header';
import Profile from './pages/profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FeaturePage from './pages/FeaturePage';
import { featurePages } from './pages/featurePageData';

function App() {
  return (
    <div className="App">
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/live-queue" element={<LiveQueue />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/ai-intelligence-engine"
              element={<FeaturePage feature={featurePages.aiIntelligenceEngine} />}
            />
            <Route
              path="/predictive-analytics"
              element={<FeaturePage feature={featurePages.predictiveAnalytics} />}
            />
            <Route
              path="/operational-insights"
              element={<FeaturePage feature={featurePages.operationalInsights} />}
            />
            <Route
              path="/hospital-risk-monitor"
              element={<FeaturePage feature={featurePages.hospitalRiskMonitor} />}
            />
          </Routes>
          <footer/>
        </AuthProvider>
      </BrowserRouter>
      
    </div>
  );
}

export default App;
