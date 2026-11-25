import Link from "next/link";
import type { ReactNode } from "react";
import { AccountNavActions } from "@/components/account-nav-actions";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Librescence, accueil">
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span>Librescence</span>
        </Link>
        <nav className="main-nav" aria-label="Navigation principale">
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/profil">Profil</Link>
          <Link href="/progression">Progression</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/notes">Notes</Link>
          <Link href="/bibliotheque">Bibliothèque</Link>
          <AccountNavActions />
          <Link href="/inscription">Inscription</Link>
        </nav>
      </header>
      <main className="main-content" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <span className="footer-brand">Librescence</span>
        <span>Apprendre librement, progresser durablement.</span>
      </footer>
    </div>
  );
}
