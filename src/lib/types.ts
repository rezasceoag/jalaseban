export type TranscriptSegment = { speaker: string; start: number; end: number; text: string };
export type MeetingDecision = { text: string; at?: number };
export type MeetingTask = {
  id: string;
  title: string;
  owner: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "done";
  at?: number;
};

export type Meeting = {
  id: string;
  title: string;
  meeting_date: string;
  participants: string[];
  audio_path?: string | null;
  audio_name?: string | null;
  audio_url?: string | null;
  duration_seconds?: number | null;
  status: "draft" | "processing" | "ready" | "failed";
  summary: string;
  decisions: MeetingDecision[];
  tasks: MeetingTask[];
  open_questions: string[];
  segments: TranscriptSegment[];
  speakers: Record<string, string>;
  error_message?: string | null;
  created_at: string;
  demo?: boolean;
};
