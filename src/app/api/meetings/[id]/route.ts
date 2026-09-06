import { NextRequest, NextResponse } from "next/server";
import { demoMeetings } from "@/lib/demo-data";
import { isConfigured, requirePassword, signedAudioUrl, supabaseAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requirePassword(request); if (denied) return denied;
  const { id } = await params;
  if (!isConfigured()) {
    const meeting = demoMeetings.find((item) => item.id === id);
    return meeting ? NextResponse.json({ meeting }) : NextResponse.json({ error: "جلسه پیدا نشد." }, { status: 404 });
  }
  const { data, error } = await supabaseAdmin().from("meetings").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "جلسه پیدا نشد." }, { status: 404 });
  return NextResponse.json({ meeting: { ...data, audio_url: await signedAudioUrl(data.audio_path) } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requirePassword(request); if (denied) return denied;
  if (!isConfigured()) return NextResponse.json({ error: "حالت نمایشی قابل ذخیره نیست." }, { status: 503 });
  const { id } = await params; const body = await request.json();
  if (!body.speakers || typeof body.speakers !== "object" || Array.isArray(body.speakers)) return NextResponse.json({ error: "نام گویندگان معتبر نیست." }, { status: 400 });
  const speakers = Object.fromEntries(Object.entries(body.speakers).slice(0, 30).map(([key, value]) => [String(key).slice(0, 60), String(value).trim().slice(0, 100)]));
  const { data, error } = await supabaseAdmin().from("meetings").update({ speakers, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error || !data) return NextResponse.json({ error: "نام گویندگان ذخیره نشد." }, { status: 500 });
  return NextResponse.json({ meeting: data });
}
