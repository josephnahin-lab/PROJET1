import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";
import { ProfilePanel } from "@/components/profile-panel";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Profil" }]} />
      <header className="page-heading">
        <p className="eyebrow">Mon espace</p>
        <h1>Mon profil</h1>
        <p>Consultez et modifiez les préférences renvoyées par votre compte.</p>
      </header>
      <ProfilePanel />
    </PageFrame>
  );
}
