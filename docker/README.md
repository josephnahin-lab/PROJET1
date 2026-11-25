# Docker local — Librescence

Cette stack est destinée au développement local. Elle utilise PostgreSQL 16,
l’API Laravel dans `backend/` et Next.js dans `frontend/`. Les applications et
leurs manifestes sont fournis séparément; les images ne peuvent être construites
qu’une fois ces fichiers présents.

## Démarrer

Prérequis : Docker avec le plugin Compose v2, ainsi que des applications Laravel
et Next.js initialisées dans les deux dossiers.

Dans un même terminal, définir un mot de passe PostgreSQL local (il n’est pas
enregistré dans le dépôt), puis construire et démarrer les services :

```sh
export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
export DOCKER_UID="$(id -u)"
export DOCKER_GID="$(id -g)"
docker compose up --build
```

Le frontend est accessible sur <http://localhost:3000>, l’API Laravel sur
<http://localhost:8000> et PostgreSQL sur le port local 5432 (modifiable avec
`POSTGRES_PORT`). Compose attend que le healthcheck PostgreSQL réussisse avant
de démarrer le backend.

Le backend est supposé être servi en développement par `php artisan serve`
sur le port 8000. Ce n’est pas une configuration de production (pas de
PHP-FPM/reverse proxy). Le client Next.js reçoit par défaut
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`; l’application peut
avoir besoin de sa configuration first-party Sanctum/CSRF et CORS en plus.
Pour les appels effectués depuis le conteneur frontend, Compose fournit
`API_BASE_URL=http://backend:8000/api/v1` sur le réseau interne.
La clé `APP_KEY` Laravel reste à configurer localement dans `backend/.env`
selon le démarrage standard du projet; elle n’est ni intégrée à l’image ni
commise ici.

## Arrêter sans supprimer les données

Dans le même terminal :

```sh
docker compose down
```

Cette commande arrête et supprime les conteneurs et le réseau Compose, mais
conserve le volume nommé `postgres_data` et donc les données PostgreSQL.
Ne pas ajouter `-v` si les données doivent être conservées. Pour redémarrer,
réutiliser la même valeur de `POSTGRES_PASSWORD` et exécuter de nouveau
`docker compose up`.
