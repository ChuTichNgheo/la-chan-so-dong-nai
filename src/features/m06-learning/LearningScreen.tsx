'use client';

import { useState } from 'react';
import { GAME_QUESTIONS, MICRO_LESSONS } from '@/data/lessons-game';

export function LearningScreen() {
  const [tab, setTab] = useState<'game' | 'lessons'>('game');
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const q = GAME_QUESTIONS[qIndex];

  return (
    <section className="space-y-3" data-screen="M06">
      <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
        Học tập &amp; Mini Game Bắt Bài
      </h1>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#CBE4DC] bg-white p-1">
        <button
          type="button"
          onClick={() => setTab('game')}
          data-screen="M06"
          data-ui="tab-game"
          className={`rounded-lg py-2 text-xs font-bold ${
            tab === 'game' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Mini Game ({score}đ)
        </button>
        <button
          type="button"
          onClick={() => setTab('lessons')}
          data-screen="M06"
          data-ui="tab-lessons"
          className={`rounded-lg py-2 text-xs font-bold ${
            tab === 'lessons' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Bài học 1 phút
        </button>
      </div>

      {tab === 'game' ? (
        <div className="space-y-2.5 rounded-2xl border border-[#CBE4DC] bg-white p-4">
          <div className="text-xs font-bold text-[#0D685E]">
            {q.role} • {q.sender}
          </div>
          <p className="rounded-xl bg-[#F4FBF8] p-3 text-sm">{q.message}</p>
          <div className="space-y-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (opt.isCorrect) setScore((s) => s + 100);
                  setFeedback(opt.isCorrect ? `Chính xác! ${q.explanation}` : `Chưa đúng: ${q.explanation}`);
                }}
                data-screen="M06"
                data-ui={`btn-quiz-opt-${idx}`}
                className="w-full rounded-xl border border-[#CBE4DC] p-2.5 text-left text-xs font-semibold hover:bg-[#E9FAF5]"
              >
                {opt.text}
              </button>
            ))}
          </div>
          {feedback && (
            <div className="rounded-xl bg-[#ECFDF5] p-2.5 text-xs text-[#065F46]">
              <p>{feedback}</p>
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setQIndex((prev) => (prev + 1) % GAME_QUESTIONS.length);
                }}
                className="mt-2 font-extrabold underline"
              >
                Câu tiếp theo →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {MICRO_LESSONS.map((lesson) => (
            <div key={lesson.id} className="rounded-2xl border border-[#CBE4DC] bg-white p-3.5">
              <h2 className="text-sm font-extrabold text-[#0D685E]">{lesson.title}</h2>
              <p className="mt-1 text-xs text-[#475569]">{lesson.summary}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
