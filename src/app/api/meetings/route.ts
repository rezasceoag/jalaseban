import { NextRequest, NextResponse } from "next/server";
import { demoMeetings } from "@/lib/demo-data";
import { isConfigured, requirePassword, supabaseAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requirePassword(request); if (denied) return denied;
  if (!isConfigured()) return NextResponse.json({ meetings: demoMeetings, demo: true });
  const { data, error } = await supabaseAdmin().from("meetings").select("*").order("meeting_date", { ascending: false });
  if (error) return NextResponse.json({ error: "جلسات دریافت نشدند." }, { status: 500 });
  return NextResponse.json({ meetings: data ?? [] });
}

export async function POST(request: NextRequest) {
  const denied = requirePassword(request); if (denied) return denied;
  if (!isConfigured()) return NextResponse.json({ error: "ابتدا Supabase را تنظیم کنید." }, { status: 503 });
  const body = await request.json();
  if (!body.title || !body.audio_path || !body.meeting_date) return NextResponse.json({ error: "اطلاعات جلسه کامل نیست." }, { status: 400 });
  const { data, error } = await supabaseAdmin().from("meetings").insert({
    title: String(body.title).slice(0, 180), meeting_date: body.meeting_date,
    participants: Array.isArray(body.participants) ? body.participants.slice(0, 30) : [],
    audio_path: body.audio_path, audio_name: body.audio_name, audio_size: body.audio_size, status: "processing",
  }).select("*").single();
  if (error) return NextResponse.json({ error: "جلسه ذخیره نشد." }, { status: 500 });
  return NextResponse.json({ meeting: data });
}
