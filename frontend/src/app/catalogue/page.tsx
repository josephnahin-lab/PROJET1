import Link from "next/link";
import { ApiFailure } from "@/components/api-failure";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DomainCards } from "@/components/domain-cards";
import { PageFrame } from "@/components/page-frame";
import { getDomains, searchCatalog } from "@/lib/catalog";
import type { SearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

type CataloguePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    family?: string | string[];
    cursor?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function resultHref(result: SearchResult): string | null {
  if (result.type === "domain") {
    return `/domaines/${encodeURIComponent(result.id)}`;
  }
  if (
    result.type === "pathway" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      result.id,
    )
  ) {
    return `/parcours/${encodeURIComponent(result.id)}`;
  }
  return null;
}

function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return <p className="empty-state">Aucun résultat publié pour cette recherche.</p>;
  }

  return (
    <ul className="search-results">
      {results.map((result) => {
        const href = resultHref(result);
        return (
          <li className="search-result" key={`${result.type}-${result.id}`}>
            <p className="card-kicker">{result.type}</p>
            <h2>
              {href ? <Link href={href}>{result.title}</Link> : result.title}
            </h2>
            {result.summary ? <p>{result.summary}</p> : null}
            {!href ? (
              <p className="field-hint">
                Aucune destination directe n’est fournie par le contrat de
                recherche pour ce résultat.
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default async function CataloguePage({
  searchParams,
}: CataloguePageProps) {
  const params = await searchParams;
  const query = firstValue(params.q)?.trim() ?? "";
  const family = firstValue(params.family)?.trim();
  const cursor = firstValue(params.cursor)?.trim();
  const isSearching = query.length >= 2;
  const result = isSearching
    ? {
        kind: "search" as const,
      response: await searchCatalog(query, family, cursor),
      }
    : {
        kind: "domains" as const,
        response: await getDomains({ family, cursor }),
      };

  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Catalogue" }]} />
      <header className="page-heading">
        <p className="eyebrow">Explorer</p>
        <h1>Catalogue des domaines</h1>
        <p>
          Ces contenus sont chargés depuis le catalogue public Librescence.
          Seuls les domaines et programmes publiés sont présentés.
        </p>
      </header>

      <form className="search-form" action="/catalogue" role="search">
        <label htmlFor="catalog-search">Rechercher un domaine ou un parcours</label>
        <div className="search-controls">
          <input
            id="catalog-search"
            name="q"
            type="search"
            minLength={2}
            maxLength={120}
            placeholder="Ex. informatique, réseaux…"
            defaultValue={query}
          />
          <button className="button button-primary" type="submit">
            Rechercher
          </button>
        </div>
        {family ? <input type="hidden" name="family" value={family} /> : null}
        <p className="field-hint">
          Saisissez au moins deux caractères. La recherche est effectuée par
          l’API publique.
        </p>
      </form>

      {query.length === 1 ? (
        <p className="inline-notice" role="status">
          Saisissez au moins deux caractères pour lancer la recherche.
        </p>
      ) : null}

      <section className="content-section" aria-live="polite">
        <div className="section-heading">
          <h2>
            {isSearching ? `Résultats pour « ${query} »` : "Domaines publiés"}
          </h2>
        </div>
        {result.kind === "search" ? (
          result.response.ok ? (
            <>
              <SearchResults results={result.response.data} />
              {result.response.meta?.hasMore &&
              result.response.meta.nextCursor ? (
                <p className="pagination">
                  <Link
                    className="button button-secondary"
                    href={`/catalogue?${new URLSearchParams({
                      q: query,
                      ...(family ? { family } : {}),
                      cursor: result.response.meta.nextCursor,
                    })}`}
                  >
                    Charger la suite des résultats
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            <ApiFailure failure={result.response.failure} />
          )
        ) : result.response.ok ? (
          result.response.data.length > 0 ? (
            <>
              <DomainCards domains={result.response.data} />
              {result.response.meta?.hasMore &&
              result.response.meta.nextCursor ? (
                <p className="pagination">
                  <Link
                    className="button button-secondary"
                    href={`/catalogue?${new URLSearchParams({
                      ...(family ? { family } : {}),
                      cursor: result.response.meta.nextCursor,
                    })}`}
                  >
                    Charger les domaines suivants
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            <p className="empty-state">
              Aucun domaine publié n’est disponible pour le moment.
            </p>
          )
        ) : (
          <ApiFailure failure={result.response.failure} />
        )}
      </section>
    </PageFrame>
  );
}
