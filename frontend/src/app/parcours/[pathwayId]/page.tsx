import Link from "next/link";
import { ApiFailure } from "@/components/api-failure";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";
import { ProjectProgressAction } from "@/components/project-progress-action";
import { getPathway } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type PathwayPageProps = {
  params: Promise<{ pathwayId: string }>;
};

export default async function PathwayPage({ params }: PathwayPageProps) {
  const { pathwayId } = await params;
  const result = await getPathway(pathwayId);

  return (
    <PageFrame>
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Catalogue", href: "/catalogue" },
          { label: result.ok ? result.data.title : "Programme" },
        ]}
      />
      {!result.ok ? (
        <ApiFailure failure={result.failure} />
      ) : (
        <>
          <header className="page-heading">
            <p className="eyebrow">
              Programme publié · Version {result.data.version}
            </p>
            {result.data.eyebrow ? (
              <p className="pathway-eyebrow">{result.data.eyebrow}</p>
            ) : null}
            <h1>{result.data.title}</h1>
            {result.data.description ? <p>{result.data.description}</p> : null}
            {result.data.overview ? (
              <p className="overview-copy">{result.data.overview}</p>
            ) : null}
            <dl className="fact-list">
              {result.data.difficulty ? (
                <div>
                  <dt>Niveau</dt>
                  <dd>{result.data.difficulty}</dd>
                </div>
              ) : null}
              {result.data.weeklyTime ? (
                <div>
                  <dt>Temps conseillé</dt>
                  <dd>{result.data.weeklyTime}</dd>
                </div>
              ) : null}
            </dl>
          </header>

          {result.data.prerequisites && result.data.prerequisites.length > 0 ? (
            <section className="detail-panel" aria-labelledby="prerequisites-title">
              <h2 id="prerequisites-title">Prérequis</h2>
              <ul>
                {result.data.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.data.skills.length > 0 ||
          result.data.careerExamples.length > 0 ||
          (result.data.equipment && result.data.equipment.length > 0) ? (
            <section
              className="content-section"
              aria-labelledby="pathway-details-title"
            >
              <h2 id="pathway-details-title">Compétences et perspectives</h2>
              <div className="project-grid">
                {result.data.skills.length > 0 ? (
                  <section
                    className="detail-panel"
                    aria-labelledby="pathway-skills-title"
                  >
                    <h3 id="pathway-skills-title">Compétences visées</h3>
                    <ul>
                      {result.data.skills.map((skill, index) => (
                        <li key={`${skill}-${index}`}>{skill}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {result.data.careerExamples.length > 0 ? (
                  <section
                    className="detail-panel"
                    aria-labelledby="pathway-careers-title"
                  >
                    <h3 id="pathway-careers-title">
                      Exemples de métiers associés
                    </h3>
                    <ul>
                      {result.data.careerExamples.map((career, index) => (
                        <li key={`${career}-${index}`}>{career}</li>
                      ))}
                    </ul>
                    <p className="field-hint">
                      Ces exemples ne constituent pas une garantie d’emploi.
                    </p>
                  </section>
                ) : null}
                {result.data.equipment && result.data.equipment.length > 0 ? (
                  <section
                    className="detail-panel"
                    aria-labelledby="pathway-equipment-title"
                  >
                    <h3 id="pathway-equipment-title">Matériel nécessaire</h3>
                    <ul>
                      {result.data.equipment.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="content-section" aria-labelledby="program-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Le programme</p>
                <h2 id="program-title">Séances et cours</h2>
              </div>
              <Link
                className="text-link"
                href={`/domaines/${encodeURIComponent(result.data.domainId)}`}
              >
                Retour au domaine
              </Link>
            </div>
            {result.data.weeks.length > 0 ? (
              <div className="week-list">
                {result.data.weeks.map((week) => (
                  <section
                    className="week-card"
                    key={week.id}
                    aria-labelledby={`week-${week.position}`}
                  >
                    <div className="week-heading">
                      <p className="card-kicker">
                        {week.label || `Étape ${week.position}`}
                      </p>
                      <h3 id={`week-${week.position}`}>{week.title}</h3>
                    </div>
                    <ol className="lesson-list">
                      {week.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <div>
                            <span className="lesson-number">
                              Séance {lesson.position}
                            </span>
                            <h4>
                              <Link
                                href={`/parcours/${encodeURIComponent(result.data.id)}/seances/${encodeURIComponent(lesson.id)}`}
                              >
                                {lesson.title}
                              </Link>
                            </h4>
                            <p>{lesson.objective}</p>
                          </div>
                          {lesson.durationMinutes ? (
                            <span className="duration">
                              {lesson.durationMinutes} min
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                Ce programme ne contient actuellement aucune séance publiée.
              </p>
            )}
          </section>

          {result.data.projects.length > 0 ? (
            <section className="content-section" aria-labelledby="projects-title">
              <h2 id="projects-title">Projets proposés</h2>
              <div className="project-grid">
                {result.data.projects.map((project) => (
                  <article className="detail-panel" key={project.id}>
                    <h3>{project.title}</h3>
                    <p>{project.instructions}</p>
                    {project.checklist.length > 0 ? (
                      <ul className="checklist">
                        {project.checklist.map((item) => (
                          <li key={item.stableKey}>{item.label}</li>
                        ))}
                      </ul>
                    ) : null}
                    <ProjectProgressAction project={project} />
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {result.data.resources && result.data.resources.length > 0 ? (
            <section className="content-section" aria-labelledby="resources-title">
              <h2 id="resources-title">Ressources publiées</h2>
              <ul className="resource-list">
                {result.data.resources.map((resource) => (
                  <li key={resource.id}>
                    <a href={resource.url} rel="noreferrer" target="_blank">
                      {resource.title}
                    </a>
                    <span>
                      {resource.provider ? `${resource.provider} · ` : ""}
                      {resource.verificationStatus === "verified"
                        ? "Ressource vérifiée"
                        : "Ressource non vérifiée"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {result.data.safetyNote ? (
            <aside className="notice-panel">
              <h2>À noter</h2>
              <p>{result.data.safetyNote}</p>
            </aside>
          ) : null}
        </>
      )}
    </PageFrame>
  );
}
