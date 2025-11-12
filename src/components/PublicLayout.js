import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Đảm bảo đường dẫn này đúng
import Footer from './Footer'; // Đảm bảo đường dẫn này đúng
import '../css/AdminLayout.css';

const PublicLayout = () => {
  return (
    <>
      <Header />
      <main className="public-main" >
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default PublicLayout;