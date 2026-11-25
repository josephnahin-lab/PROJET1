"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RefObject } from "react";
import {
  accountDownload,
  accountRequest,
  accountRequestPaginated,
  isPortfolioAttachment,
  isPortfolioItem,
  isPortfolioItemList,
  type AccountFailure,
  type PortfolioAttachment,
  type PortfolioItem,
  type PageMeta,
} from "@/lib/account-api";
import { isSafePublicHttpsUrl } from "@/lib/guards";

type PortfolioForm = {
  title: string;
  description: string;
  domainId: string;
  projectDate: string;
  skills: string;
  difficulties: string;
  learnings: string;
  url: string;
};

const emptyForm: PortfolioForm = {
  title: "",
  description: "",
  domainId: "",
  projectDate: "",
  skills: "",
  difficulties: "",
  learnings: "",
  url: "",
};

const attachmentTypes: PortfolioAttachment["mediaType"][] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const attachmentDownloadExtensions: Record<PortfolioAttachment["mediaType"], string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getAttachmentDownloadName(mediaType: PortfolioAttachment["mediaType"]): string {
  return `portfolio-attachment.${attachmentDownloadExtensions[mediaType]}`;
}

export function PortfolioPanel() {
  const errorRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [form, setForm] = useState<PortfolioForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (failure) errorRef.current?.focus();
  }, [failure]);

  useEffect(() => {
    let active = true;
    void loadItems().then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setFailure(result.failure);
        return;
      }
      setItems(result.data.data);
      setMeta(result.data.meta);
    });
    return () => {
      active = false;
    };
  }, []);

  async function loadItems(cursor?: string) {
    const query = new URLSearchParams({ limit: "50" });
    if (cursor) query.set("cursor", cursor);
    return accountRequestPaginated(`me/portfolio?${query.toString()}`, isPortfolioItemList);
  }

  function startEditing(item: PortfolioItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      domainId: item.domainId ?? "",
      projectDate: item.projectDate ?? "",
      skills: item.skills ?? "",
      difficulties: item.difficulties ?? "",
      learnings: item.learnings ?? "",
      url: item.url ?? "",
    });
    setFailure(null);
    setNotice("");
    document.getElementById("portfolio-title")?.focus();
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    setNotice("");
    const normalized = {
      title: form.title.trim(),
      description: form.description.trim(),
      domainId: form.domainId.trim() || null,
      projectDate: form.projectDate || null,
      skills: form.skills.trim(),
      difficulties: form.difficulties.trim(),
      learnings: form.learnings.trim(),
      url: form.url.trim(),
    };
    if (!normalized.title || normalized.title.length > 100) {
      setFailure({ message: "Le titre doit contenir entre 1 et 100 caractères." });
      return;
    }
    if (!normalized.description || normalized.description.length > 3000) {
      setFailure({ message: "La description doit contenir entre 1 et 3 000 caractères." });
      return;
    }
    if (normalized.domainId && normalized.domainId.length > 100) {
      setFailure({ message: "L’identifiant du domaine ne peut pas dépasser 100 caractères." });
      return;
    }
    if (normalized.projectDate && !isValidDate(normalized.projectDate)) {
      setFailure({ message: "Saisissez une date de projet valide." });
      return;
    }
    if (normalized.skills.length > 500 || normalized.difficulties.length > 1500 || normalized.learnings.length > 1500) {
      setFailure({ message: "Vérifiez les limites de longueur des compétences, difficultés et apprentissages." });
      return;
    }
    if (normalized.url && !isSafePublicHttpsUrl(normalized.url, 500)) {
      setFailure({ message: "Le lien doit être une URL HTTPS valide de 500 caractères maximum." });
      return;
    }

    const body = {
      title: normalized.title,
      description: normalized.description,
      domainId: normalized.domainId,
      projectDate: normalized.projectDate,
      skills: normalized.skills,
      difficulties: normalized.difficulties,
      learnings: normalized.learnings,
      ...(editingId
        ? { url: normalized.url || null }
        : normalized.url
          ? { url: normalized.url }
          : {}),
    };
    setSaving(true);
    const result = await accountRequest<PortfolioItem>(
      editingId ? `me/portfolio/${encodeURIComponent(editingId)}` : "me/portfolio",
      {
        method: editingId ? "PATCH" : "POST",
        body,
        ...(editingId ? {} : { extraHeaders: { "Idempotency-Key": crypto.randomUUID() } }),
        validateData: isPortfolioItem,
      },
    );
    setSaving(false);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    if (!result.data) {
      setFailure({ message: "Réponse API invalide : la fiche enregistrée est absente." });
      return;
    }
    const saved = result.data;
    setItems((current) => {
      const existing = current.findIndex((item) => item.id === saved.id);
      return existing < 0
        ? [saved, ...current]
        : current.map((item) => (item.id === saved.id ? saved : item));
    });
    resetForm();
    setNotice(editingId ? "Votre fiche privée a été modifiée." : "Votre fiche privée a été créée.");
  }

  async function deleteItem(item: PortfolioItem) {
    if (!window.confirm(`Supprimer « ${item.title} » et ses pièces jointes privées ?`)) return;
    setFailure(null);
    setNotice("");
    const result = await accountRequest<null>(
      `me/portfolio/${encodeURIComponent(item.id)}`,
      { method: "DELETE", noContent: true },
    );
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    if (editingId === item.id) resetForm();
    setNotice("La fiche et ses pièces jointes ont été supprimées.");
  }

  async function loadMore() {
    if (!meta?.nextCursor) return;
    setFailure(null);
    const result = await loadItems(meta.nextCursor);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    setItems((current) => [...current, ...result.data.data]);
    setMeta(result.data.meta);
  }

  function updateAttachment(itemId: string, attachment: PortfolioAttachment) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              attachments: [
                ...item.attachments.filter((entry) => entry.id !== attachment.id),
                attachment,
              ],
            }
          : item,
      ),
    );
  }

  function removeAttachment(itemId: string, attachmentId: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, attachments: item.attachments.filter((file) => file.id !== attachmentId) }
          : item,
      ),
    );
  }

  if (loading) {
    return <p className="loading-inline" role="status">Chargement de votre portfolio privé…</p>;
  }
  if (failure?.status === 401) {
    return <PortfolioFailure failure={failure} refElement={errorRef} />;
  }

  return (
    <>
      {failure ? <PortfolioFailure failure={failure} refElement={errorRef} /> : null}
      {notice ? <p className="success-notice" role="status">{notice}</p> : null}
      <aside className="notice-panel" aria-label="Confidentialité du portfolio">
        <h2>Votre espace privé</h2>
        <p>
          Ces fiches et leurs fichiers ne sont visibles que dans votre compte.
          Aucun contenu public ni lien de stockage n’est créé.
        </p>
      </aside>

      <form className="account-form portfolio-form" onSubmit={submit}>
        <h2>{editingId ? "Modifier une fiche" : "Ajouter un projet à mon portfolio"}</h2>
        <div className="form-field">
          <label htmlFor="portfolio-title">Titre du projet</label>
          <input
            id="portfolio-title"
            required
            maxLength={100}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="portfolio-description">Description</label>
          <textarea
            id="portfolio-description"
            required
            maxLength={3000}
            rows={5}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
        <div className="portfolio-fields-grid">
          <div className="form-field">
            <label htmlFor="portfolio-domain">Identifiant du domaine (facultatif)</label>
            <input
              id="portfolio-domain"
              maxLength={100}
              value={form.domainId}
              onChange={(event) => setForm({ ...form, domainId: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="portfolio-date">Date du projet</label>
            <input
              id="portfolio-date"
              type="date"
              value={form.projectDate}
              onChange={(event) => setForm({ ...form, projectDate: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="portfolio-skills">Compétences (500 caractères max.)</label>
            <textarea
              id="portfolio-skills"
              maxLength={500}
              rows={3}
              value={form.skills}
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="portfolio-difficulties">Difficultés rencontrées</label>
            <textarea
              id="portfolio-difficulties"
              maxLength={1500}
              rows={3}
              value={form.difficulties}
              onChange={(event) => setForm({ ...form, difficulties: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="portfolio-learnings">Apprentissages</label>
            <textarea
              id="portfolio-learnings"
              maxLength={1500}
              rows={3}
              value={form.learnings}
              onChange={(event) => setForm({ ...form, learnings: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="portfolio-url">Lien HTTPS facultatif</label>
            <input
              id="portfolio-url"
              type="url"
              maxLength={500}
              placeholder="https://…"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
            />
            <p className="field-hint">Le lien ne rend pas la fiche publique.</p>
          </div>
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer ma fiche"}
          </button>
          {editingId ? (
            <button className="button button-secondary" type="button" onClick={resetForm}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <section className="content-section" aria-labelledby="portfolio-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Visible uniquement par vous</p>
            <h2 id="portfolio-list-heading">Mes projets</h2>
          </div>
          <span>{items.length}{meta?.hasMore ? "+" : ""} fiche(s) chargée(s)</span>
        </div>
        {items.length === 0 ? (
          <p className="empty-state">Votre portfolio est vide. Ajoutez une fiche pour garder une trace de vos projets.</p>
        ) : (
          <div className="portfolio-list">
            {items.map((item) => (
              <article className="portfolio-card" key={item.id}>
                <details>
                  <summary>
                    <span>
                      <strong>{item.title}</strong>
                      <span className="portfolio-summary-meta">
                        {item.projectDate ? formatDate(item.projectDate) : "Date non renseignée"}
                        {" · "}Modifié le {formatDate(item.updatedAt)}
                      </span>
                    </span>
                    <span aria-hidden="true">⌄</span>
                  </summary>
                  <div className="portfolio-card-body">
                    <p className="portfolio-description">{item.description}</p>
                    {item.domainId ? <p><strong>Domaine :</strong> {item.domainId}</p> : null}
                    {item.skills ? <p><strong>Compétences :</strong> {item.skills}</p> : null}
                    {item.difficulties ? <p><strong>Difficultés :</strong> {item.difficulties}</p> : null}
                    {item.learnings ? <p><strong>Apprentissages :</strong> {item.learnings}</p> : null}
                    {item.url ? (
                      <p>
                        <a href={item.url} rel="noreferrer" target="_blank">
                          Ouvrir le lien associé
                          <span className="visually-hidden"> (s’ouvre dans un nouvel onglet)</span>
                        </a>
                      </p>
                    ) : null}
                    <AttachmentManager
                      item={item}
                      onFailure={setFailure}
                      onNotice={setNotice}
                      onUploaded={updateAttachment}
                      onDeleted={removeAttachment}
                    />
                    <div className="form-actions portfolio-actions">
                      <button className="button button-secondary" type="button" onClick={() => startEditing(item)}>
                        Modifier
                      </button>
                      <button className="button button-danger" type="button" onClick={() => void deleteItem(item)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
        {meta?.hasMore && meta.nextCursor ? (
          <button className="button button-secondary load-more" type="button" onClick={() => void loadMore()}>
            Charger d’autres fiches
          </button>
        ) : null}
      </section>
    </>
  );
}

function AttachmentManager({
  item,
  onFailure,
  onNotice,
  onUploaded,
  onDeleted,
}: {
  item: PortfolioItem;
  onFailure: (failure: AccountFailure | null) => void;
  onNotice: (notice: string) => void;
  onUploaded: (itemId: string, attachment: PortfolioAttachment) => void;
  onDeleted: (itemId: string, attachmentId: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const file = (new FormData(formElement).get("file"));
    if (!(file instanceof File) || file.size === 0) {
      onFailure({ message: "Choisissez un fichier non vide à ajouter." });
      return;
    }
    if (!attachmentTypes.includes(file.type as PortfolioAttachment["mediaType"])) {
      onFailure({ message: "Formats acceptés : PDF, JPEG, PNG ou WebP." });
      return;
    }
    const isPdf = file.type === "application/pdf";
    if (file.size > (isPdf ? 5_242_880 : 2_097_152)) {
      onFailure({ message: isPdf ? "Un PDF ne peut pas dépasser 5 Mio." : "Une image ne peut pas dépasser 2 Mio." });
      return;
    }
    const existingKind = item.attachments.some((attachment) =>
      isPdf
        ? attachment.mediaType === "application/pdf"
        : attachment.mediaType !== "application/pdf",
    );
    if (existingKind) {
      onFailure({ message: isPdf ? "Cette fiche possède déjà un PDF." : "Cette fiche possède déjà une image." });
      return;
    }
    if (item.attachments.length >= 2) {
      onFailure({ message: "Cette fiche a déjà atteint la limite de deux fichiers." });
      return;
    }

    const payload = new FormData();
    payload.set("file", file);
    setBusy(true);
    onFailure(null);
    const result = await accountRequest<PortfolioAttachment>(
      `me/portfolio/${encodeURIComponent(item.id)}/attachments`,
      { method: "POST", body: payload, validateData: isPortfolioAttachment },
    );
    setBusy(false);
    if (!result.ok) {
      onFailure(result.failure);
      return;
    }
    if (!result.data) {
      onFailure({ message: "Réponse API invalide : les métadonnées du fichier sont absentes." });
      return;
    }
    onUploaded(item.id, result.data);
    formElement.reset();
    onNotice("Le fichier a été ajouté dans le stockage privé.");
  }

  async function download(attachment: PortfolioAttachment) {
    onFailure(null);
    const result = await accountDownload(
      `me/portfolio/${encodeURIComponent(item.id)}/attachments/${encodeURIComponent(attachment.id)}/content`,
      attachment.mediaType,
    );
    if (!result.ok) {
      onFailure(result.failure);
      return;
    }
    const objectUrl = URL.createObjectURL(result.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getAttachmentDownloadName(attachment.mediaType);
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    onNotice("Le fichier privé a été téléchargé dans cette session.");
  }

  async function deleteAttachment(attachment: PortfolioAttachment) {
    if (!window.confirm(`Supprimer le fichier « ${attachment.name} » ?`)) return;
    setBusy(true);
    onFailure(null);
    const result = await accountRequest<null>(
      `me/portfolio/${encodeURIComponent(item.id)}/attachments/${encodeURIComponent(attachment.id)}`,
      { method: "DELETE", noContent: true },
    );
    setBusy(false);
    if (!result.ok) {
      onFailure(result.failure);
      return;
    }
    onDeleted(item.id, attachment.id);
    onNotice("La pièce jointe a été supprimée.");
  }

  return (
    <section className="attachment-panel" aria-label={`Fichiers privés de ${item.title}`}>
      <h3>Fichiers privés ({item.attachments.length}/2)</h3>
      {item.attachments.length > 0 ? (
        <ul className="attachment-list">
          {item.attachments.map((attachment) => (
            <li key={attachment.id}>
              <div>
                <strong>{attachment.name}</strong>
                <span>{attachment.mediaType} · {formatBytes(attachment.sizeBytes)}</span>
              </div>
              <div className="form-actions">
                <button className="button button-secondary" type="button" onClick={() => void download(attachment)}>
                  Télécharger
                </button>
                <button
                  className="button button-danger"
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteAttachment(attachment)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="field-hint">Aucun fichier n’est associé à cette fiche.</p>
      )}
      {item.attachments.length < 2 ? (
        <form className="attachment-upload" onSubmit={(event) => void upload(event)}>
          <label htmlFor={`portfolio-file-${item.id}`}>Ajouter un PDF ou une image</label>
          <input
            id={`portfolio-file-${item.id}`}
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            disabled={busy}
          />
          <p className="field-hint">PDF : 5 Mio max. Image : 2 Mio max. Un PDF et une image au plus.</p>
          <button className="button button-secondary" type="submit" disabled={busy}>
            {busy ? "Traitement…" : "Ajouter le fichier"}
          </button>
        </form>
      ) : null}
    </section>
  );
}

function PortfolioFailure({
  failure,
  refElement,
}: {
  failure: AccountFailure;
  refElement: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="error-panel" role="alert" tabIndex={-1} ref={refElement}>
      <h2>{failure.status === 401 ? "Connexion nécessaire" : "Impossible d’utiliser le portfolio"}</h2>
      <p>{failure.message}</p>
      {failure.status === 401 ? (
        <div className="form-actions">
          <Link className="button button-primary" href="/connexion">Se connecter</Link>
          <Link className="button button-secondary" href="/inscription">Créer un compte</Link>
        </div>
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
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

function formatBytes(bytes: number) {
  return bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mio`
    : `${Math.max(1, Math.round(bytes / 1024))} Kio`;
}
