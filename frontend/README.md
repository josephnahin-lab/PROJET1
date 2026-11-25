# Librescence — frontend

Squelette Next.js avec App Router et TypeScript. L’interface de départ est en
français; le balisage est prêt à accueillir des traductions, sans ajouter de
librairie i18n avant que les vues métier en aient besoin.

## Prérequis et commandes

- Node.js 26
- npm 12

```bash
npm ci
npm run dev
```

Contrôles disponibles :

```bash
npm run lint
npm run typecheck
npm run build
npm run check
```

## URL de l’API

Copiez `.env.example` vers `.env.local`, puis ajustez `NEXT_PUBLIC_API_BASE_URL`
si nécessaire. La valeur doit être l’URL de base de l’API versionnée, par
exemple `http://localhost:8000/api/v1`. Sans cette variable, l’application
utilise `/api/v1` sur la même origine.

Cette variable est intégrée au bundle du navigateur : elle ne doit contenir
aucun secret. Le squelette ne fait encore aucun appel métier. Lors de leur
implémentation, les appels navigateur devront suivre le contrat first-party
Sanctum (cookies de session et CSRF, sans bearer token exposé au navigateur).

## Périmètre fonctionnel

La page d’accueil est un point de départ uniquement : catalogue, progression
synchronisée et autres vues métier ne sont pas encore implémentés. Le mode
invité reste prévu et la création de compte sera facultative. Les quiz corrigés
côté serveur et persistants, l’envoi ou le stockage serveur des demandes de
contact, ainsi que les certificats sont explicitement différés; aucune de ces
capacités n’est présentée comme active dans ce squelette.
