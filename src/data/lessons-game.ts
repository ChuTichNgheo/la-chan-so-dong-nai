export interface QuizQuestion {
  id: number;
  role: string;
  sender: string;
  message: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

export interface MicroLesson {
  id: number;
  title: string;
  summary: string;
}

export const GAME_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    role: 'Học sinh THPT',
    sender: 'Tuyển Dụng Online (Số lạ)',
    message:
      'Tuyển CTV đặt đơn Shopee tại nhà 300k/ngày, bấm link http://ctv-shopee-nhanh.xyz và nạp trước 200k mở nhiệm vụ!',
    options: [
      { text: 'Chuyển thử 200k xem sao', isCorrect: false },
      { text: 'Chặn ngay — Việc làm đòi nạp tiền và link .xyz là lừa đảo', isCorrect: true },
      { text: 'Điền CCCD vào link để thử', isCorrect: false },
    ],
    explanation: 'Kẻ gian dùng tên miền giả (.xyz) và dụ nạp tiền làm nhiệm vụ trước để chiếm đoạt.',
  },
  {
    id: 2,
    role: 'Người cao tuổi (65+)',
    sender: 'Số lạ +84 909 XXX 888',
    message:
      'Tôi là Công an Biên Hòa. CCCD bác liên quan rửa tiền, KHÔNG nói với ai và chuyển 50 triệu xác minh ngay!',
    options: [
      { text: 'Cúp máy ngay và bấm Hỏi người thân', isCorrect: true },
      { text: 'Giữ bí mật theo lời đối tượng', isCorrect: false },
      { text: 'Đọc mã OTP cho họ kiểm tra', isCorrect: false },
    ],
    explanation: 'Công an KHÔNG làm việc hay yêu cầu chuyển tiền qua điện thoại.',
  },
];

export const MICRO_LESSONS: MicroLesson[] = [
  {
    id: 1,
    title: 'Nguyên tắc 3 KHÔNG khi nghe cuộc gọi lạ',
    summary: 'Không chuyển tiền, không đọc mã OTP, không bấm link/cài tệp .apk ngoài kho ứng dụng.',
  },
  {
    id: 2,
    title: 'Phanh khẩn cấp 10 giây với người thân',
    summary: 'Khi bị hù dọa khởi tố hoặc báo tin tai nạn gấp, hít thở 5 giây và gọi thẳng cho con cháu.',
  },
];
