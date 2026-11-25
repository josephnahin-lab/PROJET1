"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  accountRequest,
  isWeeklyGoal,
  type AccountFailure,
  type WeeklyGoal,
} from "@/lib/account-api";

export function AccountNavActions() {
  const router = useRouter();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [failure, setFailure] = useState<AccountFailure | null>(null);
  const [sessionCheckFailure, setSessionCheckFailure] =
    useState<AccountFailure | null>(null);

  useEffect(() => {
    let active = true;
    void accountRequest<WeeklyGoal>("me/weekly-goal", {
      validateData: isWeeklyGoal,
    }).then((result) => {
      if (!active) return;
      setCheckingSession(false);
      setHasSession(result.ok);
      setSessionCheckFailure(result.ok ? null : result.failure);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (failure || (sessionCheckFailure && sessionCheckFailure.status !== 401)) {
      errorRef.current?.focus();
    }
  }, [failure, sessionCheckFailure]);

  async function signOut() {
    setFailure(null);
    setSigningOut(true);

    const result = await accountRequest<null>("auth/logout", {
      method: "POST",
      noContent: true,
    });

    setSigningOut(false);
    if (!result.ok) {
      setFailure(result.failure);
      return;
    }

    router.replace("/connexion");
    router.refresh();
  }

  return (
    <div className="nav-account-actions">
      {checkingSession ? (
        <span role="status">Vérification de la session…</span>
      ) : !hasSession && sessionCheckFailure?.status === 401 ? (
        <Link href="/connexion">Connexion</Link>
      ) : hasSession ? (
        <button
          className="nav-action"
          type="button"
          onClick={signOut}
          disabled={signingOut}
        >
          {signingOut ? "Déconnexion…" : "Déconnexion"}
        </button>
      ) : null}
      {sessionCheckFailure && sessionCheckFailure.status !== 401 ? (
        <p className="nav-error" role="alert" tabIndex={-1} ref={errorRef}>
          Impossible de vérifier la session : {sessionCheckFailure.message}
          {sessionCheckFailure.status
            ? ` (HTTP ${sessionCheckFailure.status})`
            : ""}
        </p>
      ) : null}
      {failure ? (
        <p className="nav-error" role="alert" tabIndex={-1} ref={errorRef}>
          Impossible de fermer la session : {failure.message}
          {failure.status ? ` (HTTP ${failure.status})` : ""}
        </p>
      ) : null}
    </div>
  );
}
