import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// Import contexts
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Portfolio from './pages/Portfolio';
import Pricing from './pages/Pricing';
import Blog from './pages/Blog';
import BlogDetails from './pages/BlogDetails';
import BlogCreate from './pages/BlogCreate';
import MyBlogs from './pages/MyBlogs';
import Contact from './pages/Contact';
import Video from './pages/Video';
import VideoDetail from './pages/VideoDetail';
import TopUp from './pages/TopUp';
import PaymentResult from './pages/PaymentResult';
import Wallet from './pages/Wallet';

// Import authentication pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthDemo from "./pages/auth/AuthDemo";

// Import new pages for functional objectives
import Dashboard from "./pages/Dashboard";
import TaskerSearch from "./pages/TaskerSearch";
import TaskerProfile from "./pages/TaskerProfile";
import AccountManagement from "./pages/AccountManagement";
import TaskManagement from "./pages/TaskManagement";
import PaymentInvoicing from "./pages/PaymentInvoicing";
import RatingComplaints from "./pages/RatingComplaints";
import ContentManagement from "./pages/ContentManagement";
import VideoUpload from "./pages/VideoUpload";
import TaskerManagement from "./pages/TaskerManagement";
import AIInteraction from "./pages/AIInteraction";
import SystemManagement from "./pages/SystemManagement";
// Role landing pages
import TaskerHome from './pages/tasker/TaskerHome';
import AdminHome from './pages/admin/AdminHome';
import CustomerHome from './pages/customer/CustomerHome';
import ChatPage from './pages/Chat';
import CCCDExtractor from './pages/CCCDExtractor';
import BecomeTasker from './pages/BecomeTasker';
import TaskerApprovals from './pages/admin/TaskerApprovals';
import Wishlist from "./pages/Wishlist";


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
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
              <Route path="/blog/create" element={
                <ProtectedRoute>
                  <BlogCreate />
                </ProtectedRoute>
              } />
              <Route path="/my-blogs" element={
                <ProtectedRoute>
                  <MyBlogs />
                </ProtectedRoute>
              } />
              <Route path="/blog/:id" element={<BlogDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/video" element={<Video />} />
              <Route path="/videoDetail" element={<VideoDetail />} />
              <Route path="/topUp" element={<TopUp />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/cccd" element={<CCCDExtractor />} />
              
              {/* Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth-demo" element={<AuthDemo />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/tasker-search" element={<TaskerSearch />} />
              <Route path="/tasker-profile/:id" element={<TaskerProfile />} />
              <Route path="/account" element={
                <ProtectedRoute>
                  <AccountManagement />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute>
                  <TaskManagement />
                </ProtectedRoute>
              } />
              <Route path="/payment" element={
                <ProtectedRoute>
                  <PaymentInvoicing />
                </ProtectedRoute>
              } />
              <Route path="/ratings" element={
                <ProtectedRoute>
                  <RatingComplaints />
                </ProtectedRoute>
              } />
                <Route
                  path="/wishlists"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
              <Route path="/content" element={
                <ProtectedRoute requiredRole="Admin">
                  <ContentManagement />
                </ProtectedRoute>
              } />
              <Route path="/video-upload" element={
                <ProtectedRoute requiredRole="Tasker">
                  <VideoUpload />
                </ProtectedRoute>
              } />
              <Route path="/tasker-management" element={
                <ProtectedRoute requiredRole="Admin">
                  <TaskerManagement />
                </ProtectedRoute>
              } />
              <Route path="/ai-chat" element={
                <ProtectedRoute>
                  <AIInteraction />
                </ProtectedRoute>
              } />
              <Route path="/system" element={
                <ProtectedRoute requiredRole="Admin">
                  <SystemManagement />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="/chat/:conversationId" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              {/* Role landing */}
              <Route path="/tasker" element={
                <ProtectedRoute requiredRole="Tasker">
                  <TaskerHome />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminHome />
                </ProtectedRoute>
              } />
            </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
