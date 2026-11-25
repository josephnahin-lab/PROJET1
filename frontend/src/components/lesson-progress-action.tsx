"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  accountRequest,
  isLessonProgress,
  type AccountFailure,
  type LessonProgress,
} from "@/lib/account-api";

export function LessonProgressAction({ lessonId }: { lessonId: string }) {
  const errorRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"in_progress" | "completed">("completed");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (failure) errorRef.current?.focus();
  }, [failure]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    setNotice("");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lessonId)) {
      setFailure({ message: "Identifiant de séance invalide : aucune modification n’a été envoyée." });
      return;
    }

    setSaving(true);
    const result = await accountRequest<LessonProgress>("me/lesson-progress", {
      method: "PUT",
      body: { lessonId, status },
      extraHeaders: { "Idempotency-Key": crypto.randomUUID() },
      validateData: isLessonProgress,
    });
    setSaving(false);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    if (!result.data) {
      setFailure({ message: "Réponse API invalide : la progression enregistrée est absente." });
      return;
    }
    setNotice(
      result.data.status === "completed"
        ? "Cette séance est marquée comme terminée dans votre compte."
        : "Cette séance est marquée comme en cours dans votre compte.",
    );
  }

  return (
    <section className="activity-panel" aria-labelledby="sync-lesson-heading">
      <h2 id="sync-lesson-heading">Synchroniser ma progression</h2>
      <p>
        Cette action enregistre explicitement l’état de cette séance dans votre compte.
        Le mode invité reste disponible sans synchronisation.
      </p>
      {failure ? (
        <div className="error-panel form-error" role="alert" tabIndex={-1} ref={errorRef}>
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
      ) : null}
      {notice ? <p className="success-notice" role="status">{notice}</p> : null}
      <form className="inline-form" onSubmit={submit}>
        <div className="form-field">
          <label htmlFor={`lesson-status-${lessonId}`}>État à enregistrer</label>
          <select
            id={`lesson-status-${lessonId}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as "in_progress" | "completed")}
          >
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
          </select>
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer ma progression"}
        </button>
      </form>
    </section>
  );
}
