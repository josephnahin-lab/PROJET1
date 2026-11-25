import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Connexion" }]} />
      <header className="page-heading">
        <p className="eyebrow">Votre espace Librescence</p>
        <h1>Connexion</h1>
        <p>Connectez-vous pour consulter vos données personnelles synchronisées.</p>
      </header>
      <AuthForm mode="login" />
    </PageFrame>
  );
}
