"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RefObject } from "react";
import {
  accountRequest,
  isLearnerProgress,
  isWeeklyGoal,
  type AccountFailure,
  type LearnerProgress,
  type WeeklyGoal,
} from "@/lib/account-api";

const goalOptions = [2, 3, 5, 7] as const;

export function ProgressPanel() {
  const errorRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [targetDays, setTargetDays] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (failure) errorRef.current?.focus();
  }, [failure]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      accountRequest<LearnerProgress>("me/progress", {
        validateData: isLearnerProgress,
      }),
      accountRequest<WeeklyGoal>("me/weekly-goal", {
        validateData: isWeeklyGoal,
      }),
    ]).then(([progressResult, goalResult]) => {
      if (!active) return;
      setLoading(false);
      if (!progressResult.ok) {
        setFailure(progressResult.failure);
        return;
      }
      if (!goalResult.ok) {
        setFailure(goalResult.failure);
        return;
      }
      if (!progressResult.data || !goalResult.data) {
        setFailure({ message: "Réponse API invalide : les données de progression sont absentes." });
        return;
      }
      setProgress(progressResult.data);
      setGoal(goalResult.data);
      setTargetDays(String(goalResult.data.targetDays));
    });
    return () => {
      active = false;
    };
  }, []);

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    setNotice("");
    const parsedDays = Number(targetDays);
    if (!goalOptions.includes(parsedDays as (typeof goalOptions)[number])) {
      setFailure({ message: "Choisissez un objectif de 2, 3, 5 ou 7 jours par semaine." });
      return;
    }

    setSaving(true);
    const result = await accountRequest<WeeklyGoal>("me/weekly-goal", {
      method: "PUT",
      body: { targetDays: parsedDays },
      validateData: isWeeklyGoal,
    });
    setSaving(false);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    if (!result.data) {
      setFailure({ message: "Réponse API invalide : l’objectif enregistré est absent." });
      return;
    }
    setGoal(result.data);
    setTargetDays(String(result.data.targetDays));
    setNotice("Votre objectif hebdomadaire a été enregistré.");
  }

  if (loading) return <p className="loading-inline" role="status">Chargement de la progression…</p>;
  if (failure?.status === 401) {
    return <AccountFailure failure={failure} refElement={errorRef} />;
  }
  if (!progress || !goal) {
    return (
      <AccountFailure
        failure={failure ?? { message: "Les données de progression ne sont pas disponibles." }}
        refElement={errorRef}
      />
    );
  }

  return (
    <>
      {failure ? <AccountFailure failure={failure} refElement={errorRef} /> : null}
      {notice ? <p className="success-notice" role="status">{notice}</p> : null}

      <section className="account-summary-grid" aria-label="Résumé de progression">
        <article className="detail-panel">
          <h2>Parcours suivis</h2>
          <p className="summary-number">{progress.pathways.length}</p>
        </article>
        <article className="detail-panel">
          <h2>Séances suivies</h2>
          <p className="summary-number">{progress.lessonProgress.length}</p>
        </article>
        <article className="detail-panel">
          <h2>Projets suivis</h2>
          <p className="summary-number">{progress.projectProgress.length}</p>
        </article>
        <article className="detail-panel">
          <h2>Jours actifs reçus</h2>
          <p className="summary-number">{progress.activeDays.length}</p>
        </article>
      </section>

      <section className="content-section" aria-labelledby="project-progress-heading">
        <h2 id="project-progress-heading">Projets</h2>
        {progress.projectProgress.length === 0 ? (
          <p className="empty-state">Aucune progression de projet synchronisée n’a été renvoyée.</p>
        ) : (
          <ul className="account-list">
            {progress.projectProgress.map((entry) => (
              <li className="account-list-item" key={entry.projectId}>
                <div>
                  <h3>Projet {entry.projectId}</h3>
                  <p>
                    État : {statusLabel(entry.status)} · {entry.checkedItemIds.length} critères cochés
                  </p>
                  {entry.url ? (
                    <a href={entry.url} target="_blank" rel="noreferrer">
                      Ouvrir le lien du projet
                      <span className="visually-hidden"> (s’ouvre dans un nouvel onglet)</span>
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="content-section" aria-labelledby="weekly-goal-heading">
        <h2 id="weekly-goal-heading">Objectif hebdomadaire</h2>
        <form className="inline-form" onSubmit={saveGoal}>
          <div className="form-field">
            <label htmlFor="weekly-goal">Jours d’apprentissage visés par semaine</label>
            <select
              id="weekly-goal"
              value={targetDays}
              onChange={(event) => setTargetDays(event.target.value)}
            >
              {goalOptions.map((days) => (
                <option key={days} value={days}>{days} jours</option>
              ))}
            </select>
          </div>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer l’objectif"}
          </button>
        </form>
        <p className="field-hint">
          Dernière mise à jour : {formatDate(goal.updatedAt)}. Les jours actifs sont fournis séparément par l’API.
        </p>
      </section>

      <section className="content-section" aria-labelledby="pathways-progress-heading">
        <h2 id="pathways-progress-heading">Parcours</h2>
        {progress.pathways.length === 0 ? (
          <p className="empty-state">Aucun parcours synchronisé ne figure dans les données reçues.</p>
        ) : (
          <ul className="account-list">
            {progress.pathways.map((entry) => (
              <li className="account-list-item" key={entry.pathwayId}>
                <div>
                  <h3>Parcours {entry.pathwayId}</h3>
                  <p>
                    État : {statusLabel(entry.status)} · Plan : {planLabel(entry.plan)}
                  </p>
                  <p>{entry.completedLessonIds.length} séances terminées selon l’API.</p>
                </div>
                <Link
                  className="button button-secondary"
                  href={`/parcours/${encodeURIComponent(entry.pathwayId)}`}
                >
                  Ouvrir le parcours
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="content-section" aria-labelledby="lesson-progress-heading">
        <h2 id="lesson-progress-heading">Séances enregistrées</h2>
        <p className="field-hint">
          Pour synchroniser une séance, utilisez le bouton proposé sur sa page de cours.
        </p>
        {progress.lessonProgress.length === 0 ? (
          <p className="empty-state">Aucune progression de séance synchronisée n’a été renvoyée.</p>
        ) : (
          <ul className="account-list">
            {progress.lessonProgress.map((entry) => (
              <li className="account-list-item" key={entry.lessonId}>
                <div>
                  <h3>Séance {entry.lessonId}</h3>
                  <p>{entry.status === "completed" ? "Terminée" : "En cours"} · mise à jour {formatDate(entry.updatedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function statusLabel(status: LearnerProgress["pathways"][number]["status"]) {
  return {
    not_started: "non commencé",
    in_progress: "en cours",
    completed: "terminé",
    archived: "archivé",
  }[status];
}

function planLabel(plan: LearnerProgress["pathways"][number]["plan"]) {
  return {
    two_weeks: "2 semaines",
    four_weeks: "4 semaines",
    eight_weeks: "8 semaines",
    flex: "flexible",
  }[plan];
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr", { dateStyle: "medium" }).format(date);
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
      <h2>{failure.status === 401 ? "Connexion nécessaire" : "Impossible de charger la progression"}</h2>
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
