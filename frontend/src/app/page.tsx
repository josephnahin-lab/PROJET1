import Link from "next/link";
import { getDomains } from "@/lib/catalog";
import { PageFrame } from "@/components/page-frame";
import { ApiFailure } from "@/components/api-failure";
import { DomainCards } from "@/components/domain-cards";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await getDomains();

  return (
    <PageFrame>
      <section className="hero" aria-labelledby="welcome-title">
        <p className="eyebrow">Apprentissage ouvert, à votre rythme</p>
        <h1 id="welcome-title">Explorez un domaine. Construisez votre parcours.</h1>
        <p className="hero-copy">
          Découvrez les domaines et les programmes publiés par Librescence.
          Vous pouvez commencer en mode invité : aucun compte n’est nécessaire.
        </p>
        <Link className="button button-primary" href="/catalogue">
          Parcourir le catalogue
        </Link>
        <Link className="text-link home-portfolio-link" href="/portfolio">
          Accéder à mon portfolio privé
        </Link>
      </section>

      <section className="content-section" aria-labelledby="domains-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Contenus disponibles</p>
            <h2 id="domains-title">Domaines publiés</h2>
          </div>
          <Link className="text-link" href="/catalogue">
            Tout le catalogue <span aria-hidden="true">→</span>
          </Link>
        </div>
        {result.ok ? (
          result.data.length > 0 ? (
            <DomainCards domains={result.data.slice(0, 6)} />
          ) : (
            <p className="empty-state">
              Aucun domaine publié n’est disponible pour le moment.
            </p>
          )
        ) : (
          <ApiFailure failure={result.failure} />
        )}
      </section>

      <aside className="guest-panel">
        <div>
          <h2>Commencez sans compte</h2>
          <p>
            Le catalogue public reste accessible en mode invité. La connexion
            facultative donne accès à votre profil, votre progression, vos notes,
            votre portfolio privé et votre bibliothèque synchronisés.
          </p>
          <div className="guest-actions">
            <Link className="button button-secondary" href="/connexion">
              Se connecter
            </Link>
            <Link className="text-link" href="/inscription">
              Créer un compte
            </Link>
          </div>
        </div>
        <span className="guest-badge">Mode invité disponible</span>
      </aside>
    </PageFrame>
  );
}
