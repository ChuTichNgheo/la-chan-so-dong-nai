import { NextResponse } from 'next/server';
import { callGeminiJson, hasGeminiKeyConfigured } from '@/lib/gemini-client';

export type RoleplayScenarioId = 'job' | 'police' | 'friend';

interface ChatTurn {
  role: 'scammer' | 'user';
  text: string;
}

interface RoleplayEvaluation {
  awarenessScore: number;
  badge: string;
  strengths: string[];
  mistakes: string[];
  goldenTip: string;
}

interface RoleplayResponse {
  finished: boolean;
  scammerReply: string;
  suggestedReplies?: string[];
  evaluation?: RoleplayEvaluation;
  source: 'gemini' | 'fallback';
}

const SCENARIO_PROFILES: Record<
  RoleplayScenarioId,
  {
    name: string;
    persona: string;
    fallbackReplies: string[];
    turnSuggestions: string[][];
    goldenTip: string;
  }
> = {
  job: {
    name: 'Tuyển CTV việc nhẹ lương cao',
    persona:
      'Kẻ lừa đảo giả làm nhân sự tuyển CTV online Shopee/TikTok tại Đồng Nai, dụ nạp trước 200k mở nhiệm vụ hoàn tiền 250k và gửi link .xyz.',
    fallbackReplies: [
      'Ôi bạn yên tâm, cả trăm bạn học sinh ở Biên Hòa đang làm và rút tiền mỗi ngày rồi! Chỉ còn 2 suất cuối trong 5 phút nữa thôi, bạn bấm link đăng ký nhanh kẻo lỡ nhé!',
      'Đừng lo mất 200k đâu, công ty có giấy phép đàng hoàng mà. Bạn chỉ cần chụp màn hình chuyển khoản và đọc mã OTP xác nhận là hệ thống hoàn 250k liền tay!',
      'Thôi thấy bạn cảnh giác quá, mình rút lui vậy! Bạn đã vượt qua bẫy tâm lý lòng tham rất tốt.',
    ],
    turnSuggestions: [
      [
        'Tôi đã kiểm tra: đòi nạp tiền trước và thúc gấp trong 5 phút chính là bẫy lừa đảo!',
        'Cho mình xem mã số thuế công ty chính thức trước được không?',
        'Thôi mình chặn số và báo lên Radar Đồng Nai đây!',
      ],
      [
        'Tuyệt đối không bao giờ đọc mã OTP cho người lạ! Tôi dừng trao đổi tại đây.',
        'Để mình hỏi ba mẹ và kiểm tra trên Lá Chắn Số trước.',
        'Mình báo cáo tài khoản này lên Đội TNTN Đồng Nai ngay đây!',
      ],
    ],
    goldenTip:
      'Mọi công việc online đòi "nạp tiền trước để mở nhiệm vụ" hoặc gửi link đuôi lạ (.xyz, .top) đều là bẫy lừa đảo.',
  },
  police: {
    name: 'Giả danh Công an Biên Hòa',
    persona:
      'Kẻ lừa đảo giả danh cán bộ Công an TP. Biên Hòa hù dọa nạn nhân liên quan đường dây rửa tiền, ép giữ bí mật không nói người nhà và chuyển tiền vào tài khoản tạm giữ xác minh.',
    fallbackReplies: [
      'Đây là vụ án mật cấp tỉnh! Nếu anh/chị kể cho người nhà hoặc cúp máy là vi phạm tội cản trở điều tra, chúng tôi sẽ cử người xuống nhà bắt ngay lập tức. Hãy đọc số dư ngân hàng ngay!',
      'Cơ quan đang ghi âm cuộc gọi. Anh/chị chỉ cần chuyển tạm tiền để kiểm tra dòng tiền sạch, 30 phút sau kho bạc hoàn trả đủ 100%. Đừng để phải ra tòa!',
      'Đối tượng thấy bạn giữ bình tĩnh và đòi xác minh tại trụ sở nên đã vội tắt máy!',
    ],
    turnSuggestions: [
      [
        'Không có vụ án mật nào bắt giữ bí mật với người thân! Tôi sẽ ra thẳng Công an phường làm việc.',
        'Anh đọc họ tên, số hiệu và gửi giấy mời chính thức về địa phương đi!',
        'Tôi cúp máy và gọi trực tiếp 113 kiểm chứng ngay bây giờ!',
      ],
      [
        'Công an không bao giờ giữ tiền qua chuyển khoản. Tôi không chuyển một đồng nào!',
        'Tôi đã bật loa ngoài cho người thân nghe cùng và sẽ báo Công an phường.',
        'Chấm dứt cuộc gọi lừa đảo này ngay tại đây!',
      ],
    ],
    goldenTip:
      'Công an, Viện kiểm sát, Tòa án KHÔNG BAO GIỜ làm việc qua điện thoại hay yêu cầu chuyển tiền xác minh. Luôn cúp máy và gọi trực tiếp Công an phường hoặc 113.',
  },
  friend: {
    name: 'Giả bạn thân hack Zalo mượn tiền',
    persona:
      'Kẻ lừa đảo chiếm đoạt nick Zalo bạn thân, nhắn tin mượn gấp 3 triệu đồng và hối chuyển vào số tài khoản tên người lạ với lý do máy đang hỏng mic không nghe gọi được.',
    fallbackReplies: [
      'Điện thoại tớ loa bị rè với đang ngoài đường ồn lắm không gọi video được đâu! Đang cần trả tiền gấp để lấy xe, cậu chuyển luôn giúp tớ 3 triệu nhé, tin nhau mà!',
      'Trời ơi gấp lắm rồi chủ tiệm đang giục kìa! Cậu chuyển trước 2 triệu cũng được, đừng hỏi nhiều nữa chuyển ngay giúp tớ!',
      'Tài khoản giả mạo lập tức im lặng khi bạn kiên quyết đòi gọi video xác minh mặt thật!',
    ],
    turnSuggestions: [
      [
        'Không gọi video thấy mặt và trả lời câu mật khẩu gia đình thì tớ tuyệt đối không chuyển!',
        'Để tớ gọi trực tiếp vào số di động thật của cậu xem có đúng không nhé.',
        'Nick Zalo cậu bị hack rồi! Tớ báo cả nhóm bạn cẩn thận đây!',
      ],
      [
        'Càng giục gấp và né gọi điện càng chắc chắn là lừa đảo. Tôi chặn tài khoản này!',
        'Tớ đã gọi số di động thật của bạn tớ rồi, đừng đóng kịch nữa!',
        'Cúp máy và gửi cảnh báo lên Lá Chắn Số Đồng Nai ngay!',
      ],
    ],
    goldenTip:
      'Khi bạn bè/người thân nhắn mượn tiền qua Zalo/Facebook vào tài khoản mang tên người lạ, BẮT BUỘC gọi điện thoại trực tiếp bằng số di động hoặc gọi video xác nhận.',
  },
};

function isRefusalSentence(sentence: string): boolean {
  return /(không\s+(chuyển|nạp|bấm|tin|đọc|làm|tham gia|bao giờ|được|nhé|đâu)|từ chối|lừa đảo|bẫy|cúp máy|tắt máy|chặn|báo công an|113|bị hack|đừng đóng kịch)/i.test(
    sentence
  );
}

function evaluateConversationLocally(
  scenarioId: RoleplayScenarioId,
  messages: ChatTurn[]
): RoleplayEvaluation {
  const userMsgs = messages.filter((m) => m.role === 'user').map((m) => m.text.trim());
  const allUserText = userMsgs.join(' ').toLowerCase();

  let score = 72;
  const strengths: string[] = [];
  const mistakes: string[] = [];

  // Only flag compliance/risk in sentences that are NOT refusals!
  const nonRefusalMsgs = userMsgs.filter((m) => !isRefusalSentence(m));
  const nonRefusalText = nonRefusalMsgs.join(' ').toLowerCase();

  const agreedToTransfer =
    /(chuyển luôn|chuyển ngay|để (mình|tôi|tớ) chuyển|gửi stk của|đọc mã otp|otp là|mình nạp|tôi nạp|đã bấm link|chuyển trước \d)/i.test(
      nonRefusalText
    );
  const leakedDigits = /\b0\d{8,10}\b|\b\d{10,16}\b/.test(nonRefusalText);
  const hesitant =
    /(thật không|có thật không|làm sao để rút|hướng dẫn mình|giữ bí mật thật sao|chờ xíu)/i.test(
      nonRefusalText
    );

  const strongRefuse = userMsgs.some((m) => isRefusalSentence(m));
  const verifyAction =
    /(gọi video|gọi trực tiếp|số di động|ra (thẳng )?(trụ sở|công an)|công an phường|hỏi (người thân|ba mẹ)|mật khẩu|lá chắn số|giấy mời|113)/i.test(
      allUserText
    );
  const decisiveHangup = /(cúp máy|tắt máy|chặn|dừng trao đổi|chấm dứt)/i.test(allUserText);

  if (strongRefuse) {
    score += 18;
    strengths.push('Phản xạ dứt khoát từ chối yêu cầu chuyển tiền/nạp tiền và vạch trần dấu hiệu lừa đảo.');
  }
  if (verifyAction) {
    score += 10;
    strengths.push('Chủ động đòi xác minh độc lập (gọi video/số di động gốc, hỏi người thân hoặc ra Công an phường).');
  }
  if (decisiveHangup && !agreedToTransfer) {
    score += 6;
    strengths.push('Chủ động cắt đứt liên lạc sớm để không bị kẻ gian thao túng tâm lý thêm.');
  }

  if (agreedToTransfer) {
    score -= 48;
    mistakes.push('Có dấu hiệu đồng ý chuyển tiền, nạp tiền hoặc làm theo yêu cầu đường link/OTP của kẻ gian.');
  }
  if (leakedDigits) {
    score -= 22;
    mistakes.push('Không nên nhập số điện thoại, STK hay chuỗi số cá nhân gửi lại cho người lạ.');
  }
  if (hesitant && !strongRefuse) {
    score -= 14;
    mistakes.push('Còn trao đổi chần chừ với kẻ gian — càng nói chuyện lâu càng dễ bị dồn ép tâm lý.');
  }

  if (strengths.length === 0) {
    strengths.push('Đã đặt câu hỏi kiểm chứng thay vì chuyển tiền ngay ở lượt đầu tiên.');
  }
  if (mistakes.length === 0) {
    mistakes.push('Không phát hiện lỗi sơ hở nào — xử lý cực kỳ tỉnh táo và đúng nguyên tắc an toàn!');
  }

  const finalScore = Math.max(15, Math.min(98, score));
  const badge =
    finalScore >= 85
      ? 'Bậc Thầy Bắt Bài AI'
      : finalScore >= 65
      ? 'Lá Chắn Vững Vàng'
      : 'Cần Rèn Thêm Phản Xạ';

  return {
    awarenessScore: finalScore,
    badge,
    strengths: strengths.slice(0, 2),
    mistakes: mistakes.slice(0, 2),
    goldenTip: SCENARIO_PROFILES[scenarioId].goldenTip,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      scenarioId?: RoleplayScenarioId;
      messages?: ChatTurn[];
      finishNow?: boolean;
    };

    const scenarioId: RoleplayScenarioId =
      body.scenarioId === 'police' || body.scenarioId === 'friend' ? body.scenarioId : 'job';
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const userTurnCount = messages.filter((m) => m.role === 'user').length;
    const shouldFinish = Boolean(body.finishNow) || userTurnCount >= 3;
    const profile = SCENARIO_PROFILES[scenarioId];

    const fallbackEval = shouldFinish ? evaluateConversationLocally(scenarioId, messages) : undefined;
    const fallbackReply =
      profile.fallbackReplies[Math.min(Math.max(0, userTurnCount - 1), profile.fallbackReplies.length - 1)];
    const fallbackSuggestions =
      profile.turnSuggestions[Math.min(Math.max(0, userTurnCount - 1), profile.turnSuggestions.length - 1)];

    if (!hasGeminiKeyConfigured()) {
      return NextResponse.json<RoleplayResponse>({
        finished: shouldFinish,
        scammerReply: fallbackReply,
        suggestedReplies: shouldFinish ? undefined : fallbackSuggestions,
        evaluation: fallbackEval,
        source: 'fallback',
      });
    }

    const transcript = messages
      .map((m) => `${m.role === 'scammer' ? 'Kẻ lừa đảo' : 'Người chơi'}: ${m.text}`)
      .join('\n');

    const prompt = shouldFinish
      ? `Bạn là huấn luyện viên Cún AI chấm điểm trong trò chơi phòng chống lừa đảo Lá Chắn Số Đồng Nai.
Kịch bản: ${profile.name} (${profile.persona}).
Cuộc đối thoại vừa diễn ra:
${transcript}

QUAN TRỌNG KHI CHẤM ĐIỂM:
- Nếu Người chơi dứt khoát từ chối, nhận ra dấu hiệu lừa đảo, đòi xác minh độc lập hoặc cúp máy/chặn sớm → BẮT BUỘC cho điểm cao 85–98 ("Bậc Thầy Bắt Bài AI"), KHÔNG ĐƯỢC trừ điểm khi từ khóa "nạp tiền/link/chuyển tiền" xuất hiện trong câu từ chối!
- Chỉ trừ điểm nặng nếu Người chơi thực sự đồng ý chuyển tiền, nạp tiền, bấm link hoặc lộ thông tin/OTP.

Trả về JSON hợp lệ theo schema:
{"scammerReply":"1 câu kết thúc tình huống (kẻ lừa đảo bỏ chạy/tắt máy nếu người chơi tỉnh táo)","evaluation":{"awarenessScore":0-100,"badge":"Bậc Thầy Bắt Bài AI | Lá Chắn Vững Vàng | Cần Rèn Thêm Phản Xạ","strengths":["tối đa 2 điểm làm tốt cụ thể"],"mistakes":["tối đa 2 lỗi sơ hở nếu có, hoặc lời khen ngắn nếu không có lỗi"],"goldenTip":"1 bài học ngắn gọn đáng nhớ nhất"}}`
      : `Bạn đang nhập vai nhân vật mô phỏng giáo dục trong trò chơi nhận diện lừa đảo (Lá Chắn Số Đồng Nai).
Vai diễn: ${profile.persona}.
Cuộc hội thoại đến hiện tại (đang ở lượt ${userTurnCount}/3):
${transcript}

Hãy phản hồi lại câu mới nhất của Người chơi trong 1–2 câu tiếng Việt tự nhiên, đánh vào tâm lý để thử thách phản xạ của người chơi, ĐỒNG THỜI đề xuất 3 câu trả lời gợi ý mới sát với câu bạn vừa nói (1 câu phản bác sắc bén, 1 câu hỏi xác minh, 1 câu hơi chần chừ).
Trả về JSON: {"scammerReply":"câu đáp lại ngắn gọn","suggestedReplies":["gợi ý 1","gợi ý 2","gợi ý 3"]}`;

    const aiRes = await callGeminiJson<Partial<RoleplayResponse>>({
      parts: [{ text: prompt }],
      temperature: 0.35,
      timeoutMs: 9500,
    });

    if (!aiRes) {
      return NextResponse.json<RoleplayResponse>({
        finished: shouldFinish,
        scammerReply: fallbackReply,
        suggestedReplies: shouldFinish ? undefined : fallbackSuggestions,
        evaluation: fallbackEval,
        source: 'fallback',
      });
    }

    const parsed = aiRes.data;
    const scammerReply = parsed.scammerReply?.trim() || fallbackReply;

    if (!shouldFinish) {
      const dynamicReplies =
        Array.isArray(parsed.suggestedReplies) && parsed.suggestedReplies.length >= 2
          ? parsed.suggestedReplies.slice(0, 3).map((s) => String(s).trim()).filter(Boolean)
          : fallbackSuggestions;
      return NextResponse.json<RoleplayResponse>({
        finished: false,
        scammerReply,
        suggestedReplies: dynamicReplies,
        source: 'gemini',
      });
    }

    const ev = parsed.evaluation;
    const evaluation: RoleplayEvaluation =
      ev && typeof ev.awarenessScore === 'number'
        ? {
            awarenessScore: Math.max(0, Math.min(100, Math.round(ev.awarenessScore))),
            badge: ev.badge || fallbackEval?.badge || 'Lá Chắn Vững Vàng',
            strengths:
              Array.isArray(ev.strengths) && ev.strengths.length > 0
                ? ev.strengths.slice(0, 2)
                : fallbackEval?.strengths ?? [],
            mistakes:
              Array.isArray(ev.mistakes) && ev.mistakes.length > 0
                ? ev.mistakes.slice(0, 2)
                : fallbackEval?.mistakes ?? [],
            goldenTip: ev.goldenTip || profile.goldenTip,
          }
        : fallbackEval!;

    return NextResponse.json<RoleplayResponse>({
      finished: true,
      scammerReply,
      evaluation,
      source: 'gemini',
    });
  } catch {
    return NextResponse.json<RoleplayResponse>({
      finished: true,
      scammerReply: 'Phiên đấu trí tạm kết thúc do gián đoạn mạng.',
      evaluation: {
        awarenessScore: 80,
        badge: 'Lá Chắn Vững Vàng',
        strengths: ['Đã chủ động kiểm tra và không vội vàng chuyển tiền.'],
        mistakes: ['Hãy luôn gọi xác minh qua kênh độc lập trước mọi giao dịch tiền bạc.'],
        goldenTip: 'Chậm lại 10 giây — Không chuyển tiền gấp — Hỏi người thân ngay!',
      },
      source: 'fallback',
    });
  }
}
