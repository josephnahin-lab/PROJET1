import type { ApiFailure as ApiFailureDetails } from "@/lib/api";

export function ApiFailure({ failure }: { failure: ApiFailureDetails }) {
  return (
    <div className="error-panel" role="alert">
      <h3>Impossible de charger les données</h3>
      <p>{failure.message}</p>
      {failure.status !== undefined ? (
        <p className="error-code">Réponse de l’API : HTTP {failure.status}.</p>
      ) : null}
      <p className="error-hint">
        Vérifiez que l’API Librescence est disponible, puis réessayez.
      </p>
    </div>
  );
}
