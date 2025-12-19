// Static, non-DB introduction content per service
// Key by service id (string) or slug. Provide a default fallback.

const servicesIntro = {
  // Each entry supports: hero, intro, reasons, process
  // Slug-based keys to match service.name (vn to ascii -> kebab-case)
  default: {
    hero: {
      title: 'Dịch vụ gia đình tiện lợi',
      image: '/images/bg_1.jpg',
      des: 'Chúng tôi cung cấp nhiều dịch vụ gia đình với giá minh bạch và đội ngũ chuyên nghiệp.'
    },
    intro: {
      title: 'Giới Thiệu',
      text: ['Dịch vụ được thiết kế để phù hợp nhu cầu đa dạng của bạn, linh hoạt về thời gian và hình thức.'],
      image: '/images/image_1.jpg'
    },
    reasons: {
      title: 'Vì sao chọn HomeHelper?',
      items: ['Đặt lịch nhanh chóng', 'Nhân sự được kiểm duyệt', 'Giá rõ ràng, không phát sinh'],
      image: '/images/work-6.jpg'
    }
  },
  'nau-an': {
    hero: {
      title: 'Dịch vụ nấu ăn gia đình',
      image: '/images/nau-an.png',
      des: 'Dịch vụ nấu ăn gia đình theo thực đơn, đảm bảo dinh dưỡng và vệ sinh, phù hợp lịch sinh hoạt của bạn.'
    },
    intro: { title: 'Giới Thiệu', text: ['Chỉ một vài thao tác đơn giản, khách hàng đã tìm được Dịch vụ nấu ăn theo thực đơn, chuẩn bị bữa sáng, trưa, tối với nhiều ưu đãi hấp dẫn.'], image: '/images/nau-an-1.png' },
  reasons: { title: 'Tại Sao Cần Dịch Vụ Nấu Ăn Gia Đình Của Chúng Tôi?', items: ['Đảm bảo dinh dưỡng', 'Tiết kiệm thời gian', 'Vệ sinh an toàn thực phẩm'], image: '/images/work-1.jpg' },
    },
  'don-dep-nha-cua': {
    hero: {
      title: 'Dọn dẹp nhà cửa theo giờ',
      image: '/images/image_1.jpg',
      des: 'Dọn dẹp nhà theo giờ: lau chùi, giặt giũ và sắp xếp gọn gàng, linh hoạt theo nhu cầu.'
    },
    intro: { title: 'Giới Thiệu', text: ['Dịch vụ lau chùi, giặt giũ, sắp xếp gọn gàng.'], image: '/images/image_2.jpg' },
  reasons: { title: 'Tại Sao Cần Dọn Dẹp Nhà Cửa Theo Giờ Thường Xuyên?', items: ['Nhà sạch gọn', 'Linh hoạt thời gian', 'Nhân viên chuyên nghiệp'], image: '/images/work-4.jpg' },
      },
  'giup-viec-dinh-ky': {
    hero: {
      title: 'Giúp việc định kỳ',
      image: '/images/work-1.jpg',
      des: 'Giúp việc hàng tuần/tháng với danh sách công việc rõ ràng, ổn định và tiết kiệm chi phí.'
    },
    intro: { title: 'Giới Thiệu', text: ['Giúp việc hàng tuần/tháng, công việc theo danh sách.'], image: '/images/work-2.jpg' },
  reasons: { title: 'Tại Sao Cần Giúp Việc Định Kỳ Thường Xuyên?', items: ['Ổn định, quen việc', 'Tiết kiệm chi phí', 'Quản lý lịch dễ dàng'], image: '/images/work-7.jpg' },
    },
  'cham-soc-nguoi-gia-va-benh-nhan': {
    hero: {
      title: 'Chăm sóc người già & bệnh nhân',
      image: '/images/work-3.jpg',
      des: 'Chăm sóc tận tâm, theo dõi sức khỏe và hỗ trợ sinh hoạt an toàn cho người già & bệnh nhân.'
    },
    intro: { title: 'Giới Thiệu', text: ['Chăm sóc theo giờ/tháng, tận tâm và an toàn.'], image: '/images/work-4.jpg' },
  reasons: { title: 'Tại Sao Bạn Cần Dịch Vụ Chăm Sóc Người Già & Bệnh Nhân Của Chúng Tôi?', items: ['Đội ngũ được đào tạo', 'Theo dõi sức khỏe', 'Giao tiếp thân thiện'], image: '/images/work-2.jpg' },
      },
  've-sinh-sofa-nem-tham-rem': {
    hero: {
      title: 'Dịch Vụ Vệ Sinh Sofa Tại Nhà Chuyên Nghiệp',
      image: '/images/work-1.jpg',
      des: 'Homehelper cung cấp dịch vụ vệ sinh sofa, đệm, rèm và thảm bằng công nghệ làm sạch từ Đức. Giải pháp của chúng tôi giúp loại bỏ vết bẩn, nấm mốc và ố vàng, mang lại không gian sạch sẽ, thoải mái cho gia đình bạn.'
    },
    intro: { title: 'Giới Thiệu', text: ['Làm sạch sâu theo chất liệu, khử mùi & diệt khuẩn.'], image: '/images/work-5.jpg' },
  reasons: { title: 'Tại Sao Cần Vệ Sinh Sofa Thường Xuyên?', items: ['Loại bỏ bụi mịn & dị ứng', 'Kéo dài tuổi thọ', 'An toàn cho gia đình'], image: '/images/work-5.jpg' },
      },
  've-sinh-dieu-hoa': {
    hero: {
      title: 'Vệ sinh điều hòa',
      image: '/images/work-3.jpg',
      des: 'Vệ sinh dàn nóng/lạnh, khử khuẩn và kiểm tra gas để máy vận hành êm, mát nhanh, tiết kiệm điện.'
    },
    intro: { title: 'Giới Thiệu', text: ['Vệ sinh dàn nóng/lạnh, kiểm tra gas & hiệu suất.'], image: '/images/work-4.jpg' },
  reasons: { title: 'Tại Sao Cần Vệ Sinh Điều Hoà Thường Xuyên?', items: ['Làm mát nhanh hơn', 'Tiết kiệm điện', 'Bảo vệ sức khỏe'], image: '/images/work-8.jpg' },
      },
  'tong-ve-sinh': {
    hero: {
      title: 'Tổng vệ sinh',
      image: '/images/work-2.jpg',
      des: 'Tổng vệ sinh nhà ở/doanh nghiệp theo m² với đội ngũ chuyên nghiệp và quy trình tiêu chuẩn.'
    },
    intro: { title: 'Giới Thiệu', text: ['Vệ sinh tổng thể cho nhà ở/doanh nghiệp, tính theo m².'], image: '/images/work-7.jpg' },
  reasons: { title: 'Tại Sao Cần Tổng Vệ Sinh Thường Xuyên?', items: ['Sạch sâu toàn diện', 'Đội ngũ đông', 'Dụng cụ chuyên nghiệp'], image: '/images/work-3.jpg' },
      },
  'cham-soc-tre-em': {
    hero: {
      title: 'Chăm sóc trẻ em',
      image: '/images/work-4.jpg',
      des: 'Dịch vụ chăm sóc trẻ an toàn, hỗ trợ học tập và vui chơi, giao tiếp tích cực với trẻ.'
    },
    intro: { title: 'Giới Thiệu', text: ['Hỗ trợ học tập, vui chơi, chăm sóc theo giờ/tháng.'], image: '/images/work-5.jpg' },
  reasons: { title: 'Tại Sao Bạn Cần Dịch Vụ Chăm Sóc Trẻ Em Của Chúng Tôi?', items: ['Kiên nhẫn & tận tâm', 'An toàn là ưu tiên', 'Tương tác tích cực'], image: '/images/work-6.jpg' },
      },
};

export default servicesIntro;
