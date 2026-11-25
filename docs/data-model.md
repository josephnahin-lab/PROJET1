# Modèle de données Librescence

> Contrat de conception PostgreSQL pour l’API Laravel `/api/v1`. Ce document décrit la cible, pas le schéma effectivement déployé. Les décisions non prouvées par la source statique sont marquées **Hypothèse** ou **À décider**.

## 1. Périmètre et faits établis

La source actuelle est le site statique à la racine (`script.js`, `guided-pathways.js`, `index.html`, `README.md`, `supabase.sql`). La synchronisation Supabase et l’accès compte y sont désactivés dans `initializeApp`; `supabase.sql` ne définit que des profils et un instantané JSON de progression, protégés par RLS/MFA. Ce schéma ancien n’est pas le contrat relationnel cible. Les tables ajoutées ici (inventaires source, alias de familles, templates/générations, rôles et provenance) sont des exigences contractuelles, pas des tables déjà déployées : l’audit des migrations backend et le test de complétude attestent que plusieurs migrations de provenance/audit manquent encore. La présence de leurs noms dans ce document ne doit pas être interprétée comme preuve d’implémentation.

Faits utiles à la migration :

- 11 familles de domaines; le README annonce dix parcours informatiques disponibles et des contenus hors informatique en préparation.
- L’audit direct de `script.js` compte **250 enregistrements bruts**, contenant **192 valeurs d’ID de domaine distinctes** (les 250 lignes ne sont donc pas 250 domaines uniques). L’ordre runtime est strict : filtrer d’abord chaque enregistrement sur son `raw family` parmi les 11 familles actives, appliquer ensuite `domainAliases`, puis merger les enregistrements par ID résolu. Ce calcul donne **101 domaines runtime** : 100 parcours guidés (10 spécialisés + 90 générés) et le web. Cela ne représente pas une décision éditoriale.
- Les sept family IDs historiques présents dans 76 enregistrements sont `hospitality` (12), `technical` (11), `agriculture` (11), `education` (11), `civic` (11), `science` (10) et `health` (10). Ils ne sont pas dans les 11 familles canoniques. Leurs contenus et valeurs `raw_family_id` restent en quarantaine non publiée; les correspondances suggérées sont uniquement `proposed`, ne renseignent pas la famille canonique et ne modifient pas l’inventaire runtime.
- `guided-pathways.js` contient exactement 11 gabarits familiaux versionnables. Chaque gabarit comporte 4 semaines modèles, chacune avec question, liste d’options, index de réponse correcte et feedback. `script.js` en développe, pour chaque domaine guidé sans parcours spécialisé, 4 semaines × 3 séances/quiz, soit 12 séances, 12 quiz et 12 questions par domaine. `BesaDomainTracks` comporte 98 clés : 90 clés canoniques et huit clés alias dont les quatre topics sont identiques à leur cible canonique.
- Le parcours web contient 4 modules, 12 leçons/séances, 12 quiz et 24 questions (deux questions par leçon).
- Le dépôt contient dix parcours informatiques détaillés : Réseaux (`networks`), Cybersécurité (`cyber`), Linux (`linux`), Assistance informatique (`support`), Python (`python`), Android (`mobile`), Bases de données (`databases`), Données et IA (`data`), Cloud (`cloud`) et DevOps (`devops`). Chacun a 4 semaines, 4 séances, 4 quiz et 8 questions.
- La source comporte aussi des fiches de domaine et du contenu d’initiation généré par famille. Leur présence dans le JavaScript n’est pas, à elle seule, une approbation éditoriale pour les publier comme formation. Le statut public doit donc venir d’une décision de publication persistée et révisable, jamais du seul fait qu’un objet existe dans le code.
- État local normalisé par `defaultState()`/`normalizeState()` : `besa.learning.v2`, version interne 3; migration historique depuis `capClair.learning.v2` et `capClairCompleted`. L’objet normalisé contient domaine sélectionné, plan, leçons terminées, résultats/réponses de quiz, progression de spécialité, ressources sauvegardées, objectif hebdomadaire, jours actifs, état du projet web, fiches de portfolio et préférences. Les blobs de fichiers sont séparés dans IndexedDB. Aucun champ `notes` n’est inclus dans cet objet normalisé; ne pas importer de notes d’une autre clé sans audit supplémentaire de sa forme réelle.
- Les fichiers du portfolio sont des Blobs dans IndexedDB `besa-portfolio-files`, store `files`. L’interface autorise un PDF (5 Mio max.) et une image PNG/JPEG/WebP (2 Mio max.) par fiche; la capacité totale est celle du navigateur et n’est pas garantie.
- Le contact actuellement affiché prépare un message WhatsApp après consentement; il n’est pas enregistré ni envoyé par le site. Les certificats et rappels e-mail serveur sont des besoins de la cible, pas des fonctions existantes.
- Le profil source contient prénom/pseudo et nom, date de naissance facultative, intérêts, avatar et préférences. La date de naissance ne sera ni requise ni importée par défaut.

### Hypothèses de conception à confirmer

1. **H1 — Identifiants :** identifiants techniques UUID pour les lignes; identifiants publics immuables et lisibles pour familles/domaines/contenus, avec tables d’inventaire et d’alias. Les IDs tels que `web`, `networks` et `cyber` sont conservés. Une clé source brute, une clé canonique de domaine et un ID renvoyé par le runtime sont des notions distinctes; aucune étape ne déduit une identité d’un titre.
2. **H2 — Disponibilité éditoriale :** `preparing` reste non consultable par le catalogue public; la publication exige une validation humaine et un contenu complet. Les dix parcours informatiques et le parcours web peuvent être importés comme disponibles seulement après vérification de leur provenance et de leur état actuel. Tout autre contenu reste en préparation jusqu’à approbation.
3. **H3 — Authentification approuvée :** comptes facultatifs; le Next.js first-party utilise Sanctum par cookie de session HttpOnly et flux CSRF. Aucun bearer token n’est exposé au navigateur. Les clients non navigateur ne sont pas couverts par ce contrat tant qu’un besoin distinct n’est pas approuvé.
4. **H4 — Certificats désactivés :** aucun endpoint, table active ni réponse ne doit prétendre émettre ou vérifier un certificat valide. Critères d’admissibilité, seuils, contenu de preuve, présentation et conservation sont des décisions requises avant conception d’une future API.
5. **H5 — Rétention contact/quiz : décision produit requise.** Jusqu’à approbation de durées et d’une purge, le stockage des demandes de contact, tentatives authentifiées et résultats de quiz importés est désactivé : leurs tables ne sont pas créées et leurs opérations API retournent 503. Aucune durée ni règle de purge n’est inventée.
6. **H6 — Fichiers du portfolio compte :** stockage privé hors base, sans URL de téléchargement publique ou signée/tokenisée. Le contenu est streamé uniquement par la route API authentifiée Sanctum après contrôle d’accès; aucun fournisseur ou backend de stockage n’est imposé par ce contrat.
7. **H7 — Import : décision produit requise.** Le plafond total en octets n’est pas fixé et aucune valeur n’est proposée comme limite. Le mesurer sur des états locaux représentatifs, puis faire approuver la limite avant implémentation. Les blobs IndexedDB sont exclus de ce corps.
8. **H8 — Alias historiques de familles :** toutes les suggestions de la table ci-dessous restent `proposed`; aucune n’est utilisée comme famille canonique avant une décision et une revue `content_approver`. Les 76 occurrences conservent leurs données brutes en quarantaine jusque-là.
9. **H9 — Options source :** les totaux vérifiés sont 313 options pour les dix parcours IT et 72 pour le web; chaque question a une cardinalité source propre qui doit aussi être comparée. Les 11 templates comptent 132 options et les 90 chemins générés 3 240 options.

## 2. Conventions PostgreSQL

- PostgreSQL; tables singulières ou plurielles au choix du dépôt, mais noms cohérents en `snake_case`. Toutes les dates sont `timestamptz` en UTC; les jours d’activité sont des dates locales `date`.
- Clés techniques UUID; les lignes importées et les enfants générés utilisent exclusivement la stratégie UUIDv5 figée ci-dessous; aucun UUID aléatoire ni fallback n’est permis dans le seed. Clés étrangères explicites, `ON DELETE CASCADE` seulement pour les données privées appartenant exclusivement au compte. Le contenu éditorial référencé par historique est archivé plutôt que supprimé.
- `created_at`, `updated_at` sur les entités mutables; `published_at`, `deleted_at` ou `revoked_at` lorsque pertinent. Utiliser des contraintes `CHECK`, `NOT NULL`, `UNIQUE` et clés étrangères pour les invariants simples.
- Slugs publics uniques, normalisés en minuscules ASCII avec tirets. Une fois publié, un slug/ID ne change pas; le renommage ne change que le titre. L’API ne révèle pas les UUID internes des réponses de quiz si un ID de contenu stable suffit.
- Contenu versionné : toute modification d’une version publiée crée une nouvelle version de parcours ou un brouillon; progression et résultats conservent la version à laquelle ils se rapportent.
- Les JSONB sont réservés aux préférences évolutives et aux instantanés d’import minimisés; pas de gros blob, réponse éditoriale ou fichier en JSONB. Les champs évaluables et interrogeables restent relationnels.
- Les PUT de `/me/lesson-progress` et `/me/project-progress/{projectId}` remplacent/upsertent l’état par clé unique et sont naturellement idempotents : pas de `Idempotency-Key` ni de registre/table générique d’idempotence pour ces opérations. Les opérations qui exigent contractuellement une vraie sémantique d’idempotence, notamment l’import invité, conservent leurs clés et contraintes dédiées.
- Appliquer comme limites initiales effectivement approuvées et actives `profileRead: 120/minute/account` (lecture de compte, dite `accountRead` dans le résumé) aux GET de profil, progression, notes, ressources sauvegardées, objectif hebdomadaire, portfolio et préférences de rappel; appliquer `accountWrite: 30/minute/account` à leurs mutations. Les écritures de portfolio, sauf téléversement, et les mutations de préférences de rappel utilisent aussi `accountWrite`. Le téléversement d’une pièce jointe utilise `portfolioUpload: 10/hour/account`. Ces seuils sont révisables par configuration et mesure, sans supprimer les limites. Toutes les clés sont par compte authentifié, jamais par IP brute.

#### Identifiants déterministes du seed

Namespace UUIDv5 fixe : `6ba7b811-9dad-11d1-80b4-00c04fd430c8` (namespace URL standard). Pour une entité racine, le nom exact est `urn:librescence:content:v1/{entityType}/{canonicalSourceKey}/v{version}`. Pour une entité enfant, le nom inclut son parent et sa stable key : `urn:librescence:content:v1/{entityType}/{parentCanonicalSourceKey}/{stableKey}/v{version}`. Les composants sont UTF-8 et encodés RFC 3986 avant assemblage; le namespace et le littéral `v1` sont immuables.

`entityType` est le nom contractuel de l’entité UUID seedée : `content_source`, `source_record`, `source_resource`, `pathway`, `pathway_skill`, `career_example`, `week`, `lesson`, `quiz`, `question`, `option`, `project`, `project_checklist_item`, `resource`, `family_template`, `template_skill`, `template_career_example`, `template_week`, `template_option`, `template_stage`, `template_domain_topic`, `template_domain_topic_alias_source` et `pathway_generation_topic`. Les `domains.id`, familles, inventaires et tables d’alias sont des IDs/PK naturels et ne sont pas remplacés par UUID. `canonicalSourceKey` est une clé stable explicitement enregistrée dans le manifeste, jamais un titre; chaque occurrence de source utilise une `source_record_key` distincte, scellée par `source_revision`. La version est un entier inscrit au manifeste : première version/template de la source actuelle = `1`; les révisions éditoriales suivantes incrémentent le numéro sans changer l’identité des versions anciennes. Pour un enfant sans version propre, prendre la version du parent éditorial. Le seed s’arrête avec erreur/quarantaine si une clé ou version manque; il ne génère jamais un identifiant aléatoire, ne recourt pas à un fallback et n’écrase pas une UUID existante si son nom déterministe ne correspond pas. Toute évolution incompatible du format incrémente le namespace de nom `vN` après migration explicite. Les UUID d’événements créés à l’exécution ne font pas partie du seed et suivent leur propre cycle applicatif.

## 3. Tables

### Identité et compte (comptes facultatifs)

#### `users`

Compte Laravel/Sanctum. `id uuid PK`, `email varchar(254) NOT NULL`, `password` hashé par Laravel, `email_verified_at timestamptz NULL`, `status enum(active, deletion_pending, deleted, suspended)`, `created_at`, `updated_at`, `deleted_at NULL`. L’email sert à l’authentification et aux courriels demandés; ne pas collecter numéro de téléphone ni date de naissance par défaut. Le navigateur first-party s’authentifie par session cookie HttpOnly avec validation CSRF; aucun bearer exposé. La session Laravel/Sanctum est révocable et n’est jamais stockée dans les tables de progression.

Index unique sur `lower(email)`; index partiel sur les comptes actifs. Désactiver/révoquer les sessions à la demande de suppression. Pas d’extension PostgreSQL requise pour la comparaison insensible à la casse.

#### `roles`, `user_role_assignments`

`roles.code varchar(40) PK` limité aux rôles serveur `content_editor`, `content_approver`, `support_contact` et `system_admin`; `description text`. `user_role_assignments`: `user_id FK users ON DELETE RESTRICT`, `role_code FK roles`, `granted_by uuid FK users`, `granted_at timestamptz`, `revoked_at timestamptz NULL`, `PRIMARY KEY(user_id, role_code, granted_at)`. Index partiel sur les affectations actives par `(user_id, role_code)`. Le compte n’a aucun rôle privilégié par défaut; révocation et attribution sont journalisées. Un compte peut avoir plusieurs rôles, mais le contrôle de conflit d’intérêts est toujours appliqué : cumuler `content_editor` et `content_approver` n’autorise jamais l’auto-approbation d’une source ou révision. `system_admin` n’accorde pas automatiquement l’accès aux données privées ou aux contacts. `support_contact` ne donne aucun accès tant que la capacité de contact demeure désactivée.

#### `reauthentication_grants`, `account_deletion_requests`

`reauthentication_grants`: `id uuid PK`, `user_id FK users ON DELETE CASCADE`, `token_hash char(64) UNIQUE`, `expires_at`, `consumed_at NULL`, `created_at`. Le mot de passe courant est vérifié avant émission; le grant est à usage unique et de durée courte, jamais renvoyé dans les logs. Durée exacte de validité à configurer avant déploiement.

`account_deletion_requests`: `id uuid PK`, `user_id uuid NULL`, `status enum(deletion_pending,completed)`, `status_token_hash char(64) UNIQUE`, `requested_at`, `completed_at NULL`, `idempotency_key varchar(128)`, `created_at`. Création requiert grant récent et `confirm=true`; passage à `deletion_pending` et révocation de toutes les sessions Sanctum sont atomiques. Le token de statut autorise uniquement la lecture du statut minimal, jamais le compte ou ses données. La durée de validité du token de suivi et la conservation du reçu après purge sont à décider; ne pas conserver l’email/profil uniquement pour permettre ce suivi.

#### `learner_profiles`

`user_id uuid PK/FK users`, `display_name varchar(60) NULL`, `avatar jsonb NOT NULL DEFAULT {}`, `interests text[] NOT NULL DEFAULT '{}'`, `theme enum(light,dark)`, `resource_language enum(fr,en,es)`, `learning_mode enum(guided,free)`, `locale varchar(16) NOT NULL DEFAULT 'fr'`, `created_at`, `updated_at`.

Le nom et le prénom sont facultatifs après création du compte; `display_name` peut être un pseudo. **Pas de colonne de date de naissance dans la première version.** Si une nécessité est ultérieurement approuvée, stocker seulement la valeur strictement nécessaire avec consentement/notice, accès restreint et échéance de suppression; ne jamais en faire un prérequis d’inscription ou d’import. Avatar et préférences sont décoratifs et non sensibles; valider leur forme et liste de valeurs.

### Catalogue et contenu versionné

#### `domain_families`

`id varchar(80) PK` (ID stable source, notamment `digital`, `culture`), `name`, `description`, `sort_order integer`, `status enum(published,preparing,archived)`, timestamps.

#### `domains`

`id varchar(100) PK` stable (ex. `web`, `networks`, `cyber`), `family_id FK domain_families`, `name`, `summary`, `availability enum(published,preparing,archived) NOT NULL DEFAULT preparing`, `content_status enum(draft,in_review,approved,published,archived)`, `source_version varchar(100) NULL`, `published_at NULL`, timestamps.

Un domaine `preparing` ou non publié est exclu des routes publiques de catalogue, recherche, recommandation et de tous les liens publics vers son contenu. L’API publique expose uniquement les domaines dont le statut de publication est approuvé. Une ancienne valeur de statut « ready/guided » du JS n’est pas automatiquement une preuve de complétude éditoriale.

#### `domain_id_aliases`

`alias varchar(100) PK`, `domain_id FK domains`, `source_system varchar(80)`, `source_revision varchar(100)`, `mapping_status enum(source_verified,proposed,approved,rejected)`, `reviewed_by uuid FK users NULL`, `reviewed_at timestamptz NULL`, `created_at`. Cette table ne contient que des arêtes réellement résolubles : `CHECK(alias <> domain_id)`, cibles directes canoniques, aucune chaîne ni aucun cycle. Une clé alias normalisée ne peut pointer qu’à un domaine. La correspondance exacte de `domainAliases` est contrôlée par rapport à la source; aucune cible n’est choisie selon l’ordre des lignes.

#### `domain_id_alias_sources`

Cette table de provenance conserve **toutes** les paires exactes de `domainAliases` à chaque révision, sans être le graphe actif : `source_system varchar(80)`, `source_revision varchar(100)`, `source_key varchar(100)`, `source_target varchar(100)`, `canonical_domain_id varchar(100) FK domains`, `source_id FK content_sources`, `resolution_kind enum(resolvable,identity)`, `PRIMARY KEY(source_system, source_revision, source_key)`. Invariant : `identity` iff `source_key=source_target`; `resolvable` iff `source_key<>source_target`. Les deux observations identitaires sont `gestion-equipe→gestion-equipe` et `gestion-projet→gestion-projet`. Elles gardent paire/révision/source mais ne sont jamais insérées dans `domain_id_aliases`, jamais parcourues et ne déclenchent donc aucune détection de cycle. Les lignes résolubles correspondantes alimentent les arêtes opérationnelles `domain_id_aliases`.

#### `domain_family_aliases`

`alias varchar(80) PK`, `proposed_family_id FK domain_families NULL`, `canonical_family_id FK domain_families NULL`, `source_system varchar(80)`, `mapping_status enum(proposed,approved,rejected)`, `reviewed_by uuid FK users NULL`, `reviewed_at timestamptz NULL`, `created_at`. À l’état initial, les sept lignes ont `mapping_status=proposed`, `proposed_family_id` facultatif et `canonical_family_id=NULL`. Seule une décision de `content_approver` peut passer à `approved`, avec `reviewed_by`, `reviewed_at` et un événement d’audit; les valeurs brutes restent présentes. Un mapping `proposed` ou `rejected` ne modifie jamais `domains.family_id`, `source_domain_records.canonical_family_id`, ni la visibilité runtime. L’approbation du mapping n’équivaut toujours pas à la publication du contenu. Alias unique, pas de collision avec les 11 IDs canoniques et pas de double cible.

Suggestions de revue (ce ne sont pas des valeurs canoniques et ne doivent pas être appliquées au seed) :

| Family ID source historique | Occurrences brutes | Famille canonique suggérée, non appliquée | État initial |
|---|---:|---|---|
| `hospitality` | 12 | `mobilite-accompagnement` (ambigu : inclut aussi tourisme, restauration, sport et culture) | `proposed` |
| `technical` | 11 | `metiers-techniques-industrie` | `proposed` |
| `agriculture` | 11 | `agriculture-environnement` | `proposed` |
| `education` | 11 | `education-competences` | `proposed` |
| `civic` | 11 | `droit-action-citoyenne` | `proposed` |
| `science` | 10 | `sciences-ingenierie` | `proposed` |
| `health` | 10 | `sante-accompagnement` | `proposed` |

Cette table de suggestions ne crée pas de relation active vers une famille. Les 76 occurrences conservent leur contenu et leur famille brute en quarantaine non publiée. Les IDs canoniques sont les 11 IDs actuels de `script.js`: `digital`, `entreprendre-gerer`, `creation-medias`, `metiers-techniques-industrie`, `agriculture-environnement`, `sciences-ingenierie`, `sante-accompagnement`, `education-competences`, `droit-action-citoyenne`, `mobilite-accompagnement` et `culture`. Aucun mapping historique ne devient canonique ou visible sans revue humaine.

#### `source_domain_id_inventory`, `source_domain_records`, `source_domain_resources`

- `source_domain_id_inventory`: une ligne par ID de domaine distinct observé dans l’artefact source; `source_system varchar(80)`, `source_domain_id varchar(100)`, `canonical_domain_id varchar(100) NULL FK domains`, `resolution enum(canonical,alias,quarantined_family,unresolved)`, `PRIMARY KEY(source_system, source_domain_id)`. L’import de référence doit enregistrer **192** IDs distincts, pas 250. Si toutes ses occurrences ont une raw family historique non approuvée, la cible reste NULL et l’état est `quarantined_family`; `unresolved` conserve les collisions/autres problèmes. Aucune valeur n’est écartée.
- `source_domain_records`: une ligne par occurrence brute de domaine; `id uuid PK`, `content_source_id FK content_sources`, `source_system varchar(80)`, `source_record_key varchar(240)`, `source_position integer CHECK(source_position > 0)`, `source_domain_id varchar(100)`, `raw_family_id varchar(80)`, `canonical_family_id varchar(80) NULL FK domain_families`, `family_resolution enum(active_raw,approved_alias,quarantined,unresolved)`, `canonical_domain_id varchar(100) NULL FK domains`, `raw_name varchar(180)`, `raw_description text NULL`, `raw_status varchar(40) NULL`, `record_checksum char(64)`, `created_at`; `UNIQUE(content_source_id, source_record_key)` et FK composite `(source_system, source_domain_id)` vers l’inventaire source. Si `raw_family_id` n’est pas l’un des 11 IDs actifs et aucune approbation n’existe, `canonical_family_id` et `canonical_domain_id` restent NULL, `family_resolution=quarantined`; tout le contenu et les ressources bruts demeurent préservés.
- `source_domain_resources`: `id uuid PK`, `source_record_id FK source_domain_records ON DELETE RESTRICT`, `position integer CHECK(position > 0)`, `title`, `url text`, `language varchar(80) NULL`, `provider varchar(160) NULL`, `resource_checksum char(64)`, `UNIQUE(source_record_id, position)`. Conserve les ressources attachées à chaque enregistrement brut; la copie éditoriale correspondante dans `resources` garde sa provenance et commence en brouillon/non vérifiée.

`domain_id_aliases` gère les seules arêtes résolubles d’IDs; `domain_id_alias_sources` conserve les paires source complètes, y compris les deux no-op; `source_domain_id_inventory` gère les 192 IDs; `source_domain_records` garde les 250 occurrences. Ne pas les confondre. Les alias familiaux ne sont appliqués qu’après décision et revue et ne sont jamais appliqués avant le filtre runtime par `raw_family_id`.

L’import doit enregistrer chaque paire clé/cible de `domainAliases` présente dans `script.js`, y compris les deux paires identité, dans `domain_id_alias_sources` avec sa source/révision; comparer l’ensemble exact avec la source. Le graphe `domain_id_aliases` est exactement le sous-ensemble `resolvable`; aucune clé n’a deux cibles ni chaîne/cycle.

#### `runtime_domain_inventory`

`domain_id varchar(100) PK/FK domains`, `family_id FK domain_families`, `runtime_kind enum(web,specialty,generic_template)`, `source_revision varchar(100)`, `created_at`. Manifeste reproductible des **101** IDs. L’algorithme exact est : (1) filtrer les 250 enregistrements par leur raw `family` appartenant aux 11 familles actives; (2) résoudre l’ID par les seules paires `resolvable` de `domainAliases`; (3) merger les occurrences ayant le même ID résolu. Les aliases de famille historiques ne sont jamais appliqués dans ce calcul.

`runtime_domain_inventory_sources`: `runtime_domain_id FK runtime_domain_inventory`, `source_record_id FK source_domain_records`, `raw_family_id varchar(80)`, `raw_domain_id varchar(100)`, `applied_alias varchar(100) NULL FK domain_id_aliases(alias)`, `source_revision varchar(100)`, `PRIMARY KEY(runtime_domain_id, source_record_id)`. Une ligne par enregistrement brut qui passe le filtre et contribue au domaine fusionné. `applied_alias` référence seulement une arête résoluble exacte; pour l’identité ou absence d’alias, elle est NULL.

Le test de complétude ne vérifie pas seulement `count(*)=101`: il compare le set trié des 101 IDs canonisés, les 250 occurrences (ID/famille/position/checksum), les 192 IDs source distincts, l’ensemble exact des paires `domain_id_alias_sources` (arêtes + identité), l’égalité du graphe résoluble avec le sous-ensemble non-identité, les familles raw filtrées et les liaisons de provenance `runtime_domain_inventory_sources`. Il compare également les catégories : 10 `specialty`, 90 `generic_template`, 1 `web`. Tout écart de set/source/alias bloque le seed même si le nombre total reste 101. L’inventaire n’est ni décision éditoriale ni allowlist publique.

#### `pathways`

`id uuid PK`, `domain_id FK domains`, `stable_key varchar(120)`, `slug varchar(120)`, `status enum(draft,in_review,published,archived)`, `title`, `eyebrow varchar(180) NULL`, `description text NULL`, `overview text NULL`, `difficulty varchar(60) NULL`, `prerequisites text[] NOT NULL DEFAULT '{}'`, `equipment text[] NOT NULL DEFAULT '{}'`, `skills/careers` via tables enfants, `weekly_time varchar(120) NULL`, `safety_note text NULL`, `completion_policy jsonb NULL`, `family_template_id uuid NULL`, `family_template_version integer NULL`, `generation_key char(64) NULL UNIQUE`, `generation_checksum char(64) NULL`, `version integer CHECK(version > 0)`, `source_version`, `published_at NULL`, timestamps. Les champs descriptifs peuvent rester vides en brouillon; une publication valide leur complétude. `stable_key`/slug est immuable et distinct du UUID technique. `UNIQUE(domain_id, stable_key, version)` et au plus une version publiée courante par domaine/stable_key (index unique partiel). Les quatre champs de génération sont soit tous renseignés soit tous NULL; ils ne remplacent pas les liaisons de provenance. `family_template_id` et `family_template_version` forment une FK composite vers une version de template immuable.

#### `pathway_skills`, `pathway_career_examples`

`pathway_skills`: `id uuid PK`, `pathway_id FK pathways ON DELETE RESTRICT`, `position integer CHECK(position > 0)`, `label varchar(240)`, `UNIQUE(pathway_id, position)`. `pathway_career_examples` a les mêmes colonnes et contraintes, avec libellé de carrière. Ce sont des exemples pédagogiques, non une promesse d’emploi/qualification. La provenance est héritée de `pathway_content_sources`; cette structure porte les `skills` et `careers` des 11 gabarits et des dix parcours spécialisés sans champ JSON libre.

`completion_policy` décrit les séances et quiz obligatoires et un seuil entier/ratio; les valeurs doivent être validées contre les IDs de cette version. Valeur initiale conservatrice : toutes les séances et quiz requis, sans seuil de réussite inventé dans les contenus. Les certificats restent désactivés tant que cette règle n’est pas approuvée.

#### `pathway_weeks`

`id uuid PK`, `pathway_id FK pathways ON DELETE RESTRICT`, `stable_key varchar(100)`, `position integer CHECK(position > 0)`, `title`, `label`, `UNIQUE(pathway_id, stable_key)`, `UNIQUE(pathway_id, position)`.

#### `lessons`

`id uuid PK`, `week_id FK pathway_weeks ON DELETE RESTRICT`, `stable_key varchar(120)`, `position integer CHECK(position > 0)`, `title`, `objective`, `explanation`, `activity`, `duration_minutes integer CHECK(duration_minutes > 0) NULL`, `UNIQUE(week_id, stable_key)`, `UNIQUE(week_id, position)`.

Le parcours web peut garder ses modules comme semaines/sections de programme; les 12 IDs stables présents dans la source (`web-map`, `web-first-site`, `web-setup`, `html-structure`, `html-links-images`, `html-semantics`, `css-first-style`, `css-layout`, `css-responsive`, `js-first-steps`, `js-events`, `web-quality`) sont des `stable_key`, pas des identifiants de version.

#### `family_pathway_templates` et tables enfants normalisées

- `family_pathway_templates`: `id uuid PK`, `family_id FK domain_families`, `stable_key varchar(120)`, `version integer CHECK(version > 0)`, `status enum(draft,in_review,approved,published,archived) NOT NULL DEFAULT draft`, `project_text_template text`, `project_topics_suffix_template text`, `source_version varchar(100)`, `created_at`, `updated_at`; `UNIQUE(family_id, stable_key, version)`, `UNIQUE(id, version)`. La première importation des 11 gabarits reçoit le numéro de version `1`, attaché au checksum source; cela ne les approuve/publie pas. Un gabarit est versionné et rattaché à une famille canonique.
- `family_template_skills` et `family_template_career_examples`: `id uuid PK`, `template_id FK family_pathway_templates ON DELETE RESTRICT`, `position integer CHECK(position > 0)`, `label varchar(240)`, `UNIQUE(template_id, position)`.
- `family_template_weeks`: `id uuid PK`, `template_id FK family_pathway_templates ON DELETE RESTRICT`, `stable_key varchar(100)`, `position integer CHECK(position BETWEEN 1 AND 4)`, `title text`, `explanation text`, `exercise text`, `quiz_prompt text`, `source_answer_index smallint CHECK(source_answer_index >= 0)`, `correct_option_position integer`, `feedback text`, `UNIQUE(template_id, stable_key)`, `UNIQUE(template_id, position)`. L’index source est zéro-based; `correct_option_position` est un-based et doit référencer `source_answer_index + 1` parmi les options de cette semaine. La publication exige une explication/feedback non vide.
- `family_template_quiz_options`: `id uuid PK`, `template_week_id FK family_template_weeks ON DELETE RESTRICT`, `stable_key varchar(100)`, `position integer CHECK(position > 0)`, `label text`, `UNIQUE(template_week_id, stable_key)`, `UNIQUE(template_week_id, position)`. Les réponses sont des positions de relation, pas un JSONB.
- `family_template_stages`: `id uuid PK`, `template_week_id FK family_template_weeks ON DELETE RESTRICT`, `stable_key varchar(100)`, `position integer CHECK(position BETWEEN 1 AND 3)`, `stage_title_template text`, `objective_template text`, `exercise_template text`, `quiz_prompt_template text`, `UNIQUE(template_week_id, stable_key)`, `UNIQUE(template_week_id, position)`. Chaque semaine source doit avoir les trois étapes utilisées par `script.js` (`Découvrir`, `Mettre en pratique`, `Vérifier et présenter`); les chaînes de substitution `{topic}` et `{domain_name}` sont littérales et leur rendu est défini par les règles de génération ci-dessous.
- `family_template_domain_topics`: `id uuid PK`, `template_id FK family_pathway_templates ON DELETE RESTRICT`, `stable_key varchar(180)`, `domain_id FK domains ON DELETE RESTRICT`, `week_position integer CHECK(week_position BETWEEN 1 AND 4)`, `topic text`, `source_id FK content_sources`, `UNIQUE(template_id, stable_key)`, `UNIQUE(template_id, domain_id, week_position)`. `stable_key` = `{domain_id}:week-{n}`. Les 90 clés canoniques de `BesaDomainTracks` produisent jusqu’à 360 lignes (une par domaine/semaine); elles seules alimentent les overrides de runtime. En l’absence d’override, le fallback déterministe est le titre de semaine du gabarit. Ne pas effacer les valeurs source lors d’une mise à jour du texte générique.
- `family_template_domain_topic_alias_sources`: `id uuid PK`, `template_id FK family_pathway_templates ON DELETE RESTRICT`, `source_key varchar(100)`, `week_position integer CHECK(week_position BETWEEN 1 AND 4)`, `source_topic text`, `canonical_domain_id varchar(100) FK domains`, `canonical_topic_id uuid FK family_template_domain_topics`, `source_id FK content_sources`, `topic_match enum(identical,review_required)`, `UNIQUE(template_id, source_key, week_position)`. Table séparée des overrides canoniques : ne pas insérer ces clés dans la contrainte unique `(template_id, domain_id, week_position)`. Les huit paires alias-source/cible sont `social-entrepreneurship→entrepreneuriat-social`, `team-management→gestion-equipe`, `project-management→gestion-projet`, `content-creation→creation-contenu`, `content→creation-contenu`, `photography→photo`, `media-education→education-medias`, `professional-communication→communication-professionnelle`. Conserver les 32 observations alias/semaine, leur texte source, clé source, cible canonique et provenance. Quand `source_topic` est identique au topic canonique, `canonical_topic_id` référence la même ligne canonique (pas de copie/unique en conflit); si différent, conserver l’observation `review_required` et bloquer la matérialisation/publication de ce topic.

Les templates versionnés enregistrent séparément le titre, explication, exercice, question, options ordonnées, index correct, feedback, trois étapes générées, skills, careers et projet; aucune donnée pédagogique n’est cachée dans un blob JSONB. La provenance des lignes enfants est héritée de la liaison de source du template; les overrides de thèmes portent en plus leurs propres source IDs. La source et sa checksum sont immuables et la clé stable/position localise les champs extraits. Les ressources web ajoutées au domaine ou à un parcours sont des entités `resources` distinctes avec vérification et provenance.

Les éléments de profil résultant du runtime (eyebrow, description/overview rendus, prérequis, équipement, durée hebdomadaire, note de sécurité et contenu final du projet) sont copiés littéralement dans la version materialisée du pathway. `eyebrow` est nullable pour les parcours qui n’en ont pas dans la source. Une lecture publique ne reconstruit pas ces champs depuis un template ni depuis le nom courant du domaine.

#### Matérialisation des parcours générés

L’import matérialise les parcours générés dans les mêmes tables `pathways`, `pathway_weeks`, `lessons`, `quizzes`, `quiz_questions`, `quiz_options`, `projects`, `pathway_skills` et `pathway_career_examples` que les autres parcours. Ni l’API publique ni le navigateur ne recalculent un contenu depuis le template à la lecture. Chaque voie générée référence sa version de template, ses topics effectifs (via table de génération ci-dessous), sa source et une empreinte de génération.

`pathway_generation_topics`: `pathway_id FK pathways ON DELETE RESTRICT`, `week_position integer CHECK(week_position BETWEEN 1 AND 4)`, `topic text`, `topic_source enum(domain_override,template_title)`, `source_id FK content_sources`, `PRIMARY KEY(pathway_id, week_position)`. Quatre lignes exactes sont obligatoires pour une voie générique générée. Les lignes `pathways.family_template_id`, `family_template_version`, `generation_key` et `generation_checksum` pointent vers le jeu de génération immuable.

Règles de rendu source-à-source :

1. Utiliser uniquement la famille active portée par le raw record ou une famille issue d’un mapping explicitement `approved` par `content_approver`. Une suggestion `proposed` ne sélectionne aucun template. Les raw family historiques non approuvées restent en quarantaine sans génération. Pour un domaine admissible, choisir une version figée du template. Une version source non revue peut être matérialisée à des fins d’import/relecture, mais template et pathway résultants restent `draft` ou `in_review`; cela ne publie jamais les enfants.
2. Pour chacun des quatre index de semaine, utiliser l’override `BesaDomainTracks[domain.id][index]` s’il existe, sinon `family_template_weeks.title`; enregistrer le sujet et sa source dans `pathway_generation_topics`.
3. Créer une semaine, puis les trois étapes de template dans l’ordre. Le rendu n’autorise que les tokens définis dans le contrat : `{topic}` et `{domain_name}` dans les titres/objectifs/questions; `{topic}`, `{domain_name}`, `{week_explanation}` et `{week_exercise}` dans les exercices générés. Les deux derniers tokens valent exactement les champs `explanation` et `exercise` de la semaine source. Les textes rendus sont stockés en lignes de contenu normales.
4. Chaque séance reçoit un quiz à choix unique, la liste complète des options de la semaine dans l’ordre source, l’option correcte correspondant à l’index source et le feedback/explication. Le prompt est rendu selon le texte source de l’étape. Ne pas déduire une correction du texte, d’un titre ou de l’index d’une option après modification.
5. Le projet est le rendu exact de `project_text_template` (token autorisé `{domain_name}`) avec le nom du domaine, suivi du rendu exact de `project_topics_suffix_template` (token `{topics}`, thèmes séparés par ` ; ` dans l’ordre des quatre semaines); conserver la formulation entière dans `projects.instructions`.
6. Matérialiser aussi toutes les métadonnées du profil runtime: titre = nom du domaine; eyebrow = nom de famille + ` · PARCOURS D’INITIATION`; overview = description du domaine ou fallback source; description = description/fallback suivi de la phrase source sur parcours de quatre semaines, exercices et absence de qualification; enregistrer les deux prérequis, les deux éléments d’équipement et le weeklyTime exact du runtime; safetyNote = valeur exacte de `pathwaySafetyNotes[family]` ou chaîne vide. N’inférer aucun de ces champs à partir du gabarit après la matérialisation.
7. IDs relationnels sont les UUIDv5 issus de la stratégie fixe de la section 2. Exemple pathway : `urn:librescence:content:v1/pathway/{canonicalDomainId}/guided-intro-{familyId}/v{pathwayVersion}`; enfants : le nom contient aussi la clé canonique du parent et leur `stableKey` (`week-{n}`, `stage-{n}`, `quiz-{week}-{stage}`, `question-1`, `option-{position}`). Aucun ID n’est aléatoire; clé absente/ambiguë bloque le seed sans fallback. Réimporter la même révision/source/template produit les mêmes UUIDs. Une modification éditoriale versionne le parent/contenu et sa checksum; elle ne réécrit pas une version publiée.
8. La clé idempotente du générateur est le SHA-256 du tuple canonique `(domain_id, family_template_id, family_template_version, template_source_checksum, topic_override_checksum, renderer_version)`, stocké dans `generation_key` unique. Même clé + checksum identique = aucune nouvelle ligne ni modification des données apprenant; même clé avec checksum différent = nouvelle version brouillon ou conflit explicite, jamais écrasement destructif.

Le manifeste attendu est 90 chemins générés, chacun 4 semaines, 12 séances, 12 quiz, 12 questions et les options source répétées pour chaque quiz. Les templates sont 11, 4 semaines par template et 3 étapes par semaine (132 étapes au total). Les 90 chemins sont les domaines runtime avec gabarit après exclusion des 10 parcours spécialisés et du web. Les ressources externes héritées sont toujours `draft`/`unverified`, même si elles ont été copiées sur les 90 chemins.

#### `quizzes`, `quiz_questions`, `quiz_options`

- `quizzes`: `id uuid PK`, `lesson_id FK lessons ON DELETE RESTRICT`, `stable_key varchar(120)`, `version integer`, `status enum(draft,published,archived)`, `pass_score integer NULL CHECK(pass_score IS NULL OR pass_score >= 0)`, `UNIQUE(lesson_id, stable_key, version)`.
- `quiz_questions`: `id uuid PK`, `quiz_id FK quizzes ON DELETE RESTRICT`, `stable_key varchar(120)`, `position integer`, `prompt text`, `explanation text`, `points integer CHECK(points > 0) DEFAULT 1`, `UNIQUE(quiz_id, stable_key)`, `UNIQUE(quiz_id, position)`.
- `quiz_options`: `id uuid PK`, `question_id FK quiz_questions ON DELETE RESTRICT`, `stable_key varchar(120)`, `position integer`, `label text`, `is_correct boolean NOT NULL`, `UNIQUE(question_id, stable_key)`, `UNIQUE(question_id, position)`.

Les réponses correctes ne sont lisibles que par le service de correction et les rôles éditoriaux nécessaires; elles ne figurent jamais dans la sérialisation des endpoints publics, même si elles sont stockées dans la même base. Validation de publication : chaque question a au moins deux options, exactement une option correcte pour le format choix unique actuel, explication non vide, et une position stable. Les tables de contenu quiz sont actives; les tentatives/historiques, elles, sont désactivées et non persistées. Les règles de versionnage des tentatives ne s’appliqueront qu’après décision et activation explicite de leur rétention.

#### `resources`

`id uuid PK`, `stable_key varchar(120)`, `domain_id FK domains NULL`, `pathway_id FK pathways NULL`, `lesson_id FK lessons NULL`, `title`, `url text`, `provider varchar(160) NULL`, `language varchar(16) NULL`, `resource_kind enum(article,course,video,search,document,other)`, `access_note text NULL`, `status enum(draft,published,archived) NOT NULL DEFAULT draft`, `verification_status enum(unverified,verified,unavailable) NOT NULL DEFAULT unverified`, `verified_at NULL`, `source_record_id FK content_sources NOT NULL`, `position integer`, timestamps. ID stable unique dans son scope parent. Au moins un parent domain/pathway/lesson est requis; relations créées ou modifiées seulement vers des IDs existants. Vérifier URL HTTP(S), provenance et droits avant publication; distinguer une recherche générique d’un cours vérifié. La création produit un brouillon. Publication distincte réservée à `content_approver`; elle échoue si la source n’est pas `approved`, `reviewed_by` ou `reviewed_at` manque, si la vérification/URL/parent est invalide, ou si l’événement de revue source et son ID audité manquent. La route publique filtre les ressources non publiées/indisponibles.

#### `projects`

Brief final appartenant à une version de parcours : `id uuid PK`, `pathway_id FK pathways`, `stable_key`, `title`, `instructions text`, `position`, `status enum(draft,published,archived)`, `source_record_id FK content_sources NULL`, timestamps, `UNIQUE(pathway_id, stable_key)`, `UNIQUE(pathway_id, position)`. Une clé existante conserve son UUID lors d’une mise à jour; un brief absent d’un remplacement est archivé s’il est référencé par une progression, jamais supprimé en cascade.

`project_checklist_items`: `id uuid PK`, `project_id FK projects ON DELETE RESTRICT`, `stable_key varchar(100)`, `position integer CHECK(position > 0)`, `label text`, `UNIQUE(project_id, stable_key)`, `UNIQUE(project_id, position)`. Les critères ordonnés sont renvoyés dans l’API publique et utilisés par la progression; ils ne sont pas un score ni une évaluation automatique. Les réalisations d’apprenant sont dans `portfolio_items`, pas dans ces tables éditoriales.

#### `content_sources` et `content_audit_events`

`content_sources`: `id uuid PK`, `source_path text NOT NULL` (p. ex. `script.js` ou `guided-pathways.js`), `source_key varchar(200) NULL`, `source_revision varchar(100) NULL`, `source_checksum char(64) NULL`, `extracted_at timestamptz`, `revision_author_id uuid FK users NOT NULL`, `license_status enum(unknown,review_required,approved,rejected)`, `attribution text NULL`, `reviewed_by uuid FK users NULL`, `reviewed_at timestamptz NULL`, `notes text NULL`. Pas de copie de secrets ou de données personnelles d’apprenant. Le seed de source initiale écrit `review_required` et jamais `approved`, et doit porter l’ID explicite du compte `content_editor` auteur de la révision; si cet acteur est absent, l’import s’arrête sans seed approuvé. Le POST de création éditeur n’accepte que `unknown`/`review_required`, fixe `revision_author_id` depuis la session et n’accepte aucun ID d’auteur fourni par le client. Seule la transition dédiée d’un `content_approver` peut écrire `approved` ou `rejected`; `reviewed_by` est l’utilisateur authentifié et `reviewed_at` l’horodatage serveur.

Liaisons de provenance normalisées : `domain_content_sources(domain_id FK domains, content_source_id FK content_sources, PRIMARY KEY(domain_id, content_source_id))`, `pathway_content_sources(pathway_id FK pathways, content_source_id FK content_sources, PRIMARY KEY(pathway_id, content_source_id))`, `lesson_content_sources(lesson_id FK lessons, content_source_id FK content_sources, PRIMARY KEY(lesson_id, content_source_id))` et `quiz_content_sources(quiz_id FK quizzes, content_source_id FK content_sources, PRIMARY KEY(quiz_id, content_source_id))`. Elles matérialisent les tableaux API `sourceIds`; les ressources conservent leur liaison singulière `source_record_id` (`sourceId` dans l’API). Suppression de source référencée interdite; corriger/compléter les liens par une opération éditoriale auditée.

`content_audit_events`: `id uuid PK`, `actor_id FK users`, `entity_type`, `entity_id`, `entity_revision_key varchar(200)`, `action`, `before_checksum`, `after_checksum`, `created_at`. Insert-only pour tracer création/modification, validation, publication, retrait et migration; index `(entity_type, entity_id, entity_revision_key, created_at DESC)`. Les événements `content_created/content_updated` déterminent l’auteur/éditeur humain de la révision; les événements `source_review_approved/source_review_rejected` déterminent le reviewer. Restreindre l’accès admin et conserver selon la politique de rétention.

`content_audit_event_sources`: `audit_event_id FK content_audit_events ON DELETE RESTRICT`, `content_source_id FK content_sources ON DELETE RESTRICT`, `PRIMARY KEY(audit_event_id, content_source_id)`. Une transition source approuvée/rejetée lie son unique source; chaque révision éditoriale lie ses sources; une publication pathway lie la liste exacte des sources de sa fermeture éditoriale; une publication ressource lie son `source_record_id`. Les événements sont créés dans la même transaction que le changement de statut. Une source sans événement de revue correspondant ne satisfait pas le garde-fou, même si ses colonnes de statut ont été modifiées hors du flux autorisé.

**Traçabilité obligatoire :** chaque domaine/parcours importé conserve un ID source, un chemin/fichier racine, une empreinte et le statut de vérification des droits; toute nouvelle publication indique l’acteur et la date de revue. Reviewer et auteur de révision doivent être deux utilisateurs distincts, y compris si le reviewer détient simultanément les rôles `content_editor` et `content_approver`. Une source n’est approuvable que si `reviewed_by <> revision_author_id`. Un pathway n’est publiable que si chaque `sourceId` de sa fermeture éditoriale (pathway, semaines, séances, quiz/questions, projet et ressources incluses) est dans la liste exacte `reviewedSourceIds`, existe, a `license_status=approved`, `reviewed_by`/`reviewed_at` renseignés, possède un événement d’audit de revue approuvée et si chaque reviewer est distinct de l’auteur de la révision éditoriale. Une ressource exige les mêmes contrôles pour sa source unique et un reviewer distinct de son auteur. Toute source manquante, rejetée, non revue, self-review, date/auteur absent, source supplémentaire ou audit absent entraîne 403/409/422 et aucune publication. Les vérifications, source events, liens d’audit et statut public sont atomiques. Les liens externes doivent aussi être revalidés; le code source seul ne démontre ni licence ni accès valide.

### Progression, activité et apprentissage

#### `learner_progress`

`id uuid PK`, `user_id FK users`, `pathway_id FK pathways`, `status enum(not_started,in_progress,completed,archived)`, `plan enum(two_weeks,four_weeks,eight_weeks,flex)`, `started_at NULL`, `completed_at NULL`, `last_activity_at NULL`, `created_at`, `updated_at`, `UNIQUE(user_id, pathway_id)` pour la version courante. L’accès est limité à son propriétaire. Conserver `pathway_id` versionné; lors d’une nouvelle version, créer un nouvel enregistrement/version plutôt que réécrire les anciennes preuves.

#### `lesson_progress`

`id uuid PK`, `user_id FK users`, `lesson_id FK lessons`, `status enum(not_started,in_progress,completed)`, `completed_at NULL`, `updated_at`, `UNIQUE(user_id, lesson_id)`. La progression n’est pas une preuve de certification hors règles de `completion_policy`.

#### `learner_project_progress`

`id uuid PK`, `user_id FK users`, `project_id FK projects`, `status enum(not_started,in_progress,completed)`, `checked_item_ids text[] NOT NULL DEFAULT '{}'` (contient les `stable_key` des critères), `url text NULL`, `completed_at NULL`, `updated_at`, `UNIQUE(user_id, project_id)`. Les IDs de cases sont vérifiés par rapport à la checklist du projet/version; lien HTTPS uniquement. La complétion est une déclaration de l’apprenant, jamais une évaluation automatique; elle reste distincte d’une fiche portfolio et n’accorde pas seule de certificat.

#### Historique de quiz — stockage désactivé

`quiz_guest_sessions`, `quiz_attempts`, `quiz_attempt_answers` et `imported_quiz_results` **ne font pas partie du schéma actif et ne doivent pas être créées** avant décision produit approuvant finalité, rétention et purge. Aucune ligne, colonne de score/réponse ni session/token persistant n’est utilisé comme stockage en attente; aucune échéance de purge n’est définie sur une table inexistante. L’API ne persiste pas les soumissions authentifiées, tentatives invitées ou résultats importés dans PostgreSQL, cache, outbox, logs ou analytics. Il n’existe pas non plus de correction serveur volatile active : les endpoints de session/soumission/historique retournent 503; les quiz locaux restent sur l’appareil.

La propriété `quizResults` est détectée dans le préflight d’import. Si elle contient des éléments, l’import entier retourne 503 avant idempotence/transaction; rien d’autre n’est importé et aucune ligne `guest_import_batches` n’est créée pour cette requête. Si elle est omise ou vide, les autres données allowlistées peuvent suivre le flux d’import. Une réactivation nécessite une politique approuvée et une nouvelle révision des deux contrats avant de créer ces tables ou d’activer ces routes.

#### `learner_notes`

`id uuid PK`, `user_id FK users`, `lesson_id FK lessons`, `body text` (limite API initiale 10 000 caractères, **à confirmer**), timestamps, `UNIQUE(user_id, lesson_id)`. Privé; pas de contenu de note dans journaux ou analytics.

#### `saved_resources`

`id uuid PK`, `user_id FK users`, `resource_id FK resources NULL`, `url text`, `title varchar(180)`, `source varchar(100) NULL`, `created_at`, `UNIQUE(user_id, url)`. N’accepter que HTTPS, parser et normaliser l’URL, refuser les identifiants intégrés à l’URL; si l’hôte est une IP littérale, vérifier directement qu’elle est publiquement routable, sinon résoudre tous les enregistrements DNS A et AAAA et rejeter si la réponse est vide/invalide ou si un seul résultat n’est pas publiquement routable (privé, réservé, loopback, link-local, metadata, etc.). N’effectuer aucun appel HTTP ni scraping lors de l’enregistrement. Ne persister aucun secret, résultat DNS ni donnée d’hôte dérivée au-delà de l’URL normalisée; revalider la résolution avant toute utilisation future côté serveur. Maximum API initial de 100 éléments, aligné sur la normalisation existante.

#### `weekly_goals`, `active_days`

- `weekly_goals`: `user_id PK/FK users`, `target_days smallint CHECK(target_days IN (2,3,5,7)) DEFAULT 3`, `updated_at`. Correspond exactement au schéma API `WeeklyGoal` (`targetDays`, `updatedAt`); aucune timezone n’est stockée dans cette table ou retournée par cette ressource.
- Dans `ProgressUpdate`, le champ facultatif `weeklyGoal` est uniquement l’entier `targetDays` (`2|3|5|7`) envoyé pour modifier la cible, et non l’objet de réponse `WeeklyGoal`. `GET /me/weekly-goal` retourne l’objet `{targetDays, updatedAt}`; `GET /me/progress` utilise également cet objet dans sa propriété `weeklyGoal`.
- `active_days`: `user_id FK users`, `activity_date date`, `activity_source enum(lesson_completed,quiz_submitted)`, `created_at`, `PRIMARY KEY(user_id, activity_date)`; une journée compte une seule fois même si plusieurs activités. Index `(user_id, activity_date DESC)`. Il s’agit d’un agrégat quotidien sans quiz_id, score, réponse ni ligne de tentative; l’API n’enregistre pas la localisation ni les horaires de la journée.

Les données de minuteur, synthèse vocale et filtres temporaires n’ont pas à être synchronisées. L’objectif, les activités, favoris et notes ne sont persistés sur serveur qu’après connexion/consentement à la synchronisation. Les dates d’activité sont une collection séparée de `WeeklyGoal`; l’objectif source local est un entier `weeklyGoal`.

### Projet personnel et portfolio

#### `portfolio_items`

`id uuid PK`, `user_id FK users`, `domain_id FK domains NULL`, `title varchar(100)`, `description varchar(3000)`, `skills varchar(500) NULL`, `difficulties varchar(1500) NULL`, `learnings varchar(1500) NULL`, `project_date date NULL`, `url text NULL`, `visibility enum(private) DEFAULT private`, `created_at`, `updated_at`, `deleted_at NULL`. Liens publiés optionnels : HTTPS seulement. Aucun partage public dans la première version; pas d’accès anonyme. Ce sont des contenus potentiellement personnels; éviter une collecte de données sensibles dans les champs libres.

#### `portfolio_attachments`

`id uuid PK`, `portfolio_item_id FK portfolio_items ON DELETE CASCADE`, `storage_key text UNIQUE`, `original_name varchar(160)`, `media_type enum(application/pdf,image/jpeg,image/png,image/webp)`, `size_bytes bigint`, `sha256 char(64)`, `created_at`, `deleted_at NULL`. La pièce jointe n’est jamais publique. `storage_key` est une référence interne non sérialisée, non journalisée et non utilisée comme URL. `original_name` est privé : il n’est jamais sérialisé ni journalisé, et sa valeur brute n’est jamais exposée. `PortfolioAttachment.name` est un nom d’affichage sûr dérivé du nom de fichier après normalisation et suppression des caractères de contrôle et des composantes de chemin; il ne contient pas `original_name` brut. Aucun `user_id` redondant n’est requis sur cette table : l’autorisation dérive du `portfolio_items.user_id` et exige simultanément que la fiche soit à l’utilisateur de la session et que l’attachment chargé soit enfant de cette fiche. Ne jamais traiter la connaissance des UUID comme une preuve d’accès.

Règle contractuelle à implémenter (elle ne signifie pas que la route existe déjà) : le contenu doit être servi uniquement par `GET /api/v1/me/portfolio/{itemId}/attachments/{attachmentId}/content` : session cookie first-party Sanctum obligatoire; GET sans CSRF; cookies/CORS limités aux origines first-party configurées. Le serveur doit vérifier ownership et relation parent-enfant avant tout accès au stockage privé, puis streamer le fichier autorisé. Il ne doit jamais rediriger vers un stockage public ni créer ou exposer d’URL bearer/signée. La réponse est binaire, avec `Content-Type` correspondant au média vérifié (PDF/JPEG/PNG/WebP), `Content-Disposition: attachment` avec le même nom d’affichage sûr que `PortfolioAttachment.name` (sans séparateurs de chemin, caractères de contrôle ou injection; aucun filename n’est utilisé comme chemin); le nom original brut n’est jamais exposé. `Cache-Control: private, no-store`; aucun ETag n’est requis. Les IDs sont la seule information nécessaire au client pour construire le chemin API et envoyer la requête avec credentials. La suppression reste `DELETE /api/v1/me/portfolio/{itemId}/attachments/{attachmentId}` (sans suffixe `/content`).

Vérification serveur du type par contenu, tailles maximales PDF 5 Mio (5 242 880 octets) et image 2 Mio (2 097 152 octets), un PDF et une image par fiche; ces limites reprennent le contrat actuel. Vérifier également l’intégrité/hash attendu. Antivirus/inspection avant accès si disponible, sans rendre l’objet accessible avant résultat. Sur toute lecture, un parent ou attachment absent, supprimé ou ne correspondant pas à l’autre est refusé avec 404 afin de ne pas révéler l’existence d’un fichier hors périmètre.

Contraintes à appliquer en base et à revalider en API : `CHECK` de taille selon le média (PDF ≤ 5 242 880 octets; chacun des médias image ≤ 2 097 152 octets), et deux index uniques partiels sur les attachments actifs (`deleted_at IS NULL`), l’un par `portfolio_item_id` pour `application/pdf`, l’autre par `portfolio_item_id` pour le groupe PNG/JPEG/WebP. Cela garantit au plus un PDF et une image, même si cette image est remplacée par un autre format.

La suppression d’une pièce jointe ou de sa fiche désactive immédiatement son accès et déclenche une purge fiable du blob privé et des métadonnées. Si le blob n’est pas supprimable dans la transaction applicative, enregistrer durablement le travail de purge (outbox/job), réessayer jusqu’à succès et ne jamais rétablir l’accès pendant l’attente; purger les métadonnées après confirmation de suppression du blob. `storage_key` et le nom original ne doivent apparaître ni dans les réponses API, ni dans les journaux applicatifs. Éviter la journalisation des URL de requête complètes pour cette route; le chemin contient seulement des IDs non secrets, mais aucun lien tokenisé ou URL de stockage en clair n’existe.

### Certificats, rappels e-mail et contact

#### Certificats — capacité différée, non modélisée en tables actives

Aucune table `certificates`, endpoint de liste/émission/téléchargement/vérification ni numéro de certificat n’est inclus dans le contrat courant. Les certificats restent désactivés tant que les critères de réussite, la preuve affichée, la portée non officielle, le processus de révocation et les durées de conservation ne sont pas approuvés. Toute future capacité dépend d’une décision produit explicite et d’une révision des deux contrats; aucune progression actuelle ne permet de déduire qu’un certificat est valide.

#### `reminder_preferences`, `email_reminders`

- `reminder_preferences`: `user_id PK/FK users`, `enabled boolean DEFAULT false`, `frequency enum(weekly)`, `timezone varchar(64) NULL`, `preferred_weekday smallint NULL CHECK(0..6)`, `consented_at NULL`, `updated_at`. **Désactivé par défaut**; activation explicite, désinscription en un geste, email vérifié. N’envoyer aucune donnée de progression détaillée dans un message.
- `email_reminders`: `id uuid PK`, `user_id FK users`, `scheduled_at`, `sent_at NULL`, `status enum(queued,sent,failed,cancelled)`, `dedupe_key varchar(160) UNIQUE`, `created_at`. Contenu d’e-mail généré côté serveur; pas de journal du message complet. Un seul rappel hebdomadaire maximum et fenêtre locale configurable.

#### Stockage des demandes de contact — désactivé

La table `contact_messages` et ses colonnes/index (y compris message, coordonnées, consentement et purge) **ne font pas partie du schéma actif et ne doivent pas être créés** avant approbation d’une politique de rétention/purge. `POST /contacts`, `GET /admin/contacts` et `PATCH /admin/contacts/{contactId}` répondent 503 `FEATURE_DISABLED`; aucune donnée de demande n’est acceptée, recherchée, journalisée, mise en file, envoyée par e-mail ou stockée. Le rôle support_contact n’a pas accès à une file inactive. Le site source prépare seulement un message WhatsApp local après consentement; il n’est pas enregistré ni envoyé par cette API.

### Import invité

#### `guest_import_batches`

`id uuid PK`, `user_id FK users`, `client_import_id uuid`, `idempotency_key varchar(128)`, `source_key enum(besa.learning.v2,capClair.learning.v2,capClairCompleted)`, `source_version varchar(40) NULL`, `payload_checksum char(64)`, `status enum(applied,partial,needs_review)`, `report jsonb` sans réponses ni champs personnels, `created_at`, `UNIQUE(user_id, client_import_id)`, `UNIQUE(user_id, idempotency_key)`.

Le JSON invité normalisé n’est pas conservé après application sauf nécessité d’audit explicitement approuvée; le rapport ne contient que compteurs/IDs. Valider chaque ID de séance/quiz contre le catalogue versionné, rejeter ou marquer les enregistrements orphelins; jamais inventer un contenu correspondant. Un aperçu peut être calculé en mémoire avant confirmation.

Les résultats `quizResults` n’ont pas de table active dédiée. L’objet est conservé localement; sa présence non vide provoque 503 et annule l’import entier jusqu’à décision de rétention. Le rapport d’import actif ne contient aucun score/réponse ni compteur de résultats persistés.

## 4. Relations essentielles

```text
domain_families 1─N domains 1─N pathways (versions)
pathways 1─N pathway_weeks 1─N lessons 1─N quizzes
quizzes 1─N quiz_questions 1─N quiz_options
lessons N─N resources (directement via lesson_id) ; pathways 1─N projects
users 1─1 learner_profiles
users N─N roles via user_role_assignments
domain_families 1─N family_pathway_templates 1─N family_template_weeks
family_template_weeks 1─N family_template_stages, family_template_quiz_options
family_pathway_templates N─N domains via family_template_domain_topics
family_template_domain_topic_alias_sources N─1 canonical topic override
pathways 0..1 family template version; pathways 1─N pathway_generation_topics
source content 1─N source_domain_records 1─N source_domain_resources
content_audit_events N─N content_sources via content_audit_event_sources
users 1─N learner_progress, lesson_progress, learner_project_progress, learner_notes,
         saved_resources, portfolio_items, email_reminders
portfolio_items 1─N portfolio_attachments
users 1─1 weekly_goals ; users 1─N active_days, guest_import_batches
```

Toutes les tables de données d’apprenant sont isolées par `user_id` dérivé de la session côté serveur, jamais accepté comme preuve d’autorisation depuis le corps de la requête.

## 5. Rôles, autorisation et suppression

- **Invité non authentifié :** lecture des contenus publiés, recherche et recommandations génériques; quiz locaux sur l’appareil. Les routes de session/soumission serveur et de contact retournent 503 tant que les politiques requises ne sont pas approuvées.
- **Apprenant authentifié :** accès/CRUD uniquement à son profil, progression, notes, favoris, portefeuille privé et préférences. L’historique persistant de tentatives et les certificats ne sont pas disponibles. Ownership vérifié sur chaque parent et ressource; ID aléatoire n’est pas une autorisation.
- **Éditeur :** créer/modifier brouillons de contenu, gabarits familiaux versionnés et ressources; ne peut pas administrer comptes ou voir données privées d’apprenants.
- **Éditeur approbateur / administrateur contenu :** revue, publication/retrait et audit du contenu. Le reviewer doit être distinct de l’auteur de la source/révision, même si les rôles `content_editor` et `content_approver` se cumulent. La publication vérifie cette indépendance pour chaque source de la fermeture éditoriale; toute auto-approbation est interdite.
- **Support contact :** rôle et file inactifs jusqu’à l’activation explicite du stockage contact après approbation de rétention; aucun rôle générique « admin » ne doit automatiquement lire les portfolios, notes ou réponses.
- **Administrateur système :** opérations d’infrastructure; accès exceptionnel et journalisé, pas de lecture courante des contenus privés.

### Contrat CRUD éditorial

L’API admin expose création, lecture de collection/objet, mise à jour partielle et archivage logique (`POST`, `GET`, `PATCH`, `DELETE`) pour les domaines, parcours, semaines, séances (modèle `lessons`), quiz, questions, ressources et versions de gabarits familiaux. Les créations attribuent un UUID technique et exigent une clé stable source (`domain.id` ou `stableKey` immuable) dans son parent; un ID archivé/publié ne peut pas être réutilisé. Les routes de publication sont séparées et réservées à `content_approver`. Publier un gabarit ne publie ni les pathways matérialisés ni leur domaine.

Séquence de liaison supportée : créer le domaine et enregistrer ses `content_sources`; créer le parcours (liaison par `domainId`); créer les semaines; créer les séances; créer ressources/quizzes avec leur parent `lessonId`/`pathwayId`/`domainId` à la création. Les IDs de ressources et quiz retournés par GET sont dérivés de ces clés étrangères et exposés en lecture sur la séance; ils ne sont pas acceptés dans son POST/PATCH. Créer une question sous le quiz avec options et correction privée. Les briefs de projet sont créés/mis à jour dans la représentation imbriquée du parcours; leur `stableKey` conserve l’UUID lors des mises à jour et le GET de parcours les restitue. Les lectures de collections et d’objets retournent leurs UUID, stable keys, ordre, statut, IDs des parents, liaisons dérivées et provenance nécessaires à ce flux. Une création de parent ne suppose pas que ses enfants existent.

#### Scénarios d’autorisation exigés pour le contrat

| Acteur / action | Résultat requis |
|---|---|
| Invité sur création ou revue de source | `401`; aucune ligne ni événement |
| `content_editor` crée une source `unknown`/`review_required` | `201`; reviewer/date restent NULL |
| `content_editor` tente `approved` ou `rejected` à la création, ou la route de revue | `422` pour état interdit au schéma de création; `403` pour revue; aucune source approuvée |
| `content_approver` approuve/rejette une source dont il n’est pas l’auteur de la révision | seule route de transition autorisée; reviewer dérivé de la session, date serveur; événement d’audit atomique |
| `content_approver` tente d’approuver sa propre source/révision (`reviewed_by = revision_author_id`), même si les rôles se cumulent | `409`; aucun changement de statut ni écriture d’audit |
| `content_editor` tente de publier pathway/ressource | `403`; aucun statut modifié |
| `content_approver` publie avec source manquante, rejetée, non revue, date/reviewer manquants, IDs manquants/supplémentaires ou événement absent | `409` ou `422` selon conflit/validation; aucun commit partiel |
| `content_approver` publie avec toute la fermeture de sources approuvées et auditées | publication atomique; événement de publication et relations `content_audit_event_sources` contiennent les IDs exacts |

Ces tests d’autorisation sont des critères de contrat, pas une preuve que le modèle RBAC ou les routes sont déployés.

PATCH n’exige aucun champ de création à la racine : le schéma interdit les propriétés inconnues et exige au moins une propriété modifiable. Les tableaux imbriqués `options` et `projectBriefs` sont des remplacements complets; chaque élément doit donc respecter son schéma d’écriture complet. Les clés stables, IDs de parent, état de publication et version ne peuvent pas être modifiés par PATCH; les ressources publiées sont immuables et nécessitent une nouvelle révision.

Suppression de compte : le client obtient un grant de ré-authentification à usage unique, puis envoie une demande avec confirmation explicite. Le serveur passe le compte à `deletion_pending`, révoque immédiatement toutes les sessions Sanctum et retourne un jeton de suivi limité à la lecture de l’état; la demande est ensuite traitée de façon asynchrone. Purger/anonymiser profil, notes, progression, favoris, objectifs, activités, portfolio, pièces jointes et rappels selon la politique approuvée. Aucune demande de contact ni tentative quiz n’est stockée par les opérations désactivées. Aucun certificat n’existe dans la version courante. Le reçu de suppression ne conserve ni email ni données utilisateur; sa durée de vie doit être décidée. Ne pas conserver une sauvegarde ré-identifiante sans durée approuvée. Une suppression n’est jamais effectuée par une requête d’import.

## 6. Confidentialité, conservation et sécurité

- Date de naissance non collectée par défaut. Ne pas demander données sensibles dans les champs de notes, projets ou contact; exposer finalité et consentement avant stockage serveur.
- TLS en transit; chiffrement des sauvegardes/disques; hash de mot de passe Laravel; cookies `Secure`, `HttpOnly`, `SameSite`; protection CSRF; échappement de sortie et validation serveur.
- Schémas publics/API exclusifs aux objets publiés; politiques de rôle et contrôle objet côté serveur; réponses de quiz ne révèlent jamais `is_correct`, `correct_option_id`, les points de correction ou l’explication de correction avant soumission.
- Journalisation structurée sans secrets, token, mot de passe, email complet, note, message de contact, réponses de quiz, corps d’import ou fichier. Identifiants de requête et compteurs peuvent être journalisés. Anti-abus IP sous forme HMAC éphémère avec rotation de clé et purge rapide (**HMAC secret en configuration, jamais dans le dépôt**).
- **Aucune durée de conservation n’est approuvée** pour contacts ou tentatives/historiques de quiz; leur stockage est donc désactivé et les tables ne sont pas créées. Une décision produit, une règle de purge et une mise à jour des contrats précèdent toute activation. Les durées des jetons de suivi, journaux identifiants et données de déduplication restent aussi à fixer. Les données de compte et de portfolio sont supprimées selon le flux de suppression, dont le calendrier opérationnel reste à confirmer. Confirmer pays, règles de protection des mineurs et obligations légales avant lancement.
- Les visiteurs peuvent utiliser le site en mode local sans création de compte ni envoi automatique de progression. Toute synchronisation future est déclenchée et expliquée explicitement.

## 7. Complétude, IDs et publication des contenus

### Définitions d’inventaire et clés stables

- **Inventaire des occurrences brutes : 250** objets de domaine source repérés dans `script.js`. Chaque occurrence a une ligne `source_domain_records`, une `source_record_key` stable à l’intérieur de la révision, un checksum et ses ressources enfants; doublons conservés.
- **Inventaire canonique des IDs source : 192**, soit le nombre de valeurs d’ID distinctes parmi ces occurrences après déduplication par ID source exact, avant alias/filtres du runtime. Cela ne signifie ni 192 domaines runtime, ni 192 cours disponibles, ni 192 contenus publics.
- **Inventaire runtime visible : 101 IDs** après filtrage initial des enregistrements par leur raw `family` active, puis résolution par `domainAliases` (sans parcourir les paires identité), puis fusion des enregistrements de même ID résolu. Il comprend 100 domaines guidés (10 spécialisés et 90 génériques) plus `web`. C’est un résultat reproductible de la canonicalisation, pas une décision éditoriale.
- **Inventaire éditorial publié :** aucun nombre présumé. Seules les lignes dont les statuts de domaine/parcours/contenu ont été explicitement validés et publiés sont exposées par l’API publique. La source « ready/guided », les gabarits, le nombre de pathways matérialisés, le rôle de l’approbateur et le statut final d’un import ne constituent jamais une preuve de complétude ou une publication automatique.

La migration livre avec le manifeste des associations entre chaque occurrence brute, son ID source, sa raw family, son ID canonique résolu (si applicable) et sa provenance. Le rapprochement est par ID, jamais par titre. Les lignes avec famille historique gardent tout le contenu en quarantaine avec `canonical_family_id=NULL` jusqu’à décision/révision humaine; les propositions de mapping ne sont jamais appliquées par seed. Une clé inconnue, collision ou cible ambiguë reste `unresolved` et bloque la promotion; aucune ligne n’est ignorée, supprimée ni résolue par première/dernière occurrence.

Les clés source connues deviennent des `stable_key` immuables uniques dans leur parent/version. Les IDs UUID du seed suivent uniquement la formule UUIDv5 fixe de la section 2. Ne pas utiliser un ordinal mutable ou l’index d’un tableau comme identité de contenu; la position d’une occurrence source n’est qu’une partie de `source_record_key` à l’intérieur de sa révision immuable. Lorsqu’une position sert au rendu, garder aussi une clé sémantique (`week-1`, `stage-discover`, etc.). Renommer le texte ne change jamais l’ID; une fusion exige une entrée d’alias vérifiée et une relation de provenance conservée.

### État éditorial et inventaire de complétude

États API : domaine `preparing` ou `published`; contenus et gabarits `draft`, `in_review`, `approved`, `published`, `archived` selon l’entité. `approved` signifie revue éditoriale effectuée mais n’équivaut pas à `published`. `preparing`, `draft` et `in_review` sont invisibles aux routes publiques, recherche et recommandations. Ressources externes copiées depuis la source commencent `draft`/`unverified`; elles ne deviennent ni vérifiées ni publiques par association à un domaine publié. Le statut public exige action explicite d’un approbateur et journal d’audit; une migration ne peut pas appeler cette action par défaut.

Manifeste source vérifié par comptage des structures statiques dans `script.js` (`computerSpecialtyProfiles`, `modules`) et `guided-pathways.js` (`BesaPathwayMethods`, `BesaDomainTracks`). Options source vérifiées : **313** pour les dix parcours IT et **72** pour le web; chaque question reste comparée individuellement.

| Parcours informatique (clé source) | Semaines | Séances | Quiz | Questions |
|---|---:|---:|---:|---:|
| `networks` | 4 | 4 | 4 | 8 |
| `cyber` | 4 | 4 | 4 | 8 |
| `linux` | 4 | 4 | 4 | 8 |
| `support` | 4 | 4 | 4 | 8 |
| `python` | 4 | 4 | 4 | 8 |
| `mobile` | 4 | 4 | 4 | 8 |
| `databases` | 4 | 4 | 4 | 8 |
| `data` | 4 | 4 | 4 | 8 |
| `cloud` | 4 | 4 | 4 | 8 |
| `devops` | 4 | 4 | 4 | 8 |
| **Total des 10 parcours** | **40** | **40** | **40** | **80** |

Le parcours web séparé contient **4 modules, 12 leçons/séances, 12 quiz et 24 questions**; chaque leçon source contient un ensemble de quiz de deux questions. Les modules sont des sections source, pas une preuve qu’ils s’appellent déjà « semaines »; la migration doit les mapper aux semaines uniquement si la décision de contenu le confirme.

`guided-pathways.js` contient les 11 familles canoniques, chacune avec quatre semaines modèles. `BesaDomainTracks` contient **98 clés : 90 clés canoniques et 8 clés alias-source**, chacune à quatre thèmes. Les huit clés alias sont conservées dans `family_template_domain_topic_alias_sources` (32 observations clé/semaine), associées à leur cible canonique et à la même ligne d’override lorsque le texte est identique; elles ne créent pas de doublon dans la table unique des overrides canoniques. Dans `script.js`, après le filtre sur raw family puis la canonicalisation d’ID, chaque domaine guidé sans profil spécialisé développe **trois étapes par semaine**, en choisissant le thème canonique de `BesaDomainTracks[domain.id]` ou, à défaut, le titre de semaine du template. Ce mécanisme runtime représente **90 pathways guidés générés** distincts; les templates ne sont pas eux-mêmes les 90 parcours.

| Ensemble | Inventaire attendu | Assertions de migration |
|---|---:|---|
| Enregistrements bruts domaines | 250 occurrences | égalité exacte avec les 250 objets extraits; clés d’occurrence uniques; aucune perte/déduplication |
| IDs domaine source | 192 valeurs distinctes | set exact des IDs; plusieurs occurrences peuvent partager un ID |
| IDs de domaine visibles runtime | 101 (100 guidés + `web`) | comparer l’ensemble exact après raw-family filter → domaine aliases → merge, les occurrences sources contribuantes et toutes les paires d’alias, pas seulement la cardinalité; exactement 10 spécialisés, 90 génériques, 1 web |
| Paires `domainAliases` | chaque clé/cible source | comparer le mapping complet exact; séparer les deux paires identité `gestion-equipe→gestion-equipe`, `gestion-projet→gestion-projet` des arêtes traversables et les conserver comme no-op/provenance |
| Familles canoniques | 11 | toutes les 11 clés et relations FK présentes |
| Aliases family historiques | 7 (12, 11, 11, 11, 11, 10, 10 enregistrements, dans l’ordre du tableau source) | 76 lignes intactes, toutes en quarantaine; mappings `proposed`, `canonical_family_id=NULL`; aucune visibilité/canonicalisation avant approbation |
| Templates familiaux | 11 versions source initiales | quatre semaines et trois étapes ordonnées par semaine (44 semaines modèles, 132 étapes); 44 questions source et 132 options source; skills, careers, projet, option correcte, explication/feedback et provenance présents |
| `BesaDomainTracks` | 98 clés (90 canoniques + 8 alias-source) | comparer set, 4 topics par clé et provenance; 360 topics canoniques et 32 observations alias. Les 32 observations référencent leurs canonical targets sans collision ni perte |
| Parcours spécialisés informatiques | 10 clés listées ci-dessus | par parcours : 4 semaines, 4 séances, 4 quiz, 8 questions; totaux 40/40/40/80 et **313 options** comparées avec chaque quiz source |
| Parcours web | 1 | 4 modules source, 12 leçons/séances, 12 quiz, 24 questions et **72 options**; ne pas renommer les modules en semaines sans décision; comparer chaque option/correction source |
| Parcours génériques materialisés | 90 | par parcours : 4 semaines, 12 séances, 12 quiz, 12 questions; totaux 360 semaines, 1 080 séances, 1 080 quiz, 1 080 questions et 3 options par question (3 240 options). Les options de chacun des quiz sont la copie intégrale, ordonnée, de la semaine source correspondante; leur total doit être vérifié contre le manifeste des options de templates, sans calculer une correction à la volée. |

Pour chacun des 11 templates, le manifeste vérifie toutes les valeurs de skills/careers, l’expression de projet, les quatre semaines, le nombre et l’ordre des options, l’index exact de réponse, le texte de question et le feedback; les corrections ne sont pas exposées aux lecteurs publics. Pour chaque génération, vérifier les quatre topics effectivement résolus et leur provenance, les 12 étapes/questions/quiz, options source exactes, liens de projet, skills/careers et checksum de génération. Aucun template importé ne doit être publié automatiquement.

Pour les 10 parcours spécialisés, le web et les 90 parcours générés, vérifier les clés stables sans doublon, positions contiguës, relations semaine/séance/quiz/question/options, textes et corrections source, projets, ressources et liaisons de provenance. La comparaison est par contenu stable + checksum et cardinalités à chaque parent; des totaux globaux égaux ne suffisent pas. Une différence (y compris une option omise, une semaine renommée sans mapping, ou une source manquante) bloque la promotion et produit un rapport par ID. Les contenus non vérifiés restent `draft`/`in_review`; le pipeline doit demander une action éditoriale distincte pour publier.

## 8. Import non destructif et limites du stockage invité

1. **Connexion explicite.** Aucun appel serveur tant que l’utilisateur n’a pas choisi de créer/relier un compte et de synchroniser. La lecture locale continue de fonctionner en cas d’échec réseau.
2. **Préflight local.** Lire `besa.learning.v2` en priorité, puis `capClair.learning.v2`; ces clés ont une forme JSON issue de `defaultState()` version interne 3 et `normalizeState()`. En dernier recours, parser `capClairCompleted` comme tableau et mapper seulement les indices entiers 0–4 vers `web-map`, `html-structure`, `css-first-style`, `js-first-steps`, `web-quality`. Montrer compteurs, éléments non mappés et conflits avant confirmation. Ne jamais effacer les clés source.
3. **Allowlist exacte, sans import implicite.** Le client construit localement une projection d’import à partir des états v2, au lieu d’envoyer la valeur brute de LocalStorage. N’accepter que `version`, `domain`, `plan`, `completed`, `quizResults`, `specialtyProgress`, `savedResources`, `weeklyGoal`, `activityDates`, `project`, `portfolio` et `profile` limité à `interests`, `resourceLanguage`, `theme`, `learningMode`. Les formes d’objets et propriétés imbriquées sont fermées; les dictionnaires dynamiques ont des clés de forme contrôlée et chaque valeur est elle-même validée. Rejeter toute propriété inconnue à n’importe quel niveau par 422 et ne jamais la transférer dans JSONB. Ne pas transmettre/importer `quizAnswers`, `birthDate`, prénom/nom, `displayName`, avatar, `onboardingComplete`, fichiers ou métadonnées de fichiers, `notes` non démontrées dans l’objet normalisé, `awards/xp/coins` recalculables, données de session/auth ou HTML. Pour `capClairCompleted`, n’accepter que `clientImportId`, `sourceKey` et `completedIndexes` (0–4).
4. **Résultats quiz importés désactivés.** Un objet `quizResults` non vide déclenche 503 `FEATURE_DISABLED` avant l’idempotence, le batch ou toute fusion; l’import entier échoue sans import partiel. Les résultats restent sur l’appareil et ne sont jamais stockés comme tentative ou historique serveur. Si `quizResults` est omis, l’import des autres propriétés allowlistées peut continuer.
5. **Idempotence et plafond.** Imposer `Idempotency-Key` et UUID `clientImportId`; index uniques sur `(user_id, client_import_id)` et clé d’idempotence. Le serveur compare le checksum canonique du payload : même clé + même checksum renvoie le rapport initial sans doublons; même clé + checksum différent renvoie 409. Les clés source ne sont pas des identités de compte. Une requête comportant des résultats quiz non vides retourne 503 avant la création du batch/idempotency record. **Plafond total du corps à décider avant implémentation**, non défini par les seules limites de tableau et aucune limite n’est proposée ici. La taille doit être mesurée sur des états locaux représentatifs puis approuvée; les blobs IndexedDB restent exclus.
6. **Fusion non destructive.** Fusionner les complétions/jours actifs par ID/date; ne pas écraser la progression serveur par absence ou ancienneté locale. Mapper `project.checks` par position uniquement sur la checklist source/version vérifiée; si la version ou l’ordre ne correspond pas, conserver localement et signaler le conflit. Les `quizResults` ne sont pas fusionnés ni stockés; un payload non vide fait échouer toute la transaction avec 503. Dédupliquer ressources par URL normalisée; ajouter les fiches portfolio avec IDs source stables; collision de contenu ou identifiant inconnu = élément ignoré/conflit à résoudre, jamais remplacement silencieux. L’import ne peut pas supprimer compte, notes ou données distantes.
7. **Version/incompatibilités.** Valider les `domain`/séances/quiz contre le catalogue versionné et des alias explicites; ne jamais faire de rapprochement par titre seul. Toute clé de contenu inconnue ou payload corrompu est rapporté et reste sur l’appareil, pas forcé sous un nouvel ID.
8. **Pièces jointes IndexedDB.** La source `besa-portfolio-files`, store `files`, contient des Blobs non sérialisés dans les clés LocalStorage. Le contrat GuestImport n’accepte aucun champ fichier ni Blob. Proposer séparément chaque pièce jointe avec confirmation; si disponible, téléverser par l’API portfolio déjà autorisée, vérifier type/hash/taille et conserver l’original local tant que la personne n’a pas validé la copie serveur. Si absente, importer la fiche sans fichier et signaler l’absence. Formats/limites existants : PDF 5 Mio, PNG/JPEG/WebP 2 Mio, un fichier de chaque type par fiche.
9. **Commit et rapport.** Appliquer les changements retenus dans une transaction, sans effacer la source; renvoyer compteurs d’importés/ignorés/conflits et identifiants non résolus, sans valeurs privées. `partial`/`needs_review` est reprenable avec la même clé idempotente et le même checksum. La suppression des clés locales demande une action distincte après vérification par l’utilisateur.

## 9. Index et contraintes opérationnelles recommandés

- Catalogue : index `(availability, family_id, name)` sur `domains`; index GIN `to_tsvector('simple', ...)` ou `pg_trgm` si extension approuvée sur noms/descriptions de contenu publié. Les résultats restent filtrés par statut.
- Inventaire source : index/PK uniques `(source_system, source_domain_id)`, `(content_source_id, source_record_key)` et `(source_record_id, position)`; index sur `canonical_domain_id`, `raw_family_id`, et `mapping_status`. `domain_id_aliases.alias`, `domain_id_alias_sources(source_system, source_revision, source_key)` et `domain_family_aliases.alias` sont uniques; les conflits alias/ID canonique sont rejetés dans la même transaction.
- Collision inter-table entre identifiant canonique et alias : vérifier à chaque insertion/résolution sous transaction sérialisée avec verrou transactionnel partagé par l’espace de noms; si la même chaîne existe sous deux cibles, ne rien fusionner, conserver l’occurrence source avec résolution `unresolved` et signaler le conflit. Les clés primaires d’alias empêchent toute double cible; les cibles directes FK excluent les chaînes d’alias et les cycles.
- Templates/générations : uniques `(family_id, stable_key, version)`, `(template_id, position)` pour semaines/skills/careers, `(template_week_id, position)` pour options/étapes, `(template_id, domain_id, week_position)` pour overrides canoniques, `(template_id, source_key, week_position)` pour observations alias source, `(pathway_id, week_position)` pour les thèmes rendus. Index `(family_id, status)` et `(family_template_id, family_template_version, generation_checksum)`; aucune requête publique ne récupère des lignes template pour reconstruire les séances.
- Revue de droits : index `content_sources(license_status, reviewed_by, reviewed_at)` et `(audit_event_id, content_source_id)` unique; aucun endpoint de création éditeur ne peut définir un état approuvé/rejeté.
- Contenu : uniques des positions/clé stable indiquées ci-dessus; indexes sur FK; publication avec index partiel `(domain_id, slug) WHERE status='published'`.
- Apprenant : `(user_id, status, updated_at DESC)` sur progression; `(user_id, created_at DESC)` sur notes/portfolio/favoris.
- Anti-abus : unicités des clés idempotentes actives. Les index contact et tentative n’existent pas tant que leurs tables sont désactivées. Ne pas indexer les champs libres/message ni date de naissance.
- Taille API initiale : pagination page/cursor par défaut 20, maximum 100; page `data` et `meta` stable. Le plafond total du corps d’import reste une décision produit; mesurer les états avant de le fixer. Note 10 000 caractères proposée; contact 5 000 caractères proposé. Les limites doivent être appliquées aussi en serveur et ajustées avant implémentation selon mesure.
- Limites initiales effectivement approuvées et à appliquer (configurables, révisables par mesure, sans retirer le limiteur; clé compte pour les comptes) : `profileRead`/lecture de compte (`accountRead` dans le résumé) 120/minute/account, `accountWrite` 30/minute/account, `portfolioUpload` 10/hour/account. Elles couvrent les opérations apprenant annotées dans OpenAPI; les lectures de portfolio/préférences de rappel utilisent `profileRead`, leurs mutations `accountWrite`, et le téléversement portfolio `portfolioUpload`. Les valeurs adminRead/adminWrite restent à 60/minute/account selon le contrat existant et conservent leur statut proposé. Les autres limites listées dans OpenAPI restent proposées, sauf routes expressément désactivées; guestQuizSession, guestQuizSubmit et contactSubmit ne sont pas appliquées tant que leurs capacités répondent 503. Pour les contrôles par IP restants, employer une clé HMAC éphémère, jamais l’IP brute en stockage ou journal. Appliquer en plus taille de corps, plafond par endpoint, détection de rafales et `Retry-After`; challenge anti-robot seulement après signal d’abus. Les limites ne sont pas un mécanisme d’authentification.
- Supprimer fichiers de stockage et enregistrements associés de façon cohérente (outbox/job de purge si stockage séparé); réessayer les tâches sans exposer de lien durable.
