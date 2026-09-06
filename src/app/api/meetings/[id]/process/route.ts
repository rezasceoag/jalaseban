import { NextRequest, NextResponse } from "next/server";
import { requirePassword, signedAudioUrl, supabaseAdmin } from "@/lib/server";
import type { TranscriptSegment } from "@/lib/types";

export const maxDuration = 300;

const resultSchema = {
  type: "object", additionalProperties: false,
  required: ["summary", "decisions", "tasks", "open_questions"],
  properties: {
    summary: { type: "string" },
    decisions: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "at"], properties: { text: { type: "string" }, at: { type: ["number", "null"] } } } },
    tasks: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "owner", "due_date", "priority", "at"], properties: { title: { type: "string" }, owner: { type: ["string", "null"] }, due_date: { type: ["string", "null"] }, priority: { type: "string", enum: ["low", "medium", "high"] }, at: { type: ["number", "null"] } } } },
    open_questions: { type: "array", items: { type: "string" } },
  },
};

function extractResponseText(payload: Record<string, unknown>) {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output as Array<{ content?: Array<{ type?: string; text?: string }> }>) {
    for (const content of item.content ?? []) if (content.type === "output_text" && content.text) return content.text;
  }
  throw new Error("مدل تحلیل خروجی قابل خواندن برنگرداند.");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requirePassword(request); if (denied) return denied;
  const { id } = await params; const admin = supabaseAdmin();
  const { data: meeting, error } = await admin.from("meetings").select("*").eq("id", id).single();
  if (error || !meeting) return NextResponse.json({ error: "جلسه پیدا نشد." }, { status: 404 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "کلید OpenAI تنظیم نشده است." }, { status: 503 });
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  try {
    const url = await signedAudioUrl(meeting.audio_path); if (!url) throw new Error("فایل صوتی در دسترس نیست.");
    const audioResponse = await fetch(url); if (!audioResponse.ok) throw new Error("فایل صوتی دریافت نشد.");
    const bytes = await audioResponse.arrayBuffer(); if (bytes.byteLength > 25 * 1024 * 1024) throw new Error("حجم فایل از محدودیت ۲۵ مگابایت بیشتر است.");
    const form = new FormData();
    form.append("file", new File([bytes], meeting.audio_name || "meeting.webm", { type: audioResponse.headers.get("content-type") || "audio/webm" }));
    form.append("model", "gpt-4o-transcribe-diarize"); form.append("response_format", "diarized_json"); form.append("chunking_strategy", "auto");
    const transcriptionResponse = await fetch(`${baseUrl}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form });
    if (!transcriptionResponse.ok) throw new Error(`تبدیل صوت انجام نشد: ${await transcriptionResponse.text()}`);
    const transcription = await transcriptionResponse.json() as { text?: string; duration?: number; segments?: TranscriptSegment[] };
    const segments = transcription.segments ?? [];
    const transcript = segments.length ? segments.map((segment) => `[${segment.start}] ${segment.speaker}: ${segment.text}`).join("\n") : transcription.text || "";
    if (!transcript) throw new Error("متنی از فایل صوتی استخراج نشد.");
    const prompt = `تو منشی دقیق جلسات یک شرکت ایرانی هستی. متن جلسه زیر را فقط بر اساس گفته‌های صریح تحلیل کن. هیچ مسئول، تاریخ یا تصمیمی را حدس نزن. اگر کاری مسئول یا موعد ندارد مقدار null بگذار. at باید نزدیک‌ترین زمان برحسب ثانیه از ابتدای جلسه باشد. خلاصه را روان، کوتاه و رسمی به فارسی بنویس. تصمیم قطعی را از پیشنهاد جدا کن.\n\nموضوع: ${meeting.title}\nافراد حاضر: ${(meeting.participants || []).join("، ")}\n\nمتن زمان‌بندی‌شده:\n${transcript}`;
    const analysisResponse = await fetch(`${baseUrl}/responses`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-5.6-luna", input: prompt, text: { format: { type: "json_schema", name: "meeting_minutes", strict: true, schema: resultSchema } } }) });
    if (!analysisResponse.ok) throw new Error(`تحلیل جلسه انجام نشد: ${await analysisResponse.text()}`);
    const analysisPayload = await analysisResponse.json() as Record<string, unknown>;
    const analysis = JSON.parse(extractResponseText(analysisPayload));
    const speakerIds = [...new Set(segments.map((segment) => segment.speaker))];
    const speakers = Object.fromEntries(speakerIds.map((speaker, index) => [speaker, `گوینده ${(index + 1).toLocaleString("fa-IR")}`]));
    const tasks = analysis.tasks.map((task: Record<string, unknown>) => ({ ...task, id: crypto.randomUUID(), status: "todo" }));
    const { data: updated, error: updateError } = await admin.from("meetings").update({ summary: analysis.summary, decisions: analysis.decisions, tasks, open_questions: analysis.open_questions, segments, speakers, duration_seconds: transcription.duration || segments.at(-1)?.end || null, status: "ready", error_message: null, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (updateError) throw updateError;
    return NextResponse.json({ meeting: { ...updated, audio_url: url } });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "پردازش ناموفق بود.";
    await admin.from("meetings").update({ status: "failed", error_message: message, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
