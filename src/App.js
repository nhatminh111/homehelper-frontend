import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Pricing from './pages/Pricing';
import Blog from './pages/Blog';
import Contact from './pages/Contact';

// Import new pages for functional objectives
import Dashboard from './pages/Dashboard';
import TaskerSearch from './pages/TaskerSearch';
import TaskerProfile from './pages/TaskerProfile';
import AccountManagement from './pages/AccountManagement';
import TaskManagement from './pages/TaskManagement';
import PaymentInvoicing from './pages/PaymentInvoicing';
import RatingComplaints from './pages/RatingComplaints';
import ContentManagement from './pages/ContentManagement';
import VideoUpload from './pages/VideoUpload';
import TaskerManagement from './pages/TaskerManagement';
import AIInteraction from './pages/AIInteraction';
import SystemManagement from './pages/SystemManagement';
// Role landing pages
import TaskerHome from './pages/tasker/TaskerHome';
import AdminHome from './pages/admin/AdminHome';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* New routes for functional objectives */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasker-search" element={<TaskerSearch />} />
            <Route path="/tasker-profile/:id" element={<TaskerProfile />} />
            <Route path="/account" element={<AccountManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/payment" element={<PaymentInvoicing />} />
            <Route path="/ratings" element={<RatingComplaints />} />
            <Route path="/content" element={<ContentManagement />} />
            <Route path="/video-upload" element={<VideoUpload />} />
            <Route path="/tasker-management" element={<TaskerManagement />} />
            <Route path="/ai-chat" element={<AIInteraction />} />
            <Route path="/system" element={<SystemManagement />} />
            {/* Role landing */}
            <Route path="/tasker" element={<TaskerHome />} />
            <Route path="/admin" element={<AdminHome />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
