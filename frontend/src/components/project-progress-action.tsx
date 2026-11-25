"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  accountRequest,
  isLearnerProgress,
  isProjectProgressData,
  type AccountFailure,
  type LearnerProgress,
  type ProjectProgress,
} from "@/lib/account-api";
import type { ProjectBrief } from "@/lib/types";
import { isSafePublicHttpsUrl } from "@/lib/guards";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ProjectStatus = "not_started" | "in_progress" | "completed";

export function ProjectProgressAction({ project }: { project: ProjectBrief }) {
  const errorRef = useRef<HTMLDivElement>(null);
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ProjectStatus>("not_started");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountAvailable, setAccountAvailable] = useState(false);
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (failure) errorRef.current?.focus();
  }, [failure]);

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      await Promise.resolve();
      if (!active) return;

      const localProgress = readLocalProgress(project.id);
      if (localProgress) {
        setCheckedItemIds(localProgress.checkedItemIds);
        setStatus(localProgress.status);
        setUrl(localProgress.url ?? "");
      }

      const result = await accountRequest<LearnerProgress>("me/progress", {
        validateData: isLearnerProgress,
      });
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        if (result.failure.status !== 401) setFailure(result.failure);
        return;
      }
      if (!result.data) return;
      setAccountAvailable(true);
      const saved = result.data.projectProgress.find((entry) => entry.projectId === project.id);
      if (saved && isProjectProgressData(saved)) {
        setCheckedItemIds(saved.checkedItemIds);
        setStatus(saved.status);
        setUrl(saved.url ?? "");
      }
    }

    void loadProgress();

    return () => {
      active = false;
    };
  }, [project.id]);

  function toggleItem(stableKey: string) {
    setCheckedItemIds((current) =>
      current.includes(stableKey)
        ? current.filter((key) => key !== stableKey)
        : [...current, stableKey],
    );
    setNotice("");
  }

  async function saveProgress() {
    setFailure(null);
    setNotice("");
    if (!uuidPattern.test(project.id)) {
      setFailure({ message: "Identifiant de projet invalide : aucune modification n’a été envoyée." });
      return;
    }
    if (project.checklist.length > 50 || project.checklist.some((item) => item.stableKey.length > 120)) {
      setFailure({ message: "La checklist dépasse les limites prises en charge pour la synchronisation." });
      return;
    }
    const normalizedUrl = url.trim();
    if (normalizedUrl && !isSafePublicHttpsUrl(normalizedUrl, 500)) {
      setFailure({ message: "Le lien doit être une URL HTTPS valide de 500 caractères maximum." });
      return;
    }

    const payload = {
      status,
      checkedItemIds,
      url: normalizedUrl || null,
    };
    if (!accountAvailable) {
      persistLocalProgress(project.id, { projectId: project.id, ...payload, updatedAt: new Date().toISOString() });
      setNotice("Progression conservée dans ce navigateur uniquement; connectez-vous pour la synchroniser.");
      return;
    }

    setSaving(true);
    const result = await accountRequest<ProjectProgress>(
      `me/project-progress/${encodeURIComponent(project.id)}`,
      { method: "PUT", body: payload, validateData: isProjectProgressData },
    );
    setSaving(false);
    if (!result.ok) {
      if (result.failure.status === 401) {
        setAccountAvailable(false);
        persistLocalProgress(project.id, { projectId: project.id, ...payload, updatedAt: new Date().toISOString() });
        setNotice("Votre session a expiré. La progression a été conservée dans ce navigateur.");
      }
      setFailure(result.failure);
      return;
    }
    if (!result.data) {
      setFailure({ message: "Réponse API invalide : la progression de projet est absente." });
      return;
    }
    setCheckedItemIds(result.data.checkedItemIds);
    setStatus(result.data.status);
    setUrl(result.data.url ?? "");
    setNotice("Votre progression de projet a été synchronisée avec votre compte.");
  }

  const checkedCount = checkedItemIds.filter((key) =>
    project.checklist.some((item) => item.stableKey === key),
  ).length;

  return (
    <section className="project-progress-panel" aria-labelledby={`project-progress-${project.id}`}>
      <div className="project-progress-heading">
        <div>
          <p className="card-kicker">Votre progression</p>
          <h4 id={`project-progress-${project.id}`}>Checklist du projet</h4>
        </div>
        <span className="duration">{checkedCount}/{project.checklist.length} critères</span>
      </div>
      {project.checklist.length > 0 ? (
        <ul className="project-checklist">
          {project.checklist.map((item) => (
            <li key={item.stableKey}>
              <label>
                <input
                  type="checkbox"
                  checked={checkedItemIds.includes(item.stableKey)}
                  onChange={() => toggleItem(item.stableKey)}
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="field-hint">Aucun critère n’est défini pour ce projet.</p>
      )}
      <div className="project-progress-controls">
        <div className="form-field">
          <label htmlFor={`project-status-${project.id}`}>État</label>
          <select
            id={`project-status-${project.id}`}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ProjectStatus);
              setNotice("");
            }}
          >
            <option value="not_started">À commencer</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor={`project-url-${project.id}`}>Lien de réalisation (facultatif)</label>
          <input
            id={`project-url-${project.id}`}
            type="url"
            maxLength={500}
            placeholder="https://…"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setNotice("");
            }}
          />
        </div>
      </div>
      {failure ? (
        <div className="error-panel form-error" role="alert" tabIndex={-1} ref={errorRef}>
          <p>{failure.message}</p>
          {failure.status === 401 ? (
            <Link className="button button-primary" href="/connexion">Se connecter pour synchroniser</Link>
          ) : failure.status ? (
            <p className="error-code">Réponse de l’API : HTTP {failure.status}.</p>
          ) : null}
          {failure.fields ? (
            <ul className="validation-errors">
              {Object.entries(failure.fields).flatMap(([field, messages]) =>
                messages.map((message, index) => <li key={`${field}-${index}`}>{field} : {message}</li>),
              )}
            </ul>
          ) : null}
        </div>
      ) : null}
      {notice ? <p className="success-notice" role="status">{notice}</p> : null}
      <div className="form-actions">
        <button className="button button-primary" type="button" onClick={() => void saveProgress()} disabled={saving || loading}>
          {loading ? "Chargement…" : saving ? "Synchronisation…" : "Enregistrer ma progression"}
        </button>
        {!accountAvailable && !loading && failure?.status !== 401 ? (
          <span className="field-hint">
            Mode invité : progression conservée dans ce navigateur.{" "}
            <Link href="/connexion">Se connecter pour synchroniser</Link>
          </span>
        ) : null}
      </div>
    </section>
  );
}

function localKey(projectId: string) {
  return `librescence:project-progress:v1:${projectId}`;
}

function readLocalProgress(projectId: string): ProjectProgress | null {
  try {
    const value = window.localStorage.getItem(localKey(projectId));
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    return isProjectProgressData(parsed) && parsed.projectId === projectId ? parsed : null;
  } catch {
    return null;
  }
}

function persistLocalProgress(projectId: string, value: ProjectProgress) {
  try {
    window.localStorage.setItem(localKey(projectId), JSON.stringify(value));
  } catch {
    // Private browsing or a full storage quota should not block API synchronization.
  }
}
