import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faFacebook,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import {
  faMapMarkerAlt,
  faPhone,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
  return (
    <footer className="footer ftco-section">
      <div className="container">
        <div className="row">
          {/* Company Info */}
          <div className="col-md-6 col-lg-3 mb-4 mb-md-0">
            <h2 className="footer-heading">Homehelper company</h2>
            <p>
              Chúng tôi cung cấp dịch vụ vệ sinh chuyên nghiệp, uy tín và chất
              lượng cao. Đội ngũ nhân viên tận tâm, giàu kinh nghiệm, luôn sẵn
              sàng phục vụ khách hàng.
            </p>
            <ul className="ftco-footer-social list-unstyled float-md-left float-lft mt-4">
              <li className="ftco-animate">
                <a href="#">
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
              </li>
              <li className="ftco-animate">
                <a href="#">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
              </li>
              <li className="ftco-animate">
                <a href="#">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
              </li>
            </ul>
          </div>

          {/* Latest News */}
          <div className="col-md-6 col-lg-3 mb-4 mb-md-0">
            <h2 className="footer-heading">Tin Mới Nhất</h2>

            <div className="block-21 mb-4 d-flex">
              <a
                className="img mr-4 rounded"
                style={{ backgroundImage: "url('/images/image_1.jpg')" }}
              ></a>
              <div className="text">
                <h3 className="heading">
                  <a href="#">
                    Mẹo vệ sinh nhà cửa hiệu quả và tiết kiệm thời gian
                  </a>
                </h3>
                <div className="meta">
                  <div>
                    <a href="#">05 Tháng 09, 2025</a>
                  </div>
                  <div>
                    <a href="#">Quản trị viên</a>
                  </div>
                  <div>
                    <a href="#">19</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="block-21 mb-4 d-flex">
              <a
                className="img mr-4 rounded"
                style={{ backgroundImage: "url('/images/image_2.jpg')" }}
              ></a>
              <div className="text">
                <h3 className="heading">
                  <a href="#">Dịch vụ vệ sinh chuyên nghiệp cho gia đình</a>
                </h3>
                <div className="meta">
                  <div>
                    <a href="#">05 Tháng 09, 2025</a>
                  </div>
                  <div>
                    <a href="#">Quản trị viên</a>
                  </div>
                  <div>
                    <a href="#">19</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-6 col-lg-3 pl-lg-5 mb-4 mb-md-0">
            <h2 className="footer-heading">Liên Kết Nhanh</h2>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="py-1 d-block">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/about" className="py-1 d-block">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/services" className="py-1 d-block">
                  Dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="py-1 d-block">
                  Dự án
                </Link>
              </li>
              <li>
                <Link to="/blog" className="py-1 d-block">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="py-1 d-block">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="py-1 d-block">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-md-6 col-lg-3 mb-4 mb-md-0">
            <h2 className="footer-heading">Bạn Có Câu Hỏi?</h2>
            <div className="block-23 mb-3">
              <ul>
                <li>
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span className="text">
                    Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng 550000, Việt Nam
                  </span>
                </li>
                <li>
                  <a href="tel:+0906070605">
                    <FontAwesomeIcon icon={faPhone} />
                    <span className="text">+0906 070 605</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:info@yourdomain.com">
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span className="text">info@yourdomain.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="row mt-5">
          <div className="col-md-12 text-center">
            <p className="copyright">
              © {new Date().getFullYear()} Bản quyền thuộc về Homehelper | Giao
              diện được thiết kế bởi{" "}
              <a
                href="https://colorlib.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Colorlib
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
