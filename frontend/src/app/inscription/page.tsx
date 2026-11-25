import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";

export const metadata: Metadata = { title: "Inscription" };

export default function RegisterPage() {
  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Inscription" }]} />
      <header className="page-heading">
        <p className="eyebrow">Un compte, si vous le souhaitez</p>
        <h1>Créer un compte</h1>
        <p>
          L’inscription est facultative. Aucune date de naissance n’est demandée.
          Vous pourrez continuer à utiliser les contenus publics en mode invité.
        </p>
      </header>
      <AuthForm mode="register" />
    </PageFrame>
  );
}
