import Link from "next/link";
import { ApiFailure } from "@/components/api-failure";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageFrame } from "@/components/page-frame";
import { getDomain } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type DomainPageProps = {
  params: Promise<{ domainId: string }>;
};

export default async function DomainPage({ params }: DomainPageProps) {
  const { domainId } = await params;
  const result = await getDomain(domainId);

  return (
    <PageFrame>
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Catalogue", href: "/catalogue" },
          { label: result.ok ? result.data.name : "Domaine" },
        ]}
      />
      {!result.ok ? (
        <ApiFailure failure={result.failure} />
      ) : (
        <>
          <header className="page-heading">
            <p className="eyebrow">{result.data.familyId}</p>
            <h1>{result.data.name}</h1>
            <p>{result.data.summary}</p>
          </header>
          <section className="content-section" aria-labelledby="pathways-title">
            <div className="section-heading">
              <h2 id="pathways-title">Parcours publiés</h2>
            </div>
            {result.data.pathways.length > 0 ? (
              <ul className="pathway-list">
                {result.data.pathways.map((pathway) => (
                  <li className="pathway-card" key={pathway.id}>
                    <div>
                      <p className="card-kicker">Version {pathway.version}</p>
                      <h3>
                        <Link href={`/parcours/${encodeURIComponent(pathway.id)}`}>
                          {pathway.title}
                        </Link>
                      </h3>
                      <p>Programme publié par Librescence.</p>
                    </div>
                    <Link
                      className="button button-secondary"
                      href={`/parcours/${encodeURIComponent(pathway.id)}`}
                    >
                      Voir le programme
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                Aucun parcours publié n’est rattaché à ce domaine.
              </p>
            )}
          </section>
        </>
      )}
    </PageFrame>
  );
}
