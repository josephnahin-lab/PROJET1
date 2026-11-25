import Link from "next/link";
import { ApiFailure } from "@/components/api-failure";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LessonProgressAction } from "@/components/lesson-progress-action";
import { PageFrame } from "@/components/page-frame";
import { getPathway } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{ pathwayId: string; lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { pathwayId, lessonId } = await params;
  const result = await getPathway(pathwayId);
  const match = result.ok
    ? result.data.weeks
        .flatMap((week) =>
          week.lessons.map((lesson) => ({ week, lesson })),
        )
        .find(({ lesson }) => lesson.id === lessonId)
    : undefined;

  return (
    <PageFrame>
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Catalogue", href: "/catalogue" },
          ...(result.ok
            ? [
                {
                  label: result.data.title,
                  href: `/parcours/${encodeURIComponent(result.data.id)}`,
                },
              ]
            : []),
          { label: match?.lesson.title ?? "Séance" },
        ]}
      />
      {!result.ok ? (
        <ApiFailure failure={result.failure} />
      ) : !match ? (
        <div className="error-panel" role="alert">
          <h1>Séance introuvable</h1>
          <p>
            Cette séance n’existe pas dans le programme publié ou n’est plus
            disponible.
          </p>
          <Link
            className="button button-secondary"
            href={`/parcours/${encodeURIComponent(result.data.id)}`}
          >
            Revenir au programme
          </Link>
        </div>
      ) : (
        <article className="lesson-page">
          <p className="eyebrow">
            {match.week.title} · Séance {match.lesson.position}
          </p>
          <h1>{match.lesson.title}</h1>
          <p className="lesson-objective">{match.lesson.objective}</p>
          {match.lesson.durationMinutes ? (
            <p className="duration">
              Durée indicative : {match.lesson.durationMinutes} minutes
            </p>
          ) : null}
          <div className="lesson-actions">
            <LessonProgressAction lessonId={match.lesson.id} />
            <Link
              className="button button-secondary"
              href={`/notes?lessonId=${encodeURIComponent(match.lesson.id)}`}
            >
              Prendre une note
            </Link>
          </div>
          {match.lesson.explanation ? (
            <section className="lesson-section" aria-labelledby="lesson-content">
              <h2 id="lesson-content">Cours</h2>
              <div className="prose">{match.lesson.explanation}</div>
            </section>
          ) : (
            <p className="empty-state">
              Le contenu détaillé de ce cours n’est pas disponible dans la
              réponse publiée de l’API.
            </p>
          )}
          {match.lesson.activity ? (
            <section className="activity-panel" aria-labelledby="activity-title">
              <p className="eyebrow">À vous de jouer</p>
              <h2 id="activity-title">Activité</h2>
              <div className="prose">{match.lesson.activity}</div>
            </section>
          ) : null}
          {match.lesson.quizzes.length > 0 ? (
            <section className="lesson-section" aria-labelledby="quiz-title">
              <h2 id="quiz-title">Quiz de révision</h2>
              <p>
                Les quiz sont consultables sans compte. La correction côté
                serveur et l’enregistrement des tentatives sont désactivés.
              </p>
              <ul className="quiz-links">
                {match.lesson.quizzes.map((quiz, index) => (
                  <li key={quiz.id}>
                    <Link href={`/quiz/${encodeURIComponent(quiz.id)}`}>
                      Quiz {index + 1} — {quiz.questionCount} questions
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <Link
            className="button button-secondary"
            href={`/parcours/${encodeURIComponent(result.data.id)}`}
          >
            Revenir au programme
          </Link>
        </article>
      )}
    </PageFrame>
  );
}
