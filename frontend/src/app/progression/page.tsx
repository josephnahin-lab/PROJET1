import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";
import { ProgressPanel } from "@/components/progress-panel";

export const metadata: Metadata = { title: "Ma progression" };
export const dynamic = "force-dynamic";

export default function ProgressPage() {
  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Progression" }]} />
      <header className="page-heading">
        <p className="eyebrow">Mon espace</p>
        <h1>Ma progression</h1>
        <p>Cette vue affiche uniquement les données synchronisées renvoyées par votre compte.</p>
      </header>
      <ProgressPanel />
    </PageFrame>
  );
}
