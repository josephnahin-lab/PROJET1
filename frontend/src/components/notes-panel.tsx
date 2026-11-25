"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RefObject } from "react";
import {
  accountRequest,
  accountRequestPaginated,
  isNoteData,
  isNoteList,
  type AccountFailure,
  type LearnerNote,
  type PageMeta,
} from "@/lib/account-api";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function NotesPanel({ initialLessonId = "" }: { initialLessonId?: string }) {
  const errorRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<LearnerNote[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lessonId, setLessonId] = useState(initialLessonId);
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (failure) errorRef.current?.focus();
  }, [failure]);

  useEffect(() => {
    let active = true;
    void loadNotes().then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setFailure(result.failure);
        return;
      }
      setNotes(result.data.data);
      setMeta(result.data.meta);
    });
    return () => {
      active = false;
    };
  }, []);

  async function loadNotes(cursor?: string) {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    return accountRequestPaginated(`me/notes?${query.toString()}`, isNoteList);
  }

  async function loadMore() {
    if (!meta?.nextCursor) return;
    setFailure(null);
    const result = await loadNotes(meta.nextCursor);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    setNotes((current) => [...current, ...result.data.data]);
    setMeta(result.data.meta);
  }

  function startEditing(note: LearnerNote) {
    setEditingId(note.id);
    setLessonId(note.lessonId);
    setBody(note.body);
    setFailure(null);
    setNotice("");
    document.getElementById("note-lesson-id")?.focus();
  }

  function resetForm() {
    setEditingId(null);
    setLessonId("");
    setBody("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    setNotice("");
    const normalizedLessonId = lessonId.trim();
    if (!uuidPattern.test(normalizedLessonId)) {
      setFailure({ message: "Saisissez un identifiant de séance au format UUID valide." });
      return;
    }
    if (body.length > 10000) {
      setFailure({ message: "Une note ne peut pas dépasser 10 000 caractères." });
      return;
    }

    setSaving(true);
    const result = await accountRequest<LearnerNote>("me/notes", {
      method: "POST",
      body: { lessonId: normalizedLessonId, body },
      validateData: isNoteData,
    });
    setSaving(false);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    if (!result.data) {
      setFailure({ message: "Réponse API invalide : la note enregistrée est absente." });
      return;
    }

    const savedNote = result.data;
    setNotes((current) => {
      const existing = current.findIndex((note) => note.id === savedNote.id);
      if (existing < 0) return [savedNote, ...current];
      return current.map((note) => note.id === savedNote.id ? savedNote : note);
    });
    resetForm();
    setNotice("Votre note a été enregistrée.");
  }

  async function deleteNote(note: LearnerNote) {
    const confirmed = window.confirm("Supprimer définitivement cette note ?");
    if (!confirmed) return;
    setFailure(null);
    setNotice("");
    const result = await accountRequest<null>(`me/notes/${encodeURIComponent(note.id)}`, {
      method: "DELETE",
      noContent: true,
    });
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    setNotes((current) => current.filter((entry) => entry.id !== note.id));
    if (editingId === note.id) resetForm();
    setNotice("La note a été supprimée.");
  }

  if (loading) return <p className="loading-inline" role="status">Chargement des notes…</p>;
  if (failure?.status === 401) {
    return <AccountFailure failure={failure} refElement={errorRef} />;
  }

  return (
    <>
      {failure ? <AccountFailure failure={failure} refElement={errorRef} /> : null}
      {notice ? <p className="success-notice" role="status">{notice}</p> : null}
      <form className="account-form note-form" onSubmit={submit}>
        <h2>{editingId ? "Modifier une note" : "Ajouter une note"}</h2>
        <p className="field-hint">
          Une note est rattachée à une séance par son UUID. Le contrat enregistre
          les créations et modifications avec POST /me/notes.
        </p>
        <div className="form-field">
          <label htmlFor="note-lesson-id">Identifiant UUID de la séance</label>
          <input
            id="note-lesson-id"
            autoComplete="off"
            required
            value={lessonId}
            aria-describedby="note-lesson-hint"
            onChange={(event) => setLessonId(event.target.value)}
          />
          <p className="field-hint" id="note-lesson-hint">
            Copiez l’identifiant d’une séance disponible dans un parcours.
          </p>
        </div>
        <div className="form-field">
          <label htmlFor="note-body">Votre note</label>
          <textarea
            id="note-body"
            rows={6}
            maxLength={10000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <p className="field-hint">{body.length}/10 000 caractères.</p>
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Ajouter la note"}
          </button>
          {editingId ? (
            <button className="button button-secondary" type="button" onClick={resetForm}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <section className="content-section" aria-labelledby="notes-list-heading">
        <h2 id="notes-list-heading">Mes notes</h2>
        {notes.length === 0 ? (
          <p className="empty-state">Aucune note n’a été renvoyée par votre compte.</p>
        ) : (
          <ul className="account-list">
            {notes.map((note) => (
              <li className="account-list-item note-item" key={note.id}>
                <div>
                  <p className="card-kicker">Séance {note.lessonId}</p>
                  <p className="note-body">{note.body}</p>
                  <p className="field-hint">Modifiée : {formatDate(note.updatedAt)}</p>
                </div>
                <div className="form-actions">
                  <button className="button button-secondary" type="button" onClick={() => startEditing(note)}>
                    Modifier
                  </button>
                  <button className="button button-danger" type="button" onClick={() => void deleteNote(note)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {meta?.hasMore && meta.nextCursor ? (
          <button className="button button-secondary load-more" type="button" onClick={() => void loadMore()}>
            Charger les notes suivantes
          </button>
        ) : null}
      </section>
    </>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function AccountFailure({
  failure,
  refElement,
}: {
  failure: AccountFailure;
  refElement?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="error-panel" role="alert" tabIndex={-1} ref={refElement}>
      <h2>{failure.status === 401 ? "Connexion nécessaire" : "Impossible de traiter les notes"}</h2>
      <p>{failure.message}</p>
      {failure.status === 401 ? (
        <Link className="button button-primary" href="/connexion">Se connecter</Link>
      ) : failure.status ? (
        <p className="error-code">Réponse de l’API : HTTP {failure.status}.</p>
      ) : null}
      {failure.fields ? (
        <ul className="validation-errors">
          {Object.entries(failure.fields).flatMap(([field, messages]) =>
            messages.map((message, index) => (
              <li key={`${field}-${index}`}>{field} : {message}</li>
            )),
          )}
        </ul>
      ) : null}
    </div>
  );
}
