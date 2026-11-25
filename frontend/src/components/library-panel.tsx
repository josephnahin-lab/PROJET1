"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RefObject } from "react";
import {
  accountRequest,
  accountRequestPaginated,
  isSavedResourceData,
  isSavedResourceList,
  type AccountFailure,
  type PageMeta,
  type SavedResource,
} from "@/lib/account-api";
import { isSafePublicHttpsUrl } from "@/lib/guards";

export function LibraryPanel() {
  const errorRef = useRef<HTMLDivElement>(null);
  const [resources, setResources] = useState<SavedResource[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (failure) errorRef.current?.focus();
  }, [failure]);

  useEffect(() => {
    let active = true;
    void loadResources().then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setFailure(result.failure);
        return;
      }
      setResources(result.data.data);
      setMeta(result.data.meta);
    });
    return () => {
      active = false;
    };
  }, []);

  async function loadResources(cursor?: string) {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    return accountRequestPaginated(
      `me/saved-resources?${query.toString()}`,
      isSavedResourceList,
    );
  }

  async function loadMore() {
    if (!meta?.nextCursor) return;
    setFailure(null);
    const result = await loadResources(meta.nextCursor);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    setResources((current) => [...current, ...result.data.data]);
    setMeta(result.data.meta);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    setNotice("");
    const cleanUrl = url.trim();
    const cleanTitle = title.trim();
    const cleanSource = source.trim();
    if (!isSafePublicHttpsUrl(cleanUrl) || cleanUrl.length > 1000) {
      setFailure({
        message:
          "Saisissez une URL HTTPS valide (1 000 caractères maximum), sans identifiants ni hôte local.",
      });
      return;
    }
    if (cleanTitle.length < 1 || cleanTitle.length > 180) {
      setFailure({ message: "Le titre doit contenir entre 1 et 180 caractères." });
      return;
    }
    if (cleanSource.length > 100) {
      setFailure({ message: "La source ne peut pas dépasser 100 caractères." });
      return;
    }

    setSaving(true);
    const result = await accountRequest<SavedResource>("me/saved-resources", {
      method: "POST",
      body: {
        url: cleanUrl,
        title: cleanTitle,
        ...(cleanSource ? { source: cleanSource } : {}),
      },
      validateData: isSavedResourceData,
    });
    setSaving(false);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    if (!result.data) {
      setFailure({ message: "Réponse API invalide : la ressource enregistrée est absente." });
      return;
    }
    const savedResource = result.data;
    setResources((current) => [savedResource, ...current]);
    setUrl("");
    setTitle("");
    setSource("");
    setNotice("La ressource a été ajoutée à votre bibliothèque.");
  }

  async function remove(resource: SavedResource) {
    if (!window.confirm(`Retirer « ${resource.title} » de votre bibliothèque ?`)) return;
    setFailure(null);
    setNotice("");
    const result = await accountRequest<null>(
      `me/saved-resources/${encodeURIComponent(resource.id)}`,
      { method: "DELETE", noContent: true },
    );
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    setResources((current) => current.filter((entry) => entry.id !== resource.id));
    setNotice("La ressource a été retirée de votre bibliothèque.");
  }

  if (loading) return <p className="loading-inline" role="status">Chargement de la bibliothèque…</p>;
  if (failure?.status === 401) {
    return <AccountFailure failure={failure} refElement={errorRef} />;
  }

  return (
    <>
      {failure ? <AccountFailure failure={failure} refElement={errorRef} /> : null}
      {notice ? <p className="success-notice" role="status">{notice}</p> : null}
      <form className="account-form note-form" onSubmit={submit}>
        <h2>Enregistrer une ressource</h2>
        <div className="form-field">
          <label htmlFor="saved-url">Adresse HTTPS</label>
          <input
            id="saved-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            required
            maxLength={1000}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <p className="field-hint">
            Les liens HTTP, les adresses locales et les IP non publiques sont refusés.
          </p>
        </div>
        <div className="form-field">
          <label htmlFor="saved-title">Titre</label>
          <input
            id="saved-title"
            required
            minLength={1}
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="saved-source">Source (facultatif)</label>
          <input
            id="saved-source"
            maxLength={100}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Ajouter à la bibliothèque"}
        </button>
      </form>

      <section className="content-section" aria-labelledby="library-list-heading">
        <h2 id="library-list-heading">Ressources enregistrées</h2>
        {resources.length === 0 ? (
          <p className="empty-state">Aucune ressource n’a été renvoyée par votre compte.</p>
        ) : (
          <ul className="account-list">
            {resources.map((resource) => (
              <li className="account-list-item" key={resource.id}>
                <div>
                  <h3>
                    {isSafePublicHttpsUrl(resource.url) ? (
                      <a href={resource.url} target="_blank" rel="noreferrer">
                        {resource.title}
                        <span className="visually-hidden">
                          {" "}
                          (s’ouvre dans un nouvel onglet)
                        </span>
                      </a>
                    ) : resource.title}
                  </h3>
                  {resource.source ? <p>{resource.source}</p> : null}
                  <p className="field-hint">Ajoutée : {formatDate(resource.createdAt)}</p>
                </div>
                <button className="button button-danger" type="button" onClick={() => void remove(resource)}>
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
        {meta?.hasMore && meta.nextCursor ? (
          <button className="button button-secondary load-more" type="button" onClick={() => void loadMore()}>
            Charger les ressources suivantes
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
      <h2>{failure.status === 401 ? "Connexion nécessaire" : "Impossible de traiter la bibliothèque"}</h2>
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
