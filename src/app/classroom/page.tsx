"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { classroomsApi, foldersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Classroom, Folder } from "@/lib/types";

function ClassroomContent() {
  const { token } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [folderId, setFolderId] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    const [c, f] = await Promise.all([
      classroomsApi.list(token),
      foldersApi.list(token),
    ]);
    setClassrooms(c.classrooms);
    setFolders(f.folders);
  }, [token]);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load")
    );
  }, [load]);

  async function createClass(e: FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    const res = await classroomsApi.create(token, name.trim());
    setClassrooms((prev) => [res.classroom, ...prev]);
    setName("");
  }

  async function joinClass(e: FormEvent) {
    e.preventDefault();
    if (!token || !code.trim()) return;
    const res = await classroomsApi.join(token, code.trim());
    setClassrooms((prev) => {
      if (prev.some((c) => c._id === res.classroom._id)) return prev;
      return [res.classroom, ...prev];
    });
    setCode("");
  }

  async function assign() {
    if (!token || !selectedId || !folderId) return;
    const res = await classroomsApi.assignFolder(token, selectedId, folderId);
    setClassrooms((prev) =>
      prev.map((c) => (c._id === res.classroom._id ? res.classroom : c))
    );
  }

  return (
    <div className="page-shell-wide">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Classroom / family
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Teachers create a class and assign folders. Learners join with an invite
        code. Same account syncs across devices via the cloud API.
      </p>
      {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <form
          onSubmit={createClass}
          className="rounded-2xl border border-[var(--line)] p-5"
        >
          <h2 className="font-medium">Create classroom</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class name"
            className="mt-3 w-full rounded-xl border border-[var(--line)] px-3 py-2"
            required
          />
          <button
            type="submit"
            className="mt-3 rounded-xl bg-[var(--moss)] px-4 py-2 text-sm text-white"
          >
            Create
          </button>
        </form>
        <form
          onSubmit={joinClass}
          className="rounded-2xl border border-[var(--line)] p-5"
        >
          <h2 className="font-medium">Join with code</h2>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invite code"
            className="mt-3 w-full rounded-xl border border-[var(--line)] px-3 py-2 uppercase"
            required
          />
          <button
            type="submit"
            className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            Join
          </button>
        </form>
      </div>

      <ul className="mt-8 space-y-4">
        {classrooms.map((c) => (
          <li
            key={c._id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-[family-name:var(--font-display)]">
                  {c.name}
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  Invite: <strong>{c.inviteCode}</strong> · members{" "}
                  {c.memberIds?.length || 0}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(c._id)}
                className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
              >
                Assign folder
              </button>
            </div>
            {selectedId === c._id && (
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="rounded-lg border border-[var(--line)] px-2 py-1.5 text-sm"
                >
                  <option value="">Select folder…</option>
                  {folders.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={assign}
                  className="rounded-lg bg-[var(--moss)] px-3 py-1.5 text-sm text-white"
                >
                  Assign
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ClassroomPage() {
  return (
    <RequireAuth>
      <ClassroomContent />
    </RequireAuth>
  );
}
