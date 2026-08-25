export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type Folder = {
  _id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentMeta = {
  _id: string;
  userId: string;
  folderId: string;
  title: string;
  fileType: "image" | "pdf";
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Document = DocumentMeta & {
  extractedText: string;
};

export type VocabularyEntry = {
  _id: string;
  userId: string;
  word: string;
  phonetic?: string;
  definition: string;
  exampleSentence?: string;
  documentId?: string;
  savedAt: string;
};

export type AuthResponse = {
  success: boolean;
  token: string;
  user: User;
};
