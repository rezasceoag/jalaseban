import type { Meeting } from "./types";

export const demoMeetings: Meeting[] = [
  {
    id: "demo-sales", title: "جلسه هفتگی فروش", meeting_date: "2026-09-06T09:30:00.000Z",
    participants: ["علی کاووسی", "سارا احمدی", "محمد رضایی"], duration_seconds: 2874, status: "ready",
    summary: "فروش این هفته پایین‌تر از هدف تعیین‌شده بود. تیم تصمیم گرفت پیگیری مشتریان آزمایشگاهی غیرفعال را در اولویت قرار دهد، تخفیف عمومی را متوقف کند و گزارش روزانه فروش را تا ساعت ۱۷ ثبت کند.",
    decisions: [
      { text: "تخفیف عمومی تا بررسی حاشیه سود متوقف شود.", at: 742 },
      { text: "تمرکز تماس‌های این هفته روی مشتریان غیرفعال تهران باشد.", at: 1095 },
      { text: "گزارش روزانه فروش تا ساعت ۱۷ برای مدیریت ارسال شود.", at: 2120 },
    ],
    tasks: [
      { id: "t1", title: "استخراج فهرست مشتریان غیرفعال", owner: "سارا احمدی", due_date: "دوشنبه ۱۷ شهریور", priority: "high", status: "todo", at: 1124 },
      { id: "t2", title: "آماده‌سازی قالب گزارش روزانه فروش", owner: "محمد رضایی", due_date: "فردا", priority: "high", status: "todo", at: 2142 },
      { id: "t3", title: "بررسی قیمت سه رقیب اصلی", owner: "علی کاووسی", due_date: null, priority: "medium", status: "todo", at: 2360 },
    ],
    open_questions: ["سقف تخفیف موردی برای مشتریان کلیدی هنوز تعیین نشده است.", "بودجه کمپین بازگشت مشتری نیازمند تأیید مدیرعامل است."],
    speakers: { SPEAKER_00: "علی کاووسی", SPEAKER_01: "سارا احمدی", SPEAKER_02: "محمد رضایی" },
    segments: [
      { speaker: "SPEAKER_00", start: 12, end: 38, text: "سلام. اول وضعیت فروش هفته قبل را مرور کنیم. نسبت به هدف حدود دوازده درصد عقب هستیم و باید دلیلش مشخص شود." },
      { speaker: "SPEAKER_01", start: 39, end: 68, text: "بخش زیادی از مشتریان قدیمی مدتی است پیگیری نشده‌اند. می‌توانم فهرست مشتریان غیرفعال را تا دوشنبه آماده کنم." },
      { speaker: "SPEAKER_02", start: 69, end: 101, text: "برای گزارش روزانه هم یک قالب ثابت درست می‌کنم که تعداد تماس، پیش‌فاکتور و فروش نهایی را نشان دهد." },
      { speaker: "SPEAKER_00", start: 102, end: 129, text: "خوب است. از فردا گزارش تا ساعت پنج ارسال شود و فعلاً تخفیف عمومی را هم متوقف می‌کنیم." },
    ],
    created_at: "2026-09-06T10:25:00.000Z", demo: true,
  },
  {
    id: "demo-exhibition", title: "هماهنگی نمایشگاه", meeting_date: "2026-09-04T12:00:00.000Z",
    participants: ["تیم مدیریت", "مارکتینگ"], duration_seconds: 1940, status: "ready",
    summary: "برنامه اجرایی نمایشگاه و مسئولیت‌های غرفه مرور شد.",
    decisions: [{ text: "نسخه نهایی محتوای نمایشگر تا سه‌شنبه تحویل شود.", at: 830 }],
    tasks: [{ id: "t4", title: "تأیید محتوای نمایشگر", owner: "مدیر مارکتینگ", due_date: "سه‌شنبه", priority: "high", status: "todo", at: 830 }],
    open_questions: [], segments: [], speakers: {}, created_at: "2026-09-04T13:00:00.000Z", demo: true,
  },
  {
    id: "demo-finance", title: "بررسی وضعیت مالی ماه", meeting_date: "2026-09-02T08:30:00.000Z",
    participants: ["مدیرعامل", "واحد مالی"], duration_seconds: 3312, status: "draft",
    summary: "گزارش جریان نقدی و مطالبات بررسی شد.", decisions: [], tasks: [], open_questions: ["زمان وصول دو فاکتور مشخص نشده است."], segments: [], speakers: {}, created_at: "2026-09-02T09:30:00.000Z", demo: true,
  },
];
