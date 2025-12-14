import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import CustomToastContainer from "./components/common/CustomToast";

import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./pages/admin/AdminLayout";
import StaffDashboard from "./pages/StaffDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import Portfolio from "./pages/Portfolio";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import BlogDetails from "./pages/BlogDetails";
import BlogCreate from "./pages/BlogCreate";
import MyBlogs from "./pages/MyBlogs";
import Contact from "./pages/Contact";
import Video from "./pages/Video";
import VideoDetail from "./pages/VideoDetail";
import TopUp from "./pages/TopUp";
import PaymentResult from "./pages/PaymentResult";
import PaymentPage from "./pages/PaymentPage";
import Wallet from "./pages/Wallet";
import Booking from "./pages/Booking";
import JobDescription from "./pages/JobDescription";
import Contract from "./pages/Contract";
import TaskerBookingDetail from "./pages/TaskerBookingDetail";
import TaskerBookings from "./pages/TaskerBookings";
import TaskerJobProgress from "./pages/TaskerJobProgress";
import TaskerJobCompletion from "./pages/TaskerJobCompletion";
import TaskerJobDone from "./pages/TaskerJobDone";
// Import authentication pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthDemo from "./pages/auth/AuthDemo";
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
import QuotesPage from "./pages/QuotesPage";
import VideoManager from "./pages/VideoManager";
import ServiceManagement from "./pages/ServiceManagement";
// import NegotiateSessionTest from './pages/NegotiateSessionTest';
// Role landing pages
import TaskerHome from "./pages/tasker/TaskerHome";
import AdminHome from "./pages/admin/AdminHome";
import CustomerHome from "./pages/customer/CustomerHome";
import BookingHistory from "./pages/customer/BookingHistory";
import ChatPage from "./pages/Chat";
import CCCDExtractor from "./pages/CCCDExtractor";
import BecomeTasker from "./pages/BecomeTasker";
import Wishlist from "./pages/Wishlist";
import StaffApplications from "./pages/StaffApplications";
import StaffCertifications from "./pages/StaffCertifications";
import StaffBlogs from "./pages/StaffBlogs";
import ReportIssue from "./pages/ReportIssue";
import AdminReports from "./pages/AdminReports";
import StaffBadges from "./pages/StaffBadges";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTaskers from "./pages/admin/AdminTaskers";
import AdminEvidenceReview from "./pages/admin/AdminEvidenceReview";
import NoShowReportPage from "./pages/tasker/NoShowReportPage";
import GlobalCallManager from "./components/chat/GlobalCallManager";

function App() {


  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <GlobalCallManager />
          <div className="App">
            <CustomToastContainer />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:id" element={<ServiceDetails />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/create" element={
                  <ProtectedRoute> <BlogCreate /> </ProtectedRoute>
                } />
                <Route path="/blog/:id/edit" element={
                  <ProtectedRoute> <BlogCreate /> </ProtectedRoute>
                } />
                <Route path="/my-blogs" element={
                  <ProtectedRoute> <MyBlogs /> </ProtectedRoute>
                } />
                <Route path="/blog/:id" element={<BlogDetails />} />
                <Route path="/blog/:postId/quotes" element={
                  <ProtectedRoute> <QuotesPage /> </ProtectedRoute>
                } />
                <Route path="/contact" element={<Contact />} />
                <Route path="/video" element={<Video />} />
                <Route path="/video/:videoId" element={<VideoDetail />} />
                <Route path="/videos" element={
                  <ProtectedRoute requiredRole="Tasker"> <VideoManager /> </ProtectedRoute>
                } />
                <Route path="/topUp" element={<TopUp />} />
                <Route path="/payment-result" element={<PaymentResult />} />
                <Route path="/payment/:bookingId" element={
                  <ProtectedRoute requiredRole="Customer"> <PaymentPage /> </ProtectedRoute>
                } />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/cccd" element={<CCCDExtractor />} />
                <Route path="/booking/:taskerId" element={<Booking />} />
                <Route path="/tasker/bookings/:id" element={<TaskerBookingDetail />} />
                <Route
                  path="/tasker/bookings/:id/progress"
                  element={
                    <ProtectedRoute requiredRole="Tasker">
                      <TaskerJobProgress />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasker/bookings/:id/complete"
                  element={
                    <ProtectedRoute requiredRole="Tasker">
                      <TaskerJobCompletion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasker/bookings/:bookingId/jobdone"
                  element={<TaskerJobDone />}
                />
                <Route path="/tasker/bookings" element={
                  <ProtectedRoute requiredRole="Tasker"> <TaskerBookings /> </ProtectedRoute>
                } />
                <Route path="/job-description" element={<JobDescription />} />
                <Route path="/contract" element={<Contract />} />
                <Route path="/topUp" element={<TopUp />} />
                <Route path="/payment-result" element={<PaymentResult />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/cccd" element={<CCCDExtractor />} />
                <Route path="/booking/:taskerId" element={<Booking />} />
                <Route path="/tasker/bookings/:id" element={<TaskerBookingDetail />} />
                <Route path="/tasker/bookings" element={
                  <ProtectedRoute requiredRole="Tasker">
                    <TaskerBookings />
                  </ProtectedRoute>
                } />
                <Route path="/job-description" element={<JobDescription />} />
                <Route path="/contract" element={<Contract />} />

                <Route path="/become-tasker" element={<BecomeTasker />} />

                <Route path="/report-issue" element={
                  <ProtectedRoute> <ReportIssue /> </ProtectedRoute>
                } />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth-demo" element={<AuthDemo />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute> <Dashboard /> </ProtectedRoute>
                } />
                <Route path="/tasker-search" element={<TaskerSearch />} />
                <Route path="/tasker-profile" element={<TaskerProfile />} />
                <Route path="/tasker-profile/:id" element={<TaskerProfile />} />
                <Route path="/account" element={
                  <ProtectedRoute> <AccountManagement /> </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute> <TaskManagement /> </ProtectedRoute>
                } />
                <Route path="/payment" element={
                  <ProtectedRoute> <PaymentInvoicing /> </ProtectedRoute>
                } />
                <Route path="/ratings" element={
                  <ProtectedRoute> <RatingComplaints /> </ProtectedRoute>
                } />
                <Route path="/wishlists" element={
                  <ProtectedRoute> <Wishlist /> </ProtectedRoute>
                } />
                <Route path="/content" element={
                  <ProtectedRoute requiredRole="Admin"> <ContentManagement /> </ProtectedRoute>
                } />
                <Route path="/videostaff" element={
                  <ProtectedRoute requiredRole="Staff"> <VideoUpload /> </ProtectedRoute>
                } />
                <Route path="/tasker-management" element={
                  <ProtectedRoute requiredRole="Admin"> <TaskerManagement /> </ProtectedRoute>
                } />
                <Route path="/system" element={
                  <ProtectedRoute requiredRole="Admin"> <SystemManagement /> </ProtectedRoute>
                } />
                <Route path="/ai-chat" element={
                  <ProtectedRoute> <AIInteraction /> </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute> <ChatPage /> </ProtectedRoute>
                } />
                <Route path="/chat/:conversationId" element={
                  <ProtectedRoute> <ChatPage /> </ProtectedRoute>
                } />
                <Route path="/tasker" element={
                  <ProtectedRoute requiredRole="Tasker"> <TaskerHome /> </ProtectedRoute>
                } />
                <Route path="/tasker/no-show-report/:bookingId" element={
                  <ProtectedRoute requiredRole="Tasker"> <NoShowReportPage /> </ProtectedRoute>
                } />
                <Route path="/customer" element={
                  <ProtectedRoute requiredRole="Customer"> <CustomerHome /> </ProtectedRoute>
                } />
                <Route path="/customer/bookings" element={
                  <ProtectedRoute requiredRole="Customer"> <BookingHistory /> </ProtectedRoute>
                } />
                <Route path="/customer/booking/:id" element={
                  <ProtectedRoute requiredRole="Customer"> <CustomerBookingDetail /> </ProtectedRoute>
                } />
                <Route path="/customer/vouchers" element={
                  <ProtectedRoute requiredRole="Customer"><VoucherCenter /> </ProtectedRoute>
                } />
              </Route>

              <Route
                path="/customer/bookings"
                element={
                  <ProtectedRoute requiredRole="Customer">
                    <BookingHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminHome />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="taskers" element={<AdminTaskers />} />
                <Route path="service-management" element={<ServiceManagement />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="evidence-review" element={<AdminEvidenceReview />} />
              </Route>

              <Route
                path="/staff/dashboard"
                element={
                  <ProtectedRoute requiredRole="Staff">
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              >
                <Route path="applications" element={<StaffApplications />} />
                <Route path="certifications" element={<StaffCertifications />} />
                <Route path="blogs" element={<StaffBlogs />} />
                <Route path="badges" element={<StaffBadges />} />
              </Route>
              <Route
                path="/staff"
                element={<Navigate to="/staff/dashboard/applications" replace />}
              />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;