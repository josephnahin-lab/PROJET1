"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RefObject } from "react";
import {
  accountRequest,
  isProfile,
  type AccountFailure,
  type Profile,
} from "@/lib/account-api";

function isValidProfileUpdate(profile: Profile): string | null {
  if (profile.displayName !== null && profile.displayName.length > 60) {
    return "Le nom affiché ne peut pas dépasser 60 caractères.";
  }
  if (profile.interests.length > 8 || profile.interests.some((item) => item.length > 80)) {
    return "Indiquez au maximum 8 centres d’intérêt de 80 caractères chacun.";
  }
  if (new Set(profile.interests).size !== profile.interests.length) {
    return "Chaque centre d’intérêt doit être unique.";
  }
  if (!["light", "dark"].includes(profile.theme)) {
    return "Choisissez un thème valide.";
  }
  if (!["fr", "en", "es"].includes(profile.resourceLanguage)) {
    return "Choisissez une langue de ressources valide.";
  }
  if (!["guided", "free"].includes(profile.learningMode)) {
    return "Choisissez un mode d’apprentissage valide.";
  }
  if (!profile.locale || profile.locale.length > 16) {
    return "La langue de l’interface doit contenir au plus 16 caractères.";
  }
  return null;
}

export function ProfilePanel() {
  const errorRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [notice, setNotice] = useState("");
  const [interestsInput, setInterestsInput] = useState("");

  useEffect(() => {
    if (failure) errorRef.current?.focus();
  }, [failure]);

  useEffect(() => {
    let active = true;
    void accountRequest<Profile>("me/profile", { validateData: isProfile }).then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setFailure(result.failure);
        return;
      }
      if (!result.data) {
        setFailure({ message: "Réponse API invalide : le profil est absent." });
        return;
      }
      setProfile(result.data);
      setInterestsInput(result.data.interests.join(", "));
    });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setFailure(null);
    setNotice("");
    const updated: Profile = {
      ...profile,
      displayName: profile.displayName?.trim() || null,
      interests: interestsInput
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean),
    };
    const validationMessage = isValidProfileUpdate(updated);
    if (validationMessage) {
      setFailure({ message: validationMessage });
      return;
    }

    setSaving(true);
    const result = await accountRequest<Profile>("me/profile", {
      method: "PATCH",
      body: {
        displayName: updated.displayName,
        interests: updated.interests,
        theme: updated.theme,
        resourceLanguage: updated.resourceLanguage,
        learningMode: updated.learningMode,
        locale: updated.locale,
      },
      validateData: isProfile,
    });
    setSaving(false);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }
    if (!result.data) {
      setFailure({ message: "Réponse API invalide : le profil modifié est absent." });
      return;
    }
    setProfile(result.data);
    setInterestsInput(result.data.interests.join(", "));
    setNotice("Votre profil a été enregistré.");
  }

  if (loading) {
    return <p className="loading-inline" role="status">Chargement du profil…</p>;
  }

  if (failure?.status === 401) {
    return (
      <AccountFailurePanel failure={failure} refElement={errorRef} />
    );
  }

  if (!profile) {
    return (
      <AccountFailurePanel
        failure={failure ?? { message: "Le profil n’est pas disponible." }}
        refElement={errorRef}
      />
    );
  }

  return (
    <>
      {failure ? <AccountFailurePanel failure={failure} refElement={errorRef} /> : null}
      {notice ? <p className="success-notice" role="status">{notice}</p> : null}
      <form className="account-form" onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="profile-display-name">Nom affiché ou pseudonyme</label>
          <input
            id="profile-display-name"
            maxLength={60}
            value={profile.displayName ?? ""}
            onChange={(event) =>
              setProfile({ ...profile, displayName: event.target.value })
            }
          />
          <p className="field-hint">Facultatif, 60 caractères maximum.</p>
        </div>
        <div className="form-field">
          <label htmlFor="profile-interests">Centres d’intérêt</label>
          <input
            id="profile-interests"
            maxLength={647}
            value={interestsInput}
            aria-describedby="profile-interests-hint"
            onChange={(event) => setInterestsInput(event.target.value)}
          />
          <p className="field-hint" id="profile-interests-hint">
            Séparez les valeurs par des virgules; 8 au maximum, 80 caractères chacune.
          </p>
        </div>
        <div className="form-field">
          <label htmlFor="profile-theme">Thème</label>
          <select
            id="profile-theme"
            value={profile.theme}
            onChange={(event) =>
              setProfile({ ...profile, theme: event.target.value as Profile["theme"] })
            }
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="profile-language">Langue des ressources</label>
          <select
            id="profile-language"
            value={profile.resourceLanguage}
            onChange={(event) =>
              setProfile({
                ...profile,
                resourceLanguage: event.target.value as Profile["resourceLanguage"],
              })
            }
          >
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="es">Espagnol</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="profile-learning-mode">Mode d’apprentissage</label>
          <select
            id="profile-learning-mode"
            value={profile.learningMode}
            onChange={(event) =>
              setProfile({
                ...profile,
                learningMode: event.target.value as Profile["learningMode"],
              })
            }
          >
            <option value="guided">Guidé</option>
            <option value="free">Libre</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="profile-locale">Langue de l’interface (code)</label>
          <input
            id="profile-locale"
            maxLength={16}
            required
            value={profile.locale}
            onChange={(event) => setProfile({ ...profile, locale: event.target.value })}
          />
        </div>
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer le profil"}
        </button>
      </form>
    </>
  );
}

function AccountFailurePanel({
  failure,
  refElement,
}: {
  failure: AccountFailure;
  refElement?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="error-panel" role="alert" tabIndex={-1} ref={refElement}>
      <h2>{failure.status === 401 ? "Connexion nécessaire" : "Impossible de charger le profil"}</h2>
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
