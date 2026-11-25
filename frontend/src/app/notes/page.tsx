import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NotesPanel } from "@/components/notes-panel";
import { PageFrame } from "@/components/page-frame";

export const metadata: Metadata = { title: "Mes notes" };
export const dynamic = "force-dynamic";

type NotesPageProps = {
  searchParams: Promise<{ lessonId?: string | string[] }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams;
  const lessonId = Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId;
  const initialLessonId = lessonId && uuidPattern.test(lessonId) ? lessonId : "";

  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Notes" }]} />
      <header className="page-heading">
        <p className="eyebrow">Mon espace</p>
        <h1>Mes notes</h1>
        <p>Les notes sont privées et rattachées à une séance de votre compte.</p>
      </header>
      <NotesPanel initialLessonId={initialLessonId} />
    </PageFrame>
  );
}
