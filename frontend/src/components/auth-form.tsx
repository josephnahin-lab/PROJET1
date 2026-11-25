"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  accountRequest,
  isAuthSession,
  type AccountFailure,
} from "@/lib/account-api";

type AuthFormProps = {
  mode: "login" | "register";
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AccountFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedEmail = email.trim();

    if (!isValidEmail(normalizedEmail)) {
      setError({ message: "Saisissez une adresse e-mail valide (254 caractères maximum)." });
      return;
    }
    if (isRegister && (password.length < 12 || password.length > 128)) {
      setError({ message: "Le mot de passe doit contenir entre 12 et 128 caractères." });
      return;
    }
    if (!isRegister && (password.length < 1 || password.length > 128)) {
      setError({ message: "Saisissez votre mot de passe (128 caractères maximum)." });
      return;
    }

    setSubmitting(true);
    const result = await accountRequest("auth/" + (isRegister ? "register" : "login"), {
      method: "POST",
      body: {
        email: normalizedEmail,
        password,
        ...(isRegister ? { locale: "fr" } : {}),
      },
      validateData: isAuthSession,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.failure);
      return;
    }
    if (!result.data) {
      setError({ message: "Réponse API invalide : la session n’a pas été confirmée." });
      return;
    }

    setPassword("");
    router.replace("/profil");
    router.refresh();
  }

  const errorId = "auth-error";
  const fieldMessage = (field: string) => error?.fields?.[field]?.join(" ");

  return (
    <div className="account-form-wrap">
      {error ? (
        <div
          className="error-panel form-error"
          id={errorId}
          role="alert"
          tabIndex={-1}
          ref={errorRef}
        >
          <h2>Impossible de {isRegister ? "créer le compte" : "vous connecter"}</h2>
          <p>{error.message}</p>
          {error.status ? (
            <p className="error-code">Réponse de l’API : HTTP {error.status}.</p>
          ) : null}
          {error.fields ? (
            <ul>
              {Object.entries(error.fields).flatMap(([field, messages]) =>
                messages.map((message, index) => (
                  <li key={`${field}-${index}`}>
                    {field === "email" ? "Adresse e-mail" : field === "password" ? "Mot de passe" : field}: {message}
                  </li>
                )),
              )}
            </ul>
          ) : null}
        </div>
      ) : null}

      <form className="account-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="auth-email">Adresse e-mail</label>
          <input
            autoComplete="email"
            autoCapitalize="none"
            id="auth-email"
            name="email"
            type="email"
            maxLength={254}
            required
            value={email}
            aria-invalid={Boolean(fieldMessage("email"))}
            aria-describedby={fieldMessage("email") ? "auth-email-error" : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldMessage("email") ? (
            <p className="field-error" id="auth-email-error">{fieldMessage("email")}</p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="auth-password">Mot de passe</label>
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            id="auth-password"
            name="password"
            type="password"
            minLength={isRegister ? 12 : 1}
            maxLength={128}
            required
            value={password}
            aria-invalid={Boolean(fieldMessage("password"))}
            aria-describedby={
              fieldMessage("password")
                ? "auth-password-error"
                : isRegister
                  ? "auth-password-hint"
                  : undefined
            }
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldMessage("password") ? (
            <p className="field-error" id="auth-password-error">
              {fieldMessage("password")}
            </p>
          ) : isRegister ? (
            <p className="field-hint" id="auth-password-hint">
              12 à 128 caractères, conformément au contrat.
            </p>
          ) : null}
        </div>

        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting
            ? "Envoi en cours…"
            : isRegister
              ? "Créer mon compte"
              : "Se connecter"}
        </button>
      </form>

      <p className="auth-switch">
        {isRegister ? "Vous avez déjà un compte ?" : "Vous n’avez pas encore de compte ?"}{" "}
        <Link href={isRegister ? "/connexion" : "/inscription"}>
          {isRegister ? "Se connecter" : "Créer un compte"}
        </Link>
      </p>
      <p className="field-hint">
        Le catalogue et les parcours publics restent accessibles sans compte.
      </p>
    </div>
  );
}
