import Link from "next/link";
import type { Domain } from "@/lib/types";

export function DomainCards({ domains }: { domains: Domain[] }) {
  return (
    <ul className="card-grid">
      {domains.map((domain) => (
        <li className="domain-card" key={domain.id}>
          <p className="card-kicker">{domain.familyId}</p>
          <h3>
            <Link href={`/domaines/${encodeURIComponent(domain.id)}`}>
              {domain.name}
            </Link>
          </h3>
          <p>{domain.summary}</p>
          <Link
            className="card-link"
            href={`/domaines/${encodeURIComponent(domain.id)}`}
          >
            Voir le domaine <span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
