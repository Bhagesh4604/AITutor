

// Data Models

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER'
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  FRUSTRATED = 'FRUSTRATED'
}

export enum SupportedLanguage {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  BENGALI = 'Bengali',
  TELUGU = 'Telugu',
  TAMIL = 'Tamil',
  MARATHI = 'Marathi',
  GUJARATI = 'Gujarati',
  KANNADA = 'Kannada',
  MALAYALAM = 'Malayalam',
  PUNJABI = 'Punjabi',
  ODIA = 'Odia',
  URDU = 'Urdu',
  ASSAMESE = 'Assamese',
  BODO = 'Bodo',
  DOGRI = 'Dogri',
  KASHMIRI = 'Kashmiri',
  KONKANI = 'Konkani',
  MAITHILI = 'Maithili',
  MANIPURI = 'Manipuri',
  NEPALI = 'Nepali',
  SANSKRIT = 'Sanskrit',
  SANTALI = 'Santali',
  SINDHI = 'Sindhi'
}

export enum AIVoice {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export interface Attachment {
  type: 'image' | 'pdf' | 'audio';
  mimeType: string;
  data: string; // Base64 string
  name?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachment?: Attachment;
}

export interface ChatConversation {
  id: string;
  title: string;
  summary?: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface TeacherMessage {
  id: string;
  studentId: string;
  teacherName: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface AIResponseSchema {
  tutor_response: string;
  pedagogical_reasoning: string; // XAI: Why did the AI say this?
  detected_sentiment: Sentiment;
  suggested_action: 'NONE' | 'REVIEW_TOPIC' | 'FLAG_TEACHER';
}

export interface ModuleStats {
  id: string;
  name: string;
  mastery: number; // 0-100
  timeSpent: number; // minutes
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface StudyResource {
  id: string;
  title: string;
  uri: string;
  source?: string;
  type?: 'PDF' | 'WEB' | 'VIDEO' | 'UNKNOWN';
  dateSaved?: number;
}

export interface TranscriptItem {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LiveSession {
  id: string;
  startTime: number;
  endTime: number;
  transcript: TranscriptItem[];
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // For auth simulation
  phone?: string;
  bio?: string;
  masteryScore: number; // 0-100 (Overall)
  topicsCompleted: number;
  atRisk: boolean;
  sentimentTrend: Sentiment[];
  modules: ModuleStats[];
  preferredLanguage: SupportedLanguage;
  preferredVoice: AIVoice;
  savedResources: StudyResource[];
  conversations: ChatConversation[]; // Structured history
  liveSessions: LiveSession[];
  attempts?: QuizAttempt[];
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // For auth simulation
  subject: string;
  bio: string;
  yearsOfExperience: number;
  phone?: string;
}

export interface InterventionFlag {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
}

export interface AIDecisionLog {
  id: string;
  studentId: string;
  studentInput: string;
  aiOutput: string;
  reasoning: string; // The "Explainable" part
  timestamp: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  moduleId: string; // Links to ModuleStats
}

export interface QuizAttempt {
  id: string;
  date: number;
  moduleId: string;
  score: number;
  maxScore: number;
}