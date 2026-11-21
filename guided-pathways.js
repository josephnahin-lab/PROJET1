// Parcours d'initiation organisés par famille : les fiches y ajoutent le nom,
// la description et les ressources propres à chaque domaine.
window.BesaPathwayMethods = {
  digital: {
    skills:['Décomposer un problème','Choisir un outil ou modèle simple','Tester et documenter un prototype'], careers:['développeur logiciel','concepteur UX','testeur logiciel','concepteur de jeux'],
    project:n=>`Réalise un prototype débutant en ${n}, explique son public et son objectif, teste-le avec une personne volontaire et documente les améliorations.`,
    weeks:[
      ['Comprendre le besoin','Définis à quoi sert l’outil, jeu ou expérience et pour qui il est conçu.','Écris le problème, le public visé et un exemple d’usage.','Que faut-il définir avant de construire un outil numérique ?',['Le besoin et les personnes qui vont l’utiliser.','La couleur finale seulement.','Une longue liste de fonctions.'],0,'Un bon point de départ est le problème et son public.'],
      ['Découper les éléments','Un prototype se construit en petites parties que l’on peut expliquer et examiner.','Dessine un parcours utilisateur, schéma de modules ou boucle de jeu selon ton sujet.','Pourquoi découper un projet en petites parties ?',['Pour comprendre, construire et vérifier chaque élément.', 'Pour rendre le projet impossible à modifier.', 'Pour éviter de définir son fonctionnement.'],0,'Des parties limitées sont plus faciles à concevoir et vérifier.'],
      ['Créer un prototype','Réalise une première version simple avec un outil adapté et des données fictives.','Construis une maquette, un écran, un script de démonstration ou une règle jouable.','Que doit faire un prototype débutant ?',['Montrer une fonction ou idée limitée à tester.', 'Contenir toutes les fonctions possibles.', 'Être publié sans vérification.'],0,'Un prototype sert à examiner une idée, pas à promettre un produit fini.'],
      ['Tester et améliorer','Observe une personne volontaire utiliser le prototype et note les difficultés sans collecter de données sensibles.','Corrige un point puis rédige les limites et prochaines étapes.','Quel est l’intérêt d’un test utilisateur ?',['Repérer les difficultés et améliorer le prototype.', 'Prouver que personne ne rencontrera de problème.', 'Remplacer la documentation.'],0,'Un test donne des retours pour améliorer, sans garantir une expérience parfaite.']
    ]
  },
  'entreprendre-gerer': {
    skills:['Analyser un besoin','Construire une offre utile','Organiser un plan d’action'], careers:['gestionnaire d’activité','chargé de projet','conseiller clientèle','entrepreneur'],
    project:n=>`Présente un projet lié à ${n} : besoin, public, solution, étapes, moyens estimés et retours. Ne promets pas de réussite commerciale.`,
    weeks:[
      ['Partir d’un besoin','Observe les personnes concernées et leur contexte avant de proposer une solution.','Résume les besoins exprimés par trois personnes, sans noter de données privées.','Avant de proposer une offre, que faut-il comprendre ?',['Un besoin réel et les personnes concernées.','Le logo uniquement.','Le prix le plus élevé.'],0,'Une offre utile commence par le besoin et le public.'],
      ['Construire une offre utile','Relie un besoin observé à une proposition claire, son public et son bénéfice.','Rédige une fiche : public, besoin, solution et bénéfice attendu.','Une proposition de valeur explique…',['À qui l’offre sert et quel besoin elle aide à résoudre.','La couleur du logo.','Un résultat garanti.'],0,'Elle rend le bénéfice et le public compréhensibles.'],
      ['Organiser les moyens','Repère les tâches, ressources, coûts et responsabilités nécessaires.','Prépare un tableau des étapes, responsables, moyens et risques.','Pourquoi estimer les moyens et les coûts ?',['Pour vérifier si le plan est réaliste.','Pour garantir un bénéfice.','Pour éviter de répartir les tâches.'],0,'Une estimation aide à préparer un plan sans garantir le résultat.'],
      ['Tester et présenter','Recueille des avis sur une version simple et améliore-la.','Présente ton idée, ses moyens estimés et la prochaine étape.','À quoi sert un petit test auprès du public ?',['À recueillir des retours et améliorer l’idée.','À figer l’idée pour toujours.','À remplacer l’étude du besoin.'],0,'Un test aide à apprendre et ajuster la proposition.']
    ]
  },
  'creation-medias': {
    skills:['Définir un public et un message','Préparer une création','Vérifier sources et droits'], careers:['graphiste','photographe','journaliste','créateur de contenu','monteur audiovisuel'],
    project:n=>`Réalise une création courte en ${n}. Ajoute un brief, les étapes, les sources et crédits, puis les retours et améliorations.`,
    weeks:[
      ['Choisir le sujet et le public','Une création commence par une intention, un public et un format adaptés.','Écris un brief : sujet, public, objectif, format et message.','À quoi sert un brief ?',['À clarifier sujet, public, objectif et format.','À remplacer la création.','À garantir que tout le monde aimera.'],0,'Le brief donne un cap avant de produire.'],
      ['Rechercher et préparer','Rassemble des informations fiables et vérifie les autorisations avant de créer.','Prépare un plan ou storyboard et indique les sources et droits à vérifier.','Avant de réutiliser une image ou une musique, il faut…',['Vérifier source, licence et autorisations.','Retirer le nom de l’auteur.','Supposer que tout est libre.'],0,'La publication doit respecter les droits.'],
      ['Créer une première version','Réalise un brouillon puis contrôle clarté, qualité et accessibilité.','Produis une première version courte adaptée au domaine.','Quel est l’intérêt d’un brouillon ?',['Tester et corriger avant la version finale.','Le publier sans relecture.','Éviter les retours.'],0,'Le brouillon permet d’essayer et d’améliorer.'],
      ['Relire et présenter','Demande un avis, corrige les erreurs et crédite les sources.','Présente ta création, son intention et les changements apportés.','Que faut-il créditer dans une création ?',['Les sources et contributions utilisées.','Aucune source.','Des auteurs inventés.'],0,'Les crédits rendent le travail transparent.']
    ]
  },
  'metiers-techniques-industrie': {
    skills:['Lire un besoin ou un schéma','Repérer composants et risques','Décrire une procédure sûre'], careers:['technicien de maintenance','électricien qualifié','dessinateur technique','agent de production'],
    project:n=>`Crée une étude de cas ou maquette papier en ${n} : besoin, schéma, étapes théoriques, contrôles et risques. N’interviens pas sur une machine ou installation dangereuse.`,
    weeks:[
      ['Comprendre le système','Observe le rôle du système et ses éléments avant toute intervention.','Dessine un schéma fonctionnel simple lié à ce domaine.','Premier réflexe face à un système inconnu ?',['Comprendre son rôle et repérer les risques.','Le démonter immédiatement.','Ignorer les consignes.'],0,'L’observation et la sécurité précèdent toute action.'],
      ['Repérer matériaux et règles','Les travaux dangereux exigent qualification et supervision.','Fais une fiche théorique : composants, fonctions, risques et questions à poser.','Une tâche présente un risque. Que faire ?',['Suivre les règles et demander une supervision qualifiée.','Un tutoriel suffit toujours.','Ignorer les protections.'],0,'Une initiation à distance ne remplace pas qualification et supervision.'],
      ['Raisonner par étapes','Une fabrication ou intervention exige une procédure et des contrôles.','Écris une procédure de simulation ou observation sans manipuler de machine.','À quoi sert une procédure ?',['Organiser les étapes et contrôles.','Supprimer les règles de sécurité.','Garantir zéro panne.'],0,'Une procédure explicite aide à travailler de façon contrôlée.'],
      ['Présenter une solution sûre','Explique les vérifications et quand demander une personne qualifiée.','Prépare une étude de cas avec objectif, schéma, qualité et précautions.','Que montre une bonne étude de cas ?',['Besoin, raisonnement, contrôles et limites de sécurité.','Seulement le résultat.','Une intervention non supervisée.'],0,'Le raisonnement et les limites comptent autant que la solution.']
    ]
  },
  'agriculture-environnement': {
    skills:['Observer un milieu et ses ressources','Relier pratiques et effets','Proposer une action durable'], careers:['technicien agricole','conseiller en agroécologie','animateur environnement','agent de gestion des ressources'],
    project:n=>`Prépare une proposition locale en ${n} : contexte, objectif, ressources, étapes, indicateurs et précautions. Demande l’encadrement requis pour toute activité sur le terrain.`,
    weeks:[
      ['Observer le milieu','Sol, eau, climat, espèces et usages locaux orientent les décisions.','Dans un lieu accessible, note des observations simples sans toucher aux animaux ou produits.','Pourquoi observer le milieu d’abord ?',['Pour adapter les choix aux conditions du lieu.','Pour appliquer partout la même méthode.','Pour remplacer les connaissances locales.'],0,'Le contexte local modifie besoins et effets.'],
      ['Comprendre les cycles','Étudie les saisons, cycles de production et relations entre espèces.','Dessine un calendrier des cycles pertinents dans ta région.','À quoi sert un calendrier saisonnier ?',['À comprendre les périodes et cycles du domaine.','À remplacer les observations.','À garantir une récolte.'],0,'Les cycles aident à planifier et observer.'],
      ['Comparer les pratiques','Compare les effets possibles sur ressources, biodiversité, santé et communautés.','Fais un tableau à partir de sources; n’utilise ni machine ni produit dangereux.','Comment comparer deux pratiques ?',['Examiner effets, ressources et limites dans leur contexte.','Choisir celle qui semble rapide.','Ignorer les sources.'],0,'Une comparaison doit prendre en compte plusieurs effets.'],
      ['Proposer une action locale','Une proposition durable tient compte du contexte et des limites des observations.','Prépare un projet avec objectif local, ressources, étapes et indicateurs.','Que précise un projet environnemental ?',['Contexte, objectif, étapes, indicateurs et précautions.','Une promesse certaine.','Un slogan seulement.'],0,'Un projet indique ce qu’il veut changer et comment observer ses effets.']
    ]
  },
  'sciences-ingenierie': {
    skills:['Formuler une question','Construire un modèle ou protocole','Interpréter avec prudence'], careers:['technicien de laboratoire','assistant de recherche','technicien en ingénierie','analyste scientifique'],
    project:n=>`Prépare un dossier ou une mini-affiche en ${n} : question, sources, modèle ou simulation, observations, limites et conclusion prudente. Pas d’expérience dangereuse ou non supervisée.`,
    weeks:[
      ['Poser une question','Une étude commence par une question précise et limitée.','Formule une question simple et ce que tu chercherais à observer.','À quoi sert une question précise ?',['À délimiter ce que l’on veut comprendre.','À garantir une réponse immédiate.','À éviter les sources.'],0,'La question guide recherche et méthode.'],
      ['Chercher et modéliser','Consulte des sources fiables et construis un schéma, calcul ou modèle.','Réalise un schéma annoté et note les hypothèses.','Pourquoi noter les hypothèses d’un modèle ?',['Pour rendre visibles les choix et limites.','Pour cacher les incertitudes.','Pour en faire des faits.'],0,'Un modèle simplifie le réel; ses hypothèses doivent être explicites.'],
      ['Observer sans danger','Les expériences nécessitant du matériel exigent un laboratoire encadré.','Utilise un jeu de données public, simulation ou observation sans danger.','Une expérience présente un risque. Que faire ?',['Utiliser une simulation ou un cadre qualifié.','Improviser à la maison.','Mélanger des produits.'],0,'Les activités à risque exigent un encadrement adapté.'],
      ['Expliquer les résultats','Distingue observations et interprétations; indique incertitudes et limites.','Rédige une mini-affiche avec question, méthode, résultats et sources.','Que fait une conclusion prudente ?',['Elle s’appuie sur les observations et indique les limites.','Elle affirme plus que les données.','Elle ignore les résultats contraires.'],0,'La conclusion doit rester proportionnée aux observations.']
    ]
  },
  'sante-accompagnement': {
    skills:['Repérer des besoins collectifs','Partager une information fiable','Orienter vers des services compétents'], careers:['animateur de santé communautaire','médiateur social','accompagnant éducatif','agent de prévention'],
    project:n=>`Prépare un support général de sensibilisation en ${n}, fondé sur des sources institutionnelles, sans diagnostic ni conseil individuel. Ajoute les services compétents à contacter.`,
    weeks:[
      ['Comprendre les besoins','Étudie les besoins collectifs sans diagnostiquer une situation individuelle.','Décris un besoin général et les services qualifiés concernés; ne collecte pas de données privées.','Une initiation en ligne peut-elle poser un diagnostic ?',['Non, cela relève d’un professionnel qualifié.','Oui, avec un quiz.','Oui, si le cas semble simple.'],0,'Ce parcours ne fournit ni diagnostic ni traitement.'],
      ['Vérifier les informations','Privilégie les organismes reconnus; distingue repères généraux et cas individuels.','Compare deux sources institutionnelles et note auteur, date et public.','Quelle source privilégier ?',['Un organisme reconnu et des informations datées.','Une publication anonyme.','Une rumeur.'],0,'Les sources reconnues et datées se vérifient mieux.'],
      ['Communiquer et orienter','Une communication responsable indique où demander de l’aide.','Crée une fiche générale et indique un service officiel local.','Une personne a besoin d’aide individuelle. Que faire ?',['L’orienter vers un service ou professionnel compétent.','Promettre une solution certaine.','Publier son histoire sans accord.'],0,'L’orientation respecte le rôle et la confidentialité.'],
      ['Préparer une action de prévention','Une action respecte confidentialité et dignité et s’appuie sur des partenaires compétents.','Conçois un plan d’information avec objectif, public, message et partenaire à consulter.','Que doit respecter une sensibilisation ?',['La dignité, la confidentialité et les conseils compétents.','La publication de données privées.','Des promesses de guérison.'],0,'Une action responsable protège les personnes.']
    ]
  },
  'education-competences': {
    skills:['Identifier un besoin d’apprentissage','Formuler un objectif','Préparer une activité et recueillir un retour'], careers:['formateur','assistant pédagogique','tuteur scolaire','animateur de compétences'],
    project:n=>`Conçois une activité d’initiation en ${n} : public fictif, objectif observable, explication, exercice, adaptation accessible et retour.`,
    weeks:[
      ['Connaître le public','Une activité part des connaissances, besoins, langue et conditions des apprenants.','Décris un public fictif et trois besoins possibles, sans données privées.','Pourquoi identifier le public ?',['Pour adapter exemples, rythme et accessibilité.','Pour imposer le même format.','Pour éviter un objectif.'],0,'La préparation tient compte des personnes qui apprennent.'],
      ['Définir un objectif','Un objectif clair décrit ce que l’apprenant pourra faire à la fin.','Rédige un objectif observable avec un exemple de réussite.','Un objectif utile décrit…',['Une action observable que l’apprenant peut réaliser.','Seulement le thème.','Une note garantie.'],0,'Une action observable aide à choisir exercice et retour.'],
      ['Préparer une activité','Choisis explication, exemple et exercice adaptés à l’objectif.','Prépare une fiche avec matériel, explication, exercice et adaptation.','Une activité devrait être liée…',['À l’objectif annoncé et un exercice adapté.','À une liste sans ordre.','À une surprise.'],0,'L’activité permet de pratiquer l’objectif.'],
      ['Vérifier et améliorer','Un retour formatif aide à repérer ce qui est compris et à améliorer l’activité.','Fais tester ta fiche par un volontaire et note une amélioration.','À quoi sert un retour formatif ?',['À repérer ce qui est compris et à améliorer.','À classer définitivement.','À éviter les explications.'],0,'Le retour soutient apprentissage et amélioration.']
    ]
  },
  'droit-action-citoyenne': {
    skills:['Situer contexte et sources','Comprendre droits et institutions','Préparer une action documentée'], careers:['médiateur citoyen','assistant juridique sous supervision','animateur associatif','chargé de sensibilisation'],
    project:n=>`Prépare une fiche d’information en ${n} : territoire, sources officielles, questions ouvertes et services compétents. Ce travail n’est pas un avis juridique.`,
    weeks:[
      ['Situer le contexte','Les règles varient selon pays, territoire et sujet.','Choisis un sujet et repère pays, niveau institutionnel et personnes concernées.','Pourquoi préciser le territoire ?',['Lois et institutions varient selon le lieu.','Les règles sont identiques partout.','Pour éviter les sources.'],0,'Une information juridique dépend du territoire et de sa date.'],
      ['Trouver des sources fiables','Privilégie textes officiels et institutions compétentes.','Trouve deux sources institutionnelles et note auteur, date et territoire.','Quelle source vérifier en premier ?',['Un texte ou site institutionnel compétent et à jour.','Une publication anonyme.','Une vidéo sans référence.'],0,'Les sources officielles donnent origine et contexte.'],
      ['Analyser un cas fictif','Sépare faits, questions et informations manquantes; ce parcours n’est pas un avis juridique.','Écris faits d’un cas fictif, questions à vérifier et organismes à consulter.','Ce parcours remplace-t-il un conseil juridique ?',['Non, une situation réelle demande un service compétent.','Oui, dans tous les pays.','Oui, si le cas ressemble.'],0,'Un contenu pédagogique ne constitue pas un avis juridique.'],
      ['Informer ou agir','Une action responsable est factuelle, inclusive et respecte les règles locales.','Prépare une fiche d’information avec sources, partenaires et précautions.','Quelles qualités pour une action citoyenne ?',['Faits vérifiés, démarche inclusive et respect des règles.','Accusations sans source.','Diffusion de données privées.'],0,'Une action responsable s’appuie sur des faits.']
    ]
  },
  'mobilite-accompagnement': {
    skills:['Comprendre un besoin de mobilité','Comparer options et accessibilité','Préparer une proposition sûre'], careers:['agent de mobilité','coordinateur logistique','conseiller en orientation','médiateur de transport'],
    project:n=>`Prépare un cas fictif en ${n} : besoin, options comparées, accessibilité, informations à vérifier et solution de repli. Aucun exercice ne remplace permis ou formation.`,
    weeks:[
      ['Comprendre besoins et flux','Repère qui se déplace ou a besoin d’accompagnement, le contexte et les contraintes.','Cartographie un trajet fictif, ses étapes, besoins d’accès et difficultés.','Pourquoi commencer par le besoin ?',['Pour adapter la solution au contexte.','Pour choisir le plus rapide sans autre critère.','Pour ignorer l’accessibilité.'],0,'La solution dépend des besoins réels.'],
      ['Comparer les options','Compare horaires, accessibilité, ressources et services disponibles.','Compare deux solutions et indique ce qui reste à vérifier.','Que comparer pour une option de mobilité ?',['Accessibilité, horaires, coût, sécurité et contraintes.','La couleur seulement.','Une information non vérifiée.'],0,'Plusieurs critères influencent la faisabilité.'],
      ['Vérifier sécurité et règles','Les déplacements réels dépendent des règles, permis et procédures locales.','Rédige une liste de vérifications avant un trajet ou une opération logistique.','Un exercice de sécurité routière autorise-t-il à conduire ?',['Non, il ne remplace ni permis ni règles locales.','Oui, sans encadrement.','Oui, sur un trajet court.'],0,'La conduite exige les autorisations requises.'],
      ['Proposer un parcours clair','Précise étapes, alternatives et aides en cas d’imprévu.','Réalise un plan fictif avec accessibilité, contact officiel et solution de repli.','Que prévoir dans un plan de déplacement ?',['Étapes, accessibilité, vérifications et solution de repli.','Un itinéraire sans alternative.','Des horaires inventés.'],0,'Un plan utile anticipe accès et imprévus.']
    ]
  },
  culture: {
    skills:['Choisir un sujet et un public','Documenter avec respect','Préparer une médiation culturelle'], careers:['médiateur culturel','assistant de projet culturel','guide patrimonial','chargé de valorisation culturelle'],
    project:n=>`Prépare un projet culturel en ${n} : sujet, public, sources, droits à vérifier, médiation, crédits et retours attendus.`,
    weeks:[
      ['Choisir un sujet culturel','Définis un lieu, une pratique ou un récit et les publics ou communautés concernés.','Choisis un sujet local et explique son importance pour les personnes concernées.','Pourquoi définir le public ?',['Pour choisir une médiation adaptée.','Pour exclure les novices.','Pour éviter de préparer.'],0,'La médiation relie le contenu aux besoins du public.'],
      ['Documenter avec respect','Croise les sources et demande les autorisations avant toute réutilisation.','Prépare une fiche avec sources, dates, personnes à consulter et droits à vérifier.','Avant d’utiliser un récit local, il faut…',['Vérifier la source, les droits et les accords nécessaires.','Le publier sans demander.','Retirer les crédits.'],0,'Le respect des sources et personnes est essentiel.'],
      ['Concevoir une médiation','Choisis une forme accessible : récit, visite, atelier, exposition ou création.','Réalise le plan d’une activité destinée à un public défini.','La médiation culturelle sert à…',['Rendre un sujet compréhensible et accessible.','Remplacer les personnes concernées.','Imposer une interprétation unique.'],0,'Elle facilite la découverte en reconnaissant le contexte.'],
      ['Partager et écouter','Crédite les sources et recueille les réactions sans parler au nom des communautés.','Crée une présentation avec contexte, crédits, accessibilité et question de retour.','Que faire des retours du public ?',['Les écouter et améliorer la présentation.','Les ignorer toujours.','Les publier sans accord.'],0,'Les retours améliorent la clarté et l’accessibilité.']
    ]
  }
};

// Thèmes de séances par sous-domaine. Ils remplacent les intitulés génériques
// afin que chaque fiche possède un ordre d’apprentissage qui lui est propre.
window.BesaDomainTracks = {
  software:['Besoins utilisateurs et cahier des charges','Algorithmes, données et découpage en modules','Prototype, tests et correction des erreurs','Documentation et présentation d’une application'],
  games:['Public, idée et boucle de jeu','Règles, objectifs et progression','Prototype jouable et tests de partie','Équilibrage, accessibilité et présentation du jeu'],
  ux:['Publics, tâches et besoins d’usage','Parcours, architecture de l’information et maquette','Accessibilité et test d’utilisabilité','Amélioration d’une interface avec retours utilisateurs'],
  'business-creation':['Problème local et étude du public','Proposition de valeur et modèle d’activité','Budget de départ et démarches à vérifier localement','Test d’une offre et présentation du projet'],
  'activity-management':['Objectifs et organisation quotidienne','Processus, stocks et répartition des tâches','Suivi d’activité avec indicateurs simples','Plan d’amélioration et compte rendu'],
  'project-management':['Besoin, parties prenantes et objectif','Tâches, calendrier et ressources','Risques, suivi et communication','Bilan d’un projet et leçons apprises'],
  'commerce-sales':['Public, besoin et proposition commerciale','Accueil, découverte et conseil responsable','Suivi de commande et qualité de service','Simulation de vente et bilan client'],
  'social-entrepreneurship':['Besoin collectif et personnes concernées','Solution sociale et partenaires','Modèle de ressources et mesure d’impact','Présentation d’une initiative responsable'],
  'entrepreneuriat-social':['Besoin collectif et personnes concernées','Solution sociale et partenaires','Modèle de ressources et mesure d’impact','Présentation d’une initiative responsable'],
  'team-management':['Rôles, objectifs partagés et règles d’équipe','Communication et répartition du travail','Écoute, désaccords et résolution de problèmes','Bilan collectif et plan de coopération'],
  'gestion-equipe':['Rôles, objectifs partagés et règles d’équipe','Communication et répartition du travail','Écoute, désaccords et résolution de problèmes','Bilan collectif et plan de coopération'],
  'gestion-projet':['Besoin, parties prenantes et objectif','Tâches, calendrier et ressources','Risques, suivi et communication','Bilan d’un projet et leçons apprises'],
  entrepreneurship:['Idée, besoin et public','Proposition de valeur et modèle économique','Ressources, budget et risques','Prototype et présentation à un public test'],
  commerce:['Acteurs, produits et parcours client','Prix, information et pratiques loyales','Commande, stock et relation client','Étude d’un petit cas commercial'],
  marketing:['Public cible et besoin','Positionnement et message','Choix de canaux et calendrier éditorial','Campagne test et indicateurs de suivi'],
  management:['Objectifs et responsabilités','Planification des ressources','Communication et suivi de l’activité','Étude de cas de prise de décision'],
  finance:['Revenus, dépenses et budget','Pièces justificatives et classement','Recettes, coûts et lecture d’un tableau simple','Budget prévisionnel fictif et explication'],
  'graphic-design':['Brief, public et hiérarchie visuelle','Typographie, couleurs et composition','Déclinaisons et lisibilité des visuels','Mini-identité graphique avec crédits'],
  'design-graphique':['Brief, public et hiérarchie visuelle','Typographie, couleurs et composition','Déclinaisons et lisibilité des visuels','Mini-identité graphique avec crédits'],
  'content-creation':['Public, objectif et format du contenu','Recherche, angle et calendrier éditorial','Rédaction ou production d’un brouillon','Publication responsable et mesure des retours'],
  'creation-contenu':['Public, objectif et format du contenu','Recherche, angle et calendrier éditorial','Rédaction ou production d’un brouillon','Publication responsable et mesure des retours'],
  content:['Public, objectif et format du contenu','Recherche, angle et calendrier éditorial','Rédaction ou production d’un brouillon','Publication responsable et mesure des retours'],
  'video-audiovisual':['Intention, public et écriture d’un synopsis','Storyboard, plan de tournage et autorisations','Cadrage, son et montage d’une séquence courte','Montage final, crédits et présentation'],
  video:['Intention, public et écriture d’un synopsis','Storyboard, plan de tournage et autorisations','Cadrage, son et montage d’une séquence courte','Montage final, crédits et présentation'],
  'photography':['Lumière, sujet et intention photographique','Cadrage, plans et composition','Sélection et retouche respectueuse','Série photo légendée avec droits et crédits'],
  photo:['Lumière, sujet et intention photographique','Cadrage, plans et composition','Sélection et retouche respectueuse','Série photo légendée avec droits et crédits'],
  journalism:['Sujet, angle et intérêt public','Recherche, vérification et pluralité des sources','Structure d’un article et distinction faits/opinions','Article relu, sourcé et corrigé'],
  writing:['Sujet, lecteur et intention d’écriture','Plan, paragraphes et cohérence','Révision, orthographe et retours de lecture','Texte final avec titre et présentation'],
  'media-education':['Source, auteur et intention d’un média','Indices de fiabilité et vérification croisée','Images, algorithmes et désinformation','Fiche d’analyse critique d’un contenu'],
  'education-medias':['Source, auteur et intention d’un média','Indices de fiabilité et vérification croisée','Images, algorithmes et désinformation','Fiche d’analyse critique d’un contenu'],
  'professional-communication':['Public, objectif et message professionnel','Structure d’un courriel ou d’une présentation','Ton, clarté et adaptation au canal','Rédaction et révision d’un message professionnel'],
  'communication-professionnelle':['Public, objectif et message professionnel','Structure d’un courriel ou d’une présentation','Ton, clarté et adaptation au canal','Rédaction et révision d’un message professionnel'],
  animation:['Mouvement, timing et intention','Storyboard, poses clés et séquençage','Animation d’une boucle courte','Séquence finale avec titre et crédits'],
  music:['Rythme, écoute et structure musicale','Mélodie, harmonie ou arrangement débutant','Enregistrement ou interprétation d’une courte pièce','Présentation d’une création et crédits des sons'],
  'electricite-electrotechnique':['Grandeurs électriques et symboles de schéma','Composants et circuits en simulation','Protection, risques et lecture de documentation','Étude de cas électrique sur schéma uniquement'],
  'maintenance-mecanique':['Fonctionnement et composants d’un mécanisme','Observation d’usure et entretien préventif','Diagnostic théorique et documentation technique','Plan de maintenance fictif avec risques'],
  'automatisation-mecatronique':['Capteurs, actionneurs et chaîne d’information','Logique de commande et schéma fonctionnel','Simulation d’une séquence automatisée','Étude de cas d’un système mécatronique sûr'],
  'industrie-4':['Flux de production et données industrielles','Capteurs, traçabilité et systèmes connectés','Qualité, cybersécurité et continuité','Schéma d’amélioration d’un processus fictif'],
  'construction-batiment':['Lecture de plans et fonctions d’un ouvrage','Matériaux, mesures et étapes de chantier','Accessibilité, environnement et prévention','Étude de cas d’un petit aménagement sur plan'],
  'energie-renouvelable':['Sources d’énergie et besoins locaux','Solaire, éolien et principes de conversion','Stockage, réseau et impacts','Comparaison argumentée de solutions énergétiques'],
  'securite-travail':['Danger, risque et prévention','Repérage des risques dans un cas fictif','Protections, consignes et signalement','Plan de prévention théorique d’une activité'],
  'securite-au-travail':['Danger, risque et prévention','Repérage des risques dans un cas fictif','Protections, consignes et signalement','Plan de prévention théorique d’une activité'],
  cultures:['Cycle d’une plante et calendrier cultural','Sol, semences et besoins de la culture choisie','Eau, observation et protection intégrée','Calendrier de culture adapté à une région'],
  elevage:['Besoins et comportement de l’espèce étudiée','Habitat, alimentation et bien-être animal','Hygiène, biosécurité et observation','Plan d’élevage théorique avec suivi du bien-être'],
  'sols-eau':['Texture du sol, infiltration et matière organique','Cycle de l’eau et besoins d’un territoire','Érosion, conservation et qualité de l’eau','Fiche d’observation et de protection des ressources'],
  agroecologie:['Écosystème agricole et interactions','Diversité, sol vivant et rotations','Réduction des intrants et observation','Plan de transition agroécologique fictif'],
  'forets-peche':['Écosystèmes forestiers et aquatiques','Ressources, cycles et pressions humaines','Gestion durable et règles locales','Étude de cas de conservation d’un milieu'],
  'transformation-alimentaire':['Étapes de transformation d’un aliment','Hygiène, conservation et chaîne du froid','Qualité, emballage et traçabilité','Schéma sûr d’une petite chaîne de transformation'],
  'securite-alimentaire':['Disponibilité, accès et qualité des aliments','Nutrition, conservation et pertes alimentaires','Résilience des systèmes alimentaires','Diagnostic documentaire d’un enjeu local'],
  'climat-biodiversite':['Climat, habitats et espèces locales','Causes de pression et données d’observation','Adaptation, conservation et solutions fondées sur la nature','Fiche de sensibilisation à la biodiversité locale'],
  'mathematiques-appliquees':['Données, unités et estimation','Proportionnalité, pourcentages et échelles','Statistiques simples et représentation','Résolution documentée d’un problème concret'],
  physique:['Mouvement, distance et temps','Forces, énergie et transformations','Mesures, unités et modèles simples','Explication d’un phénomène par schéma et calcul'],
  chimie:['Matière, mélanges et pictogrammes','Transformations et équations simples','Matériaux, usages et sécurité','Étude documentaire d’une transformation sans manipulations risquées'],
  biologie:['Cellules, organismes et classification','Fonctions du vivant et cycles','Écosystèmes et interactions','Fiche scientifique d’observation ou de données'],
  'genie-civil':['Plans, échelles et fonctions d’une structure','Charges, matériaux et principes de stabilité','Eau, accessibilité et résilience du site','Étude de cas d’un ouvrage sur plan'],
  'genie-mecanique':['Mouvement et composants mécaniques','Croquis, dimensions et contraintes','Matériaux, assemblages et maintenance','Conception papier d’un mécanisme simple'],
  'genie-electrique':['Symboles, grandeurs et schémas électriques','Circuits et conversion d’énergie en simulation','Protection, rendement et documentation','Étude de schéma sans intervention réelle'],
  'robotique-energie':['Capteurs, actionneurs et boucle de commande','Logique de déplacement et simulation','Sources d’énergie, autonomie et sécurité','Prototype papier ou simulation d’un robot utile'],
  'sante-publique':['Déterminants et besoins de santé d’une population','Prévention et lecture de données publiques','Accès aux services et communication fiable','Fiche de sensibilisation fondée sur des sources officielles'],
  prevention:['Risques, facteurs protecteurs et prévention','Sources fiables et comportements préventifs','Communication non culpabilisante et orientation','Support général de prévention relu par une source compétente'],
  nutrition:['Groupes alimentaires et besoins généraux','Étiquettes, diversité et équilibre','Sécurité alimentaire et contexte culturel','Menu éducatif fictif sans conseil médical individualisé'],
  'sante-communautaire':['Besoins collectifs et ressources du quartier','Participation et partenaires communautaires','Prévention, écoute et orientation','Plan d’action communautaire fictif et indicateurs'],
  'sante-mentale':['Bien-être, émotions et facteurs de soutien','Écoute, limites et langage non stigmatisant','Signes de besoin d’aide et services de recours','Fiche de ressources de soutien sans diagnostic'],
  'accompagnement-social':['Écoute active, besoins et consentement','Ressources sociales et orientation','Confidentialité, limites et posture professionnelle','Carte d’orientation vers des services locaux'],
  'handicap-accessibilite':['Obstacles à la participation et diversité des besoins','Accessibilité physique, numérique et communicationnelle','Conception inclusive et aménagement raisonnable','Audit d’accessibilité d’un espace ou support fictif'],
  'protection-enfance':['Droits, besoins et facteurs de protection de l’enfant','Repérage prudent et limites du rôle','Voies de signalement et services compétents','Fiche de repères et de contacts officiels locaux'],
  pedagogie:['Objectifs pédagogiques et besoins d’un groupe','Progression, consignes et exemples','Activités, différenciation et évaluation formative','Séquence pédagogique courte et testée'],
  enseignement:['Préparer une séance et définir des objectifs','Expliquer une notion par étapes','Gérer participation et diversité des apprenants','Plan de cours avec exercice et vérification des acquis'],
  'formation-professionnelle':['Compétences métier et référentiel de formation','Démonstration et pratique encadrée','Évaluation des gestes et sécurité au poste','Mini-parcours de formation avec critères observables'],
  'education-numerique':['Compétences numériques et accès aux outils','Recherche, identité et sécurité en ligne','Ressource numérique accessible pour apprendre','Fiche d’activité numérique avec règles de protection'],
  'accompagnement-scolaire':['Besoins scolaires et méthode de travail','Organisation, mémorisation et consignes','Encouragement et autonomie de l’apprenant','Plan de soutien scolaire fictif et réaliste'],
  'apprentissage-adultes':['Expériences et objectifs des apprenants adultes','Autonomie, motivation et utilité pratique','Activités ancrées dans des situations réelles','Séance courte adaptée à un public adulte'],
  'competences-professionnelles':['Compétences transférables et objectifs professionnels','Communication, collaboration et résolution de problème','Exemples de preuves et retours professionnels','Plan de développement de compétences'],
  'competences-vie':['Organisation du temps et priorités','Budget personnel simple et objectifs','Communication, décisions et résolution de problème','Plan personnel d’une semaine et bilan'],
  'droits-humains':['Dignité, égalité et principes universels','Sources et mécanismes de protection','Étude factuelle d’un cas fictif','Fiche pédagogique sur un droit et ses recours locaux'],
  'prevention-citoyenne':['Risques sociaux, signaux et prévention','Sources fiables et analyse d’un cas fictif','Action responsable et protection des personnes','Fiche de prévention avec recours locaux'],
  'droits-enfant':['Principes des droits de l’enfant','Protection, participation et intérêt supérieur','Acteurs et recours de protection selon le pays','Support d’information adapté aux jeunes'],
  citoyennete:['Droits, responsabilités et participation','Institutions et décisions locales','Débat factuel et participation non violente','Proposition citoyenne à présenter à un acteur local'],
  institutions:['Niveaux de décision et services publics','Rôles et responsabilités institutionnels','Accès à l’information et démarches officielles','Carte simple des institutions d’un sujet local'],
  'decouverte-droit':['Règles, droits et responsabilités','Sources officielles et territoire d’application','Lire un cas fictif et repérer les questions ouvertes','Fiche d’orientation vers les services juridiques locaux'],
  integrite:['Conflits d’intérêts et responsabilité','Transparence, équité et règles','Signalement sûr et protection des personnes','Charte d’intégrité pour un projet fictif'],
  'action-associative':['Besoins locaux et mobilisation collective','Objectifs, rôles et gouvernance associative','Budget, partenaires et communication','Fiche projet associatif avec étapes et indicateurs'],
  'medias-citoyens':['Information locale et intérêt public','Vérification des faits et témoignages','Éthique, sécurité et protection des sources','Production d’un contenu citoyen sourcé'],
  'transport-logistique':['Flux, acteurs et demande de transport','Stock, itinéraires et planification','Suivi, sécurité et gestion des imprévus','Plan logistique fictif avec indicateurs'],
  'chaine-approvisionnement':['Fournisseurs, flux et chaîne de valeur','Approvisionnement, stock et prévisions','Traçabilité, risques et durabilité','Schéma d’une chaîne d’approvisionnement responsable'],
  'mobilite-urbaine':['Usages, déplacements et données urbaines','Modes de transport et intermodalité','Accessibilité, sécurité et impacts environnementaux','Proposition d’amélioration d’un trajet urbain'],
  'transports-publics':['Réseau, lignes et services aux voyageurs','Horaires, correspondances et information voyageur','Accessibilité, sécurité et qualité de service','Fiche de trajet accessible avec sources opérateur'],
  'securite-routiere':['Usagers, règles et risques de circulation','Visibilité, vitesse et comportements protecteurs','Équipements, situations d’urgence et prévention','Campagne de sensibilisation routière locale'],
  'mobilite-inclusive':['Obstacles de déplacement et besoins divers','Accessibilité des parcours et des services','Information voyageurs et accompagnement','Audit fictif d’un trajet inclusif'],
  'accompagnement-orientation':['Écoute, demande et consentement','Ressources locales et critères d’orientation','Confidentialité et limites de rôle','Guide d’orientation vers des services fiables'],
  patrimoine:['Patrimoine matériel, immatériel et contexte','Sources, récits et autorisations','Conservation, transmission et médiation','Notice patrimoniale sourcée sur un élément local'],
  musees:['Collections, objets et documentation','Conservation préventive et droits d’image','Parcours visiteur et médiation inclusive','Cartel d’exposition accessible et sourcé'],
  'mediation-culturelle':['Publics, besoins et objectifs de médiation','Récit, interprétation et supports accessibles','Animation, participation et retours','Plan d’une activité culturelle participative'],
  arts:['Observation et langages artistiques','Techniques, matériaux et intention','Création, critique et droits','Œuvre ou performance courte avec note d’intention'],
  'langues-diversite-culturelle':['Langue, identité et diversité des pratiques','Communication interculturelle et écoute','Traduction, médiation et biais','Ressource bilingue valorisant une pratique locale'],
  'projets-culturels':['Public, intention et partenaires culturels','Calendrier, budget et autorisations','Production, médiation et communication','Dossier court de projet culturel'],
  'industries-creatives':['Chaîne de création et métiers','Propriété intellectuelle et modèle de diffusion','Production, public et distribution','Présentation d’une idée de projet créatif responsable'],
  'memoire-locale':['Sources orales et histoire locale','Collecte éthique et consentement','Archivage, contexte et vérification','Récit local documenté avec autorisations']
};
