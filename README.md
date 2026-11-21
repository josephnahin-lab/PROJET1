# Librescence — Apprendre libre. Grandir ensemble.

Librescence est un site statique sans dépendance applicative. Le catalogue, les parcours, les cours, quiz, projets et portfolio restent utilisables sans compte. Le livre ouvre une page de présentation, puis propose un profil de départ facultatif avant le catalogue.

## Profil et confidentialité

La création de compte, la connexion, les codes WhatsApp et la synchronisation distante sont désactivés dans cette version. Le profil utilise le stockage local du navigateur : prénom ou pseudo, nom facultatif, date de naissance facultative, centres d’intérêt, avatar, thème, langue préférée des recherches vidéo et mode d’apprentissage. Les données de profil et de progression restent sur cet appareil, ne sont pas envoyées par e-mail ou WhatsApp et ne se synchronisent pas entre appareils; elles peuvent disparaître si les données du navigateur sont effacées.

Sur la page Contact, après consentement, le navigateur prépare une conversation WhatsApp contenant le nom, le numéro, le sujet et le message saisis. Librescence ne stocke pas ces champs et n’envoie pas le message automatiquement. La personne peut le vérifier et le modifier dans WhatsApp, puis doit appuyer elle-même sur « Envoyer ». L’envoi et la réception ne peuvent pas être confirmés par Librescence. L’interface et les cours restent actuellement en français; le choix de langue personnalise les recherches vidéo.

Un guide vocal contextuel utilise la synthèse vocale intégrée au navigateur lorsqu’elle est disponible. Il explique les actions de l’écran ouvert (catalogue, fiche de domaine, choix du rythme, cours, projet, progression, portfolio ou profil). Librescence n’enregistre pas de note vocale et n’accède pas au microphone. Les transitions respectent le réglage système de réduction des mouvements.

Les améliorations de cette version comprennent :

- une application installable sur les navigateurs compatibles et une mise en cache du site pour ouvrir l’interface et les cours hors ligne après une première visite ;
- un avis clair quand la connexion Internet est interrompue ; les vidéos et les liens externes restent indisponibles sans réseau ;
- un objectif hebdomadaire configurable, un historique des jours actifs et une série d’apprentissage sans pénalité en cas de pause ;
- un minuteur de concentration de 15, 25 ou 45 minutes dans les cours ;
- l’enregistrement local des notes de cours ;
- une page de révision qui rassemble les quiz où il reste des réponses à retravailler ;
- une bibliothèque pour enregistrer des ressources et les retrouver dans le même navigateur.

La bibliothèque, les objectifs, les dates d’activité, les notes et la progression sont enregistrés uniquement sur cet appareil. Ils ne se synchronisent pas entre appareils. Les vidéos sont chargées uniquement après une action volontaire, ce qui évite le démarrage automatique et réduit les données consommées.

## Déploiement et mode hors ligne

Le mode hors ligne et l’installation nécessitent un hébergement HTTPS (ou `localhost` pour les essais). Après une première visite en ligne, l’application et les parcours inclus dans le site peuvent être mis en cache. Les polices distantes, vidéos YouTube, liens vers les fournisseurs, création de compte, connexion et synchronisation nécessitent toujours Internet et des services externes. Après une mise à jour, le navigateur peut garder l’ancienne version jusqu’à ce que le service worker actualise son cache.

## Parcours d’apprentissage

Le développement web conserve son parcours détaillé avec cours rédigés, quiz corrigés, progression locale, ressources MDN et projet final. Les dix parcours informatiques et les autres domaines guidés proposent une fiche de domaine, prérequis, matériel, choix du rythme (2, 4 ou 8 semaines, ou libre), programme ordonné, séances, activités, quiz corrigés, navigation, projet final et impression en PDF.

Un lien direct de ressource n’est associé à une leçon que si son titre ou son adresse recoupe le thème. Sinon, le site propose une recherche ciblée, signalée comme piste à vérifier. Les liens directs vers des vidéos YouTube ouvrent le lecteur intégré de Librescence, avec lien de secours. Une recherche YouTube ou un cours hébergé sur un autre site s’ouvre séparément; certains fournisseurs interdisent l’intégration dans une autre page. Les ressources et conditions d’accès doivent être vérifiées avant publication.

Les contenus de santé, sécurité, droit, sciences, agriculture et mobilité comportent des précautions adaptées; les activités ne remplacent ni un professionnel ni une qualification. Les pièces jointes de portfolio restent dans le navigateur. L’impression ouvre la boîte de dialogue du navigateur pour enregistrer un PDF. Aucun partage public, envoi de contact ou espace communautaire modéré n’est configuré.
