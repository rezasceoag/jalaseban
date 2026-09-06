"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, CircleAlert,
  Clock3, FileAudio2, ListChecks, Loader2, LogOut, Mic, Play,
  Plus, RotateCcw, Search, Square, UploadCloud, Users,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { Meeting, MeetingTask, TranscriptSegment } from "@/lib/types";

type View = "list" | "new" | "detail";
type ApiListResponse = { meetings: Meeting[]; demo?: boolean };

const statusMap: Record<Meeting["status"], { label: string; tone: string }> = {
  ready: { label: "آماده", tone: "ready" },
  processing: { label: "در حال پردازش", tone: "processing" },
  failed: { label: "ناموفق", tone: "failed" },
  draft: { label: "پیش‌نویس", tone: "draft" },
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
  } catch { return value; }
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

async function api<T>(path: string, password: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-app-password": password, ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "در ارتباط با سرور مشکلی پیش آمد.");
  return body as T;
}

export default function Home() {
  const [password, setPassword] = useState("");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<View>("list");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Session storage is only available after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPassword(sessionStorage.getItem("jalaseban-password") ?? "");
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, password]);

  async function loadMeetings() {
    setLoading(true); setMessage(null);
    try {
      const data = await api<ApiListResponse>("/api/meetings", password);
      setMeetings(data.meetings); setDemo(Boolean(data.demo));
    } catch (error) { setMessage(error instanceof Error ? error.message : "خطا در دریافت جلسات"); }
    finally { setLoading(false); }
  }

  async function openMeeting(meeting: Meeting) {
    setView("detail"); setSelected(meeting);
    if (demo || meeting.demo) return;
    try {
      const data = await api<{ meeting: Meeting }>(`/api/meetings/${meeting.id}`, password);
      setSelected(data.meeting);
    } catch (error) { setMessage(error instanceof Error ? error.message : "جلسه باز نشد"); }
  }

  function signIn(event: FormEvent) {
    event.preventDefault();
    sessionStorage.setItem("jalaseban-password", passwordDraft);
    setPassword(passwordDraft); setMessage(null);
  }

  function signOut() {
    sessionStorage.removeItem("jalaseban-password"); setPassword(""); setPasswordDraft("");
  }

  const filtered = useMemo(() => {
    const query = search.trim();
    return query ? meetings.filter((m) => m.title.includes(query) || m.participants.some((item) => item.includes(query))) : meetings;
  }, [meetings, search]);

  if (!authReady) return <PageLoader />;
  if (message?.includes("رمز عبور")) return <Login draft={passwordDraft} setDraft={setPasswordDraft} onSubmit={signIn} error={message} />;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Mic size={20} strokeWidth={2.4} /></div><div><strong>جلسه‌بان</strong><span>دستیار جلسات شرکت</span></div></div>
        <nav aria-label="ناوبری اصلی">
          <button className={view === "list" ? "nav-item active" : "nav-item"} onClick={() => setView("list")}><CalendarDays size={19} /> جلسات</button>
          <button className="nav-item" onClick={() => setView("new")}><Plus size={19} /> جلسه جدید</button>
        </nav>
        <div className="sidebar-foot">{demo && <span className="demo-chip">حالت نمایشی</span>}{password && <button className="signout" onClick={signOut}><LogOut size={17} /> خروج</button>}</div>
      </aside>
      <section className="workspace">
        <MobileHeader onBack={view === "list" ? undefined : () => setView("list")} />
        {message && !message.includes("رمز عبور") && <div className="notice error"><CircleAlert size={18} />{message}<button onClick={() => setMessage(null)}>بستن</button></div>}
        {view === "list" && <MeetingList meetings={filtered} loading={loading} search={search} setSearch={setSearch} onNew={() => setView("new")} onOpen={openMeeting} />}
        {view === "new" && <NewMeeting password={password} demo={demo} onCancel={() => setView("list")} onCreated={async (meeting) => {
          setSelected(meeting); setView("detail"); await loadMeetings();
          const fresh = await api<{ meeting: Meeting }>(`/api/meetings/${meeting.id}`, password); setSelected(fresh.meeting);
        }} />}
        {view === "detail" && selected && <MeetingDetail key={selected.id} meeting={selected} password={password} demo={demo} onBack={() => setView("list")} />}
      </section>
    </main>
  );
}

function PageLoader() { return <div className="page-loader"><Loader2 className="spin" size={30} /><span>در حال آماده‌سازی…</span></div>; }

function Login({ draft, setDraft, onSubmit, error }: { draft: string; setDraft: (v: string) => void; onSubmit: (e: FormEvent) => void; error?: string | null }) {
  return <main className="login-page"><form className="login-card" onSubmit={onSubmit}><div className="brand-mark large"><Mic size={26} /></div><h1>ورود به جلسه‌بان</h1><p>رمز داخلی شرکت را وارد کنید.</p><label>رمز عبور<input type="password" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus /></label>{error && <span className="field-error">{error}</span>}<button className="primary-btn" type="submit">ورود</button></form></main>;
}

function MobileHeader({ onBack }: { onBack?: () => void }) {
  return <header className="mobile-header">{onBack ? <button onClick={onBack} aria-label="بازگشت"><ArrowRight size={21} /></button> : <span />}<strong>جلسه‌بان</strong><Mic size={19} /></header>;
}

function MeetingList({ meetings, loading, search, setSearch, onNew, onOpen }: { meetings: Meeting[]; loading: boolean; search: string; setSearch: (v: string) => void; onNew: () => void; onOpen: (m: Meeting) => void }) {
  return <div className="page-content">
    <header className="page-heading"><div><span className="eyebrow">آرشیو شرکت</span><h1>جلسات</h1><p>صورت‌جلسه‌ها، تصمیم‌ها و کارهای بعدی یک‌جا.</p></div><button className="primary-btn" onClick={onNew}><Plus size={19} /> جلسه جدید</button></header>
    <div className="toolbar"><label className="search-box"><Search size={19} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جست‌وجوی موضوع یا نام افراد" /></label><span className="count">{meetings.length.toLocaleString("fa-IR")} جلسه</span></div>
    {loading ? <div className="empty"><Loader2 className="spin" /><p>در حال دریافت جلسات…</p></div> : meetings.length === 0 ? <div className="empty"><FileAudio2 size={34} /><h2>هنوز جلسه‌ای ثبت نشده</h2><p>اولین فایل صوتی را اضافه کنید.</p><button className="secondary-btn" onClick={onNew}>ایجاد جلسه</button></div> : <div className="meeting-list">{meetings.map((meeting) => {
      const status = statusMap[meeting.status]; const date = new Date(meeting.meeting_date);
      return <button className="meeting-card" key={meeting.id} onClick={() => onOpen(meeting)}><div className="meeting-date"><span>{new Intl.DateTimeFormat("fa-IR", { day: "2-digit" }).format(date)}</span><small>{new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(date)}</small></div><div className="meeting-main"><h2>{meeting.title}</h2><div className="meeting-meta"><span><Users size={16} />{meeting.participants.join("، ") || "بدون شرکت‌کننده"}</span><span><Clock3 size={16} />{formatDuration(meeting.duration_seconds)}</span></div></div><span className={`status ${status.tone}`}>{meeting.status === "processing" && <Loader2 size={14} className="spin" />}{status.label}</span><ChevronLeft className="chevron" size={20} /></button>;
    })}</div>}
  </div>;
}

function NewMeeting({ password, demo, onCancel, onCreated }: { password: string; demo: boolean; onCancel: () => void; onCreated: (m: Meeting) => Promise<void> }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [participants, setParticipants] = useState(""); const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false); const [recordTime, setRecordTime] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null); const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const chunks: BlobPart[] = [];
      const preferred = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
      const recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onstop = () => { const blob = new Blob(chunks, { type: recorder.mimeType }); setFile(new File([blob], `meeting-${Date.now()}.webm`, { type: recorder.mimeType })); stream.getTracks().forEach((track) => track.stop()); };
      recorder.start(1000); recorderRef.current = recorder; setRecording(true); setRecordTime(0); timerRef.current = setInterval(() => setRecordTime((time) => time + 1), 1000);
    } catch { setError("اجازه دسترسی به میکروفن داده نشد."); }
  }
  function stopRecording() { recorderRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); setRecording(false); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (demo) return setError("برای پردازش واقعی، متغیرهای Supabase و OpenAI را روی Vercel وارد کنید.");
    if (!title.trim() || !file) return setError("موضوع و فایل صوتی لازم است.");
    if (file.size > 24 * 1024 * 1024) return setError("حجم فایل باید کمتر از ۲۴ مگابایت باشد.");
    setSaving(true); setError(null);
    try {
      const upload = await api<{ path: string; token: string; supabaseUrl: string; anonKey: string }>("/api/upload-url", password, { method: "POST", body: JSON.stringify({ filename: file.name, contentType: file.type || "audio/webm" }) });
      const supabase = createClient(upload.supabaseUrl, upload.anonKey);
      const result = await supabase.storage.from("meeting-audio").uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type, upsert: false });
      if (result.error) throw result.error;
      const created = await api<{ meeting: Meeting }>("/api/meetings", password, { method: "POST", body: JSON.stringify({ title: title.trim(), meeting_date: date, participants: participants.split(/[،,]/).map((x) => x.trim()).filter(Boolean), audio_path: upload.path, audio_name: file.name, audio_size: file.size }) });
      const processed = await api<{ meeting: Meeting }>(`/api/meetings/${created.meeting.id}/process`, password, { method: "POST", body: "{}" });
      await onCreated(processed.meeting);
    } catch (err) { setError(err instanceof Error ? err.message : "ثبت جلسه انجام نشد."); }
    finally { setSaving(false); }
  }

  return <div className="page-content narrow"><button className="back-link" onClick={onCancel}><ArrowRight size={18} /> بازگشت به جلسات</button><header className="page-heading compact"><div><span className="eyebrow">جلسه تازه</span><h1>ثبت فایل صوتی</h1><p>موضوع و افراد حاضر را وارد کنید، سپس فایل را بفرستید.</p></div></header><form className="new-form" onSubmit={submit}>
    <div className="form-grid"><label className="field full"><span>موضوع جلسه</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً جلسه هفتگی فروش" /></label><label className="field"><span>تاریخ جلسه</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="field"><span>افراد حاضر</span><input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="علی، سارا، محمد" /></label></div>
    <div className="audio-box"><div className="audio-choice"><label className="upload-btn"><UploadCloud size={21} /><span>{file ? "تغییر فایل" : "انتخاب فایل صوتی"}</span><input type="file" accept="audio/*,.mp3,.m4a,.wav,.webm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label><span className="or">یا</span>{!recording ? <button type="button" className="record-btn" onClick={startRecording}><Mic size={20} /> ضبط مستقیم</button> : <button type="button" className="record-btn active" onClick={stopRecording}><Square size={18} fill="currentColor" /> توقف {formatTime(recordTime)}</button>}</div>{file && <div className="selected-file"><FileAudio2 size={20} /><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} مگابایت</span></div><CheckCircle2 size={19} /></div>}<small>فرمت‌های MP3، M4A، WAV و WebM · حداکثر ۲۴ مگابایت</small></div>
    {error && <div className="notice error"><CircleAlert size={18} />{error}</div>}<div className="form-actions"><button type="button" className="secondary-btn" onClick={onCancel}>انصراف</button><button className="primary-btn" disabled={saving}>{saving ? <><Loader2 className="spin" size={18} /> در حال پردازش جلسه…</> : <><UploadCloud size={18} /> ثبت و پردازش</>}</button></div>
  </form></div>;
}

function MeetingDetail({ meeting, password, demo, onBack }: { meeting: Meeting; password: string; demo: boolean; onBack: () => void }) {
  const [tab, setTab] = useState<"summary" | "transcript">("summary");
  const [speakerNames, setSpeakerNames] = useState(meeting.speakers);
  const [savingNames, setSavingNames] = useState(false);
  const [speakerNotice, setSpeakerNotice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); const status = statusMap[meeting.status];
  function seek(at?: number) { if (at == null || !audioRef.current) return; audioRef.current.currentTime = at; audioRef.current.play(); }
  async function saveSpeakerNames() {
    if (demo || meeting.demo) { setSpeakerNotice("نام‌ها در حالت نمایشی فقط روی همین صفحه تغییر می‌کنند."); return; }
    setSavingNames(true); setSpeakerNotice(null);
    try {
      await api(`/api/meetings/${meeting.id}`, password, { method: "PATCH", body: JSON.stringify({ speakers: speakerNames }) });
      setSpeakerNotice("نام گویندگان ذخیره شد.");
    } catch (error) { setSpeakerNotice(error instanceof Error ? error.message : "نام‌ها ذخیره نشدند."); }
    finally { setSavingNames(false); }
  }
  return <div className="page-content detail-page"><button className="back-link" onClick={onBack}><ArrowRight size={18} /> همه جلسات</button><header className="detail-header"><div><span className={`status ${status.tone}`}>{status.label}</span><h1>{meeting.title}</h1><div className="meeting-meta large"><span><CalendarDays size={17} />{formatDate(meeting.meeting_date)}</span><span><Clock3 size={17} />{formatDuration(meeting.duration_seconds)}</span><span><Users size={17} />{meeting.participants.join("، ")}</span></div></div></header>
    {meeting.status === "processing" ? <div className="processing-panel"><Loader2 size={34} className="spin" /><h2>جلسه در حال پردازش است</h2><p>متن، گویندگان و نتیجه جلسه تا چند دقیقه دیگر آماده می‌شود.</p></div> : meeting.status === "failed" ? <div className="processing-panel failed"><CircleAlert size={34} /><h2>پردازش کامل نشد</h2><p>{meeting.error_message || "دوباره تلاش کنید."}</p><button className="secondary-btn"><RotateCcw size={17} /> تلاش دوباره</button></div> : <>{meeting.audio_url && <audio ref={audioRef} controls src={meeting.audio_url} className="audio-player" />}<div className="tabs" role="tablist"><button className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}>صورت‌جلسه</button><button className={tab === "transcript" ? "active" : ""} onClick={() => setTab("transcript")}>متن کامل</button></div>
      {tab === "summary" ? <div className="result-grid"><section className="result-card summary-card"><div className="section-title"><span className="icon-box"><FileAudio2 size={19} /></span><h2>خلاصه جلسه</h2></div><p>{meeting.summary || "خلاصه‌ای ثبت نشده است."}</p></section><section className="result-card"><div className="section-title"><span className="icon-box amber"><CheckCircle2 size={19} /></span><h2>تصمیم‌های نهایی</h2><span className="section-count">{meeting.decisions.length.toLocaleString("fa-IR")}</span></div><div className="decision-list">{meeting.decisions.length ? meeting.decisions.map((decision, index) => <button key={index} onClick={() => seek(decision.at)}><span>{(index + 1).toLocaleString("fa-IR")}</span><p>{decision.text}</p>{decision.at != null && <small><Play size={13} />{formatTime(decision.at)}</small>}</button>) : <EmptyLine text="تصمیم قطعی ثبت نشده است." />}</div></section><section className="result-card full"><div className="section-title"><span className="icon-box teal"><ListChecks size={19} /></span><h2>کارهای بعدی</h2><span className="section-count">{meeting.tasks.length.toLocaleString("fa-IR")}</span></div>{meeting.tasks.length ? <div className="task-table"><div className="task-head"><span>کار</span><span>مسئول</span><span>موعد</span><span>اولویت</span></div>{meeting.tasks.map((task) => <TaskRow key={task.id} task={task} onSeek={seek} />)}</div> : <EmptyLine text="تسکی از این جلسه استخراج نشده است." />}</section>{!!meeting.open_questions.length && <section className="result-card full"><div className="section-title"><span className="icon-box rose"><CircleAlert size={19} /></span><h2>موضوعات باز</h2></div><ul className="open-list">{meeting.open_questions.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}</div> : <><SpeakerEditor speakers={speakerNames} setSpeakers={setSpeakerNames} onSave={saveSpeakerNames} saving={savingNames} notice={speakerNotice} /><Transcript segments={meeting.segments} speakers={speakerNames} onSeek={seek} /></>}</>}
  </div>;
}

function TaskRow({ task, onSeek }: { task: MeetingTask; onSeek: (at?: number) => void }) {
  return <button className="task-row" onClick={() => onSeek(task.at)}><span className="task-name"><i className={task.status === "done" ? "task-check checked" : "task-check"} />{task.title}{task.at != null && <small><Play size={12} />{formatTime(task.at)}</small>}</span><span>{task.owner || "تعیین نشده"}</span><span>{task.due_date || "تعیین نشده"}</span><span><em className={`priority ${task.priority}`}>{task.priority === "high" ? "بالا" : task.priority === "low" ? "پایین" : "متوسط"}</em></span></button>;
}

function Transcript({ segments, speakers, onSeek }: { segments: TranscriptSegment[]; speakers: Record<string, string>; onSeek: (at: number) => void }) {
  return <section className="transcript-card"><div className="section-title"><span className="icon-box"><Mic size={19} /></span><h2>متن کامل جلسه</h2><span className="section-count">{segments.length.toLocaleString("fa-IR")} بخش</span></div><div className="transcript-list">{segments.map((segment, index) => <article key={`${segment.start}-${index}`}><button className="speaker-time" onClick={() => onSeek(segment.start)}><span>{speakers[segment.speaker] || segment.speaker}</span><small><Play size={12} />{formatTime(segment.start)}</small></button><p>{segment.text}</p></article>)}</div></section>;
}

function SpeakerEditor({ speakers, setSpeakers, onSave, saving, notice }: { speakers: Record<string, string>; setSpeakers: (v: Record<string, string>) => void; onSave: () => void; saving: boolean; notice: string | null }) {
  const entries = Object.entries(speakers);
  if (!entries.length) return null;
  return <section className="speaker-editor"><div><strong>نام گویندگان</strong><span>نام درست هر صدا را یک‌بار وارد کنید.</span></div><div className="speaker-fields">{entries.map(([id, name]) => <label key={id}><small>{id}</small><input value={name} onChange={(event) => setSpeakers({ ...speakers, [id]: event.target.value })} /></label>)}</div><button className="secondary-btn" onClick={onSave} disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />} ذخیره نام‌ها</button>{notice && <p>{notice}</p>}</section>;
}

function EmptyLine({ text }: { text: string }) { return <p className="empty-line">{text}</p>; }
