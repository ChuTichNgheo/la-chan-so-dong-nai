export interface VideoScenario {
  id: number;
  group: 'senior' | 'student';
  src: string;
  duration: string;
  trend: string;
  title: string;
  caption: string;
  stepTrick: string;
  stepSign: string;
  stepAction: string;
  audioKey: 'danger' | 'warn' | 'intro';
}

export const LESSONS_DATA: VideoScenario[] = [
  {
    id: 1,
    group: 'student',
    src: '/videos/video1_thue_tai_khoan.mp4',
    duration: 'Tóm tắt 01:00 • Gốc 02:38',
    trend: 'VIDEO THẬT • Cảnh báo nóng',
    title: '1. Cảnh báo mở và cho thuê/mượn tài khoản ngân hàng',
    caption:
      '"Mở rồi cho thuê, bán hoặc cho mượn tài khoản ngân hàng là tiếp tay cho đường dây lừa đảo rửa tiền — có thể bị xử lý hình sự!"',
    stepTrick: 'Dụ học sinh, sinh viên, công nhân mở tài khoản ngân hàng rồi mua/thuê lại giá 500k–2 triệu.',
    stepSign: 'Kẻ gian dùng tài khoản chính chủ của bạn nhận tiền lừa đảo; chủ tài khoản chịu trách nhiệm pháp lý.',
    stepAction: 'Tuyệt đối KHÔNG mở hộ, bán hay cho mượn thẻ/tài khoản ngân hàng & mã OTP.',
    audioKey: 'warn',
  },
  {
    id: 2,
    group: 'student',
    src: '/videos/video2_tu_che_phao.mp4',
    duration: 'Tóm tắt 01:00 • Gốc 02:17',
    trend: 'VIDEO THẬT • An toàn học đường',
    title: '2. Kỹ năng số HS: Cảnh báo tin/video dụ tự chế pháo cận Tết',
    caption:
      '"Tuyệt đối không làm theo video hướng dẫn chế pháo trên mạng xã hội và không đặt mua hóa chất qua link lạ!"',
    stepTrick: 'Các hội nhóm & video ngắn câu kéo học sinh mua nguyên liệu, học chế pháo nổ dịp cận Tết.',
    stepSign: 'Nguy cơ cháy nổ, thương tích nặng suốt đời và vi phạm pháp luật.',
    stepAction: 'Báo cáo video độc hại, không chia sẻ lại và báo ngay cho thầy cô/phụ huynh.',
    audioKey: 'warn',
  },
  {
    id: 3,
    group: 'senior',
    src: '',
    duration: '00:55 / 01:00',
    trend: 'Đang rộ • 34 báo cáo',
    title: '3. Giả danh Công an yêu cầu chuyển tiền xác minh',
    caption:
      '"Công an KHÔNG BAO GIỜ gọi điện yêu cầu chuyển tiền vào tài khoản tạm giữ. Nghe câu này là CÚP MÁY NGAY!"',
    stepTrick: 'Hù dọa liên quan vụ án rửa tiền, yêu cầu giữ bí mật không nói với con cháu.',
    stepSign: 'Gọi video mặc sắc phục mờ, gửi lệnh bắt qua Zalo, đòi chuyển tiền chứng minh trong sạch.',
    stepAction: 'Cúp máy tức thì → Bấm nút vàng Hỏi người thân trên Lá Chắn Số.',
    audioKey: 'danger',
  },
  {
    id: 4,
    group: 'student',
    src: '',
    duration: '00:50 / 01:00',
    trend: 'Rộ mạnh • 35% link giả',
    title: '4. Đường dẫn nhận quà tri ân, hoàn tiền giả mạo',
    caption: '"Không có món quà miễn phí nào đòi nhập mật khẩu ngân hàng và mã OTP cả!"',
    stepTrick: 'Nhắn tin trúng thưởng điện thoại / quà tri ân kèm link rút gọn hoặc tên miền lạ.',
    stepSign: 'Tên miền sai chính tả (.xyz, .top), yêu cầu đăng nhập tài khoản ngân hàng.',
    stepAction: 'Không bấm link → Dán link vào ô Kiểm tra nhanh (M01).',
    audioKey: 'warn',
  },
  {
    id: 5,
    group: 'student',
    src: '',
    duration: '00:58 / 01:00',
    trend: 'Nhắm vào HS THPT • 26 báo cáo',
    title: '5. Tuyển cộng tác viên đặt đơn "việc nhẹ lương cao"',
    caption: '"Nhiệm vụ đầu trả 50k để tạo lòng tin, nhiệm vụ sau đòi nạp tiền triệu rồi khóa nhóm!"',
    stepTrick: 'Mời làm CTV like video / tăng tương tác sàn TMĐT kiếm 300k–500k mỗi ngày.',
    stepSign: 'Yêu cầu nạp tiền trước để nâng cấp nhiệm vụ hoặc đóng phí rút hoa hồng.',
    stepAction: 'Thoát nhóm ngay, không chuyển thêm tiền để "gỡ vốn".',
    audioKey: 'warn',
  },
  {
    id: 6,
    group: 'senior',
    src: '',
    duration: '00:48 / 01:00',
    trend: 'Đánh vào tâm lý gia đình',
    title: '6. Báo tin người thân gặp tai nạn cần tiền cấp cứu gấp',
    caption: '"Bình tĩnh hít thở 5 giây — gọi thẳng vào số thật của con cháu trước khi chuyển 1 đồng!"',
    stepTrick: 'Giả bác sĩ/giáo viên gọi báo con cháu bị tai nạn đang mổ gấp, cần chuyển tạm ứng.',
    stepSign: 'Tạo tiếng ồn bệnh viện, thúc giục chuyển vào STK cá nhân không rõ tên.',
    stepAction: 'Bấm nút "Hỏi người thân" để xác minh trực tiếp với gia đình.',
    audioKey: 'danger',
  },
  {
    id: 7,
    group: 'senior',
    src: '',
    duration: '00:52 / 01:00',
    trend: 'Mới tại Đồng Nai',
    title: '7. Giả nhân viên Điện lực / Cấp nước dọa cắt điện',
    caption: '"Gửi link tải app cập nhật hóa đơn điện (.apk) là chiêu chiếm quyền điều khiển điện thoại!"',
    stepTrick: 'Gọi báo nợ tiền điện tháng này, 2 giờ nữa cắt điện nếu không tải app đóng phí.',
    stepSign: 'Gửi file cài đặt ngoài CH Play/App Store và đòi cấp quyền Trợ năng.',
    stepAction: 'Tra cứu hóa đơn qua ứng dụng chính thức hoặc gọi tổng đài CSKH.',
    audioKey: 'warn',
  },
  {
    id: 8,
    group: 'senior',
    src: '',
    duration: '00:55 / 01:00',
    trend: 'Mạo danh ngân hàng',
    title: '8. Giả nhân viên ngân hàng hỗ trợ cập nhật sinh trắc học',
    caption: '"Ngân hàng không gọi Zalo hướng dẫn cài app lạ hay hỏi mã OTP!"',
    stepTrick: 'Hù dọa tài khoản sắp bị khóa vì chưa cập nhật sinh trắc học, mời gọi video hỗ trợ.',
    stepSign: 'Gửi đường link giả website ngân hàng, yêu cầu chụp 2 mặt CCCD & đọc OTP.',
    stepAction: 'Ra trực tiếp quầy ngân hàng hoặc tự cập nhật trong app ngân hàng chính chủ.',
    audioKey: 'warn',
  },
  {
    id: 9,
    group: 'student',
    src: '',
    duration: '00:50 / 01:00',
    trend: 'Deepfake AI mới',
    title: '9. Gọi video Deepfake giả mặt, giả giọng người quen vay tiền',
    caption: '"Cuộc gọi video chỉ dài 3 giây, hình mờ giật rồi cúp máy nhắn mượn tiền — 99% là Deepfake!"',
    stepTrick: 'Chiếm tài khoản Facebook/Zalo người quen, ghép mặt AI gọi chớp nhoáng.',
    stepSign: 'STK nhận tiền mang tên người lạ, lý do mượn tiền cực gấp.',
    stepAction: 'Gọi lại bằng số điện thoại di động thông thường để xác nhận.',
    audioKey: 'danger',
  },
  {
    id: 10,
    group: 'senior',
    src: '',
    duration: '00:46 / 01:00',
    trend: 'Giả mạo định danh số',
    title: '10. Giả danh cập nhật định danh VNeID mức 2 qua điện thoại',
    caption: '"Cập nhật VNeID chỉ làm tại Công an xã/phường hoặc app VNeID chính chủ trên kho ứng dụng!"',
    stepTrick: 'Tự xưng cán bộ phường gọi hướng dẫn tích hợp BHYT/giấy phép lái xe từ xa.',
    stepSign: 'Gửi đường link có chữ vneid nhưng đuôi lạ để cài mã độc.',
    stepAction: 'Liên hệ trực tiếp Công an xã/phường hoặc Đội Thanh niên tình nguyện hỗ trợ.',
    audioKey: 'warn',
  },
];

export const VIDEOS_DATA: VideoScenario[] = LESSONS_DATA.filter((item) => Boolean(item.src));
