import { NextResponse } from 'next/server';

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
  evaluation?: RoleplayEvaluation;
  source: 'gemini' | 'fallback';
}

const SCENARIO_PROFILES: Record<
  RoleplayScenarioId,
  {
    name: string;
    persona: string;
    opening: string;
    fallbackReplies: string[];
    goldenTip: string;
  }
> = {
  job: {
    name: 'Tuyển CTV việc nhẹ lương cao',
    persona:
      'Kẻ lừa đảo giả làm nhân sự tuyển CTV online Shopee/TikTok tại Đồng Nai, dụ nạp trước 200k mở nhiệm vụ hoàn tiền 250k và gửi link .xyz.',
    opening:
      'Chào bạn! Bên mình tuyển CTV bấm tim video tại nhà 300k–500k/ngày cho học sinh, sinh viên Đồng Nai. Nhiệm vụ đầu chỉ cần nạp 200k kích hoạt tài khoản ở http://nhiemvu-ctv-dn.xyz, 3 phút sau hoàn lại 250k ngay. Bạn gửi STK để mình lên đơn nhé?',
    fallbackReplies: [
      'Ôi bạn yên tâm, cả trăm bạn học sinh ở Biên Hòa đang làm và rút tiền mỗi ngày rồi! Chỉ còn 2 suất cuối trong 5 phút nữa thôi, bạn bấm link đăng ký nhanh kẻo lỡ nhé!',
      'Đừng lo mất 200k đâu, công ty có giấy phép đàng hoàng mà. Bạn chỉ cần chụp màn hình chuyển khoản và đọc mã OTP xác nhận là hệ thống hoàn 250k liền tay!',
      'Thôi thấy bạn cảnh giác quá, mình rút lui vậy! Bạn đã vượt qua bẫy tâm lý lòng tham rất tốt.',
    ],
    goldenTip:
      'Mọi công việc online đòi "nạp tiền trước để mở nhiệm vụ" hoặc gửi link đuôi lạ (.xyz, .top) đều là bẫy lừa đảo.',
  },
  police: {
    name: 'Giả danh Công an Biên Hòa',
    persona:
      'Kẻ lừa đảo giả danh cán bộ Công an TP. Biên Hòa hù dọa nạn nhân liên quan đường dây rửa tiền, ép giữ bí mật không nói người nhà và chuyển tiền vào tài khoản tạm giữ xác minh.',
    opening:
      'Tôi là cán bộ điều tra Công an Biên Hòa. CCCD của anh/chị đang liên quan vụ án rửa tiền 2 tỷ đồng. Yêu cầu giữ bí mật tuyệt đối, không báo người thân và chuyển ngay số dư vào tài khoản tạm giữ để xác minh trong hôm nay nếu không sẽ có lệnh bắt!',
    fallbackReplies: [
      'Đây là vụ án mật cấp tỉnh! Nếu anh/chị kể cho người nhà hoặc cúp máy là vi phạm tội cản trở điều tra, chúng tôi sẽ cử người xuống nhà bắt ngay lập tức. Hãy đọc số dư ngân hàng ngay!',
      'Cơ quan đang ghi âm cuộc gọi. Anh/chị chỉ cần chuyển tạm tiền để kiểm tra dòng tiền sạch, 30 phút sau kho bạc hoàn trả đủ 100%. Đừng để phải ra tòa!',
      'Đối tượng thấy bạn giữ bình tĩnh và đòi xác minh tại trụ sở nên đã vội tắt máy!',
    ],
    goldenTip:
      'Công an, Viện kiểm sát, Tòa án KHÔNG BAO GIỜ làm việc qua điện thoại hay yêu cầu chuyển tiền xác minh. Luôn cúp máy và gọi trực tiếp Công an phường hoặc 113.',
  },
  friend: {
    name: 'Giả bạn thân hack Zalo mượn tiền',
    persona:
      'Kẻ lừa đảo chiếm đoạt nick Zalo bạn thân, nhắn tin mượn gấp 3 triệu đồng và hối chuyển vào số tài khoản tên người lạ với lý do máy đang hỏng mic không nghe gọi được.',
    opening:
      'Ê cậu ơi cứu tớ gấp với! Xe tớ vừa bị hư giữa đường ở Quốc lộ 1A, app ngân hàng lại lỗi. Cậu chuyển gấp giúp tớ 3 triệu vào STK 109800006621 (chủ TK Nguyễn Văn Lạ — tiệm sửa xe) trước nhé, tối về tớ gửi lại liền!',
    fallbackReplies: [
      'Điện thoại tớ loa bị rè với đang ngoài đường ồn lắm không gọi video được đâu! Đang cần trả tiền gấp để lấy xe, cậu chuyển luôn giúp tớ 3 triệu nhé, tin nhau mà!',
      'Trời ơi gấp lắm rồi chủ tiệm đang giục kìa! Cậu chuyển trước 2 triệu cũng được, đừng hỏi nhiều nữa chuyển ngay giúp tớ!',
      'Tài khoản giả mạo lập tức im lặng khi bạn kiên quyết đòi gọi video xác minh mặt thật!',
    ],
    goldenTip:
      'Khi bạn bè/người thân nhắn mượn tiền qua Zalo/Facebook vào tài khoản mang tên người lạ, BẮT BUỘC gọi điện thoại trực tiếp bằng số di động hoặc gọi video xác nhận.',
  },
};

function evaluateConversationLocally(
  scenarioId: RoleplayScenarioId,
  messages: ChatTurn[]
): RoleplayEvaluation {
  const userMsgs = messages.filter((m) => m.role === 'user').map((m) => m.text.toLowerCase());
  const allUserText = userMsgs.join(' ');

  let score = 68;
  const strengths: string[] = [];
  const mistakes: string[] = [];

  const riskyGiveMoney = /(chuyển luôn|chuyển ngay|để mình chuyển|gửi stk|số tài khoản của tôi|mã otp|otp là|nạp 200|nạp tiền|bấm link|đã bấm)/i.test(
    allUserText
  );
  const leakedDigits = /\b0\d{8,10}\b|\b\d{10,16}\b/.test(allUserText);
  const hesitant = /(chuyển trước|có thật không|hướng dẫn mình|làm sao để nạp|để tôi xem thử)/i.test(
    allUserText
  );

  const strongRefuse = /(không chuyển|từ chối|lừa đảo|cúp máy|tắt máy|chặn|báo công an|113|không nạp|không bấm)/i.test(
    allUserText
  );
  const verifyAction = /(gọi video|gọi trực tiếp|ra trụ sở|công an phường|hỏi người thân|hỏi ba mẹ|gọi xác minh|giấy mời)/i.test(
    allUserText
  );

  if (strongRefuse) {
    score += 20;
    strengths.push('Phản xạ dứt khoát từ chối yêu cầu chuyển tiền/nạp tiền và nhận diện đúng dấu hiệu lừa đảo.');
  }
  if (verifyAction) {
    score += 14;
    strengths.push('Biết chủ động đề nghị xác minh qua kênh độc lập (gọi video, ra trụ sở hoặc hỏi người thân).');
  }
  if (riskyGiveMoney) {
    score -= 42;
    mistakes.push('Có dấu hiệu đồng ý chuyển tiền, nạp tiền hoặc làm theo yêu cầu đường link/OTP của kẻ gian.');
  }
  if (leakedDigits) {
    score -= 22;
    mistakes.push('Không nên gõ số điện thoại, STK hay chuỗi số nhạy cảm gửi lại cho người lạ trong cuộc trò chuyện.');
  }
  if (hesitant && !strongRefuse) {
    score -= 12;
    mistakes.push('Còn trao đổi thăm dò quá lâu, dễ bị kẻ gian khai thác tâm lý và dẫn dụ tiếp.');
  }

  if (strengths.length === 0) {
    strengths.push('Đã chủ động đặt câu hỏi thay vì chuyển tiền ngay lập tức ở lượt đầu tiên.');
  }
  if (mistakes.length === 0) {
    mistakes.push('Không phát hiện sơ hở đáng kể — hãy duy trì nguyên tắc "Chậm lại 10 giây & xác minh độc lập".');
  }

  const finalScore = Math.max(15, Math.min(99, score));
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json<RoleplayResponse>({
        finished: shouldFinish,
        scammerReply: fallbackReply,
        evaluation: fallbackEval,
        source: 'fallback',
      });
    }

    const transcript = messages
      .map((m) => `${m.role === 'scammer' ? 'Kẻ lừa đảo' : 'Người chơi'}: ${m.text}`)
      .join('\n');

    const prompt = shouldFinish
      ? `Bạn là hệ thống mô phỏng giáo dục phòng chống lừa đảo Lá Chắn Số Đồng Nai.
Kịch bản: ${profile.name} (${profile.persona}).
Cuộc đối thoại vừa diễn ra:
${transcript}

Hãy kết thúc màn đấu trí và chấm điểm Độ Tỉnh Táo cho Người chơi.
Trả về JSON hợp lệ theo schema:
{"scammerReply":"1 câu kết thúc tình huống (kẻ lừa đảo bỏ chạy/tắt máy nếu người chơi tỉnh táo, hoặc cảnh báo nếu người chơi sập bẫy)","evaluation":{"awarenessScore":0-100,"badge":"Bậc Thầy Bắt Bài AI | Lá Chắn Vững Vàng | Cần Rèn Thêm Phản Xạ","strengths":["tối đa 2 điểm làm tốt cụ thể theo câu người chơi vừa nhắn"],"mistakes":["tối đa 2 lỗi sơ hở nếu có, hoặc lời khen ngắn nếu không có lỗi"],"goldenTip":"1 bài học ngắn gọn đáng nhớ nhất"}}`
      : `Bạn đang nhập vai nhân vật mô phỏng giáo dục trong trò chơi nhận diện lừa đảo (Lá Chắn Số Đồng Nai).
Vai diễn: ${profile.persona}.
Cuộc hội thoại đến hiện tại (đang ở lượt ${userTurnCount}/3):
${transcript}

Hãy phản hồi lại câu mới nhất của Người chơi trong 1–2 câu tiếng Việt tự nhiên, đánh vào tâm lý (hối gấp, hứa thưởng, hoặc né tránh gọi video) để thử thách phản xạ của người chơi. Không dùng từ ngữ thô tục hay hướng dẫn phạm tội thật.
Trả về JSON: {"scammerReply":"câu đáp lại ngắn gọn của nhân vật mô phỏng"}`;

    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.45 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json<RoleplayResponse>({
        finished: shouldFinish,
        scammerReply: fallbackReply,
        evaluation: fallbackEval,
        source: 'fallback',
      });
    }

    const payload = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return NextResponse.json<RoleplayResponse>({
        finished: shouldFinish,
        scammerReply: fallbackReply,
        evaluation: fallbackEval,
        source: 'fallback',
      });
    }

    const parsed = JSON.parse(raw) as Partial<RoleplayResponse>;
    const scammerReply = parsed.scammerReply?.trim() || fallbackReply;

    if (!shouldFinish) {
      return NextResponse.json<RoleplayResponse>({
        finished: false,
        scammerReply,
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
        awarenessScore: 75,
        badge: 'Lá Chắn Vững Vàng',
        strengths: ['Đã chủ động kiểm tra và không vội vàng chuyển tiền.'],
        mistakes: ['Hãy luôn gọi xác minh qua kênh độc lập trước mọi giao dịch tiền bạc.'],
        goldenTip: 'Chậm lại 10 giây — Không chuyển tiền gấp — Hỏi người thân ngay!',
      },
      source: 'fallback',
    });
  }
}
