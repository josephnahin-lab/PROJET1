import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";
import { PortfolioPanel } from "@/components/portfolio-panel";

export const metadata: Metadata = { title: "Mon portfolio privé" };
export const dynamic = "force-dynamic";

export default function PortfolioPage() {
  return (
    <PageFrame>
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Portfolio privé" },
        ]}
      />
      <header className="page-heading">
        <p className="eyebrow">Mon espace personnel</p>
        <h1>Mon portfolio privé</h1>
        <p>
          Gardez une trace de vos projets, de vos apprentissages et de vos fichiers.
          Seul votre compte peut consulter ou télécharger ces contenus.
        </p>
      </header>
      <PortfolioPanel />
    </PageFrame>
  );
}
