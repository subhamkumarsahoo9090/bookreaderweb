export type ThemeId = "paper" | "night" | "sepia" | "contrast";

export type UserSettings = {
  theme?: ThemeId;
  dyslexiaFont?: boolean;
  lineSpacing?: number;
  preferredLanguage?: string;
};

export type User = {
  id: string;
  email: string;
  role?: "reader" | "teacher" | "parent";
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
  wordCount: number;
  isPublic?: boolean;
  shareSlug?: string;
  createdAt: string;
  updatedAt: string;
};

export type Document = DocumentMeta & {
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
