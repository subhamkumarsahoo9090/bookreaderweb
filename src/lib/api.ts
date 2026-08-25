import type {
  AuthResponse,
  Document,
  DocumentMeta,
  Folder,
  User,
  VocabularyEntry,
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
  me: (token: string) =>
    api<{ success: boolean; user: User }>("/api/auth/me", { token }),
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
    }: { file: File; folderId: string; title: string }
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", folderId);
    formData.append("title", title);
    const fileType =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
        ? "pdf"
        : "image";
    formData.append("fileType", fileType);
    return api<{ success: boolean; document: Document }>(
      "/api/documents/process",
      { method: "POST", token, formData, timeoutMs: 180_000 }
    );
  },
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

export const vocabularyApi = {
  list: (token: string, documentId?: string) => {
    const q = documentId
      ? `?documentId=${encodeURIComponent(documentId)}`
      : "";
    return api<{ success: boolean; vocabulary: VocabularyEntry[] }>(
      `/api/vocabulary${q}`,
      { token }
    );
  },
  save: (
    token: string,
    body: {
      word: string;
      definition: string;
      phonetic?: string;
      exampleSentence?: string;
      documentId?: string;
    }
  ) =>
    api<{ success: boolean; vocabulary: VocabularyEntry }>("/api/vocabulary", {
      method: "POST",
      token,
      body,
    }),
  remove: (token: string, id: string) =>
    api<{ success: boolean; message: string }>(`/api/vocabulary/${id}`, {
      method: "DELETE",
      token,
    }),
};
