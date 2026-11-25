export interface QuizQuestion {
  id: number;
  role: string;
  sender: string;
  message: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

export const GAME_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    role: 'Tình huống Học sinh THPT',
    sender: 'Tuyển Dụng Online (Số lạ)',
    message:
      'Em ơi bên chị tuyển CTV đặt đơn Shopee tại nhà, việc nhẹ lương cao 300k/ngày. Bấm link http://ctv-shopee-nhanh.xyz và nạp trước 200k mở nhiệm vụ là nhận hoa hồng ngay nhé!',
    options: [
      { text: 'Chuyển thử 200k xem có thật không rồi rút về', isCorrect: false },
      { text: 'Chặn ngay — Mọi việc làm đòi nạp tiền trước và dùng link đuôi .xyz đều là lừa đảo', isCorrect: true },
      { text: 'Bấm vào link điền số CCCD để đăng ký thử', isCorrect: false },
    ],
    explanation:
      'Đây là kịch bản "Tuyển CTV việc nhẹ lương cao" phổ biến nhất nhắm vào học sinh THPT. Kẻ gian dùng tên miền giả (.xyz) và dụ nạp tiền làm nhiệm vụ để chiếm đoạt.',
  },
  {
    id: 2,
    role: 'Tình huống Người cao tuổi (65+)',
    sender: 'Cuộc gọi lạ: +84 909 XXX 888',
    message:
      'Alo, tôi là cán bộ Công an TP. Biên Hòa. Số CCCD của bác liên quan đến đường dây rửa tiền. Yêu cầu bác KHÔNG nói với ai và chuyển 50 triệu vào tài khoản tạm giữ để xác minh ngay hôm nay!',
    options: [
      { text: 'Cúp máy ngay lập tức và bấm nút vàng "Hỏi người thân" để báo cho con cháu', isCorrect: true },
      { text: 'Làm theo yêu cầu giữ bí mật vì sợ bị bắt', isCorrect: false },
      { text: 'Đọc số tài khoản và mã OTP cho họ kiểm tra cho nhanh', isCorrect: false },
    ],
    explanation:
      'Cơ quan Công an KHÔNG BAO GIỜ yêu cầu công dân chuyển tiền qua điện thoại hay bắt giữ bí mật với gia đình. Chiêu "cô lập nạn nhân" là dấu hiệu 100% lừa đảo.',
  },
  {
    id: 3,
    role: 'Kiểm tra đường dẫn (35% báo cáo)',
    sender: 'Tin nhắn SMS: NganHang-TB',
    message:
      'Tài khoản của quý khách sẽ bị khóa sau 2 giờ do chưa cập nhật sinh trắc học. Vui lòng truy cập https://vietcombank-xacminh.top để giữ tài khoản.',
    options: [
      { text: 'Bấm vào đường link ngay để khỏi bị khóa tài khoản', isCorrect: false },
      { text: 'Không bấm link vì đuôi .top là giả mạo; mở thẳng app ngân hàng chính chủ để kiểm tra', isCorrect: true },
      { text: 'Chuyển tiếp link này cho nhóm gia đình bấm cùng', isCorrect: false },
    ],
    explanation:
      'Đường dẫn giả mạo chiếm tới 35% báo cáo tại Đồng Nai. Ngân hàng Việt Nam dùng tên miền chính thức (.com.vn / .vn), không dùng đuôi .top hay .xyz.',
  },
  {
    id: 4,
    role: 'Tình huống Gia đình khẩn cấp',
    sender: 'Số lạ xưng "Bác sĩ cấp cứu"',
    message:
      'Chú ơi con trai chú vừa bị tai nạn giao thông đang vào phòng mổ gấp, chú chuyển ngay 30 triệu vào số tài khoản cá nhân Nguyễn Văn X để bệnh viện mua dụng cụ mổ ngay!',
    options: [
      { text: 'Chuyển tiền ngay lập tức vì quá lo lắng', isCorrect: false },
      { text: 'Giữ bình tĩnh 5 giây, gọi trực tiếp vào số điện thoại thật của con hoặc người nhà để xác minh', isCorrect: true },
      { text: 'Hỏi thêm họ số CCCD rồi mới chuyển', isCorrect: false },
    ],
    explanation:
      'Kẻ gian đánh mạnh vào sự hoảng loạn của phụ huynh và người cao tuổi. Chỉ cần 1 cuộc gọi kiểm chứng với con cháu hoặc trường học là lật tẩy ngay.',
  },
  {
    id: 5,
    role: 'Tình huống Số lạ chưa có dữ liệu',
    sender: 'Kết quả tra cứu Lá Chắn Số',
    message:
      'Bạn vừa tra cứu một số điện thoại lạ rủ đầu tư chứng khoán lãi 20%/tuần. Hệ thống báo: "Chưa ghi nhận báo cáo trong cơ sở dữ liệu". Bạn nên hiểu thế nào?',
    options: [
      { text: 'Chắc chắn 100% an toàn, có thể chuyển tiền đầu tư', isCorrect: false },
      { text: 'Vẫn phải cảnh giác cao vì kẻ gian có thể dùng SIM rác mới; cam kết lãi 20%/tuần là lừa đảo', isCorrect: true },
      { text: 'Tắt hết cảnh báo và lưu số này là người tin cậy', isCorrect: false },
    ],
    explanation:
      '"Chưa có báo cáo" KHÔNG đồng nghĩa an toàn 100% — kẻ gian liên tục đổi SIM rác mới. Luôn kết hợp phân tích nội dung và giữ tỉnh táo.',
  },
];
