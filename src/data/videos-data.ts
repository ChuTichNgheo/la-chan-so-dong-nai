export interface VideoScenario {
  id: number;
  group: 'senior' | 'student';
  src: string;
  duration: string;
  trend: string;
  title: string;
  caption: string;
}

export const VIDEOS_DATA: VideoScenario[] = [
  {
    id: 1,
    group: 'student',
    src: '/videos/video1_thue_tai_khoan.mp4',
    duration: '01:00',
    trend: 'VIDEO THẬT • Cảnh báo nóng',
    title: '1. Cảnh báo mở và cho thuê/mượn tài khoản ngân hàng',
    caption: 'Mở rồi cho thuê, bán hoặc cho mượn tài khoản ngân hàng là tiếp tay cho lừa đảo rửa tiền!',
  },
  {
    id: 2,
    group: 'student',
    src: '/videos/video2_tu_che_phao.mp4',
    duration: '01:00',
    trend: 'VIDEO THẬT • An toàn học đường',
    title: '2. Kỹ năng số HS: Cảnh báo tin/video dụ tự chế pháo cận Tết',
    caption: 'Tuyệt đối không làm theo video hướng dẫn chế pháo và không mua hóa chất qua link lạ!',
  },
  {
    id: 3,
    group: 'senior',
    src: '',
    duration: '00:55',
    trend: 'Đang rộ • 34 báo cáo',
    title: '3. Giả danh Công an yêu cầu chuyển tiền xác minh',
    caption: 'Công an KHÔNG BAO GIỜ gọi điện yêu cầu chuyển tiền vào tài khoản tạm giữ!',
  },
];
