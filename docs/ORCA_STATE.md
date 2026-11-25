# État du projet Librescence

## Phase en cours

**Phase 5 — Portfolio privé et projets.** Le contrat de téléchargement des pièces jointes est accepté indépendamment; implémentations backend et frontend livrées en SQLite/build, en attente de revue de sécurité indépendante. Stockage portfolio séparé `portfolio-private` non servi, purge fiable après commit; aucune URL bearer/signée/publique.

## Revue du contrat de téléchargement portfolio

La première revue a refusé le GET sans `/content` et `sizeBytes` non conditionnel au média. Les corrections suivantes ajoutent ce chemin, DELETE sans suffixe, `PortfolioAttachment.additionalProperties=false`, maximum 5 Mio PDF/2 Mio image et nom affiché neutralisé distinct de `original_name` privée. PyYAML valide maintenant OpenAPI 3.1 avec 63 chemins, 96 opérations, 92 schémas, refs/operationIds uniques et aucune manquante. Revue indépendante finale a accepté le contrat pour implémenter; backend API reste en cours.

Le slice frontend portfolio est livré : `/portfolio` liste/crée/modifie/supprime les fiches privées, gère upload/téléchargement/suppression de pièces jointes via API authentifiée, et ajoute la checklist/progression projet aux pages pathway. Mode invité conserve la progression localement. Les liens téléchargement utilisent des noms neutres basés sur le MIME plutôt que les métadonnées API. Revue UI **APPROUVÉE**; `npm run check` passe. L’intégration réelle avec le backend portfolio reste à tester après livraison.

Routes backend portfolio désormais visibles via `route:list`: GET/POST collection; PATCH/DELETE item; POST upload; DELETE attachment; GET private content `/content`. L’auteur backend termine encore les tests, la validation de stockage/purge, Pint et la suite complète; aucun verdict de livraison avant ces vérifications et revue indépendante.

Revue finale : **ACCEPTÉ POUR IMPLÉMENTER PORTFOLIO**. Contrôle propriétaire item + attachment enfant, stream privé, pas d’URL bearer/signée/redirection publique/storage_key, Content-Disposition neutralisé et Cache-Control no-store sont exigés. Backend storage disk et purge fiable restent des choix d’implémentation à fixer; aucune sauvegarde Postgres/Docker locale n’est utilisée.

## État de la source

- Le site statique, ses contenus et ressources sont à la racine; il n’existe pas de répertoire `legacy/`.
- Le code principal est un fichier JavaScript monolithique d’environ 381 Ko; les styles font environ 62 Ko.
- Contenu repéré : 11 familles de domaines, 10 parcours informatiques disponibles selon le README, un parcours web de 12 leçons et 24 questions, plus des domaines en préparation.
- L’état invité utilise `besa.learning.v2`; migration historique repérée depuis `capClair.learning.v2` et `capClairCompleted`. Les pièces jointes de portfolio sont en IndexedDB.
- Authentification et synchronisation Supabase sont déclarées désactivées; du code ancien et `supabase.sql` subsistent.
- Fonctionnalités existantes à préserver : catalogue/parcours, quiz, progression, objectif et activité, minuteur, notes, révision, bibliothèque, portfolio local, synthèse vocale, impression, vidéo et PWA.

## Décisions approuvées / hypothèses de travail

- Backend Laravel, API REST versionnée `/api/v1`, Sanctum, PostgreSQL; frontend Next.js et TypeScript.
- `docs/openapi.yaml` est la source de vérité du contrat HTTP.
- Le mode invité demeure utilisable sans compte; connexion et synchronisation entre appareils sont optionnelles.
- Interface initiale en français, structure i18n prévue; MFA reportée.
- Pour le Next.js first-party avec Sanctum : privilégier la session cookie HttpOnly et la protection CSRF; ne pas exposer de bearer token au navigateur. Les routes et la séquence CSRF doivent être explicites dans l’OpenAPI.
- Minimiser les données personnelles; ne pas migrer la date de naissance facultative sans nécessité validée.
- Normaliser le nom de produit sur **Librescence**; migration de contenu doit conserver une comparaison automatique du nombre de parcours, semaines/séances et quiz.

## Rôles et propriété des fichiers

- **Contrat-API-Données** (spécialiste réutilisable créé pour la phase) : seul propriétaire de `docs/openapi.yaml` et `docs/data-model.md` pendant rédaction et corrections. Il lit ce fichier avant d’agir.
- **Orca** : approuve les décisions d’interface et tient ce fichier à jour; ne modifie pas les contrats ni le code applicatif.
- **Relecteur de contrats indépendant** (brief ponctuel) : vérifie les deux contrats après rédaction, sans les modifier; relève les défauts bloquants avant tout gel.
- Aucun autre agent ne travaille sur ces fichiers durant cette phase.

## Phases et dépendances

1. Audit et cadrage — terminé.
2. Contrats OpenAPI et données — **gelés** après revue indépendante finale; parsing OpenAPI 3.1.0, 62 paths, 95 opérations, 92 schémas, 605 refs (104 uniques), zéro manquante, IDs uniques. Aucun mapping familial proposé n’est approuvé; familles historiques restent en quarantaine.
3. Fondations backend, frontend, Docker et CI — **terminé avec limites documentées**. Revue indépendante approuve infra, modèle utilisateur/CORS/CSRF/routes différées et type média des erreurs. Tests backend (15/141), Pint et route:list passent; `npm run check` passe. Le build réel des images Docker attend CI GitHub, le stockage Docker local étant plein.
4. Migration de contenu et provenance — **terminé pour SQLite/test fixture**, pas de migration/seed de la base persistante. Seed complet non publié, idempotent, UUIDv5, quarantines et provenance vérifiés; revue indépendante **APPROUVÉ POUR MIGRATION CONTENU**. PostgreSQL reste non testé.
5. Fonctions apprenant et vues personnelles — profil, progression, notes, bibliothèque et authentification, approuvés; server quiz history, contacts et certificats restent désactivés.
6. Portfolio/projets et pièces jointes — démarrage après ajout et revue d’une route privée de téléchargement dans l’OpenAPI.
7. Import invité, PWA/hors ligne, minuteur/guide vocal, rappels, i18n et vues restantes.
8. Vérification finale, sécurité/confidentialité, accessibilité et livraison.

## Blocages et risques

- PostgreSQL n’est pas joignable actuellement (`pg_isready` sans réponse); le client Docker est disponible. La disponibilité d’une base devra être vérifiée pour les tests d’intégration.
- Squelettes Composer/npm, pipeline CI, Compose et contrats existent désormais; builds Docker effectifs et tests PostgreSQL doivent être exécutés en CI ou dans un environnement disposant d’espace.
- Réconcilier les anciens schémas de stockage et les pièces jointes IndexedDB sans perte ni import silencieux.
- Distinguer strictement les domaines disponibles de ceux marqués « en préparation ».
- Les données de profil existantes incluent une date de naissance facultative; appliquer la minimisation et obtenir une décision avant toute migration de cette donnée.
- Vérifier les versions supportées de Laravel, Sanctum, PHP, Next.js et Node lors de la phase fondations.

## Historique de rôles

- **Contrat-API-Données** créé pour produire les contrats nécessaires avant tout travail parallèle; rôle réutilisable car l’API et le modèle devront rester cohérents pendant les phases suivantes.
- **Relecteur de contrats indépendant** invoqué en brief ponctuel pour vérifier l’acceptation sans auto-validation par l’auteur.
- **Contrat-API-Données** réaffecté à une correction ciblée à la suite de constats bloquants du relecteur; le relecteur garde l’exclusivité de la prochaine validation.
- **Contrat-API-Données** a repris les corrections après changement de compte Copilot; aucun autre agent n’a travaillé sur ses deux fichiers.
- **Relecteur de contrats indépendant** relancé avec brief distinct après corrections; doit contrôler les changements sans modifier les contrats.
- **Contrat-API-Données** reprend une correction finale ciblée : rendre contact persistant et historique de quiz explicitement inactifs jusqu’à politique de rétention approuvée; opérations concernées doivent répondre de façon documentée et aucune donnée ne doit être durablement stockée.
- **Relecteur de contrats indépendant** devra confirmer que les fonctions désactivées ne laissent pas de voie de collecte/stockage implicite et que les contrats utilisables restent cohérents.
- **Relecteur de contrats indépendant** invoqué pour une troisième revue après correction des réponses `FEATURE_DISABLED` et du traitement atomique des résultats importés.
- Revue finale acceptée avec fonctions différées; démarrage de trois périmètres non chevauchants : backend Laravel, frontend Next.js, Docker/CI.
- Les trois périmètres ont produit leurs fichiers. Les agents backend/frontend ont fini en erreur de transport Copilot sans compte rendu final; les fichiers générés ont été testés localement. L’agent infrastructure a terminé son compte rendu.
- **Relecteur indépendant des fondations** invoqué pour examiner les squelettes Laravel, Next.js et Docker/CI avant d’ouvrir les phases suivantes.
- **Développeur backend** réaffecté aux migrations utilisateur, modèle, préflight CORS, route CSRF, réponses `503 FEATURE_DISABLED` et tests correspondants. Propriété limitée à `backend/`.
- **Développeur infrastructure** réaffecté à `.gitignore` racine et au workflow CI Docker. Propriété limitée à ces fichiers; aucun changement au Compose/Dockerfiles existants.
- **Développeur infrastructure** a terminé `.gitignore` racine et le job de build Docker CI; relecture indépendante demandée.
- **Relecteur indépendant des fondations** approuve `.gitignore` et le workflow CI Docker. Le build effectif n’a pas été exécuté localement car le système de fichiers `/` Docker est plein; la commande de build est validée structurellement et par configuration Compose.
- **Développeur backend** a aligné migration/utilisateur/CORS et ajouté bootstrap CSRF et routes désactivées. Tests ciblés, Pint et route:list rapportés réussis; **relecteur indépendant des fondations** chargé de la validation des corrections.
- Relecture backend valide les P1, mais relève l’incohérence de média-type sur `503 FeatureDisabled` et `501 NotImplemented` dans `backend/routes/api.php`; correctif backend ciblé puis relecture finale requis.
- Auteur backend a corrigé les réponses 503/501 vers `application/problem+json`, ajouté les assertions correspondantes; 13 tests/139 assertions, Pint et route:list rapportés réussis. Relecture indépendante finale demandée.
- Relecture finale backend : **APPROUVÉ POUR FONDATIONS**, 15 tests/141 assertions, Pint et 8 routes API; aucun changement effectué.
- Phase fondations clôturée. Propriétaires applicatifs lancés en parallèle : API Laravel (`backend/app`, routes, migrations et tests API); migration pédagogique (`backend/database/seeders`, test complétude dédié); interface Next.js (`frontend/src`). Aucun propriétaire ne modifie les contrats, l’autre périmètre, Compose/CI ou ce fichier d’état.
- Première tranche verticale attribuée : agent API développe authentification et consultation catalogue/cours selon l’OpenAPI; agent migration peuple les seeders et vérifie la complétude, sans toucher aux migrations/modèles; agent frontend réalise accueil/catalogue/domaines/cours connectés, sans toucher aux manifests, backend ni contrats.
- Agent frontend a terminé l’accueil, catalogue, fiche domaine, programme/séance et quiz en consultation, avec fetch SSR dynamique, erreurs explicites, navigation accessible; `npm run check` réussi. Relecture indépendante requise. Besoin infra identifié : injecter `API_BASE_URL=http://backend:8000/api/v1` dans Compose pour SSR en conteneur.
- Relecture frontend : **À CORRIGER**. Critique : destination SSR dérivée des en-têtes `Host`/`X-Forwarded-Host` si aucune URL absolue configurée; corriger en exigeant une `API_BASE_URL` absolue. Majeur : résultats recherche lesson/resource sans vraie destination; mineur : filtre family perdu, enveloppe `data` vérifiée insuffisamment. L’auteur frontend corrige sous `frontend/src/**`; relecture suivante.
- Agent contenu a créé un seeder et fixture source JSON; comptage rapporté : 11 familles, 250 domaines, 11 parcours détaillés, 52 séances/quiz et 104 questions (40+12 cursus web). Il laisse les gabarits génériques non migrés et les tests DB ignorés car tables de provenance absentes; complétude finale/non-perte non établie. Revue indépendante contenu requise.
- Le seeder dépend des quatre tables de provenance (`domain_content_sources`, `pathway_content_sources`, `lesson_content_sources`, `quiz_content_sources`) explicitement requises par `docs/data-model.md`; elles n’étaient pas encore présentes dans les migrations backend lors de son test parce que le chantier API se déroulait en parallèle. L’agent rapporte que Pint a formaté des PHP backend hors de son périmètre; le propriétaire API inspectera ces changements accidentels avant intégration.
- API vertical slice livré : auth cookie Sanctum (register/login/logout/me), domaines/parcours/quiz publics, modèles/migrations UUID et 16 routes. Tests ciblés rapportés 14/115 assertions passent; suite complète 29 passent, 3 ignorés, 1 échec dû au test de foundation qui attendait zéro route API. L’auteur API met à jour ce test dans une tâche de suivi; revue indépendante API à lancer après.
- L’API actuelle n’inclut pas encore `/search` demandé par la tranche frontend; cette opération reste au backlog API et bloque l’intégration réelle de la recherche. Test seeder contenu peut maintenant être relancé avec les migrations de catalogue fournies.
- L’allowlist de routes du test fondation a été mise à jour strictement : suite API complète rapportée **33 tests, 30 réussis, 3 ignorés, aucun échec**; 16 routes. Revue indépendante API requise.
- L’auteur frontend a corrigé SSR (URL absolue `API_BASE_URL` obligatoire, sans en-têtes host), validation runtime des enveloppes/données, transmission de `family` et état non-lié explicite pour les résultats lesson/resource sans destination sûre. `npm run check` réussi; nouvelle revue indépendante requise.
- Relecture indépendante frontend : **À CORRIGER**. Deux P2 : le type/guard `Pathway` omet les champs OpenAPI requis `eyebrow`, `skills`, `careerExamples`; et `/domains`/`search` n’exigent pas `meta`, ce qui peut masquer un curseur incohérent quand `hasMore=true`. L’auteur frontend corrige sous `frontend/src/**`; `npm run check` passe mais ne couvre pas ces écarts.
- Auteur frontend a ajouté les champs et guards conformes, exigé `meta`/curseur pour `/domains` et `/search`, et présenté skills/careerExamples/equipment dans la page pathway. `cd frontend && npm run check` et `git diff --check` rapportés réussis; nouvelle revue indépendante requise.
- Relecture indépendante du correctif frontend : **APPROUVÉ**, aucun constat critique/majeur/mineur; Pathway guard, meta pagination, family/cursor, rendu accessible et SSR/CORS vérifiés. Le slice accueil/catalogue/parcours/quizz public est accepté, mais les autres vues métier restent à construire.
- Revue de migration : **À CORRIGER**, aucune persistance seed validée. Les 250 enregistrements source ne représentent que 192 IDs distincts; après filtrage/canonicalisation du runtime, 101 domaines sont visibles (100 guidés + web). Le seeder/test essaye encore 250 domaines, ne canonise pas 7 familles historiques et attend des tables de provenance/audit que la tranche API n’avait pas encore migrées.
- Reprise du migrateur contenu : changement partiel limité à fixture/seeder/test. Vérifiés : 250 occurrences/192 IDs; 174 occurrences de familles actives et 76 en quarantaine; 72 domain aliases (70 résolvables + 2 identité); pipeline filtre famille raw → alias → fusion; 101 IDs runtime (90 génériques + 10 IT + web); 233 ressources attendues. Aucune donnée n’a été seedée. Tests SQLite ciblés : 5 tests, 1 pass, 1 fail, 3 erreurs car `familyTemplates` et `domainTopics` manquent encore dans le fixture; pas de tests ignorés. L’auteur poursuit l’ajout de 11 templates/90 parcours et leurs thèmes/provenance.
- Backend schema/search vertical slice livré : migration provenance/audit/familles/templates, modèles/relations, UUIDv5, `GET /api/v1/search` paginé et filtrant, routes publiques publiées seulement; mappings historiques non approuvés et contenus non publiés. Tests ciblés rapportés 9 pass, Pint ciblé pass. Suite complète : 34 pass et 5 échecs/erreurs attribués à l’allowlist `BackendFoundationTest` qui omet `/search` et à la fixture incomplète. Revue indépendante backend requise; PostgreSQL non testé (SQLite uniquement).
- Allowlist `BackendFoundationTest` actualisée strictement pour `GET /api/v1/search`; test ciblé 3 tests/6 assertions réussis, Pint ciblé réussi. `route:list --path=api/v1` affiche 17 entrées, dont bootstrap CSRF et recherche. Suite complète subséquente : 34 pass, 1 failure, 4 errors, tous dans `ContentCompletenessTest` (fixture `familyTemplates`/`domainTopics` incomplète).
- Revue indépendante schema/search : `/search` et migration fraîche SQLite validés (`SearchApiTest` 5/83, `BackendFoundationTest` 3/6), mais **À CORRIGER** sur invariants DB et IDs. Ajout requis de checks qui empêchent alias domaine identity dans graphe résoluble, alias famille `proposed` avec famille canonique, source occurrence `quarantined` avec canonique, positions/versions hors limites, paire template/version seulement partiellement renseignée. `ContentSource::create()` ignore l’ID seed UUIDv5 car non fillable et HasUuids régénère; prévoir chemin serveur dédié qui conserve l’UUID sans mass-assign côté client. Le générateur UUIDv5 doit refuser stable keys vides. Une revue indépendante après correction est obligatoire; PostgreSQL et suite complète non validés.
- Backend author a ajouté les invariants manquants (CHECK PG et triggers d’équivalence SQLite sur migration additive), une méthode seed-only `ContentSource::createFromSeed()` qui préserve UUIDv5 sans mass assignment, validation clés UUID non vides et tests négatifs. Tests ciblés rapportés 12/152 pass, Pint/lint ciblés pass. Revue indépendante requise; PostgreSQL non testé et suite complète attend la fixture.
- Seconde revue backend : **À CORRIGER**. UUIDv5 validé. 4 blocages : rollback SQLite échoue sur `dropForeign(name)`; `approved_alias` peut exister sans alias `domain_family_aliases` réellement approved et famille target correspondante; `correct_option_position` n’est pas contraint à `source_answer_index+1`; lien `canonical_topic_id` d’un topic alias n’est pas contraint au même template/domaine/semaine. Ajouter tests négatifs UPDATE et rollback, puis nouvelle revue. Tests API ciblés Search 8/112 et Catalog 4/40 pass, migration fresh SQLite passe; rollback fail; PostgreSQL/Docker non exécutés.
- **Perte de contenu bloquante :** les 11 gabarits génériques familiaux génèrent réellement 90 parcours guidés (4 semaines, 3 séances/quiz par semaine); ces gabarits, contenus générés, skills/careers et projets génériques ne sont pas dans la fixture. La cible actuelle doit être étendue pour les conserver, sans publier un contenu non revu par défaut. Les tests de comptage/idempotence/corrigé restent ignorés, la complétude n’est donc pas vérifiée.
- Réouverture ciblée des contrats attribuée à **Contrat-API-Données** : ajouter le modèle de gabarits génériques, contenus générés, champs pathway et alias historiques; préciser l’inventaire canonique. Premier amendement revu; deuxième correctif requis. Aucun nouveau code applicatif avant gel révisé.

### Amendement contractuel — parité pédagogique

L’auteur rapporte les changements dans `docs/openapi.yaml` et `docs/data-model.md` : inventorier les 250 occurrences/192 IDs distincts/101 IDs runtime; représenter les alias de famille et de domaine; conserver 11 gabarits (skills, métiers, projet, quatre semaines avec quiz/options/réponses); et matérialiser 90 parcours guidés avec les thèmes par domaine, provenance et IDs stables. Aucun contenu non vérifié n’est publié automatiquement et aucun endpoint de fonction différée n’a été activé.

Comptes corroborés depuis le source : 76 occurrences de sept alias familiaux historiques; 11 × 4 semaines, 44 questions source/132 options; 90 × 4 semaines, 1 080 séances/quiz/questions et 3 240 options générées, en plus de 40 quiz/80 questions IT et 12 quiz/24 questions web. Options vérifiées : IT 313, web 72. `BesaDomainTracks` compte 98 clés, dont huit alias ayant des topics identiques aux canoniques; provenance à conserver sans collision. Les mappings familiaux restent à arbitrer et le namespace UUIDv5 doit être fixé avant matérialisation.

### Revue indépendante migration de contenu

Verdict : **À CORRIGER**. Source/fixture : 250 occurrences, 192 IDs distincts; runtime canonicalisé : 101 domaines (100 guided + web), dont 10 parcours spécialisés et 90 parcours générés; comptes IT/web ci-dessus. Fixture actuelle ne contient pas les 11 gabarits, skills/careers ni les chemins générés. Le seeder/test attend 250 domaines, ne canonicalise pas les 7 familles historiques et trois tests sont ignorés (inventaire, idempotence, corrigé) car quatre tables de provenance manquent encore dans les migrations backend; `content_audit_events` manque aussi. Ce dernier point relève des migrations applicatives, puisque les cinq tables sont dans le modèle contractuel actuel.

Ressources de fixture : 233, conservées en brouillon/non vérifiées; projects détaillés attendus : 11. Des IDs quiz/réponses de fixture sont valides selon l’audit statique, mais leur insertion n’a pas été vérifiée. Le seeder ne doit pas être accepté avant migration complète, tests seedés non ignorés, et conservation des templates/générés/alias.

### Première revue de l’amendement contractuel — 25 novembre 2026

Verdict : **À CORRIGER**. Le modèle structuré des gabarits est jugé étendu, mais trois éléments bloquent le seed/materialisation :

1. `docs/data-model.md:325` résout les alias domaines avant de filtrer par famille, contrairement au runtime `script.js:358-362` qui filtre par famille source avant canonicalisation. Le test doit comparer le set, pas seulement le nombre.
2. Alias identité `gestion-equipe→gestion-equipe` et `gestion-projet→gestion-projet` (`script.js:293,295`) ne peuvent pas être traités comme cycles. Les huit clés `BesaDomainTracks` alias doivent être tracées sans collision avec les topics canoniques.
3. `POST /admin/content-sources` autorise `licenseStatus=approved` pour `content_editor`, sans transition séparée ni reviewer obligatoire; publication doit exiger une approbation de droits explicite, traçable et autorisée.

Alias familiaux historiques vérifiés : hospitality 12, technical 11, agriculture 11, education 11, civic 11, science 10, health 10. Les mappings du contrat sont des propositions, pas des décisions approuvées. Le modèle permet un seed brut non publié en quarantaine sans mapper les familles; le mapping bloque canonisation/publication, pas la rétention brute.

Contrôles structurels rapportés : parsing YAML sans clés dupliquées, OAS 3.1, 61 chemins, 94 opérations, 89 schémas, 532 refs résolues, operationIds uniques, réponses et paramètres de chemin. Aucun validateur OAS dédié; tests structurels seulement. Aucun fichier modifié.

Correction syntaxe : le parseur local avait trouvé une erreur YAML ligne 3849 liée aux accolades d’un exemple inline; l’auteur a cité les descriptions aux lignes 3849 et 3926. Validation locale suivante avec PyYAML/détection des clés dupliquées réussie : OpenAPI 3.1.0, 62 chemins, 95 opérations, 92 schémas, 605 références locales (104 uniques), aucune manquante, operationIds uniques; zéro espace final dans les deux documents. Une relecture indépendante complète reste obligatoire.

### Seconde revue de l’amendement contractuel — 25 novembre 2026

Verdict : **ACCEPTÉ POUR RÉOUVRIR LA MIGRATION**, sans approbation des mappings familiaux. La revue a confirmé l’ordre filtre famille source → alias domaine → fusion, les alias identité hors graphe résoluble, les 8 aliases BesaDomainTracks avec leurs 32 observations tracées, la transition `content_approver` et UUIDv5 stable. Les 76 occurrences historiques peuvent être importées brutes en quarantaine non publique; aucun mapping n’est considéré validé.

La revue a signalé deux descriptions non citées dans des flow mappings; elles sont désormais citées. Décision d’Orca confirmée dans le modèle et l’OpenAPI : reviewer Sanctum distinct de l’auteur de la révision; les rôles peuvent se cumuler mais aucune auto-approbation. La dernière revue a trouvé une contradiction au modèle §5; l’auteur l’a corrigée et a ajouté au tableau d’autorisation le cas d’auto-approbation → 409 sans statut/audit. Relecture indépendante ciblée requise avant gel final.
- Auteur backend a corrigé les réponses 503/501 vers `application/problem+json`, ajouté les assertions correspondantes; 13 tests/139 assertions, Pint et route:list rapportés réussis. Relecture indépendante finale demandée.

## Résultat de rédaction

- `docs/openapi.yaml` et `docs/data-model.md` ont été rédigés par Contrat-API-Données.
- L’auteur rapporte une analyse YAML, des contrôles structurels OpenAPI, une vérification d’absence de corrections dans les schémas publics de quiz et `git diff --check` réussi.
- Aucun test PostgreSQL n’a été possible, le service local n’étant pas joignable.
- Points à confirmer relevés par l’auteur : limites de débit, conservation des données, plafond d’import et critères d’émission des certificats. Le relecteur indépendant confirme que plusieurs éléments restent à fixer avant le gel.

## Revue indépendante — 25 novembre 2026

Verdict du relecteur : **À CORRIGER**. Validation rapportée : YAML parsé, 361 références locales résolues, 60 opérations et identifiants uniques, réponses présentes; aucun validateur OpenAPI dédié n’était installé. Aucun fichier modifié pendant la revue.

Corrections bloquantes demandées :

- Documenter un seul flux Sanctum cohérent (cookie de session et CSRF pour le Next.js first-party, ou Bearer explicitement retenu) et les mécanismes de suppression/confirmation de compte.
- Fermer strictement le schéma d’import invité et ses objets imbriqués selon les champs source autorisés; préciser l’idempotence et le plafond.
- Décrire la création, lecture et liaison des cours, semaines, séances, quiz, questions et ressources pour que l’administration puisse réellement les gérer.
- Définir la session/limitation des quiz invités et leur durée de conservation.
- Fournir des décomptes source de complétude pour tous les parcours informatiques et clarifier la comparaison du contenu.
- Résoudre les schémas `PATCH` qui imposent les champs de création, le décalage entre `WeeklyGoal` et `weekly_goals`, et la mauvaise limite de débit sur logout.
- Ne pas présenter les certificats comme émissibles tant que les règles et la rétention ne sont pas définies; marquer explicitement leur disponibilité.

Décisions produit à apporter avant gel si aucun choix par défaut sûr ne peut être retenu : critères d’émission des certificats, durées de conservation des données de contact/tentatives, et plafond d’import. Le choix du flux d’authentification first-party est pris par Orca : cookie HttpOnly Sanctum avec CSRF, sans bearer exposé au navigateur.

## Corrections de l’auteur — 25 novembre 2026

L’auteur rapporte des corrections dans les deux contrats : Sanctum cookie + CSRF, import allowlisté et fermé, CRUD admin, quiz invités volatils/non vérifiés, suppression avec ré-authentification/confirmation, PATCH partiels, WeeklyGoal aligné, logout et limites `429`, certificats désactivés.

Comptage de complétude rapporté depuis les fichiers source :

- Dix parcours informatiques détaillés (hors web) : chacun 4 semaines, 4 séances, 4 quiz et 8 questions; totaux 40 semaines, 40 séances, 40 quiz, 80 questions.
- Parcours web détaillé : 4 modules, 12 leçons/séances, 12 quiz et 24 questions.
- Onze familles et onze gabarits génériques : ne sont pas assimilés à des parcours spécialisés détaillés.

Vérifications rapportées : YAML parsé, 88 opérations, 551 références locales, operationIds uniques, réponses déclarées; contrôles ciblés des PATCH, import fermé, corrections privées, CRUD/permissions et limites. Pas de validateur OpenAPI dédié disponible. Cette auto-validation ne remplace pas la seconde revue indépendante.

Décisions non prises : conservation des contacts et tentatives, durée de vie sessions invitées et jetons de suivi, plafond d’import, critères/preuves/rétention des certificats. Les certificats restent désactivés dans le contrat. La revue doit déterminer si ces décisions bloquent le gel contractuel ou peuvent rester des paramètres différés sans exposer de comportement ambigu.

## Seconde revue indépendante — 25 novembre 2026

Verdict : **À CORRIGER**. Le relecteur rapporte 58 chemins, 88 opérations, 78 schémas, 551 références locales résolues, operationIds uniques, réponses/paramètres déclarés, `429` pour les routes limitées; YAML sans clés dupliquées. Les quiz publics n’exposent pas de correction, `AuthSession` pas de Bearer token. Aucun validateur OpenAPI dédié n’a été installé.

Deux blocages : rétention des demandes de contact et rétention des tentatives authentifiées/résultats importés. La conservation peut être mise hors service explicitement jusqu’à décision, avec routes désactivées et comportement observable/documenté. Ne jamais accepter puis abandonner silencieusement les écritures. Risques non bloquants : extensions CSRF personnalisées, validation des IDs importés via catalogue versionné, traçabilité éditoriale, limites import et durées des jetons à fixer avant activation.

## Correction après seconde revue — 25 novembre 2026

L’auteur rapporte que les endpoints de sessions/tentatives quiz et d’historique, ainsi que l’acceptation, consultation et modification des contacts sont explicitement désactivés par erreur `503 FEATURE_DISABLED`; aucune écriture durable ne doit avoir lieu. `state.quizResults` non vide dans l’import entraîne le rejet de la requête entière avant toute mutation. Les tables correspondantes sont hors du schéma actif jusqu’à décision de rétention; les parcours de quiz locaux restent disponibles. L’auteur rapporte 88 opérations, 532 références, YAML sans doublons, réponses et operationIds présents, ainsi que les contrôles ciblés des routes désactivées/import et `git diff --no-index --check`.

Cette désactivation diffère temporairement les quiz corrigés côté serveur et le contact serveur demandé dans la cible. La réactivation requiert une politique de conservation validée. La revue indépendante doit évaluer si le report est explicite et acceptable pour geler les contrats/fondations sans prétendre livrer ces fonctions.

## Revue finale des contrats — 25 novembre 2026

Verdict indépendant : **ACCEPTÉ POUR GEL DES FONDATIONS AVEC FONCTIONS DIFFÉRÉES**. Aucun blocage majeur; risques mineurs documentés : appliquer CSRF globalement même si les générateurs ignorent l’extension, préflight d’import quiz avant toute mutation, et fixer plafond/limites/durées avant activation. Contrôles rapportés : parsing YAML sans doublons, OpenAPI 3.1.0, 58 chemins, 88 opérations, 532 références, IDs uniques et réponses/paramètres, vérification des routes différées, du schéma sans stockage actif et des risques antérieurs. Aucun validateur OAS dédié installé.

Différés explicites à réactiver seulement après décisions produit et nouvelle revue contractuelle :

- Quiz corrigé côté serveur, création de session, persistance de tentatives/historique et import de résultats quiz.
- Stockage/lecture/modification de contacts côté serveur.
- Certificats.

Les fondations peuvent s’aligner sur le contrat accepté, mais ne doivent pas fournir une voie cachée pour ces fonctions ni présenter les fonctionnalités désactivées comme livrées.

## Vérification des fondations — 25 novembre 2026

Validation exécutée localement dans les dossiers appropriés :

- Laravel 13.44.1, Sanctum 4.5.0, PHP 8.5; `php artisan test --compact` : 5 tests, 8 assertions réussis; Pint `--test` réussi.
- Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3; `npm run check` (ESLint, typecheck, build de production) réussi.
- `docker compose config --quiet` réussi; `git diff --check` sans erreur.
- `composer show --direct` confirme les versions installées; PostgreSQL local n’est pas joignable. Le précédent rapport signale l’échec du build d’image backend faute d’espace Docker; le build complet des images reste à vérifier.
- `backend/.env`, dépendances et résultats de build sont ignorés par Git; aucun secret local ne doit être ajouté au dépôt.

## Revue indépendante des fondations — 25 novembre 2026

Verdict : **À CORRIGER**, aucun P0 et trois constats P1 :

1. `backend/config/cors.php` n’autorise pas `Idempotency-Key` ni `If-Match`, requis par le contrat.
2. `backend/database/migrations/0001_01_01_000000_create_users_table.php` utilise ID auto-incrémenté, `name` obligatoire et unicité exacte d’email au lieu de UUID, nom facultatif et index unique insensible à la casse; aligner migration/modèle/tests.
3. `backend/routes/api.php` ne route pas le bootstrap CSRF ni les réponses 503 explicites des fonctions désactivées.

P2 : pas de `.gitignore` racine pour `.env`; CI ne construit pas les images Docker. Les tests de migration doivent utiliser la base mémoire configurée dans PHPUnit tout en gardant la migration compatible PostgreSQL. Vérifier spécifiquement les préflights CORS avec credentials, CSRF, et les routes désactivées.

Limite environnement : `/home` dispose d’espace mais `/` (racine Docker `/var/lib/docker`) est à 100 %, donc aucune construction d’image locale ne sera retentée; CI doit couvrir le build, et aucun nettoyage Docker destructif ne sera effectué sans autorisation.

## Correction infrastructure après revue — 25 novembre 2026

L’auteur rapporte l’ajout de la règle `.env` dans `.gitignore` racine sans ignorer `.env.example`, et d’un job CI `docker-build` avec secret de validation localisé, dépendant de la validation Compose, sans démarrage ni migration. `git check-ignore`, parsing YAML et `docker compose config --quiet` ont réussi. Pas de build local puisque `/var/lib/docker` est sur le système de fichiers `/` plein. Une relecture indépendante est demandée.

## Revue infra ciblée — 25 novembre 2026

Verdict infra : **APPROUVÉ**. `.env` ignoré et `.env.example` conservé; le job CI exécute `docker compose build backend frontend`, déclenché sur `push`, `pull_request` et `workflow_dispatch`, avec `POSTGRES_PASSWORD` de validation, sans lancer les services ni migrations dans ce job. YAML et configuration Compose validés. Un autre job CI démarre PostgreSQL pour les tests backend, indépendamment du build. Les images restent à valider réellement par CI; aucune validation GitHub Actions dédiée installée.

## Revue finale backend — 25 novembre 2026

Verdict : **APPROUVÉ POUR FONDATIONS**. Le correctif `application/problem+json` pour 503 `FEATURE_DISABLED` et 501 `NOT_IMPLEMENTED` concorde avec OpenAPI; les corps, codes et `feature` restent conformes et aucune opération désactivée ne persiste le corps métier. Revue indépendante : `php artisan test --compact` 15 tests/141 assertions, Pint réussi, 8 routes dans `route:list --path=api/v1`. PostgreSQL et Docker non exécutés. La couche d’autorisation `support_contact` reste fermée par défaut en l’absence du modèle de rôles; elle doit être implémentée avant une activation future d’administration.

## Corrections backend après revue — 25 novembre 2026

L’auteur rapporte :

- CORS autorise `If-Match` et `Idempotency-Key` explicitement.
- Migration `users` et modèle alignés sur UUID, nom facultatif et index unique sur `LOWER(email)`; `sessions.user_id` UUID.
- `GET /api/v1/auth/csrf-cookie` branché sur l’implémentation Sanctum installée; le bootstrap possède une limite configurable déclarée.
- Les routes de session/tentatives quiz persistantes, historique et contacts renvoient 503 `FEATURE_DISABLED` sans traitement/persistance; les opérations protégées gardent Sanctum; accès admin-contact fermé par défaut faute de rôles intégrés.
- Import quiz non vide rejeté en 503; import métier restant non implémenté.
- Tests ciblés rapportés : 13 tests / 131 assertions; Pint réussi; 8 routes dans `route:list --path=api/v1`.

La revue indépendante valide la migration, CORS, CSRF et routes, avec 15 tests/133 assertions, Pint et route:list réussis, mais exigeait `application/problem+json` pour les 503/501. L’auteur rapporte ce dernier correctif et ses assertions. L’auteur n’a pas exécuté PostgreSQL ou Docker; l’environnement PostgreSQL hôte est absent et la racine Docker pleine. Toute opération de rôles demeure bloquée jusqu’à l’intégration d’un modèle d’autorisation approuvé.

## Reprise contenu SQLite — en attente de revue

Le seed de contenu s’exécute désormais en base SQLite isolée via les tests `RefreshDatabase`; la suite complète actuelle locale : **81 tests / 21 561 assertions réussis** (incluant portfolio). Base SQLite persistante non migrée/non seedée.

Comptes en base de test : 250 occurrences / 192 IDs; 174 occurrences de familles actives, 76 occurrences historiques en quarantaine; 72 alias de domaine dont 70 résolvables et deux identités; 101 domaines runtime. Le catalogue contient 11 templates familiaux v1, 90 chemins générés + 11 détaillés, 404 semaines, 1 132 séances/quiz, 1 184 questions, 3 625 options; 233 ressources brouillon/non vérifiées. Sources restent `review_required`; contenus gabarits, domaines, pathways, quiz et projets non publiés. Corrections, UUIDv5, idempotence et projections de quiz ont des assertions de test rapportées.

La migration contient désormais le pivot `family_pathway_template_content_sources`; le seeder crée exactement 11 liens source `guided-pathways.js` avec insertOrIgnore; les tests comparent les IDs exacts, la relation Eloquent, idempotence après re-seed et absence de doublons. Les sources restent `review_required`, les templates `draft`; aucun lien n’auto-approuve ni publie. Le test ciblé et la suite complète passent après ce correctif; une revue indépendante finale contenu/provenance est en cours. Les comptes seedés sont ceux de la base test; la base persistante n’a pas été migrée.

La revue indépendante finale approuve le lien de provenance template/source et la migration pédagogique. Suite frontend `npm run check` passée. La base persistante reste inchangée (3 migrations Laravel de base seulement).

La tranche UI apprenant ajoute `/connexion`, `/inscription`, `/profil`, `/progression`, `/notes` et `/bibliotheque`, conserve le quiz en consultation sans essai serveur, et utilise CSRF Sanctum côté navigateur sans cookie transmis par SSR. Relecture frontend **APPROUVÉE** pour session/errors, pagination, logout CSRF, IP guards et IDNA/punycode. `cd frontend && npm run check` passe, routes SSR dynamiques.

API apprenant livrée : profile GET/PATCH, progress GET/PUT, lesson-progress PUT, project-progress PUT, notes GET/POST/DELETE, saved-resources GET/POST/DELETE et weekly-goal GET/PUT. Données utilisateur isolées par session Sanctum, références vérifiées contre contenu publié, emails/dates de naissance exclus du profil, URLs saved validées HTTPS/DNS public sans fetch, notes nettoyées. Allowlist stricte 31 routes/méthodes. Suite backend locale **65 tests / 21 361 assertions réussis**, aucun skip. OpenAPI parsing 62 paths/95 ops/92 schemas/636 refs, zero missing. Revue indépendante **APPROUVÉ POUR API APPRENANT**; tests ciblés learner 18/518 et import/désactivation 14/167. Import invité hors résultats de quiz, PATCH note absent du contrat, tentatives/contacts/certificats restent différés.

La revue indépendante apprenant a confirmé CORS/ETag, DNS saved URLs, limites, PUT idempotents et media types pour routes controller. Corrections auteur : import invité retourne 415 avant lecture JSON, PATCH profil sérialise avatar vide en objet, `/me` a profileRead limiter; contrat déclare les réponses. Suite backend locale **65 tests / 21 361 assertions**, relecture indépendante finale **APPROUVÉ POUR API APPRENANT**; tests ciblés learner 18/518, tests import/désactivation 14/167 pass. PostgreSQL/Docker non testés.

La suite frontend `cd frontend && npm run check` est également passée après reprise (lint, TS, build Next 16, routes SSR dynamiques). Compose résout `API_BASE_URL=http://backend:8000/api/v1`; `.env` racine ignoré et `.env.example` trackable. La base SQLite persistante contient uniquement les 3 migrations Laravel de base; les migrations catalogue/provenance sont `Pending` et n’ont volontairement pas été exécutées sur cette base locale.
