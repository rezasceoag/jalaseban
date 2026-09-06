import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase تنظیم نشده است.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function requirePassword(request: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return null;
  if (request.headers.get("x-app-password") !== expected) return NextResponse.json({ error: "رمز عبور صحیح نیست." }, { status: 401 });
  return null;
}

export function safeFilename(filename: string) {
  const extension = filename.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "webm";
  return `${crypto.randomUUID()}.${extension}`;
}

export async function signedAudioUrl(path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin().storage.from("meeting-audio").createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}
