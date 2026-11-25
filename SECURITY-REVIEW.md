# Revue de sécurité — Librescence

**Date :** 25 novembre 2026
**Périmètre :** API et interface du portfolio privé, téléversement, téléchargement et purge des pièces jointes.
**Verdict :** aucun finding exploitable identifié lors de la revue de sécurité indépendante.

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| — | — | — | — | Aucun finding exploitable identifié. | — |

## Contrôles examinés

- Accès portfolio et pièces jointes limité à la session Sanctum et à la propriété de la fiche par le compte courant.
- Pièce jointe vérifiée comme enfant de la fiche demandée; les ressources absentes ou hors périmètre ne sont pas divulguées.
- Fichiers stockés sur le disque privé `portfolio-private`, non servi publiquement; aucune URL signée, bearer URL ou clé de stockage n’est exposée.
- Téléversements limités aux PDF/JPEG/PNG/WebP, avec validation serveur du type, de l’extension, de la taille et du SHA-256.
- Téléchargement en flux après vérification d’existence, du type MIME et du hash, avec `Content-Disposition` neutralisé, `nosniff` et `Cache-Control: private, no-store`.
- Purge déclenchée après commit via outbox et job réessayable; accès révoqué par suppression logique avant retrait physique.
- Interface cliente utilise un nom de téléchargement neutre, plutôt que le nom de fichier renvoyé par l’API.

## Note opérationnelle — hors finding de sécurité

Une revue de code distincte a relevé qu’un échec d’enqueue après commit, ou un arrêt du processus avant l’enqueue, peut laisser un blob privé non purgé alors que son accès via l’API est révoqué. Aucun réconciliateur périodique des lignes d’outbox en attente n’a été identifié. Il s’agit d’un risque de fiabilité/rétention, pas d’un accès non autorisé démontré. À traiter par une tâche de reprise/monitoring si la purge garantie est exigée en production.

## Validation et limites

- Suite backend complète : 81 tests, 21 561 assertions réussis.
- Tests portfolio et purge : 16 tests, 196 assertions réussis lors de la revue indépendante.
- Vérifications frontend : lint, TypeScript et build Next.js réussis.
- PostgreSQL, Docker et le fonctionnement d’un worker réel avec la queue database n’ont pas été exercés.
- Aucun antivirus n’est configuré; l’inspection antivirus est une mesure additionnelle à évaluer selon les exigences d’exploitation.
