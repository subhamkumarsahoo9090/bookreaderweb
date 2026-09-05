import type {
  Annotation,
  AuthResponse,
  Classroom,
  Document,
  DocumentMeta,
  Folder,
  Note,
  QuizQuestion,
  ReadingProgress,
  SharedBook,
  SharedBookMeta,
  ThemeId,
  FontFamilyId,
  User,
  VocabularyEntry,
  SnippetType,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  formData?: FormData;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, token, formData, timeoutMs }: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers["Content-Type"] = "application/json";

  const controller = timeoutMs ? new AbortController() : undefined;
  const timer =
    timeoutMs && controller
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: formData
        ? formData
        : body
          ? JSON.stringify(body)
          : undefined,
      signal: controller?.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(
        (data as { error?: string }).error || "Request failed",
        res.status
      );
    }
    return data as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function inferClientFileType(file: File): string {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|tiff?)$/i.test(name))
    return "image";
  if (file.type === "text/plain" || name.endsWith(".txt")) return "txt";
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  )
    return "docx";
  if (file.type.includes("rtf") || name.endsWith(".rtf")) return "rtf";
  if (file.type.includes("epub") || name.endsWith(".epub")) return "epub";
  if (file.type.startsWith("audio/") || /\.(mp3|wav|webm|ogg|m4a)$/i.test(name))
    return "audio";
  return "image";
}

export const authApi = {
  register: (email: string, password: string) =>
    api<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: { email, password },
    }),
  login: (email: string, password: string) =>
    api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  me: (token: string, opts?: { timeoutMs?: number }) =>
    api<{ success: boolean; user: User; googleConfigured?: boolean }>(
      "/api/auth/me",
      { token, timeoutMs: opts?.timeoutMs }
    ),
  googleStart: (state: "login" | "drive" = "login") =>
    api<{ success: boolean; url: string }>(
      `/api/auth/google?state=${state}`
    ),
  driveStatus: (token: string) =>
    api<{
      success: boolean;
      connected: boolean;
      googleConfigured: boolean;
      rootFolderId: string | null;
    }>("/api/auth/drive", { token }),
  disconnectDrive: (token: string) =>
    api<{ success: boolean; message: string }>("/api/auth/drive", {
      method: "DELETE",
      token,
    }),
  updateSettings: (
    token: string,
    body: {
      theme?: ThemeId;
      dyslexiaFont?: boolean;
      lineSpacing?: number;
      preferredLanguage?: string;
      readingFontFamily?: FontFamilyId;
      editorFontFamily?: FontFamilyId;
      fontSize?: number;
      role?: string;
    }
  ) =>
    api<{ success: boolean; user: User }>("/api/auth/settings", {
      method: "PATCH",
      token,
      body,
    }),
};

export const foldersApi = {
  list: (token: string) =>
    api<{ success: boolean; folders: Folder[] }>("/api/folders", { token }),
  create: (token: string, name: string) =>
    api<{ success: boolean; folder: Folder }>("/api/folders", {
      method: "POST",
      token,
      body: { name },
    }),
  rename: (token: string, id: string, name: string) =>
    api<{ success: boolean; folder: Folder }>(`/api/folders/${id}`, {
      method: "PATCH",
      token,
      body: { name },
    }),
  remove: (token: string, id: string) =>
    api<{ success: boolean; message: string }>(`/api/folders/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const documentsApi = {
  list: (token: string, folderId?: string) => {
    const q = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
    return api<{ success: boolean; documents: DocumentMeta[] }>(
      `/api/documents${q}`,
      { token }
    );
  },
  get: (token: string, id: string) =>
    api<{ success: boolean; document: Document }>(`/api/documents/${id}`, {
      token,
    }),
  process: (
    token: string,
    {
      file,
      folderId,
      title,
      ocrLang,
    }: { file: File; folderId: string; title: string; ocrLang?: string }
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", folderId);
    formData.append("title", title);
    formData.append("fileType", inferClientFileType(file));
    if (ocrLang) formData.append("ocrLang", ocrLang);
    return api<{ success: boolean; document: Document }>(
      "/api/documents/process",
      { method: "POST", token, formData, timeoutMs: 180_000 }
    );
  },
  recognize: (
    token: string,
    file: Blob,
    filename = "handwriting.png",
    ocrLang?: string
  ) => {
    const formData = new FormData();
    formData.append("file", file, filename);
    if (ocrLang) formData.append("ocrLang", ocrLang);
    return api<{ success: boolean; text: string; wordCount: number }>(
      "/api/documents/recognize",
      { method: "POST", token, formData, timeoutMs: 120_000 }
    );
  },
  createFromText: (
    token: string,
    body: {
      folderId: string;
      title: string;
      extractedText: string;
      fileType?: string;
      language?: string;
    }
  ) =>
    api<{ success: boolean; document: Document }>("/api/documents/from-text", {
      method: "POST",
      token,
      body,
    }),
  update: (
    token: string,
    id: string,
    body: { title?: string; folderId?: string; extractedText?: string }
  ) =>
    api<{ success: boolean; document: Document }>(`/api/documents/${id}`, {
      method: "PATCH",
      token,
      body,
    }),
  updateTitle: (token: string, id: string, title: string) =>
    api<{ success: boolean; document: Document }>(`/api/documents/${id}`, {
      method: "PATCH",
      token,
      body: { title },
    }),
  remove: (token: string, id: string) =>
    api<{ success: boolean; message: string }>(`/api/documents/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const sharedLibraryApi = {
  list: (token: string) =>
    api<{ success: boolean; books: SharedBookMeta[] }>("/api/shared-library", {
      token,
    }),
  get: (token: string, id: string) =>
    api<{ success: boolean; book: SharedBook }>(`/api/shared-library/${id}`, {
      token,
    }),
  adminList: (token: string) =>
    api<{ success: boolean; books: SharedBookMeta[] }>(
      "/api/shared-library/admin/all",
      { token }
    ),
  adminUpload: (
    token: string,
    {
      file,
      title,
      description,
      category,
      tags,
      ocrLang,
      published,
    }: {
      file: File;
      title: string;
      description?: string;
      category?: string;
      tags?: string;
      ocrLang?: string;
      published?: boolean;
    }
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (category) formData.append("category", category);
    if (tags) formData.append("tags", tags);
    if (ocrLang) formData.append("ocrLang", ocrLang);
    formData.append("published", published === false ? "false" : "true");
    formData.append("fileType", inferClientFileType(file));
    return api<{ success: boolean; book: SharedBookMeta }>(
      "/api/shared-library/admin",
      { method: "POST", token, formData, timeoutMs: 180_000 }
    );
  },
  adminUpdate: (
    token: string,
    id: string,
    body: {
      title?: string;
      description?: string;
      category?: string;
      tags?: string | string[];
      published?: boolean;
    }
  ) =>
    api<{ success: boolean; book: SharedBookMeta }>(
      `/api/shared-library/admin/${id}`,
      { method: "PATCH", token, body }
    ),
  adminDelete: (token: string, id: string) =>
    api<{ success: boolean; message: string }>(
      `/api/shared-library/admin/${id}`,
      { method: "DELETE", token }
    ),
};

export const vocabularyApi = {
  list: (
    token: string,
    opts?: {
      documentId?: string;
      standalone?: boolean;
      linked?: boolean;
      type?: SnippetType;
    }
  ) => {
    const params = new URLSearchParams();
    if (opts?.documentId) params.set("documentId", opts.documentId);
    if (opts?.standalone) params.set("standalone", "1");
    if (opts?.linked) params.set("linked", "1");
    if (opts?.type) params.set("type", opts.type);
    const q = params.toString() ? `?${params}` : "";
    return api<{ success: boolean; vocabulary: VocabularyEntry[] }>(
      `/api/vocabulary${q}`,
      { token }
    );
  },
  save: (
    token: string,
    body: {
      word?: string;
      text?: string;
      type?: SnippetType;
      definition: string;
      phonetic?: string;
      exampleSentence?: string;
      exampleSentences?: string[];
      documentId?: string | null;
      folderId?: string | null;
    }
  ) =>
    api<{ success: boolean; vocabulary: VocabularyEntry }>("/api/vocabulary", {
      method: "POST",
      token,
      body,
    }),
  update: (
    token: string,
    id: string,
    body: {
      definition?: string;
      type?: SnippetType;
      text?: string;
      documentId?: string | null;
      folderId?: string | null;
      standalone?: boolean;
      exampleSentences?: string[];
    }
  ) =>
    api<{ success: boolean; vocabulary: VocabularyEntry }>(
      `/api/vocabulary/${id}`,
      { method: "PATCH", token, body }
    ),
  remove: (token: string, id: string) =>
    api<{ success: boolean; message: string }>(`/api/vocabulary/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const notesApi = {
  list: (token: string, documentId?: string) => {
    const q = documentId
      ? `?documentId=${encodeURIComponent(documentId)}`
      : "";
    return api<{ success: boolean; notes: Note[] }>(`/api/notes${q}`, {
      token,
    });
  },
  get: (token: string, id: string) =>
    api<{ success: boolean; note: Note }>(`/api/notes/${id}`, { token }),
  create: (
    token: string,
    body: {
      title: string;
      content: string;
      documentId?: string | null;
      folderId?: string | null;
      tags?: string[];
    }
  ) =>
    api<{ success: boolean; note: Note }>("/api/notes", {
      method: "POST",
      token,
      body,
    }),
  update: (
    token: string,
    id: string,
    body: Partial<{
      title: string;
      content: string;
      documentId: string | null;
      folderId: string | null;
      tags: string[];
    }>
  ) =>
    api<{ success: boolean; note: Note }>(`/api/notes/${id}`, {
      method: "PATCH",
      token,
      body,
    }),
  remove: (token: string, id: string) =>
    api<{ success: boolean; message: string }>(`/api/notes/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const progressApi = {
  list: (token: string) =>
    api<{
      success: boolean;
      progress: ReadingProgress[];
      streak: User["streak"];
    }>("/api/progress", { token }),
  get: (token: string, documentId: string) =>
    api<{ success: boolean; progress: ReadingProgress | null }>(
      `/api/progress/${documentId}`,
      { token }
    ),
  save: (
    token: string,
    body: { documentId: string; charOffset: number; percent: number }
  ) =>
    api<{
      success: boolean;
      progress: ReadingProgress;
      streak: User["streak"];
    }>("/api/progress", { method: "PUT", token, body }),
};

export const annotationsApi = {
  list: (token: string, documentId?: string) => {
    const q = documentId
      ? `?documentId=${encodeURIComponent(documentId)}`
      : "";
    return api<{ success: boolean; annotations: Annotation[] }>(
      `/api/annotations${q}`,
      { token }
    );
  },
  create: (
    token: string,
    body: {
      documentId: string;
      selectedText: string;
      color?: string;
      comment?: string;
      startOffset?: number;
      endOffset?: number;
    }
  ) =>
    api<{ success: boolean; annotation: Annotation }>("/api/annotations", {
      method: "POST",
      token,
      body,
    }),
  update: (
    token: string,
    id: string,
    body: { color?: string; comment?: string }
  ) =>
    api<{ success: boolean; annotation: Annotation }>(`/api/annotations/${id}`, {
      method: "PATCH",
      token,
      body,
    }),
  remove: (token: string, id: string) =>
    api<{ success: boolean; message: string }>(`/api/annotations/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const flashcardsApi = {
  due: (token: string) =>
    api<{ success: boolean; cards: VocabularyEntry[]; count: number }>(
      "/api/flashcards/due",
      { token }
    ),
  review: (token: string, id: string, quality: number) =>
    api<{ success: boolean; card: VocabularyEntry; streak: User["streak"] }>(
      `/api/flashcards/${id}/review`,
      { method: "POST", token, body: { quality } }
    ),
};

export const classroomsApi = {
  list: (token: string) =>
    api<{ success: boolean; classrooms: Classroom[] }>("/api/classrooms", {
      token,
    }),
  create: (token: string, name: string) =>
    api<{ success: boolean; classroom: Classroom }>("/api/classrooms", {
      method: "POST",
      token,
      body: { name },
    }),
  join: (token: string, inviteCode: string) =>
    api<{ success: boolean; classroom: Classroom }>("/api/classrooms/join", {
      method: "POST",
      token,
      body: { inviteCode },
    }),
  get: (token: string, id: string) =>
    api<{ success: boolean; classroom: Classroom }>(`/api/classrooms/${id}`, {
      token,
    }),
  assignFolder: (token: string, id: string, folderId: string) =>
    api<{ success: boolean; classroom: Classroom }>(
      `/api/classrooms/${id}/assign-folder`,
      { method: "POST", token, body: { folderId } }
    ),
};

export const libraryApi = {
  search: (token: string, q: string) =>
    api<{
      success: boolean;
      documents: DocumentMeta[];
      notes: Note[];
      vocabulary: VocabularyEntry[];
    }>(`/api/library/search?q=${encodeURIComponent(q)}`, { token }),
  exportMarkdown: (token: string, type: "all" | "notes" | "vocab" | "documents") =>
    api<{ success: boolean; markdown: string; filename: string }>(
      `/api/library/export?type=${type}`,
      { token }
    ),
  publicList: () =>
    api<{ success: boolean; documents: DocumentMeta[]; folders: Folder[] }>(
      "/api/library/public"
    ),
  publicDoc: (slug: string) =>
    api<{ success: boolean; document: Document }>(
      `/api/library/public/${slug}`
    ),
  shareDocument: (token: string, id: string, isPublic = true) =>
    api<{
      success: boolean;
      document: Document;
      shareUrl: string | null;
    }>(`/api/library/documents/${id}/share`, {
      method: "POST",
      token,
      body: { isPublic },
    }),
};

export async function generateQuiz(text: string) {
  const res = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Quiz failed");
  return data as { success: boolean; questions: QuizQuestion[] };
}

export async function translateText(text: string, targetLang = "hi") {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLang }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Translate failed");
  return data as { success: boolean; translation: string; targetLang: string };
}

export async function transcribeAudio(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Transcribe failed");
  return data as { success: boolean; text: string };
}
