export type ThemeId = "paper" | "night" | "sepia" | "contrast";

export type FontFamilyId =
  | "outfit"
  | "fraunces"
  | "literata"
  | "noto-devanagari"
  | "noto-oriya"
  | "opendyslexic";

export type UserSettings = {
  theme?: ThemeId;
  dyslexiaFont?: boolean;
  lineSpacing?: number;
  preferredLanguage?: string;
  readingFontFamily?: FontFamilyId;
  editorFontFamily?: FontFamilyId;
  fontSize?: number;
};

export type UserRole = "reader" | "teacher" | "parent" | "admin";

export type User = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: UserRole;
  driveConnected?: boolean;
  createdAt: string;
  settings?: UserSettings;
  streak?: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
};

export type Folder = {
  _id: string;
  userId: string;
  name: string;
  isPublic?: boolean;
  shareSlug?: string;
  driveFolderId?: string;
  createdAt: string;
  updatedAt: string;
};

export type FileType =
  | "image"
  | "pdf"
  | "txt"
  | "docx"
  | "rtf"
  | "epub"
  | "audio";

export type DocumentMeta = {
  _id: string;
  userId: string;
  folderId: string;
  title: string;
  fileType: FileType;
  language?: string;
  storage?: "mongo" | "drive";
  wordCount: number;
  textPreview?: string;
  isPublic?: boolean;
  shareSlug?: string;
  createdAt: string;
  updatedAt: string;
};

export type Document = DocumentMeta & {
  extractedText: string;
};

export type SharedBookMeta = {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  fileType: FileType;
  language?: string;
  wordCount: number;
  textPreview?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SharedBook = SharedBookMeta & {
  extractedText: string;
};

export type SnippetType = "word" | "phrase" | "sentence";

export type VocabularyEntry = {
  _id: string;
  userId: string;
  text?: string;
  word: string;
  type?: SnippetType;
  phonetic?: string;
  definition: string;
  exampleSentence?: string;
  exampleSentences?: string[];
  documentId?: string | null;
  folderId?: string | null;
  easeFactor?: number;
  interval?: number;
  repetitions?: number;
  nextReviewAt?: string;
  savedAt: string;
};

export type Note = {
  _id: string;
  userId: string;
  title: string;
  content: string;
  documentId?: string | null;
  folderId?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  success: boolean;
  token: string;
  user: User;
};

export type ReadingProgress = {
  _id: string;
  documentId: string | DocumentMeta;
  charOffset: number;
  percent: number;
  lastReadAt: string;
};

export type Annotation = {
  _id: string;
  documentId: string;
  selectedText: string;
  color: "yellow" | "green" | "blue" | "pink" | "purple";
  comment: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
};

export type Classroom = {
  _id: string;
  name: string;
  teacherId: string | { _id: string; email: string };
  inviteCode: string;
  memberIds: (string | { _id: string; email: string })[];
  folderIds: (string | { _id: string; name: string })[];
  createdAt: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

export const FONT_OPTIONS: { id: FontFamilyId; label: string }[] = [
  { id: "outfit", label: "Outfit (UI)" },
  { id: "fraunces", label: "Fraunces" },
  { id: "literata", label: "Literata" },
  { id: "noto-devanagari", label: "Noto Devanagari (Hindi)" },
  { id: "noto-oriya", label: "Noto Oriya (Odia)" },
  { id: "opendyslexic", label: "OpenDyslexic" },
];

export const OCR_LANG_OPTIONS = [
  { value: "auto", label: "Auto (Eng+Hindi+Odia)" },
  { value: "eng", label: "English" },
  { value: "hin", label: "Hindi" },
  { value: "ori", label: "Odia" },
  { value: "ben", label: "Bengali" },
  { value: "tam", label: "Tamil" },
  { value: "tel", label: "Telugu" },
  { value: "mar", label: "Marathi" },
  { value: "guj", label: "Gujarati" },
  { value: "kan", label: "Kannada" },
  { value: "mal", label: "Malayalam" },
  { value: "pan", label: "Punjabi" },
];
