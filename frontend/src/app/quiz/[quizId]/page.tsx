import Link from "next/link";
import { ApiFailure } from "@/components/api-failure";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";
import { getPublicQuiz } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type QuizPageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;
  const result = await getPublicQuiz(quizId);

  return (
    <PageFrame>
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Catalogue", href: "/catalogue" },
          { label: "Quiz de révision" },
        ]}
      />
      {!result.ok ? (
        <ApiFailure failure={result.failure} />
      ) : (
        <article className="quiz-page">
          <p className="eyebrow">Révision · Version {result.data.version}</p>
          <h1>Questions de révision</h1>
          <div className="notice-panel" role="note">
            <h2>Mode consultation</h2>
            <p>
              Cette page affiche uniquement les questions et les options
              publiques. Elle ne contient pas de corrigé : la correction côté
              serveur et l’enregistrement des tentatives sont contractuellement
              désactivés.
            </p>
          </div>
          <ol className="question-list">
            {result.data.questions.map((question, index) => (
              <li className="question-card" key={question.id}>
                <h2>
                  <span className="question-number">Question {index + 1}</span>
                  {question.prompt}
                </h2>
                <ul>
                  {question.options.map((option) => (
                    <li key={option.id}>{option.label}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <Link className="text-link" href="/catalogue">
            Revenir au catalogue
          </Link>
        </article>
      )}
    </PageFrame>
  );
}
