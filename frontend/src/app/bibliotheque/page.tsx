import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LibraryPanel } from "@/components/library-panel";
import { PageFrame } from "@/components/page-frame";

export const metadata: Metadata = { title: "Ma bibliothèque" };
export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Bibliothèque" }]} />
      <header className="page-heading">
        <p className="eyebrow">Mon espace</p>
        <h1>Ma bibliothèque</h1>
        <p>Enregistrez et gérez vos ressources personnelles.</p>
      </header>
      <LibraryPanel />
    </PageFrame>
  );
}
