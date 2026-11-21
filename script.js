(() => {
  'use strict';

  const app = document.querySelector('#app');
  const storageKey = 'besa.learning.v2';
  const supabaseUrl = (window.BesaConfig?.supabaseUrl || '').replace(/\/+$/, '');
  const supabaseKey = window.BesaConfig?.supabaseAnonKey || '';
  const sessionKey = 'besa.auth.session.v1';

  const families = [
    { id: 'digital', name: 'Informatique & numérique', icon: '⌘', description: 'Créer avec le numérique, comprendre les outils et imaginer des services.' },
    { id: 'entreprendre-gerer', name: 'Entreprendre & gérer', icon: '↗', description: 'Faire grandir une idée, une activité ou un projet.' },
    { id: 'creation-medias', name: 'Création & médias', icon: '✳', description: 'Raconter, concevoir et partager des idées.' },
    { id: 'metiers-techniques-industrie', name: 'Métiers techniques & industrie', icon: '⚙', description: 'Fabriquer, construire, réparer et entretenir.' },
    { id: 'agriculture-environnement', name: 'Agriculture & environnement', icon: '❋', description: 'Produire, transformer et prendre soin du vivant.' },
    { id: 'sciences-ingenierie', name: 'Sciences & ingénierie', icon: '◉', description: 'Observer, comprendre et expérimenter.' },
    { id: 'sante-accompagnement', name: 'Santé & accompagnement', icon: '♡', description: 'Prendre soin et accompagner les personnes.' },
    { id: 'education-competences', name: 'Éducation & compétences', icon: '✎', description: 'Apprendre, transmettre et développer ses capacités.' },
    { id: 'droit-action-citoyenne', name: 'Droit & action citoyenne', icon: '◎', description: 'Comprendre les règles et agir avec les autres.' },
    { id: 'mobilite-accompagnement', name: 'Mobilité & accompagnement', icon: '✦', description: 'Accueillir, se déplacer, bouger et partager la culture.' },
    { id: 'culture', name: 'Culture', icon: '✦', description: 'Découvrir les patrimoines, les arts et les pratiques culturelles.' },
  ];

  const domains = [
    { id: 'web', family: 'digital', name: 'Développement web', status: 'ready', description: 'Concevoir des pages web accessibles, les mettre en forme, leur donner vie et créer un petit site.' },
    { id: 'networks', family: 'digital', name: 'Réseaux informatiques', status: 'ready', description: 'Comprendre les appareils, les protocoles, l’adressage et la sécurisation des réseaux.' },
    { id: 'cyber', family: 'digital', name: 'Cybersécurité', status: 'ready', description: 'Découvrir les bases de la sécurité numérique, les risques et les bonnes pratiques défensives.' },
    { id: 'linux', family: 'digital', name: 'Systèmes d’exploitation et Linux', status: 'ready', description: 'Explorer les systèmes d’exploitation, les fichiers, les permissions, les commandes et le diagnostic de base.' },
    { id: 'support', family: 'digital', name: 'Assistance informatique, matériel et dépannage', status: 'ready', description: 'Comprendre le matériel, le diagnostic et les méthodes de dépannage sans risque.' },
    { id: 'python', family: 'digital', name: 'Programmation avec Python', status: 'ready', description: 'Apprendre les bases du code, les variables, les conditions, les fonctions et les petits projets Python.' },
    { id: 'mobile', family: 'digital', name: 'Développement d’applications mobiles Android', status: 'ready', description: 'Découvrir les bases d’Android, Kotlin et les interfaces d’une application mobile simple.' },
    { id: 'databases', family: 'digital', name: 'Bases de données et SQL', status: 'ready', description: 'Structurer des informations, écrire des requêtes et comprendre les relations entre tables.' },
    { id: 'data', family: 'digital', name: 'Données et intelligence artificielle', status: 'ready', description: 'Explorer les données, la visualisation, les modèles simples et les limites de l’IA.' },
    { id: 'cloud', family: 'digital', name: 'Cloud computing', status: 'ready', description: 'Comprendre les services cloud, l’identité, la sécurité, les coûts et une architecture simple.' },
    { id: 'devops', family: 'digital', name: 'DevOps, Git et conteneurs', status: 'ready', description: 'Découvrir Git, GitHub, les conteneurs et la base de la publication de projets.' },
    { id: 'software', family: 'digital', name: 'Développement logiciel', description: 'Imaginer, programmer et tester des logiciels et outils numériques.' },
    { id: 'games', family: 'digital', name: 'Création de jeux', description: 'Découvrir les idées, règles, visuels et outils qui composent un jeu.' },
    { id: 'ux', family: 'digital', name: 'UX & accessibilité', description: 'Concevoir des expériences numériques compréhensibles et utilisables par des personnes diverses.' },
    { id: 'business-creation', family: 'entreprendre-gerer', name: 'Création d’entreprise', status: 'ready', description: 'Découvrir l’idée, le modèle, le marché et la mise en route d’une activité utile.' },
    { id: 'activity-management', family: 'entreprendre-gerer', name: 'Gestion d’activité', status: 'ready', description: 'Organiser les tâches, les ressources, les priorités et la bonne gestion quotidienne.' },
    { id: 'project-management', family: 'entreprendre-gerer', name: 'Gestion de projet', status: 'ready', description: 'Planifier, piloter et suivre une action avec clarté et méthode.' },
    { id: 'commerce-sales', family: 'entreprendre-gerer', name: 'Commerce et vente', status: 'ready', description: 'Comprendre la relation client, la proposition de valeur et le bon parcours de vente.' },
    { id: 'social-entrepreneurship', family: 'entreprendre-gerer', name: 'Entrepreneuriat social', status: 'ready', description: 'Créer une réponse utile aux besoins de la collectivité, avec une logique sociale et solidaire.' },
    { id: 'team-management', family: 'entreprendre-gerer', name: 'Gestion d’équipe', status: 'ready', description: 'Mieux comprendre la communication, l’organisation et le leadership partagé.' },
    { id: 'entrepreneurship', family: 'entreprendre-gerer', name: 'Entrepreneuriat', description: 'Explorer comment transformer une idée en projet et comprendre les besoins de ses publics.' },
    { id: 'commerce', family: 'entreprendre-gerer', name: 'Commerce', description: 'Découvrir les échanges, la relation client et les étapes d’une activité commerciale.' },
    { id: 'marketing', family: 'entreprendre-gerer', name: 'Marketing', description: 'Comprendre les publics, les offres et les façons de communiquer sur un produit ou service.' },
    { id: 'management', family: 'entreprendre-gerer', name: 'Gestion', description: 'Organiser les ressources, tâches, objectifs et décisions d’une activité.' },
    { id: 'finance', family: 'entreprendre-gerer', name: 'Finance & comptabilité', description: 'Découvrir les notions de budget, suivi financier et comptabilité de base.' },
    { id: 'graphic-design', family: 'creation-medias', name: 'Graphisme', status: 'ready', description: 'Composer des images, formes et textes pour transmettre un message visuel.' },
    { id: 'content-creation', family: 'creation-medias', name: 'Création de contenu', status: 'ready', description: 'Préparer des contenus utiles et adaptés à un public et à un format.' },
    { id: 'video-audiovisual', family: 'creation-medias', name: 'Vidéo et audiovisuel', status: 'ready', description: 'Découvrir la préparation, le tournage et le montage d’un récit audiovisuel.' },
    { id: 'photography', family: 'creation-medias', name: 'Photographie', status: 'ready', description: 'Explorer la prise de vue, la lumière, le cadrage et la narration en images.' },
    { id: 'journalism', family: 'creation-medias', name: 'Journalisme', status: 'ready', description: 'Apprendre à chercher, structurer et communiquer des informations par écrit.' },
    { id: 'media-education', family: 'creation-medias', name: 'Éducation aux médias', status: 'ready', description: 'Comprendre comment analyser, choisir et produire des contenus médiatiques de façon critique.' },
    { id: 'professional-communication', family: 'creation-medias', name: 'Communication professionnelle', status: 'ready', description: 'Mettre en mots une idée, une offre ou une action de manière claire et crédible.' },
    { id: 'photo', family: 'creation-medias', name: 'Photographie', description: 'Explorer la prise de vue, la lumière, le cadrage et la narration en images.' },
    { id: 'video', family: 'creation-medias', name: 'Vidéo', description: 'Découvrir la préparation, le tournage et le montage d’un récit audiovisuel.' },
    { id: 'animation', family: 'creation-medias', name: 'Animation', description: 'Explorer le mouvement image par image et la création de séquences animées.' },
    { id: 'writing', family: 'creation-medias', name: 'Rédaction & journalisme', description: 'Apprendre à chercher, structurer et communiquer des informations par écrit.' },
    { id: 'music', family: 'creation-medias', name: 'Musique', description: 'Découvrir la création musicale, l’écoute, l’interprétation et l’enregistrement.' },
    { id: 'content', family: 'creation-medias', name: 'Création de contenu', description: 'Préparer des contenus utiles et adaptés à un public et à un format.' },
    { id: 'electricite-electrotechnique', family: 'metiers-techniques-industrie', name: 'Électricité et électrotechnique', status: 'ready', description: 'Comprendre le courant, les installations, la sécurité et les compétences techniques du domaine électrique.' },
    { id: 'maintenance-mecanique', family: 'metiers-techniques-industrie', name: 'Mécanique et maintenance', status: 'ready', description: 'Découvrir les machines, leur entretien, les pièces et les méthodes de réparation.' },
    { id: 'automatisation-mecatronique', family: 'metiers-techniques-industrie', name: 'Automatisation et mécatronique', status: 'ready', description: 'Explorer les systèmes automatiques, les capteurs et l’assemblage de machines intelligentes.' },
    { id: 'industrie-4-0', family: 'metiers-techniques-industrie', name: 'Industrie 4.0', status: 'ready', description: 'Comprendre les outils numériques, les données et la logique de production connectée.' },
    { id: 'construction-batiment', family: 'metiers-techniques-industrie', name: 'Construction et bâtiment', status: 'ready', description: 'Découvrir les techniques de construction, les matériaux et les métiers du bâtiment.' },
    { id: 'energie-renouvelable', family: 'metiers-techniques-industrie', name: 'Énergie renouvelable', status: 'ready', description: 'Étudier les énergies propres, les installations et les besoins du système énergétique.' },
    { id: 'securite-travail', family: 'metiers-techniques-industrie', name: 'Sécurité au travail', status: 'ready', description: 'Identifier les risques, les règles et les pratiques pour travailler plus sereinement.' },
    { id: 'cultures', family: 'agriculture-environnement', name: 'Cultures', status: 'ready', description: 'Découvrir les bases de la production végétale, des sols et de l’agriculture durable.' },
    { id: 'elevage', family: 'agriculture-environnement', name: 'Élevage', status: 'ready', description: 'Comprendre les animaux, les pratiques de soins et les systèmes de production.' },
    { id: 'sols-eau', family: 'agriculture-environnement', name: 'Sols et eau', status: 'ready', description: 'Explorer la qualité du sol, les ressources hydriques et leur gestion responsable.' },
    { id: 'agroecologie', family: 'agriculture-environnement', name: 'Agroécologie', status: 'ready', description: 'Étudier les relations entre cultures, environnement et système agricole durable.' },
    { id: 'forets-peche', family: 'agriculture-environnement', name: 'Forêts et pêche', status: 'ready', description: 'Comprendre la gestion des ressources naturelles et les métiers liés à l’environnement.' },
    { id: 'transformation-alimentaire', family: 'agriculture-environnement', name: 'Transformation alimentaire', status: 'ready', description: 'Découvrir la sécurité, la qualité et la transformation des produits agricoles.' },
    { id: 'securite-alimentaire', family: 'agriculture-environnement', name: 'Sécurité alimentaire', status: 'ready', description: 'Comprendre les enjeux alimentaires, l’accès et la qualité des aliments.' },
    { id: 'climat-biodiversite', family: 'agriculture-environnement', name: 'Climat et biodiversité', status: 'ready', description: 'Explorer les liens entre environnement, climat, espèces et modes de production.' },
    { id: 'mathematiques-appliquees', family: 'sciences-ingenierie', name: 'Mathématiques appliquées', status: 'ready', description: 'Utiliser les mathématiques dans la modélisation, le raisonnement et la résolution de problèmes.' },
    { id: 'physique', family: 'sciences-ingenierie', name: 'Physique', status: 'ready', description: 'Observer les lois du mouvement, de l’énergie et des phénomènes naturels.' },
    { id: 'chimie', family: 'sciences-ingenierie', name: 'Chimie', status: 'ready', description: 'Découvrir les transformations, les matériaux et les réactions chimiques.' },
    { id: 'biologie', family: 'sciences-ingenierie', name: 'Biologie', status: 'ready', description: 'Explorer la vie, les organismes et les mécanismes du vivant.' },
    { id: 'genie-civil', family: 'sciences-ingenierie', name: 'Génie civil', status: 'ready', description: 'Comprendre la construction, les infrastructures et les structures de base.' },
    { id: 'genie-mecanique', family: 'sciences-ingenierie', name: 'Génie mécanique', status: 'ready', description: 'Étudier la conception, les mécanismes et les systèmes techniques.' },
    { id: 'genie-electrique', family: 'sciences-ingenierie', name: 'Génie électrique', status: 'ready', description: 'Explorer les circuits, les systèmes électriques et les dispositifs techniques.' },
    { id: 'robotique-energie', family: 'sciences-ingenierie', name: 'Robotique et énergie', status: 'ready', description: 'Découvrir la robotique, les moteurs, les capteurs et les systèmes énergétiques.' },
    { id: 'sante-publique', family: 'sante-accompagnement', name: 'Santé publique', status: 'ready', description: 'Comprendre les enjeux de la prévention, de la santé collective et de l’environnement de vie.' },
    { id: 'prevention', family: 'sante-accompagnement', name: 'Prévention', status: 'ready', description: 'Identifier les bons repères pour prévenir les risques et soutenir des comportements plus sûrs.' },
    { id: 'nutrition', family: 'sante-accompagnement', name: 'Nutrition', status: 'ready', description: 'Explorer les besoins alimentaires, les habitudes et l’importance d’une alimentation équilibrée.' },
    { id: 'sante-communautaire', family: 'sante-accompagnement', name: 'Santé communautaire', status: 'ready', description: 'Découvrir l’accompagnement collectif, la santé de proximité et l’éducation à la santé.' },
    { id: 'sante-mentale', family: 'sante-accompagnement', name: 'Santé mentale et bien-être', status: 'ready', description: 'Comprendre l’écoute, le repérage et les pratiques de bien-être et d’accompagnement.' },
    { id: 'accompagnement-social', family: 'sante-accompagnement', name: 'Accompagnement social', status: 'ready', description: 'Apprendre à orienter, écouter et soutenir les personnes dans leur parcours de vie.' },
    { id: 'handicap-accessibilite', family: 'sante-accompagnement', name: 'Handicap et accessibilité', status: 'ready', description: 'Explorer les bonnes pratiques d’accueil, de communication et de conception inclusive.' },
    { id: 'protection-enfance', family: 'sante-accompagnement', name: 'Protection de l’enfance', status: 'ready', description: 'Comprendre les enjeux de sécurité, d’écoute et de protection des enfants et des jeunes.' },
    { id: 'pedagogie', family: 'education-competences', name: 'Pédagogie', status: 'ready', description: 'Découvrir les méthodes d’apprentissage, les habitudes d’écoute et les approches pédagogiques.' },
    { id: 'enseignement', family: 'education-competences', name: 'Enseignement', status: 'ready', description: 'Comprendre le rôle de l’enseignant, la préparation et l’accompagnement des apprenants.' },
    { id: 'formation-professionnelle', family: 'education-competences', name: 'Formation professionnelle', status: 'ready', description: 'Explorer les compétences, les parcours et les méthodes de formation utiles au monde du travail.' },
    { id: 'education-numerique', family: 'education-competences', name: 'Éducation numérique', status: 'ready', description: 'Comprendre l’usage des outils numériques pour apprendre mieux et plus sereinement.' },
    { id: 'accompagnement-scolaire', family: 'education-competences', name: 'Accompagnement scolaire', status: 'ready', description: 'Identifier les clés pour aider les apprenants à organiser leur travail et leur progression.' },
    { id: 'apprentissage-adultes', family: 'education-competences', name: 'Apprentissage des adultes', status: 'ready', description: 'Découvrir les méthodes d’apprentissage adaptées aux parcours de retour aux études ou à la mise à jour de compétences.' },
    { id: 'competences-vie', family: 'education-competences', name: 'Compétences professionnelles et de vie', status: 'ready', description: 'Travailler la communication, l’organisation et les compétences utiles au quotidien et au travail.' },
    { id: 'droits-humains', family: 'droit-action-citoyenne', name: 'Droits humains', status: 'ready', description: 'Comprendre les droits fondamentaux, leur protection et leur application dans la vie quotidienne.' },
    { id: 'droits-enfant', family: 'droit-action-citoyenne', name: 'Droits de l’enfant', status: 'ready', description: 'Explorer les droits et les protections accordées aux enfants et aux jeunes.' },
    { id: 'citoyennete', family: 'droit-action-citoyenne', name: 'Citoyenneté', status: 'ready', description: 'Découvrir les responsabilités, les institutions et les façons d’agir dans la société.' },
    { id: 'institutions', family: 'droit-action-citoyenne', name: 'Institutions', status: 'ready', description: 'Se repérer dans les structures publiques, les rôles et les institutions qui organisent la vie collective.' },
    { id: 'decouverte-droit', family: 'droit-action-citoyenne', name: 'Découverte du droit', status: 'ready', description: 'Comprendre les bases du droit, la justice et les règles de société.' },
    { id: 'integrite', family: 'droit-action-citoyenne', name: 'Intégrité', status: 'ready', description: 'Étudier les principes d’intégrité, de prévention et de responsabilité dans l’action collective.' },
    { id: 'action-associative', family: 'droit-action-citoyenne', name: 'Action associative et médias citoyens', status: 'ready', description: 'Explorer les moyens d’agir collectivement et de participer à la vie démocratique.' },
    { id: 'medias-citoyens', family: 'droit-action-citoyenne', name: 'Médias citoyens', status: 'ready', description: 'Découvrir la production d’informations utiles, claires et responsables dans l’espace public.' },
    { id: 'transport-logistique', family: 'mobilite-accompagnement', name: 'Transport et logistique', status: 'ready', description: 'Comprendre les déplacements, les flux et l’organisation des services de transport.' },
    { id: 'chaine-approvisionnement', family: 'mobilite-accompagnement', name: 'Chaîne d’approvisionnement', status: 'ready', description: 'Explorer le parcours des biens, les infrastructures et les rôles de la logistique.' },
    { id: 'mobilite-urbaine', family: 'mobilite-accompagnement', name: 'Mobilité urbaine', status: 'ready', description: 'Comprendre les déplacements quotidiens, les services et les enjeux des villes.' },
    { id: 'transports-publics', family: 'mobilite-accompagnement', name: 'Transports publics', status: 'ready', description: 'Découvrir les systèmes de mobilité, leur fonctionnement et leur rôle social.' },
    { id: 'securite-routiere', family: 'mobilite-accompagnement', name: 'Sécurité routière', status: 'ready', description: 'Identifier les règles de circulation, les risques et les comportements sûrs.' },
    { id: 'mobilite-inclusive', family: 'mobilite-accompagnement', name: 'Mobilité inclusive', status: 'ready', description: 'Comprendre l’accès aux services, aux déplacements et la réduction des obstacles.' },
    { id: 'orientation-accompagnement', family: 'mobilite-accompagnement', name: 'Accompagnement social et orientation', status: 'ready', description: 'Explorer l’aide à la mobilité, à l’orientation et à l’accès aux services.' },
    { id: 'patrimoine', family: 'culture', name: 'Patrimoine', status: 'ready', description: 'Découvrir le patrimoine, ses histoires, ses traces et sa transmission.' },
    { id: 'musees', family: 'culture', name: 'Musées', status: 'ready', description: 'Explorer la médiation culturelle, les collections et la mémoire collective.' },
    { id: 'mediation-culturelle', family: 'culture', name: 'Médiation culturelle', status: 'ready', description: 'Comprendre les pratiques culturelles, les publics et les méthodes d’accueil.' },
    { id: 'arts', family: 'culture', name: 'Arts', status: 'ready', description: 'Découvrir les arts, leurs formes et leurs langages visuels, sonores ou plastiques.' },
    { id: 'langues-diversite-culturelle', family: 'culture', name: 'Langues et diversité culturelle', status: 'ready', description: 'Explorer les langues, les identités et les échanges culturels.' },
    { id: 'projets-culturels', family: 'culture', name: 'Gestion de projets culturels', status: 'ready', description: 'Comprendre le sens, l’organisation et la mise en œuvre d’actions culturelles.' },
    { id: 'industries-creatives', family: 'culture', name: 'Industries créatives', status: 'ready', description: 'Explorer le lien entre création, culture, production et économie créative.' },
    { id: 'electrical-tech', family: 'technical', name: 'Électricité et électrotechnique', status: 'ready', description: 'Comprendre les circuits, les tensions, la sécurité et les installations électriques de base.' },
    { id: 'mechanical-maintenance', family: 'technical', name: 'Mécanique et maintenance', status: 'ready', description: 'Explorer les pièces, les outils, les diagnostics et l’entretien d’équipements.' },
    { id: 'automation-mechatronics', family: 'technical', name: 'Automatisation et mécatronique', status: 'ready', description: 'Découvrir la logique des systèmes automatisés, capteurs, actionneurs et mécanismes.' },
    { id: 'industry-40', family: 'technical', name: 'Industrie 4.0', status: 'ready', description: 'Identifier les systèmes connectés, les données et les outils de production numérique.' },
    { id: 'construction-building', family: 'technical', name: 'Construction et bâtiment', status: 'ready', description: 'Comprendre les étapes d’un chantier, les matériaux et la sécurité de travail.' },
    { id: 'renewable-energy', family: 'technical', name: 'Énergie renouvelable', status: 'ready', description: 'Explorer les énergies propres, l’efficacité et les usages du terrain et des installations.' },
    { id: 'workplace-safety', family: 'technical', name: 'Sécurité au travail', status: 'ready', description: 'Se familiariser avec les risques, les règles, la protection et les bonnes pratiques.' },
    { id: 'craft', family: 'technical', name: 'Artisanat', description: 'Explorer la conception et la fabrication manuelle d’objets et de pièces.' },
    { id: 'industry', family: 'technical', name: 'Industrie', description: 'Comprendre les procédés de production, la qualité et l’organisation industrielle.' },
    { id: 'construction', family: 'technical', name: 'Construction', description: 'Découvrir la préparation et les métiers liés aux bâtiments et aux ouvrages.' },
    { id: 'maintenance', family: 'technical', name: 'Maintenance', description: 'Explorer l’entretien, le diagnostic et la remise en état des équipements.' },
    { id: 'crop-farming', family: 'agriculture', name: 'Cultures', status: 'ready', description: 'Découvrir les cycles de culture, les besoins des plantes et les bonnes pratiques agricoles.' },
    { id: 'livestock', family: 'agriculture', name: 'Élevage', status: 'ready', description: 'Comprendre l’élevage, les animaux, les soins et la production durable.' },
    { id: 'soil-water', family: 'agriculture', name: 'Sols et eau', status: 'ready', description: 'Explorer les sols, l’irrigation et la qualité de l’eau pour les cultures.' },
    { id: 'agroecology', family: 'agriculture', name: 'Agroécologie', status: 'ready', description: 'Découvrir les pratiques qui respectent les cycles naturels et la biodiversité.' },
    { id: 'forest-fishing', family: 'agriculture', name: 'Forêts et pêche', status: 'ready', description: 'Comprendre les milieux naturels, les ressources et les usages responsables.' },
    { id: 'food-processing', family: 'agriculture', name: 'Transformation alimentaire', status: 'ready', description: 'Explorer la qualité, la conservation et la transformation des produits alimentaires.' },
    { id: 'food-security', family: 'agriculture', name: 'Sécurité alimentaire', status: 'ready', description: 'Découvrir les enjeux liés à la disponibilité, la qualité et la résilience des systèmes alimentaires.' },
    { id: 'climate-biodiversity', family: 'agriculture', name: 'Climat et biodiversité', status: 'ready', description: 'Étudier les liens entre environnement, biodiversité et systèmes agricoles.' },
    { id: 'farming', family: 'agriculture', name: 'Agriculture & élevage', description: 'Découvrir les productions végétales et animales et les cycles du vivant.' },
    { id: 'food', family: 'agriculture', name: 'Agroalimentaire & agribusiness', description: 'Explorer la transformation, la qualité et l’organisation des activités alimentaires.' },
    { id: 'environment', family: 'agriculture', name: 'Environnement', description: 'Comprendre les milieux naturels et les enjeux de leur préservation.' },
    { id: 'applied-maths', family: 'science', name: 'Mathématiques appliquées', status: 'ready', description: 'Utiliser les mathématiques pour modéliser, mesurer et décider dans la vie quotidienne.' },
    { id: 'physics', family: 'science', name: 'Physique', status: 'ready', description: 'Découvrir les notions de mouvement, d’énergie, de matière et de relation entre objets.' },
    { id: 'chemistry', family: 'science', name: 'Chimie', status: 'ready', description: 'Explorer les réactions, les matériaux et la compréhension des transformations physiques.' },
    { id: 'biology', family: 'science', name: 'Biologie', status: 'ready', description: 'Se familiariser avec les organismes vivants, leur fonctionnement et leur environnement.' },
    { id: 'civil-engineering', family: 'science', name: 'Génie civil', status: 'ready', description: 'Comprendre la construction, les structures et les enjeux du cadre de vie.' },
    { id: 'mechanical-engineering', family: 'science', name: 'Génie mécanique', status: 'ready', description: 'Explorer les principes des mécanismes, la conception et les systèmes techniques.' },
    { id: 'electrical-engineering', family: 'science', name: 'Génie électrique', status: 'ready', description: 'Comprendre l’électricité, les circuits et leurs applications dans la vie quotidienne.' },
    { id: 'robotics-energy', family: 'science', name: 'Robotique et énergie', status: 'ready', description: 'Découvrir les systèmes automatisés, les capteurs et les sources d’énergie.' },
    { id: 'science-lab', family: 'science', name: 'Sciences & recherche', description: 'Découvrir les méthodes d’observation, de mesure, de raisonnement et de recherche.' },
    { id: 'engineering', family: 'science', name: 'Ingénierie', description: 'Explorer comment les sciences aident à concevoir et améliorer des solutions techniques.' },
    { id: 'public-health', family: 'health', name: 'Santé publique', status: 'ready', description: 'Comprendre les besoins de santé de la population, la prévention et la santé collective.' },
    { id: 'prevention', family: 'health', name: 'Prévention', status: 'ready', description: 'Explorer les bonnes pratiques qui aident à garder ou retrouver un état de santé stable.' },
    { id: 'nutrition', family: 'health', name: 'Nutrition', status: 'ready', description: 'Découvrir les besoins alimentaires, le choix des aliments et les habitudes utiles.' },
    { id: 'community-health', family: 'health', name: 'Santé communautaire', status: 'ready', description: 'Identifier les actions qui soutiennent les groupes et les lieux de vie.' },
    { id: 'mental-wellbeing', family: 'health', name: 'Santé mentale et bien-être', status: 'ready', description: 'Comprendre les bases de la santé mentale et les pratiques de soutien, sans se substituer à un professionnel.' },
    { id: 'social-support', family: 'health', name: 'Accompagnement social', status: 'ready', description: 'Explorer l’écoute, l’accompagnement et les services destinés aux personnes et aux communautés.' },
    { id: 'disability-accessibility', family: 'health', name: 'Handicap et accessibilité', status: 'ready', description: 'Comprendre les besoins de participation, les aménagements et les pratiques inclusives.' },
    { id: 'child-protection', family: 'health', name: 'Protection de l’enfance', status: 'ready', description: 'Connaître les enjeux de sécurité, de protection et d’accompagnement des enfants.' },
    { id: 'wellbeing', family: 'health', name: 'Santé & bien-être', description: 'Découvrir les notions de prévention, de santé et de bien-être sans remplacer les soins.' },
    { id: 'social', family: 'health', name: 'Accompagnement social', description: 'Explorer l’écoute, l’accompagnement et les services destinés aux personnes et aux communautés.' },
    { id: 'pedagogy', family: 'education', name: 'Pédagogie', status: 'ready', description: 'Découvrir comment organiser une séance, un apprentissage et une dynamique de groupe.' },
    { id: 'teaching', family: 'education', name: 'Enseignement', status: 'ready', description: 'Comprendre les méthodes de transmission, la planification et l’écoute des apprenants.' },
    { id: 'vocational-training', family: 'education', name: 'Formation professionnelle', status: 'ready', description: 'Explorer les compétences utiles au travail et leur mise en pratique.' },
    { id: 'digital-education', family: 'education', name: 'Éducation numérique', status: 'ready', description: 'Utiliser les outils numériques avec une vraie logique d’apprentissage et d’accès.' },
    { id: 'school-support', family: 'education', name: 'Accompagnement scolaire', status: 'ready', description: 'Comprendre comment soutenir l’apprentissage, la concentration et la confiance.' },
    { id: 'adult-learning', family: 'education', name: 'Apprentissage des adultes', status: 'ready', description: 'Découvrir les méthodes adaptées aux adultes et au travail de transmission.' },
    { id: 'professional-skills', family: 'education', name: 'Compétences professionnelles', status: 'ready', description: 'Identifier les compétences utiles pour la vie professionnelle et la progression dans un métier.' },
    { id: 'life-skills', family: 'education', name: 'Compétences de vie', status: 'ready', description: 'Développer les moyens d’organiser son temps, son argent et ses actions.' },
    { id: 'education-skills', family: 'education', name: 'Éducation & formation', description: 'Découvrir la préparation d’activités, la transmission et l’accompagnement des apprentissages.' },
    { id: 'languages', family: 'education', name: 'Langues', description: 'Développer la compréhension, l’expression et la pratique d’autres langues.' },
    { id: 'personal', family: 'education', name: 'Compétences personnelles', description: 'Explorer l’organisation, la communication et les méthodes d’apprentissage.' },
    { id: 'human-rights', family: 'civic', name: 'Droits humains', status: 'ready', description: 'Comprendre les principes de dignité, protection et participation des personnes.' },
    { id: 'child-rights', family: 'civic', name: 'Droits de l’enfant', status: 'ready', description: 'Découvrir les droits, la protection et le respect de l’enfance.' },
    { id: 'citizenship', family: 'civic', name: 'Citoyenneté', status: 'ready', description: 'Explorer les rôles, responsabilités et actions qui relient les personnes au collectif.' },
    { id: 'institutions', family: 'civic', name: 'Institutions', status: 'ready', description: 'Découvrir les structures publiques et leur rôle dans la vie collective.' },
    { id: 'legal-discovery', family: 'civic', name: 'Découverte du droit', status: 'ready', description: 'S’initier aux notions de règles, droits et responsabilités dans la vie quotidienne.' },
    { id: 'integrity', family: 'civic', name: 'Intégrité', status: 'ready', description: 'Comprendre les principes d’honnêteté, d’équité et de responsabilité.' },
    { id: 'prevention-civic', family: 'civic', name: 'Prévention', status: 'ready', description: 'Explorer les moyens de limiter les risques, les violences et les situations difficiles.' },
    { id: 'associative-action', family: 'civic', name: 'Action associative', status: 'ready', description: 'Découvrir les initiatives collectives et leur rôle dans les territoires.' },
    { id: 'citizen-media', family: 'civic', name: 'Médias citoyens', status: 'ready', description: 'Explorer le rôle de l’information, de la création et de la participation commune.' },
    { id: 'law', family: 'civic', name: 'Droit & administration', description: 'Comprendre des notions juridiques et administratives dans leur contexte.' },
    { id: 'community', family: 'civic', name: 'Action citoyenne & projets communautaires', description: 'Préparer des initiatives collectives et comprendre les besoins d’un groupe.' },
    { id: 'transport-logistics', family: 'hospitality', name: 'Transport et logistique', status: 'ready', description: 'Comprendre le déplacement des personnes et des marchandises, ainsi que leur organisation.' },
    { id: 'supply-chain', family: 'hospitality', name: 'Chaîne d’approvisionnement', status: 'ready', description: 'Explorer les flux, la planification et l’organisation des biens et services.' },
    { id: 'urban-mobility', family: 'hospitality', name: 'Mobilité urbaine', status: 'ready', description: 'Découvrir les déplacements quotidiens, les solutions collectives et leur impact social.' },
    { id: 'public-transports', family: 'hospitality', name: 'Transports publics', status: 'ready', description: 'Comprendre les services de transport, leur rôle et leur accessibilité.' },
    { id: 'road-safety', family: 'hospitality', name: 'Sécurité routière', status: 'ready', description: 'Identifier les règles, gestes et responsabilités utiles pour voyager en sécurité.' },
    { id: 'inclusive-mobility', family: 'hospitality', name: 'Mobilité inclusive', status: 'ready', description: 'Explorer la manière de rendre les déplacements accessibles à toutes et tous.' },
    { id: 'social-orientation', family: 'hospitality', name: 'Accompagnement social et orientation', status: 'ready', description: 'Comprendre le repérage, l’orientation et l’accompagnement des personnes vers des services.' },
    { id: 'culture', family: 'hospitality', name: 'Culture', status: 'ready', description: 'Découvrir les pratiques artistiques, la médiation et la préparation de projets culturels.' },
    { id: 'transport', family: 'hospitality', name: 'Transport', description: 'Découvrir les métiers, services et organisations liés au déplacement des personnes et des biens.' },
    { id: 'tourism', family: 'hospitality', name: 'Tourisme & hôtellerie', description: 'Explorer l’accueil, la préparation des séjours et les services touristiques.' },
    { id: 'food-service', family: 'hospitality', name: 'Restauration', description: 'Découvrir l’organisation d’un service de restauration et la préparation des repas.' },
    { id: 'sports', family: 'hospitality', name: 'Sport', description: 'Explorer la pratique, l’encadrement et l’organisation d’activités sportives.' },
    { id: 'creation-entreprise', family: 'entreprendre-gerer', name: 'Création d’entreprise', status: 'ready', description: 'Découvrir l’idée, le modèle, le marché et la mise en route d’une activité utile.', resources: [{ title: 'HP LIFE en français', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'OIT, économie sociale et solidaire', url: 'https://www.ilo.org/cooperatives-and-social-and-solidarity-economy-education-and-training-0', language: 'Français', source: 'OIT' }] },
    { id: 'gestion-activite', family: 'entreprendre-gerer', name: 'Gestion d’activité', status: 'ready', description: 'Organiser les tâches, les ressources, les priorités et la bonne gestion quotidienne.', resources: [{ title: 'HP LIFE en français', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'OIT, économie sociale et solidaire', url: 'https://www.ilo.org/cooperatives-and-social-and-solidarity-economy-education-and-training-0', language: 'Français', source: 'OIT' }] },
    { id: 'gestion-projet', family: 'entreprendre-gerer', name: 'Gestion de projet', status: 'ready', description: 'Planifier, piloter et suivre une action avec clarté et méthode.', resources: [{ title: 'HP LIFE en français', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'OIT, économie sociale et solidaire', url: 'https://www.ilo.org/cooperatives-and-social-and-solidarity-economy-education-and-training-0', language: 'Français', source: 'OIT' }] },
    { id: 'commerce-vente', family: 'entreprendre-gerer', name: 'Commerce et vente', status: 'ready', description: 'Comprendre la relation client, la proposition de valeur et le bon parcours de vente.', resources: [{ title: 'HP LIFE en français', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'OIT, économie sociale et solidaire', url: 'https://www.ilo.org/cooperatives-and-social-and-solidarity-economy-education-and-training-0', language: 'Français', source: 'OIT' }] },
    { id: 'entrepreneuriat-social', family: 'entreprendre-gerer', name: 'Entrepreneuriat social', status: 'ready', description: 'Créer une réponse utile aux besoins de la collectivité, avec une logique sociale et solidaire.', resources: [{ title: 'HP LIFE en français', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'OIT, économie sociale et solidaire', url: 'https://www.ilo.org/cooperatives-and-social-and-solidarity-economy-education-and-training-0', language: 'Français', source: 'OIT' }] },
    { id: 'gestion-equipe', family: 'entreprendre-gerer', name: 'Gestion d’équipe', status: 'ready', description: 'Mieux comprendre la communication, l’organisation et le leadership partagé.', resources: [{ title: 'HP LIFE en français', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'OIT, économie sociale et solidaire', url: 'https://www.ilo.org/cooperatives-and-social-and-solidarity-economy-education-and-training-0', language: 'Français', source: 'OIT' }] },
    { id: 'design-graphique', family: 'creation-medias', name: 'Design graphique', status: 'ready', description: 'Comprendre la composition visuelle, les formes, les textes et la communication visuelle.', resources: [{ title: 'Canva Design School', url: 'https://www.canva.com/design-school/courses/', language: 'Anglais (cours en langue à confirmer)', source: 'Canva' }, { title: 'Canva, cours de design graphique', url: 'https://www.canva.com/design-school/courses/graphic-design-essentials/', language: 'Anglais (cours en langue à confirmer)', source: 'Canva' }, { title: 'Vidéo officielle Canva', url: 'https://www.youtube.com/watch?v=vRjtRFLrXC4', language: 'Langue de la vidéo à vérifier', source: 'YouTube', isVideo: true }, { title: 'UNESCO, communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }] },
    { id: 'creation-contenu', family: 'creation-medias', name: 'Création de contenu', status: 'ready', description: 'Préparer des contenus utiles et adaptés à un public et à un format.', resources: [{ title: 'Canva Design School', url: 'https://www.canva.com/design-school/courses/', language: 'Anglais (cours en langue à confirmer)', source: 'Canva' }, { title: 'UNESCO, communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }, { title: 'UNESCO, plateforme d’éducation aux médias en français', url: 'https://www.unesco.org/mil4teachers/fr', language: 'Français', source: 'UNESCO' }] },
    { id: 'video-audiovisuel', family: 'creation-medias', name: 'Vidéo et audiovisuel', status: 'ready', description: 'Découvrir la préparation, le tournage et le montage d’un récit audiovisuel.', resources: [{ title: 'Vidéo officielle Canva', url: 'https://www.youtube.com/watch?v=vRjtRFLrXC4', language: 'Langue de la vidéo à vérifier', source: 'YouTube', isVideo: true }, { title: 'UNESCO, communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }] },
    { id: 'photographie', family: 'creation-medias', name: 'Photographie', status: 'ready', description: 'Explorer la prise de vue, la lumière, le cadrage et la narration en images.', resources: [{ title: 'Canva Design School', url: 'https://www.canva.com/design-school/courses/', language: 'Anglais (cours en langue à confirmer)', source: 'Canva' }, { title: 'UNESCO, communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }] },
    { id: 'journalisme', family: 'creation-medias', name: 'Journalisme', status: 'ready', description: 'Apprendre à chercher, structurer et communiquer des informations par écrit.', resources: [{ title: 'UNESCO, communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }, { title: 'UNESCO, plateforme d’éducation aux médias en français', url: 'https://www.unesco.org/mil4teachers/fr', language: 'Français', source: 'UNESCO' }] },
    { id: 'education-medias', family: 'creation-medias', name: 'Éducation aux médias', status: 'ready', description: 'Comprendre comment analyser, choisir et produire des contenus médiatiques de façon critique.', resources: [{ title: 'UNESCO, plateforme d’éducation aux médias en français', url: 'https://www.unesco.org/mil4teachers/fr', language: 'Français', source: 'UNESCO' }, { title: 'UNESCO, communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }] },
    { id: 'communication-professionnelle', family: 'creation-medias', name: 'Communication professionnelle', status: 'ready', description: 'Mettre en mots une idée, une offre ou une action de manière claire et crédible.', resources: [{ title: 'Canva Design School', url: 'https://www.canva.com/design-school/courses/', language: 'Anglais (cours en langue à confirmer)', source: 'Canva' }, { title: 'UNESCO, communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }] },
    { id: 'electricite-electrotechnique', family: 'metiers-techniques-industrie', name: 'Électricité et électrotechnique', status: 'ready', description: 'Comprendre les circuits, la sécurité électrique, les installations et les gestes de base.', resources: [{ title: 'UNESCO-UNEVOC, formation technique et professionnelle', url: 'https://www.unesco.org/en/skills-work-life', language: 'Français', source: 'UNESCO-UNEVOC' }, { title: 'WorldSkills, liste des métiers et compétences', url: 'https://worldskills.org/skills', language: 'Français', source: 'WorldSkills' }, { title: 'OIT, santé et sécurité au travail', url: 'https://www.ilo.org/meetings-and-events/distance-learning-course-occupational-safety-and-health-english-spanish', language: 'Français', source: 'OIT' }] },
    { id: 'mecanique-maintenance', family: 'metiers-techniques-industrie', name: 'Mécanique et maintenance', status: 'ready', description: 'Identifier les machines, les outils et les méthodes de maintenance de base.', resources: [{ title: 'UNESCO-UNEVOC, formation technique et professionnelle', url: 'https://www.unesco.org/en/skills-work-life', language: 'Français', source: 'UNESCO-UNEVOC' }, { title: 'WorldSkills, ressources', url: 'https://worldskills.org/media/member-resources/', language: 'Français', source: 'WorldSkills' }, { title: 'OIT, santé et sécurité au travail', url: 'https://www.ilo.org/meetings-and-events/distance-learning-course-occupational-safety-and-health-english-spanish', language: 'Français', source: 'OIT' }] },
    { id: 'automatisation-mecatronique', family: 'metiers-techniques-industrie', name: 'Automatisation et mécatronique', status: 'ready', description: 'Explorer les systèmes automatisés, la logique de commande et l’assemblage de dispositifs techniques.', resources: [{ title: 'UNESCO-UNEVOC, formation technique et professionnelle', url: 'https://www.unesco.org/en/skills-work-life', language: 'Français', source: 'UNESCO-UNEVOC' }, { title: 'WorldSkills, liste des métiers et compétences', url: 'https://worldskills.org/skills', language: 'Français', source: 'WorldSkills' }] },
    { id: 'industrie-4', family: 'metiers-techniques-industrie', name: 'Industrie 4.0', status: 'ready', description: 'Comprendre les outils numériques, la robotique et le pilotage connecté de l’industrie.', resources: [{ title: 'UNESCO-UNEVOC, formation technique et professionnelle', url: 'https://www.unesco.org/en/skills-work-life', language: 'Français', source: 'UNESCO-UNEVOC' }, { title: 'WorldSkills, ressources', url: 'https://worldskills.org/media/member-resources/', language: 'Français', source: 'WorldSkills' }] },
    { id: 'construction-batiment', family: 'metiers-techniques-industrie', name: 'Construction et bâtiment', status: 'ready', description: 'Découvrir les bases de la construction, des matériaux et des métiers du chantier.', resources: [{ title: 'UNESCO-UNEVOC, formation technique et professionnelle', url: 'https://www.unesco.org/en/skills-work-life', language: 'Français', source: 'UNESCO-UNEVOC' }, { title: 'WorldSkills, liste des métiers et compétences', url: 'https://worldskills.org/skills', language: 'Français', source: 'WorldSkills' }] },
    { id: 'energie-renouvelable', family: 'metiers-techniques-industrie', name: 'Énergie renouvelable', status: 'ready', description: 'Explorer les sources d’énergie, leurs usages et leurs enjeux techniques et environnementaux.', resources: [{ title: 'UNESCO-UNEVOC, formation technique et professionnelle', url: 'https://www.unesco.org/en/skills-work-life', language: 'Français', source: 'UNESCO-UNEVOC' }, { title: 'WorldSkills, ressources', url: 'https://worldskills.org/media/member-resources/', language: 'Français', source: 'WorldSkills' }] },
    { id: 'securite-au-travail', family: 'metiers-techniques-industrie', name: 'Sécurité au travail', status: 'ready', description: 'Comprendre les risques, les règles et les gestes qui aident à travailler en sécurité.', resources: [{ title: 'OIT, santé et sécurité au travail', url: 'https://www.ilo.org/meetings-and-events/distance-learning-course-occupational-safety-and-health-english-spanish', language: 'Français', source: 'OIT' }, { title: 'UNESCO-UNEVOC, formation technique et professionnelle', url: 'https://www.unesco.org/en/skills-work-life', language: 'Français', source: 'UNESCO-UNEVOC' }] },
    { id: 'cultures', family: 'agriculture-environnement', name: 'Cultures', status: 'ready', description: 'Découvrir la production végétale, les cycles de culture et les bonnes pratiques.', resources: [{ title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }, { title: 'Catalogue FAO en français', url: 'https://elearning.fao.org/course/index.php?lang=fr', language: 'Français', source: 'FAO' }, { title: 'OpenLearn, cours sur l’environnement', url: 'https://www.open.edu/openlearn/nature-environment/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'elevage', family: 'agriculture-environnement', name: 'Élevage', status: 'ready', description: 'Explorer les besoins des animaux, les espaces d’élevage et la qualité de vie des troupeaux.', resources: [{ title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }, { title: 'Catalogue FAO en français', url: 'https://elearning.fao.org/course/index.php?lang=fr', language: 'Français', source: 'FAO' }] },
    { id: 'sols-eau', family: 'agriculture-environnement', name: 'Sols et eau', status: 'ready', description: 'Comprendre la qualité du sol, l’irrigation et le rôle de l’eau dans les systèmes agricoles.', resources: [{ title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }, { title: 'OpenLearn, cours sur l’environnement', url: 'https://www.open.edu/openlearn/nature-environment/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'agroecologie', family: 'agriculture-environnement', name: 'Agroécologie', status: 'ready', description: 'Observer les liens entre culture, sol, biodiversité et systèmes durables.', resources: [{ title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }, { title: 'Catalogue FAO en français', url: 'https://elearning.fao.org/course/index.php?lang=fr', language: 'Français', source: 'FAO' }] },
    { id: 'forets-peche', family: 'agriculture-environnement', name: 'Forêts et pêche', status: 'ready', description: 'Découvrir la gestion des ressources naturelles, la pêche et les écosystèmes.', resources: [{ title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }, { title: 'OpenLearn, cours sur l’environnement', url: 'https://www.open.edu/openlearn/nature-environment/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'transformation-alimentaire', family: 'agriculture-environnement', name: 'Transformation alimentaire', status: 'ready', description: 'Comprendre la chaîne de transformation, la sécurité alimentaire et la qualité des produits.', resources: [{ title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }, { title: 'Catalogue FAO en français', url: 'https://elearning.fao.org/course/index.php?lang=fr', language: 'Français', source: 'FAO' }] },
    { id: 'securite-alimentaire', family: 'agriculture-environnement', name: 'Sécurité alimentaire', status: 'ready', description: 'Explorer les enjeux de disponibilité, accès et qualité des aliments.', resources: [{ title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }, { title: 'Catalogue FAO en français', url: 'https://elearning.fao.org/course/index.php?lang=fr', language: 'Français', source: 'FAO' }] },
    { id: 'climat-biodiversite', family: 'agriculture-environnement', name: 'Climat et biodiversité', status: 'ready', description: 'Relier les milieux vivants, le climat et les actions à mettre en œuvre.', resources: [{ title: 'OpenLearn, cours sur l’environnement', url: 'https://www.open.edu/openlearn/nature-environment/free-courses', language: 'Français', source: 'OpenLearn' }, { title: 'Académie numérique de la FAO en français', url: 'https://elearning.fao.org/?lang=fr', language: 'Français', source: 'FAO' }] },
    { id: 'mathematiques-appliquees', family: 'sciences-ingenierie', name: 'Mathématiques appliquées', status: 'ready', description: 'Explorer les mathématiques utiles pour modéliser, calculer et résoudre des problèmes concrets.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'OpenLearn, sciences, mathématiques et technologie', url: 'https://www.open.edu/openlearn/science-maths-technology/free-courses', language: 'Français', source: 'OpenLearn' }, { title: 'Khan Academy en français', url: 'https://fr.khanacademy.org/science', language: 'Français', source: 'Khan Academy' }] },
    { id: 'physique', family: 'sciences-ingenierie', name: 'Physique', status: 'ready', description: 'Comprendre les mouvements, l’énergie, les forces et les phénomènes physiques.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Khan Academy en français', url: 'https://fr.khanacademy.org/science', language: 'Français', source: 'Khan Academy' }] },
    { id: 'chimie', family: 'sciences-ingenierie', name: 'Chimie', status: 'ready', description: 'Découvrir les matériaux, les réactions et les transformations chimiques.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'OpenLearn, sciences, mathématiques et technologie', url: 'https://www.open.edu/openlearn/science-maths-technology/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'biologie', family: 'sciences-ingenierie', name: 'Biologie', status: 'ready', description: 'Explorer la vie, les organismes et les mécanismes du vivant.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Khan Academy en français', url: 'https://fr.khanacademy.org/science', language: 'Français', source: 'Khan Academy' }] },
    { id: 'genie-civil', family: 'sciences-ingenierie', name: 'Génie civil', status: 'ready', description: 'Comprendre les structures, les infrastructures et les projets de construction durable.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'OpenLearn, sciences, mathématiques et technologie', url: 'https://www.open.edu/openlearn/science-maths-technology/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'genie-mecanique', family: 'sciences-ingenierie', name: 'Génie mécanique', status: 'ready', description: 'Explorer les mécanismes, la conception et les systèmes techniques.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'WorldSkills, métiers techniques', url: 'https://worldskills.org/skills', language: 'Français', source: 'WorldSkills' }] },
    { id: 'genie-electrique', family: 'sciences-ingenierie', name: 'Génie électrique', status: 'ready', description: 'Découvrir les circuits, l’énergie et les systèmes électriques.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'OpenLearn, sciences, mathématiques et technologie', url: 'https://www.open.edu/openlearn/science-maths-technology/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'robotique-energie', family: 'sciences-ingenierie', name: 'Robotique et énergie', status: 'ready', description: 'Explorer les systèmes intelligents, les automatismes et les énergies durables.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Khan Academy en français', url: 'https://fr.khanacademy.org/science', language: 'Français', source: 'Khan Academy' }] },
    { id: 'sante-publique', family: 'sante-accompagnement', name: 'Santé publique', status: 'ready', description: 'Comprendre les enjeux de santé collective, la prévention et l’accès aux services.', resources: [{ title: 'Académie de l’OMS en français', url: 'https://www.who.int/fr/about/who-academy', language: 'Français', source: 'OMS' }, { title: 'Plateforme de l’OMS pour l’apprentissage en santé communautaire', url: 'https://whoacademy.org/TAP/', language: 'Français', source: 'OMS' }, { title: 'UNICEF Agora', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }] },
    { id: 'prevention-sante', family: 'sante-accompagnement', name: 'Prévention', status: 'ready', description: 'Identifier les comportements et les pratiques utiles pour prévenir les risques.', resources: [{ title: 'Académie de l’OMS en français', url: 'https://www.who.int/fr/about/who-academy', language: 'Français', source: 'OMS' }, { title: 'Premiers secours, Fédération internationale de la Croix-Rouge', url: 'https://www.ifrc.org/fr/notre-travail/sante-et-soins/premiers-secours', language: 'Français', source: 'FICR' }] },
    { id: 'nutrition', family: 'sante-accompagnement', name: 'Nutrition', status: 'ready', description: 'Explorer les besoins alimentaires, l’équilibre et l’accompagnement de la santé.', resources: [{ title: 'Académie de l’OMS en français', url: 'https://www.who.int/fr/about/who-academy', language: 'Français', source: 'OMS' }, { title: 'UNICEF Agora', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }] },
    { id: 'sante-communautaire', family: 'sante-accompagnement', name: 'Santé communautaire', status: 'ready', description: 'Découvrir les actions collectives et l’accompagnement de proximité en santé.', resources: [{ title: 'Plateforme de l’OMS pour l’apprentissage en santé communautaire', url: 'https://whoacademy.org/TAP/', language: 'Français', source: 'OMS' }, { title: 'UNICEF Agora', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }] },
    { id: 'sante-mentale', family: 'sante-accompagnement', name: 'Santé mentale et bien-être', status: 'ready', description: 'Comprendre les bases du bien-être, de l’écoute et du soutien humain.', resources: [{ title: 'Académie de l’OMS en français', url: 'https://www.who.int/fr/about/who-academy', language: 'Français', source: 'OMS' }, { title: 'UNICEF Agora', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }] },
    { id: 'accompagnement-social', family: 'sante-accompagnement', name: 'Accompagnement social', status: 'ready', description: 'Explorer la relation d’aide, les services et les références utiles autour du soutien humain.', resources: [{ title: 'UNICEF Agora', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }, { title: 'Académie de l’OMS en français', url: 'https://www.who.int/fr/about/who-academy', language: 'Français', source: 'OMS' }] },
    { id: 'handicap-accessibilite', family: 'sante-accompagnement', name: 'Handicap et accessibilité', status: 'ready', description: 'Découvrir les principes d’accessibilité, de respect et d’accompagnement des personnes.', resources: [{ title: 'UNICEF Agora', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }, { title: 'Plateforme de l’OMS pour l’apprentissage en santé communautaire', url: 'https://whoacademy.org/TAP/', language: 'Français', source: 'OMS' }] },
    { id: 'protection-enfance', family: 'sante-accompagnement', name: 'Protection de l’enfance', status: 'ready', description: 'Comprendre la sécurité, l’écoute et les dispositifs de protection des enfants.', resources: [{ title: 'UNICEF Agora', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }, { title: 'Académie de l’OMS en français', url: 'https://www.who.int/fr/about/who-academy', language: 'Français', source: 'OMS' }] },
    { id: 'pedagogie', family: 'education-competences', name: 'Pédagogie', status: 'ready', description: 'Découvrir des méthodes simples pour enseigner, aider et faire progresser une personne.', resources: [{ title: 'UNESCO Global Teacher Campus', url: 'https://www.unesco.org/en/global-education-coalition/teacher-campus?hub=132423', language: 'Français', source: 'UNESCO' }, { title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'HP LIFE', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }] },
    { id: 'enseignement', family: 'education-competences', name: 'Enseignement', status: 'ready', description: 'Explorer les rôles, les méthodes et les situations d’apprentissage en groupe.', resources: [{ title: 'UNESCO Global Teacher Campus', url: 'https://www.unesco.org/en/global-education-coalition/teacher-campus?hub=132423', language: 'Français', source: 'UNESCO' }, { title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }] },
    { id: 'formation-professionnelle', family: 'education-competences', name: 'Formation professionnelle', status: 'ready', description: 'Comprendre comment se former à une compétence et la mettre en pratique.', resources: [{ title: 'UNESCO ICT Essentials for Teachers', url: 'https://openlearning.unesco.org/courses/course-v1%3AUNESCO%2BUNESCO-06%2B2021_01/about', language: 'Français', source: 'UNESCO' }, { title: 'HP LIFE', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }] },
    { id: 'education-numerique', family: 'education-competences', name: 'Éducation numérique', status: 'ready', description: 'Découvrir les outils numériques utiles à l’apprentissage et à la pédagogie.', resources: [{ title: 'UNESCO ICT Essentials for Teachers', url: 'https://openlearning.unesco.org/courses/course-v1%3AUNESCO%2BUNESCO-06%2B2021_01/about', language: 'Français', source: 'UNESCO' }, { title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }] },
    { id: 'accompagnement-scolaire', family: 'education-competences', name: 'Accompagnement scolaire', status: 'ready', description: 'Apprendre à soutenir une personne dans son apprentissage et sa progression.', resources: [{ title: 'UNESCO Global Teacher Campus', url: 'https://www.unesco.org/en/global-education-coalition/teacher-campus?hub=132423', language: 'Français', source: 'UNESCO' }, { title: 'HP LIFE', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }] },
    { id: 'apprentissage-adultes', family: 'education-competences', name: 'Apprentissage des adultes', status: 'ready', description: 'Comprendre les besoins, les rythmes et les méthodes pour apprendre à l’âge adulte.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'HP LIFE', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }] },
    { id: 'competences-professionnelles', family: 'education-competences', name: 'Compétences professionnelles', status: 'ready', description: 'Identifier les compétences utiles au travail et leur développement progressif.', resources: [{ title: 'HP LIFE', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }] },
    { id: 'competences-vie', family: 'education-competences', name: 'Compétences de vie', status: 'ready', description: 'Développer les savoirs pratiques utiles dans la vie quotidienne et le travail.', resources: [{ title: 'HP LIFE', url: 'https://www.life-global.org/fr', language: 'Français', source: 'HP LIFE' }, { title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }] },
    { id: 'droits-humains', family: 'droit-action-citoyenne', name: 'Droits humains', status: 'ready', description: 'Comprendre les grands principes, les protections et le rôle des institutions.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'UNODC, justice et prévention', url: 'https://www.unodc.org/e4j/en/crime-prevention-criminal-justice/module-13/index.html', language: 'Français', source: 'UNODC' }] },
    { id: 'droits-enfant', family: 'droit-action-citoyenne', name: 'Droits de l’enfant', status: 'ready', description: 'Explorer les protections de l’enfance et les situations où l’aide est nécessaire.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'UNODC Education for Justice', url: 'https://www.unodc.org/e4j/', language: 'Français', source: 'UNODC' }] },
    { id: 'citoyennete', family: 'droit-action-citoyenne', name: 'Citoyenneté', status: 'ready', description: 'Découvrir les droits, devoirs et actions collectives dans la vie démocratique.', resources: [{ title: 'UNESCO, cours en communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }, { title: 'OpenLearn', url: 'https://www.open.edu/openlearn/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'institutions', family: 'droit-action-citoyenne', name: 'Institutions', status: 'ready', description: 'Identifier les institutions et les mécanismes qui encadrent la vie collective.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'UNODC Education for Justice', url: 'https://www.unodc.org/e4j/', language: 'Français', source: 'UNODC' }] },
    { id: 'decouverte-droit', family: 'droit-action-citoyenne', name: 'Découverte du droit', status: 'ready', description: 'Comprendre les bases des normes, des règles et des procédures.', resources: [{ title: 'UNODC Education for Justice', url: 'https://www.unodc.org/e4j/', language: 'Français', source: 'UNODC' }, { title: 'OpenLearn', url: 'https://www.open.edu/openlearn/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'integrite', family: 'droit-action-citoyenne', name: 'Intégrité', status: 'ready', description: 'Explorer les notions d’honnêteté, de responsabilité et d’action citoyenne.', resources: [{ title: 'UNODC Education for Justice', url: 'https://www.unodc.org/e4j/', language: 'Français', source: 'UNODC' }, { title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }] },
    { id: 'prevention-citoyenne', family: 'droit-action-citoyenne', name: 'Prévention', status: 'ready', description: 'Comprendre les moyens de prévenir les risques sociaux et les situations de danger.', resources: [{ title: 'UNODC Education for Justice', url: 'https://www.unodc.org/e4j/', language: 'Français', source: 'UNODC' }, { title: 'OpenLearn', url: 'https://www.open.edu/openlearn/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'action-associative', family: 'droit-action-citoyenne', name: 'Action associative', status: 'ready', description: 'Découvrir la manière d’agir collectivement, de s’organiser et de faire entendre des idées.', resources: [{ title: 'UNESCO, cours en communication et information', url: 'https://www.unesco.org/en/communication-information/online-courses', language: 'Cours multilingues · vérifier la langue de chaque cours', source: 'UNESCO' }, { title: 'OpenLearn', url: 'https://www.open.edu/openlearn/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'medias-citoyens', family: 'droit-action-citoyenne', name: 'Médias citoyens', status: 'ready', description: 'Développer une conscience critique sur l’information et la participation publique.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'OpenLearn', url: 'https://www.open.edu/openlearn/free-courses', language: 'Français', source: 'OpenLearn' }] },
    { id: 'transport-logistique', family: 'mobilite-accompagnement', name: 'Transport et logistique', status: 'ready', description: 'Comprendre le déplacement des personnes et des marchandises, ainsi que leur organisation.', resources: [{ title: 'LearnITC, cours de transport', url: 'https://learnitc.unece.org/course/index.php?categoryid=1', language: 'Anglais', source: 'UNECE / LearnITC' }, { title: 'EIT Urban Mobility', url: 'https://urbanmobilitycourses.eu/', language: 'Anglais', source: 'EIT Urban Mobility' }] },
    { id: 'chaine-approvisionnement', family: 'mobilite-accompagnement', name: 'Chaîne d’approvisionnement', status: 'ready', description: 'Explorer les flux, la planification et l’organisation des biens et services.', resources: [{ title: 'LearnITC, cours de transport', url: 'https://learnitc.unece.org/course/index.php?categoryid=1', language: 'Anglais', source: 'UNECE / LearnITC' }] },
    { id: 'mobilite-urbaine', family: 'mobilite-accompagnement', name: 'Mobilité urbaine', status: 'ready', description: 'Découvrir les déplacements quotidiens, les solutions collectives et leur impact social.', resources: [{ title: 'EIT Urban Mobility', url: 'https://urbanmobilitycourses.eu/', language: 'Anglais', source: 'EIT Urban Mobility' }, { title: 'UN-Habitat Learn', url: 'https://learn.unhabitat.org/course/index.php?categoryid=15&lang=fr', language: 'Français', source: 'UN-Habitat' }] },
    { id: 'transports-publics', family: 'mobilite-accompagnement', name: 'Transports publics', status: 'ready', description: 'Comprendre les services de transport, leur rôle et leur accessibilité.', resources: [{ title: 'EIT Urban Mobility', url: 'https://urbanmobilitycourses.eu/', language: 'Anglais', source: 'EIT Urban Mobility' }, { title: 'UN-Habitat Learn', url: 'https://learn.unhabitat.org/course/index.php?categoryid=15&lang=fr', language: 'Français', source: 'UN-Habitat' }] },
    { id: 'securite-routiere', family: 'mobilite-accompagnement', name: 'Sécurité routière', status: 'ready', description: 'Identifier les règles, gestes et responsabilités utiles pour voyager en sécurité.', resources: [{ title: 'LearnITC, cours de transport', url: 'https://learnitc.unece.org/course/index.php?categoryid=1', language: 'Anglais', source: 'UNECE / LearnITC' }] },
    { id: 'mobilite-inclusive', family: 'mobilite-accompagnement', name: 'Mobilité inclusive', status: 'ready', description: 'Explorer la manière de rendre les déplacements accessibles à toutes et tous.', resources: [{ title: 'EIT Urban Mobility', url: 'https://urbanmobilitycourses.eu/', language: 'Anglais', source: 'EIT Urban Mobility' }, { title: 'UN-Habitat Learn', url: 'https://learn.unhabitat.org/course/index.php?categoryid=15&lang=fr', language: 'Français', source: 'UN-Habitat' }] },
    { id: 'accompagnement-orientation', family: 'mobilite-accompagnement', name: 'Accompagnement social et orientation', status: 'ready', description: 'Comprendre le repérage, l’orientation et l’accompagnement des personnes vers des services.', resources: [{ title: 'UNICEF Agora, ressources de formation', url: 'https://agora.unicef.org/', language: 'Français', source: 'UNICEF' }] },
    { id: 'patrimoine', family: 'culture', name: 'Patrimoine', status: 'ready', description: 'Découvrir les lieux, les objets et les mémoire collectives d’un territoire.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
    { id: 'musees', family: 'culture', name: 'Musées', status: 'ready', description: 'Explorer la médiation culturelle, les collections et la transmission du patrimoine.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
    { id: 'mediation-culturelle', family: 'culture', name: 'Médiation culturelle', status: 'ready', description: 'Comprendre l’accueil, le dialogue culturel et l’animation de projets culturels.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
    { id: 'arts', family: 'culture', name: 'Arts', status: 'ready', description: 'Découvrir les pratiques artistiques, les formes et les langages visuels ou sonores.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
    { id: 'langues-diversite-culturelle', family: 'culture', name: 'Langues et diversité culturelle', status: 'ready', description: 'Explorer le rôle des langues, des identités et des échanges culturels.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
    { id: 'projets-culturels', family: 'culture', name: 'Gestion de projets culturels', status: 'ready', description: 'Découvrir l’organisation d’un projet artistique, culturel ou de mémoire collective.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
    { id: 'industries-creatives', family: 'culture', name: 'Industries créatives', status: 'ready', description: 'Explorer les métiers et les chaînes de création dans les secteurs culturels.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
    { id: 'memoire-locale', family: 'culture', name: 'Mémoire locale', status: 'ready', description: 'Conserver les récits, les histoires et les pratiques locales dans une démarche culturelle.', resources: [{ title: 'UNESCO Open Learning', url: 'https://openlearning.unesco.org/', language: 'Français', source: 'UNESCO' }, { title: 'Programmes UNESCO', url: 'https://openlearning.unesco.org/program/', language: 'Français', source: 'UNESCO' }] },
  ];

  const domainAliases = {
    'professional-communication': 'communication-professionnelle',
    content: 'creation-contenu',
    'content-creation': 'creation-contenu',
    'media-education': 'education-medias',
    journalisme: 'journalism',
    photographie: 'photo',
    photography: 'photo',
    'video-audiovisuel': 'video-audiovisual',
    'industrie-4-0': 'industrie-4',
    'mecanique-maintenance': 'maintenance-mecanique',
    'orientation-accompagnement': 'accompagnement-orientation',
    'commerce-vente': 'commerce-sales',
    'creation-entreprise': 'business-creation',
    'social-entrepreneurship': 'entrepreneuriat-social',
    'gestion-activite': 'activity-management',
    'gestion-equipe': 'gestion-equipe',
    'team-management': 'gestion-equipe',
    'gestion-projet': 'gestion-projet',
    'project-management': 'gestion-projet',
    'prevention-sante': 'prevention',
    'electrical-tech': 'electricite-electrotechnique',
    'mechanical-maintenance': 'maintenance-mecanique',
    'automation-mechatronics': 'automatisation-mecatronique',
    'industry-40': 'industrie-4',
    'construction-building': 'construction-batiment',
    'renewable-energy': 'energie-renouvelable',
    'workplace-safety': 'securite-au-travail',
    'crop-farming': 'cultures',
    livestock: 'elevage',
    'soil-water': 'sols-eau',
    agroecology: 'agroecologie',
    'forest-fishing': 'forets-peche',
    'food-processing': 'transformation-alimentaire',
    'food-security': 'securite-alimentaire',
    'climate-biodiversity': 'climat-biodiversite',
    'applied-maths': 'mathematiques-appliquees',
    physics: 'physique',
    chemistry: 'chimie',
    biology: 'biologie',
    'civil-engineering': 'genie-civil',
    'mechanical-engineering': 'genie-mecanique',
    'electrical-engineering': 'genie-electrique',
    'robotics-energy': 'robotique-energie',
    'public-health': 'sante-publique',
    'community-health': 'sante-communautaire',
    'mental-wellbeing': 'sante-mentale',
    'social-support': 'accompagnement-social',
    'disability-accessibility': 'handicap-accessibilite',
    'child-protection': 'protection-enfance',
    pedagogy: 'pedagogie',
    teaching: 'enseignement',
    'vocational-training': 'formation-professionnelle',
    'digital-education': 'education-numerique',
    'school-support': 'accompagnement-scolaire',
    'adult-learning': 'apprentissage-adultes',
    'professional-skills': 'competences-professionnelles',
    'life-skills': 'competences-vie',
    'human-rights': 'droits-humains',
    'child-rights': 'droits-enfant',
    citizenship: 'citoyennete',
    'legal-discovery': 'decouverte-droit',
    integrity: 'integrite',
    'prevention-civic': 'prevention-citoyenne',
    'associative-action': 'action-associative',
    'citizen-media': 'medias-citoyens',
    'transport-logistics': 'transport-logistique',
    'supply-chain': 'chaine-approvisionnement',
    'urban-mobility': 'mobilite-urbaine',
    'public-transports': 'transports-publics',
    'road-safety': 'securite-routiere',
    'inclusive-mobility': 'mobilite-inclusive',
    'social-orientation': 'accompagnement-orientation',
  };
  const domainNameOverrides = {
    'action-associative': 'Action associative',
    'competences-vie': 'Compétences de vie',
    prevention: 'Prévention santé',
    'prevention-citoyenne': 'Prévention citoyenne',
    photo: 'Photographie',
  };
  const activeFamilyIds = new Set(families.map(family => family.id));
  const domainRecordsById = new Map();
  domains.forEach(domain => {
    if (!activeFamilyIds.has(domain.family)) return;
    const id = domainAliases[domain.id] || domain.id;
    const records = domainRecordsById.get(id) || [];
    records.push(domain);
    domainRecordsById.set(id, records);
  });
  const activeDomains = [...domainRecordsById.entries()].map(([id, records]) => {
    const canonicalRecords = records.filter(domain => domain.id === id);
    const candidates = canonicalRecords.length ? canonicalRecords : records;
    const source = candidates.reduce((best, domain) =>
      (domain.resources?.length || 0) > (best.resources?.length || 0) ? domain : best
    );
    const resources = [...new Map(records.flatMap(domain => domain.resources || [])
      .filter(resource => /^https?:\/\//i.test(resource.url))
      .map(resource => [resource.url, resource])).values()];
    return {
      ...source,
      id,
      name: domainNameOverrides[id] || source.name,
      status: id === 'web' ? 'ready' : 'preparing',
      ...(resources.length ? { resources } : {}),
    };
  });
  const activeDomainsById = new Map(activeDomains.map(domain => [domain.id, domain]));

  function canonicalDomainId(id) {
    return domainAliases[id] || id;
  }

  function findDomain(id) {
    return activeDomainsById.get(canonicalDomainId(id)) || null;
  }

  const contentMissing = [
    'Compétences à apprendre, prérequis, langue et matériel propres au sous-domaine.',
    'Débouchés possibles, présentés sans promesse d’emploi.',
    'Programme débutant de quatre semaines avec séances, objectifs et durées.',
    'Exercices et quiz originaux avec corrections expliquées.',
    'Projet final adapté au sous-domaine et à ses compétences.',
    'Liens vers des cours précis et vidéos vérifiés, avec langue et conditions d’accès.',
    'Progression propre au parcours et export de son programme.',
  ];
  const domainSafetyNotes = {
    cyber: 'La future initiation devra rester défensive et légale, dans des environnements de laboratoire autorisés. Elle ne devra pas guider des essais sur des systèmes tiers.',
    finance: 'Le contenu devra rester pédagogique et ne pas se substituer à un conseil financier, fiscal ou comptable adapté à une situation réelle.',
    wellbeing: 'Le contenu ne devra ni diagnostiquer ni recommander de traitement. Les situations de santé nécessitent l’avis d’un professionnel qualifié.',
    social: 'Les pratiques d’accompagnement devront être contextualisées et ne remplacer ni les services sociaux ni l’aide professionnelle.',
    law: 'Les règles varient selon les pays et les situations. Un parcours ne devra pas se présenter comme un avis juridique.',
    construction: 'Les travaux pratiques devront éviter toute tâche dangereuse et préciser les équipements, règles et encadrements obligatoires.',
    maintenance: 'Aucune manipulation d’équipement électrique, mécanique ou dangereux ne devra être proposée sans supervision et qualification appropriées.',
    industry: 'Les exercices devront rester théoriques ou utiliser des équipements de démonstration encadrés, sans action dangereuse sur des machines.',
    farming: 'Les activités devront signaler les risques des machines, animaux, produits et conditions de travail et exiger un encadrement adéquat.',
    food: 'Les contenus devront être vérifiés pour l’hygiène alimentaire, la sécurité, les allergènes et les règles locales.',
    'food-service': 'Les contenus devront traiter les règles d’hygiène et les allergènes sans remplacer une formation professionnelle locale.',
    transport: 'Aucun exercice ne remplacera les permis, formations, règles de circulation ou exigences professionnelles applicables.',
    sports: 'Les exercices devront être adaptés à la sécurité physique et rappeler les limites d’un apprentissage à distance.',
  };

  const computerSpecialtyProfiles = {
    networks: {
      eyebrow: 'INFORMATIQUE · RÉSEAUX',
      title: 'Réseaux informatiques',
      overview: 'Comprendre comment les appareils, ordinateurs et services communiquent entre eux.',
      description: 'Tu découvriras les composants d’un réseau, le rôle des protocoles, l’adressage, le dépannage et les outils de simulation. Le parcours reste débutant et met l’accent sur la compréhension, pas sur la manipulation de réseaux réels.',
      skills: ['Identifier les éléments d’un réseau local ou distant', 'Comprendre l’adressage IPv4 et IPv6', 'Utiliser une logique de dépannage de base'],
      prerequisites: ['Aucune connaissance réseau préalable n’est nécessaire.', 'Une curiosité pour le fonctionnement des appareils connectés.'],
      equipment: ['Ordinateur portable ou de bureau', 'Connexion Internet', 'Cisco Packet Tracer en option pour simuler des réseaux'],
      weeklyTime: '2 à 3 heures par semaine',
      resources: [
        { title: 'Cisco Networking Basics', url: 'https://www.netacad.com/courses/networking-basics?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' },
        { title: 'Cisco, adressage réseau et dépannage', url: 'https://www.netacad.com/courses/network-addressing-and-basic-troubleshooting?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' },
        { title: 'Cisco, démarrer avec Packet Tracer', url: 'https://www.netacad.com/courses/getting-started-cisco-packet-tracer/1000', language: 'Français', source: 'Cisco Networking Academy' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Appareils, types de réseau et circulation des données', sessions: [{ title: 'Appareils, clients, serveurs et circulation des données', objective: 'Décrire le rôle des équipements et le flux de données dans un réseau.', explanation: 'Un réseau relie des appareils afin d’échanger des données et de partager des ressources. Un ordinateur, un routeur, un commutateur et un point d’accès remplissent chacun un rôle précis dans le parcours d’une information. Pour débuter, il faut comprendre les éléments qui participent à la communication.', exercise: 'Dessine un schéma simple d’un réseau domestique avec un modem, un routeur, un ordinateur et un téléphone.', resource: { title: 'Cisco Networking Basics', url: 'https://www.netacad.com/courses/networking-basics?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quel appareil permet de relier un réseau local au réseau internet ?', options: ['Un routeur.', 'Un clavier.', 'Un écran.'], answer: 0, explanation: 'Le routeur sert de point de passage entre le réseau local et les réseaux externes.' }, { question: 'Que fait un serveur dans un réseau ?', options: ['Il fournit des services ou des données à d’autres appareils.', 'Il remplace complètement le navigateur.', 'Il empêche toute communication.', 'Il ne sert qu’à afficher les images.'], answer: 0, explanation: 'Les serveurs hébergent des données, des fichiers, des services ou des applications partageables.' }] }] },
        { label: 'Semaine 2', title: 'Ethernet, Wi‑Fi, protocoles, IPv4 et IPv6', sessions: [{ title: 'Ethernet, Wi‑Fi, protocoles et adresses', objective: 'Comprendre la base de la transmission des informations et des adresses réseau.', explanation: 'Les réseaux utilisent des protocoles pour organiser le trafic. Ethernet et Wi‑Fi sont des moyens de transmission, tandis que des adresses comme IPv4 ou IPv6 permettent d’identifier les appareils. Une bonne base consiste à distinguer les supports physiques et les règles logiques de communication.', exercise: 'Fais la différence entre un réseau filaire et un réseau sans fil en listant 3 éléments de chacun.', resource: { title: 'Cisco, adressage réseau et dépannage', url: 'https://www.netacad.com/courses/network-addressing-and-basic-troubleshooting?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que représente une adresse IP ?', options: ['Une identification d’un appareil sur un réseau.', 'Le nom du système d’exploitation.', 'Le nom d’un fichier de projet.'], answer: 0, explanation: 'L’adresse IP sert à identifier et localiser un appareil dans le réseau.' }, { question: 'Pourquoi le Wi‑Fi et l’Ethernet ne sont pas exactement la même chose ?', options: ['Ils ne désignent pas la même manière de transmettre les données.', 'Ils sont identiques à 100 %.', 'Le Wi‑Fi ne passe jamais par des appareils.'], answer: 0, explanation: 'Ethernet est filaire ; le Wi‑Fi est sans fil, même si les deux transportent des données.' }] }] },
        { label: 'Semaine 3', title: 'Routeurs, commutateurs, DNS, DHCP et Packet Tracer', sessions: [{ title: 'Routeurs, commutateurs, DNS et DHCP', objective: 'Découvrir les services qui permettent d’orienter et de configurer les appareils réseau.', explanation: 'Un routeur dirige le trafic entre réseaux. Un commutateur aide à relier efficacement plusieurs appareils sur un même réseau. DNS transforme un nom lisible comme example.com en adresse utile, et DHCP attribue automatiquement une configuration réseau aux appareils.', exercise: 'Explique le rôle de la DHCP et du DNS avec un exemple de connexion à un réseau domestique.', resource: { title: 'Cisco, démarrer avec Packet Tracer', url: 'https://www.netacad.com/courses/getting-started-cisco-packet-tracer/1000', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quel service permet de donner automatiquement une adresse IP à un nouvel appareil ?', options: ['DHCP.', 'HTML.', 'Le clavier.'], answer: 0, explanation: 'DHCP assigne automatiquement une configuration réseau aux appareils.' }, { question: 'À quoi sert le DNS ?', options: ['Convertir un nom de site en adresse réseau compréhensible pour la machine.', 'Créer des fichiers HTML.', 'Supprimer les routeurs.'], answer: 0, explanation: 'Le DNS transforme les noms lisibles en adresses utiles au réseau.' }] }] },
        { label: 'Semaine 4', title: 'Dépannage de base et sécurité Wi‑Fi', sessions: [{ title: 'Diagnostic, dépannage et sécurité Wi‑Fi', objective: 'Identifier un problème réseau simple et appliquer des mesures de sécurité de base.', explanation: 'Le dépannage consiste d’abord à vérifier les branchements, les lumières, la configuration et le bon fonctionnement des appareils. Pour la sécurité, il faut utiliser un mot de passe robuste, un réseau correctement nommé et des mises à jour. Le but n’est pas d’attaquer un réseau réel, mais de comprendre les bonnes pratiques.', exercise: 'Crée une checklist simple pour diagnostiquer une connexion qui ne marche pas et protéger un réseau Wi‑Fi domestique.', resource: { title: 'Cisco, équipements réseau et configuration', url: 'https://www.netacad.com/courses/networking-devices-and-initial-configuration?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quelle est une bonne première vérification face à un réseau qui ne répond pas ?', options: ['Vérifier le branchement, la puissance du signal et la configuration.', 'Supprimer tous les appareils du réseau.', 'Fermer entièrement le routeur.', 'Ignorer le problème.'], answer: 0, explanation: 'Le dépannage commence par des vérifications simples et logiques sur le matériel et la configuration.' }, { question: 'Pourquoi un mot de passe Wi‑Fi solide est-il important ?', options: ['Il réduit les risques d’accès non autorisé au réseau.', 'Il change le type de câble.', 'Il rend le DNS inutile.', 'Il bloque l’écran.'], answer: 0, explanation: 'Un bon mot de passe limite l’accès non autorisé et renforce la sécurité du réseau.' }] }] }
      ],
      project: 'Créer un schéma d’un réseau domestique ou d’une petite structure dans Packet Tracer ou sur papier, puis expliquer les connexions et les composants.'
    },
    cyber: {
      eyebrow: 'INFORMATIQUE · CYBERSÉCURITÉ',
      title: 'Cybersécurité',
      overview: 'Découvrir les risques, les bonnes pratiques et les principes défensifs du numérique.',
      description: 'Tu apprendras à reconnaître les principales menaces, à protéger tes comptes et appareils, et à appliquer des consignes simples et responsables. Le parcours reste légal, défensif et orienté vers des laboratoires ou des situations simulées.',
      skills: ['Identifier les menaces et les risques numériques', 'Sécuriser un compte et un appareil', 'Établir une checklist de protection personnelle'],
      prerequisites: ['Aucune connaissance préalable de la sécurité informatique.', 'Un usage quotidien d’un ordinateur ou d’un téléphone.'],
      equipment: ['Ordinateur ou smartphone', 'Connexion Internet', 'Un environnement de test ou un appareil personnel utilisé conformément aux consignes de sécurité'],
      weeklyTime: '2 heures par semaine',
      resources: [
        { title: 'Cisco, Introduction à la cybersécurité', url: 'https://www.netacad.com/courses/introduction-to-cybersecurity?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' },
        { title: 'OWASP Web Security Testing Guide', url: 'https://owasp.org/projects/web-security-testing-guide', language: 'Anglais', source: 'OWASP' },
        { title: 'Catalogue Cisco de cybersécurité', url: 'https://www.netacad.com/fr/catalogs/learn/cybersecurity', language: 'Français', source: 'Cisco Networking Academy' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Données, menaces, risques et bases de la cybersécurité', sessions: [{ title: 'Comprendre les données et les menaces', objective: 'Identifier ce qu’il faut protéger et pourquoi.', explanation: 'La cybersécurité commence par la donnée : mots de passe, fichiers, messages, photos, comptes et appareils. Une menace correspond à un risque potentiel pour la confidentialité, l’intégrité ou la disponibilité de ces éléments. Le but est de comprendre les risques sans chercher à les exploiter.', exercise: 'Fais une liste de 5 éléments numériques qui ont une valeur pour toi et note pourquoi ils doivent être protégés.', resource: { title: 'Cisco, Introduction à la cybersécurité', url: 'https://www.netacad.com/courses/introduction-to-cybersecurity?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi la sécurité numérique est-elle importante ?', options: ['Parce qu’elle protège les comptes, données et appareils contre des risques.', 'Parce qu’elle remplace tout logiciel.', 'Parce qu’elle est utile uniquement pour les entreprises.'], answer: 0, explanation: 'La cybersécurité vise à réduire les risques pour les données et les outils numériques utilisés par les personnes.' }, { question: 'Qu’est-ce qu’un risque numérique ?', options: ['Une possibilité de problème ou d’attaque sur un système ou un compte.', 'Un bouton de navigateur.', 'Un type de clavier.'], answer: 0, explanation: 'Un risque est une situation potentielle qui peut menacer la sécurité ou la confidentialité.' }] }] },
        { label: 'Semaine 2', title: 'Mots de passe, authentification, mises à jour et sauvegardes', sessions: [{ title: 'Protection des comptes et des appareils', objective: 'Mettre en place des habitudes simples et efficaces pour sécuriser un compte.', explanation: 'Les mots de passe solides, les authentifications à facteurs multiples et les mises à jour régulières sont des piliers de la sécurité. Les sauvegardes réduisent les conséquences d’un incident et permettent de se rétablir plus rapidement. Elles doivent rester simples à mettre en œuvre au quotidien.', exercise: 'Crée une checklist de sécurité pour ton compte mail ou ton compte d’accès à un service numérique.', resource: { title: 'OWASP Web Security Testing Guide', url: 'https://owasp.org/projects/web-security-testing-guide', language: 'Anglais', source: 'OWASP' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que peut faire une authentification forte ?', options: ['Ajouter une étape supplémentaire pour prouver l’identité.', 'Effacer automatiquement les données.', 'Supprimer les logiciels.', 'Déconnecter le matériel.'], answer: 0, explanation: 'L’authentification forte ajoute un élément de vérification supplémentaire pour sécuriser l’accès.' }, { question: 'Pourquoi les mises à jour sont-elles importantes ?', options: ['Elles corrigent souvent des failles et renforcent la sécurité.', 'Elles ne servent à rien pour la sécurité.', 'Elles permettent de changer le système d’exploitation seulement.', 'Elles remplacent les sauvegardes.'], answer: 0, explanation: 'Les correctifs de sécurité réduisent les vulnérabilités connues et limitent les risques.' }] }] },
        { label: 'Semaine 3', title: 'Sécurité des appareils, réseaux et applications web', sessions: [{ title: 'Sécuriser les appareils et les services', objective: 'Comprendre les mesures simples pour réduire les risques sur un appareil ou une application.', explanation: 'La sécurité se joue aussi sur les appareils et les services utilisés. Les mises à jour, les permissions, l’hygiène des liens et la vigilance face aux téléchargements sont autant d’éléments à maîtriser. Pour le web, il faut rester prudent face aux demandes d’accès, aux pièces jointes ou aux sites peu fiables.', exercise: 'Classe 5 bonnes habitudes de sécurité selon l’endroit où elles s’appliquent : compte, appareil, site web ou réseau.', resource: { title: 'Catalogue Cisco de cybersécurité', url: 'https://www.netacad.com/fr/catalogs/learn/cybersecurity', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi faut-il faire attention aux pièces jointes ou liens inconnus ?', options: ['Ils peuvent contenir des logiciels malveillants ou piéger l’utilisateur.', 'Ils ne sont jamais utiles.', 'Ils remplacent les mots de passe.', 'Ils ne peuvent pas contenir de cyber-risques.'], answer: 0, explanation: 'Les liens ou pièces jointes douteux peuvent mener à des téléchargements ou des pages malveillantes.' }, { question: 'Quel est un bon réflexe pour sécuriser un appareil ?', options: ['Faire les mises à jour et vérifier les permissions des applications.', 'Laisser toutes les permissions sans contrôle.', 'Ignorer les alertes de sécurité.', 'Ne jamais sauvegarder ses fichiers.'], answer: 0, explanation: 'Les mises à jour et les permissions contrôlées aident à réduire les risques de vulnérabilités.' }] }] },
        { label: 'Semaine 4', title: 'Analyse défensive, documentation et règles éthiques', sessions: [{ title: 'Documenter un risque et adopter un posture défensive', objective: 'Appliquer une logique de protection claire et responsable.', explanation: 'La cybersécurité défensive consiste à documenter les risques, organiser des bonnes pratiques et maintenir une communication claire sur les règles à suivre. La dimension éthique est centrale : il faut protéger les informations, ne pas chercher à exploiter de failles sur des systèmes tiers et respecter l’autorisation des personnes et des environnements.', exercise: 'Rédige une mini-checklist « protégeons mon compte et mon appareil » dans un format simple à partager.', resource: { title: 'Cisco, Introduction à la cybersécurité', url: 'https://www.netacad.com/courses/introduction-to-cybersecurity?courseLang=fr-FR', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi faut-il tenir une documentation de sécurité simple ?', options: ['Parce qu’elle aide à rappeler les bonnes pratiques et les actions à faire.', 'Parce qu’elle remplace le besoin de vigilance.', 'Parce qu’elle empêche de mettre à jour les appareils.', 'Parce qu’elle est réservée aux professionnels uniquement.'], answer: 0, explanation: 'Une documentation claire aide à suivre les habitudes de sécurité et les procédures utiles.' }, { question: 'Que signifie une approche éthique en cybersécurité ?', options: ['Protéger les systèmes, les données et les personnes sans chercher à exploiter les failles d’autrui.', 'Tester librement tous les systèmes voisins.', 'Utiliser des mots de passe faibles.', 'Ignorer la documentation.'], answer: 0, explanation: 'L’éthique impose de protéger, non de nuire, et de travailler dans des environnements autorisés.' }] }] }
      ],
      project: 'Rédiger une checklist pour protéger un compte et un appareil personnels, puis décrire les actions essentielles, les risques et les règles de sécurité liées à leur usage.'
    },
    linux: {
      eyebrow: 'INFORMATIQUE · LINUX',
      title: 'Systèmes d’exploitation et Linux',
      overview: 'Découvrir le système d’exploitation, les fichiers, les commandes et les bases du terminal.',
      description: 'Tu apprendras les principes d’un système d’exploitation, le rôle des fichiers et utilisateurs, les commandes de base de Linux, les permissions et les notions de sécurité élémentaire. Le parcours reste sûr et pédagogique, sans demander d’effacer le système principal.',
      skills: ['Naviguer dans un système de fichiers', 'Utiliser le terminal de base', 'Comprendre permissions et processus'],
      prerequisites: ['Aucune connaissance Linux obligatoire.', 'Un ordinateur ou une machine virtuelle avec un système d’exploitation de test.'],
      equipment: ['Ordinateur compatible', 'Machine virtuelle ou environnement Linux de test', 'Connexion Internet pour lire la documentation'],
      weeklyTime: '2 à 3 heures par semaine',
      resources: [
        { title: 'Linux Foundation, Introduction to Linux', url: 'https://training.linuxfoundation.org/training/introduction-to-linux/', language: 'Anglais', source: 'Linux Foundation' },
        { title: 'Cisco Networking Academy, catalogue de cours', url: 'https://www.netacad.com/catalogs/learn', language: 'Français et anglais', source: 'Cisco Networking Academy' },
        { title: 'Cisco, Linux Essentials', url: 'https://www.netacad.com/courses/linux-essentials', language: 'Français', source: 'Cisco Networking Academy' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Rôle du système d’exploitation, fichiers, dossiers et utilisateurs', sessions: [{ title: 'Le système d’exploitation et sa structure', objective: 'Comprendre le rôle du système d’exploitation dans un ordinateur.', explanation: 'Le système d’exploitation orchestre le matériel et les logiciels. Il organise les fichiers, gère les utilisateurs et permet d’exécuter des programmes. En Linux, le système de fichiers est hiérarchique et chaque fichier a un rôle précis.', exercise: 'Explique à quoi servent un dossier, un fichier, un utilisateur et un mot de passe dans un système informatique.', resource: { title: 'Linux Foundation, Introduction to Linux', url: 'https://training.linuxfoundation.org/training/introduction-to-linux/', language: 'Anglais', source: 'Linux Foundation' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quel est le rôle principal d’un système d’exploitation ?', options: ['Gérer le matériel et les logiciels pour qu’ils fonctionnent ensemble.', 'Remplacer les fichiers par des dossiers.', 'Supprimer les utilisateurs.', 'Faire fonctionner sans interface graphique.'], answer: 0, explanation: 'Le système d’exploitation coordonne les ressources du matériel et la logique des applications.' }, { question: 'Que représente un dossier dans un système de fichiers ?', options: ['Un conteneur qui permet d’organiser les fichiers.', 'Une adresse mail.', 'Un type de disque dur.', 'Un logiciel de navigation.'], answer: 0, explanation: 'Les dossiers structurent les fichiers et les ressources du système.' }] }] },
        { label: 'Semaine 2', title: 'Environnement Linux, terminal et commandes de base', sessions: [{ title: 'Découvrir le terminal', objective: 'Apprendre les commandes essentielles du système Linux.', explanation: 'Le terminal permet d’interagir directement avec le système. Des commandes simples comme ls, cd, pwd, mkdir ou touch permettent de naviguer, créer des dossiers et vérifier l’emplacement courant. L’objectif est de découvrir la logique du terminal sans manipuler le système principal.', exercise: 'Dans une machine virtuelle ou un environnement Linux de test, liste les fichiers et crée un dossier portant ton prénom.', resource: { title: 'Cisco, Linux Essentials', url: 'https://www.netacad.com/courses/linux-essentials', language: 'Français', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que fait la commande ls ?', options: ['Elle affiche les fichiers et dossiers du répertoire courant.', 'Elle supprime tout le contenu du dossier.', 'Elle ouvre une page web.', 'Elle modifie la mémoire du périphérique.'], answer: 0, explanation: 'ls sert à lister les éléments disponibles dans le dossier courant.' }, { question: 'Pourquoi tester les commandes sur une machine virtuelle ?', options: ['Pour apprendre sans risquer de toucher le système principal.', 'Parce que le terminal est dangereux sur tout système.', 'Parce que le terminal ne fonctionne pas sur une machine virtuelle.', 'Parce que ce n’est pas utile.'], answer: 0, explanation: 'Une machine virtuelle est un environnement sûr pour expérimenter sans modifier l’ordinateur principal.' }] }] },
        { label: 'Semaine 3', title: 'Permissions, processus, logiciels et mises à jour', sessions: [{ title: 'Permissions, logiciels et gestion des processus', objective: 'Comprendre comment le système protège les fichiers et approche les applications.', explanation: 'Les permissions contrôlent qui peut lire, écrire ou exécuter un fichier. Les processus représentent les programmes en cours d’exécution. Les mises à jour permettent de corriger des failles et d’assurer un bon fonctionnement. Ces notions sont utiles pour un usage sûr et responsable du système.', exercise: 'Fais un mini tableau avec 3 types de permissions et une utilisation concrète pour chaque type.', resource: { title: 'Cisco Networking Academy, catalogue de cours', url: 'https://www.netacad.com/catalogs/learn', language: 'Français et anglais', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que contrôle une permission de fichier ?', options: ['Qui peut lire, écrire ou exécuter le fichier.', 'Le type de clavier utilisé.', 'La couleur du bureau.', 'Le nom du navigateur.'], answer: 0, explanation: 'Les permissions définissent les droits d’accès sur un fichier ou un dossier.' }, { question: 'Pourquoi les mises à jour sont-elles utiles ?', options: ['Elles corrigent des failles de sécurité et améliorent le fonctionnement.', 'Elles remplacent les fichiers.', 'Elles rendent le terminal inutile.', 'Elles ne servent que pour les installations complètes.'], answer: 0, explanation: 'Les correctifs de sécurité réduisent les vulnérabilités et contribuent à la stabilité du système.' }] }] },
        { label: 'Semaine 4', title: 'Aide, documentation, journaux et sécurité élémentaire', sessions: [{ title: 'Documentation, journaux et sécurité de base', objective: 'Trouver des informations utiles et reconnaître les signes d’un problème.', explanation: 'La commande man, les journaux système et la documentation de distribution aident à résoudre des problèmes. En sécurité, il faut éviter les actions risquées et conserver des habitudes sûres : ne pas supprimer des fichiers sans vérification, utiliser des comptes adaptés et documenter les changements.', exercise: 'Prépare un mini-guide de dépannage Linux avec 4 conseils : identification du problème, recherche, vérification, sécurisation.', resource: { title: 'Linux Foundation, Introduction to Linux', url: 'https://training.linuxfoundation.org/training/introduction-to-linux/', language: 'Anglais', source: 'Linux Foundation' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quel est l’intérêt d’un journal système ?', options: ['Il décrit les événements et les erreurs du système.', 'Il remplace les fichiers utilisateur.', 'Il efface automatiquement les données.', 'Il crée des utilisateurs.'], answer: 0, explanation: 'Les journaux enregistrent des informations utiles pour diagnostiquer les problèmes du système.' }, { question: 'Que faut-il faire avant de supprimer un fichier ou une configuration ?', options: ['Vérifier son rôle et s’assurer de ne pas supprimer une donnée utile.', 'Le supprimer immédiatement sans vérifier.', 'Le renommer sans contrôle.', 'Le laisser sans documentation.'], answer: 0, explanation: 'La prudence et la documentation sont essentielles pour éviter des erreurs sur un système de bureau ou une machine virtuelle.' }] }] }
      ],
      project: 'Réaliser un guide débutant de Linux dans une machine virtuelle, en expliquant les dossiers, commandes de base, permissions et sécurité élémentaire, sans effacer le système principal.'
    },
    support: {
      eyebrow: 'INFORMATIQUE · ASSISTANCE',
      title: 'Assistance informatique, matériel et dépannage',
      overview: 'Découvrir les composants d’un ordinateur, le diagnostic et l’accompagnement des utilisateurs.',
      description: 'Tu apprendras à reconnaître les composants d’un ordinateur, à utiliser une méthode de dépannage sûre et à documenter les problèmes sans prendre de risques. Le parcours insiste sur la clarté, l’écoute et la sécurité.',
      skills: ['Identifier les composants d’un ordinateur', 'Suivre une méthode de diagnostic', 'Documenter un problème et ses solutions'],
      prerequisites: ['Aucune connaissance technique préalable.', 'Un intérêt pour le matériel informatique et l’accompagnement des utilisateurs.'],
      equipment: ['Ordinateur ou matériel de démonstration', 'Connexion Internet', 'Feuille de route de diagnostic simple'],
      weeklyTime: '2 heures par semaine',
      resources: [
        { title: 'Cisco IT Essentials', url: 'https://www.netacad.com/courses/it-essentials/courses?courseLang=en-US', language: 'Anglais', source: 'Cisco Networking Academy' },
        { title: 'Catalogue Cisco pour les cours informatiques', url: 'https://www.netacad.com/catalogs/learn', language: 'Français et anglais', source: 'Cisco Networking Academy' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Composants d’un ordinateur et rôle de chaque élément', sessions: [{ title: 'Le cœur d’un ordinateur', objective: 'Identifier les composants principaux et leur rôle.', explanation: 'Un ordinateur comprend au moins un processeur, une mémoire, un stockage, une carte graphique ou un écran, ainsi que des périphériques comme clavier, souris et réseau. Connaître les composants permet de poser des questions utiles et de comprendre le symptôme d’un problème.', exercise: 'Choisis un ordinateur ordinaire et fais un schéma des éléments principaux : processeur, mémoire, stockage, périphériques, écran.', resource: { title: 'Cisco IT Essentials', url: 'https://www.netacad.com/courses/it-essentials/courses?courseLang=en-US', language: 'Anglais', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quel composant exécute les instructions logiques d’un ordinateur ?', options: ['Le processeur.', 'Le clavier.', 'Le câble USB.', 'Le lecteur de DVD.'], answer: 0, explanation: 'Le processeur est le cœur de calcul de l’ordinateur.' }, { question: 'Pourquoi connaître les composants est utile ?', options: ['Parce qu’on peut mieux diagnostiquer le symptôme et choisir la bonne piste de dépannage.', 'Parce que cela remplace l’aide d’un professionnel.', 'Parce qu’il n’y a plus besoin de connectique.', 'Parce que ça rend chaque machine identique.'], answer: 0, explanation: 'La connaissance des composants aide à localiser la cause probable d’un dysfonctionnement.' }] }] },
        { label: 'Semaine 2', title: 'Périphériques, logiciels et systèmes d’exploitation', sessions: [{ title: 'Périphériques et logiciels', objective: 'Relier le matériel et les logiciels dans une logique de fonctionnement.', explanation: 'Les périphériques comme le clavier, la souris, le moniteur ou l’imprimante interagissent avec le système d’exploitation. Les logiciels dépendent eux aussi de la configuration matérielle. Une bonne compréhension de ces relations permet de poser les bonnes questions lors d’un dépannage.', exercise: 'Fais une liste de 6 périphériques et indique si chacun est un périphérique d’entrée, de sortie ou mixte.', resource: { title: 'Catalogue Cisco pour les cours informatiques', url: 'https://www.netacad.com/catalogs/learn', language: 'Français et anglais', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quelle est la différence entre un périphérique d’entrée et de sortie ?', options: ['L’entrée transmet des informations au système ; la sortie les affiche ou les envoie vers l’utilisateur.', 'Ils sont toujours identiques.', 'La sortie contrôle seulement le clavier.', 'L’entrée remplace les logiciels.'], answer: 0, explanation: 'Les dispositifs d’entrée envoient de l’information au système ; les dispositifs de sortie la restituent à l’utilisateur.' }, { question: 'Que faut-il vérifier si un ordinateur ne s’allume pas ?', options: ['L’alimentation, le câble et la prise, puis les voyants de démarrage.', 'Le nom de l’écran.', 'Le système d’exploitation uniquement.', 'Le type de bureau.'], answer: 0, explanation: 'Un diagnostic de départ passe souvent par les points d’alimentation et les éléments visibles de démarrage.' }] }] },
        { label: 'Semaine 3', title: 'Méthode de diagnostic et dépannage sans risque', sessions: [{ title: 'Détecter les symptômes et poser les bonnes questions', objective: 'Suivre une logique de diagnostic claire et sûre.', explanation: 'Le dépannage commence par décrire précisément le symptôme, vérifier les signes visibles, puis tester les hypothèses. L’important est de ne pas ouvrir des boîtiers ni manipuler des composants non sécurisés sans qualification. La méthode aide à limiter les erreurs et à communiquer clairement avec l’utilisateur.', exercise: 'Rédige un mini dialogue de dépannage : une personne explique un problème, tu poses 4 questions utiles puis proposes une première piste.', resource: { title: 'Cisco IT Essentials', url: 'https://www.netacad.com/courses/it-essentials/courses?courseLang=en-US', language: 'Anglais', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi faut-il décrire le symptôme avant de proposer une solution ?', options: ['Parce que le même symptôme peut avoir plusieurs causes.', 'Parce que c’est plus rapide à ignorer.', 'Parce qu’il n’y a qu’une cause possible.', 'Parce que c’est inutile.'], answer: 0, explanation: 'Une bonne description permet d’évaluer les hypothèses et de valider le bon axe de diagnostic.' }, { question: 'Que faut-il éviter lors d’un diagnostic ?', options: ['Les manipulations dangereuses ou non encadrées sur des composants électriques ou mécaniques.', 'Les questions utiles.', 'La vérification des branchements.', 'La documentation des étapes.'], answer: 0, explanation: 'La sécurité et les limites de compétences doivent guider les actions de dépannage.' }] }] },
        { label: 'Semaine 4', title: 'Entretien préventif, documentation et communication', sessions: [{ title: 'Prévention et communication avec l’utilisateur', objective: 'Documenter le problème et transmettre une solution claire.', explanation: 'Le maintenance préventive repose sur l’entretien régulier, la vérification des câbles, le nettoyage, les mises à jour et la documentation. La communication avec l’utilisateur accompagne le diagnostic : expliquer l’état du matériel, les limites et les étapes de vérification aide à rassurer et à éviter les erreurs.', exercise: 'Crée une fiche de diagnostic d’un problème informatique courant (par ex. écran noir, ordinateur lent ou son absent) avec symptômes, vérifications et conclusion.', resource: { title: 'Catalogue Cisco pour les cours informatiques', url: 'https://www.netacad.com/catalogs/learn', language: 'Français et anglais', source: 'Cisco Networking Academy' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi la documentation est-elle importante ?', options: ['Elle aide à garder une trace des symptômes, vérifications et solutions.', 'Elle supprime la nécessité de vérifier.', 'Elle évite toute manipulation de matériel.', 'Elle rend les problèmes impossibles à comprendre.'], answer: 0, explanation: 'La documentation aide à faire le lien entre le symptôme, la vérification et l’action corrective.' }, { question: 'Quelle attitude est utile pour accompagner un utilisateur ?', options: ['Expliquer clairement ce qui est observé, ce qu’on vérifie et ce qu’on choisit de faire.', 'Ne rien dire pour ne pas inquiéter.', 'Ne pas poser de questions.', 'Ignorer le problème.'], answer: 0, explanation: 'Une explication claire aide le public à comprendre la situation et les étapes de diagnostic.' }] }] }
      ],
      project: 'Créer une fiche de diagnostic d’un problème informatique courant, avec symptômes, vérifications, hypothèses et recommandations de sécurité et de communication.'
    },
    python: {
      eyebrow: 'INFORMATIQUE · PYTHON',
      title: 'Programmation avec Python',
      overview: 'Découvrir le code, les variables, la logique et la création de petits projets personnels.',
      description: 'Tu apprendras les bases du langage Python : variables, conditions, boucles, fonctions, listes et codes simples. Le parcours vise à développer une logique de programmation sans pression, avec des exercices progressifs et des projets simples.',
      skills: ['Écrire des scripts simples', 'Utiliser des variables et des boucles', 'Créer un petit programme autonome'],
      prerequisites: ['Aucune expérience de programmation préalable.', 'Un ordinateur et un environnement Python de base.'],
      equipment: ['Ordinateur avec Python installé ou une plateforme de test', 'Éditeur de texte ou IDE simple', 'Connexion Internet pour les ressources'],
      weeklyTime: '2 heures par semaine',
      resources: [
        { title: 'Python.org, commencer avec Python', url: 'https://www.python.org/about/gettingstarted/', language: 'Anglais', source: 'Python Software Foundation' },
        { title: 'Guide débutant Python', url: 'https://wiki.python.org/moin/BeginnersGuide', language: 'Anglais', source: 'Python Wiki' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Instructions, affichage, variables et nombres', sessions: [{ title: 'Premiers programmes Python', objective: 'Écrire un petit script et comprendre les variables.', explanation: 'Python est un langage lisible et adapté aux débutants. Une variable sert à mémoriser des informations comme un nom, un nombre ou un texte. L’affichage permet de faire réagir le programme et de vérifier le résultat.', exercise: 'Écris un script qui affiche ton prénom et un nombre de 3 chiffres.', resource: { title: 'Python.org, commencer avec Python', url: 'https://www.python.org/about/gettingstarted/', language: 'Anglais', source: 'Python Software Foundation' }, video: 'Vidéo à vérifier', quiz: [{ question: 'À quoi sert une variable en Python ?', options: ['Mémoriser une valeur que le programme peut réutiliser.', 'Supprimer le code.', 'Afficher uniquement le texte.', 'Remplacer un navigateur.'], answer: 0, explanation: 'Les variables stockent des données et permettent de les réutiliser dans le script.' }, { question: 'Comment afficher une information en Python ?', options: ['Avec print().', 'Avec ouvrir().', 'Avec dossier().', 'Avec wifi().'], answer: 0, explanation: 'print() affiche le texte ou la valeur demandée.' }] }] },
        { label: 'Semaine 2', title: 'Conditions et boucles', sessions: [{ title: 'Décider et répéter', objective: 'Utiliser des conditions et des boucles pour faire agir le programme.', explanation: 'Les conditions rendent un programme capable de choisir selon une situation. Les boucles répètent une action plusieurs fois. La logique de décision est centrale dans l’apprentissage de la programmation.', exercise: 'Écris un programme qui dit bonjour 5 fois et qui change le message si le nombre est pair ou impair.', resource: { title: 'Guide débutant Python', url: 'https://wiki.python.org/moin/BeginnersGuide', language: 'Anglais', source: 'Python Wiki' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que fait une boucle ?', options: ['Elle répète des instructions plusieurs fois.', 'Elle affiche uniquement une fois.', 'Elle supprime les variables.', 'Elle remplace l’éditeur de texte.'], answer: 0, explanation: 'Les boucles automatisent des répétitions utiles dans un programme.' }, { question: 'À quoi sert une condition ?', options: ['À décider entre plusieurs chemins selon une situation.', 'À masquer les variables.', 'À ralentir le code sans raison.', 'À copier les fichiers.'], answer: 0, explanation: 'Les conditions permettent de différencier plusieurs comportements possibles.' }] }] },
        { label: 'Semaine 3', title: 'Fonctions, listes, dictionnaires et erreurs simples', sessions: [{ title: 'Organiser le code', objective: 'Structurer les instructions et manipuler des collections d’informations.', explanation: 'Une fonction rassemble un ensemble d’instructions qui peuvent être réutilisées. Les listes et dictionnaires servent à stocker plusieurs éléments, ce qui aide à organiser des données comme des nœuds de données ou des résultats.', exercise: 'Crée un mini quiz en console avec une liste de questions et une liste de réponses. Utilise une fonction pour afficher une question.', resource: { title: 'Python.org, commencer avec Python', url: 'https://www.python.org/about/gettingstarted/', language: 'Anglais', source: 'Python Software Foundation' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi utiliser une fonction ?', options: ['Pour regrouper des instructions réutilisables.', 'Pour remplacer les variables.', 'Pour vider la mémoire.', 'Pour compresser le clavier.'], answer: 0, explanation: 'Les fonctions permettent de réutiliser une série d’actions sans recopier le code.' }, { question: 'Qu’est-ce qu’une liste ?', options: ['Une structure qui contient plusieurs valeurs dans un ordre donné.', 'Une commande système.', 'Un navigateur web.', 'Un réseau sans fil.'], answer: 0, explanation: 'Les listes stockent de nombreuses valeurs et sont utiles pour gérer des données en série.' }] }] },
        { label: 'Semaine 4', title: 'Organisation, tests et explication du code', sessions: [{ title: 'Écrire un code plus clair', objective: 'Améliorer la compréhension, les tests et la qualité du script.', explanation: 'Un bon programme n’est pas seulement fonctionnel : il doit être lisible, organisé et testable. Les commentaires, le nom des variables et les petits essais aident à comprendre le code. Une erreur n’est pas un échec, c’est un signal utile.', exercise: 'Améliore un script de base en ajoutant des commentaires, un nom plus clair aux variables et une vérification sur un cas limite.', resource: { title: 'Guide débutant Python', url: 'https://wiki.python.org/moin/BeginnersGuide', language: 'Anglais', source: 'Python Wiki' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi tester un script est-il utile ?', options: ['Pour vérifier qu’il se comporte comme prévu et corriger les erreurs.', 'Parce que le code ne doit pas être relu.', 'Parce que les programmes fonctionnent sans tests.', 'Parce que cela remplace l’écriture du code.'], answer: 0, explanation: 'Les tests aident à repérer les erreurs et à valider le comportement du programme.' }, { question: 'Que signifie une erreur de code ?', options: ['Un signal utile permettant de corriger un détail ou une logique.', 'Une preuve de l’absence de logique.', 'La fin définitive du programme.', 'Un message que l’on ignore.'], answer: 0, explanation: 'Les erreurs sont généralement des indices utiles pour améliorer le script.' }] }] }
      ],
      project: 'Créer un mini quiz en console, un calculateur simple ou un gestionnaire de tâches pour débutants, puis expliquer comment il fonctionne.'
    },
    mobile: {
      eyebrow: 'INFORMATIQUE · ANDROID',
      title: 'Développement d’applications mobiles Android',
      overview: 'Découvrir le développement Android et les principes d’une application mobile simple.',
      description: 'Tu apprendras les bases de Kotlin, le modèle d’une application Android, la création d’une interface avec Jetpack Compose, et la logique de navigation et d’interaction. Le parcours est orienté débutant et pratique, sans nécessiter un profil avancé.',
      skills: ['Comprendre l’architecture d’une app Android', 'Créer un écran simple avec Compose', 'Tester une interface et la rendre plus accessible'],
      prerequisites: ['Aucune expérience Android préalable.', 'Ordinateur compatible et, si possible, Android Studio.'],
      equipment: ['Ordinateur compatible', 'Android Studio', 'Émulateur Android ou téléphone compatible'],
      weeklyTime: '2 à 3 heures par semaine',
      resources: [
        { title: 'Android Basics with Compose', url: 'https://developer.android.com/courses/android-basics-compose/course', language: 'Anglais', source: 'Android Developers' },
        { title: 'Formations Android Developers', url: 'https://developer.android.com/courses', language: 'Anglais', source: 'Android Developers' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Découvrir une application et les bases de Kotlin', sessions: [{ title: 'Qu’est-ce qu’une application Android ?', objective: 'Comprendre la structure d’une app et le rôle des fondations de Kotlin.', explanation: 'Une application Android est une interface qui permet aux utilisateurs d’interagir avec des fonctionnalités. Kotlin est le langage principal utilisé pour écrire ces applications. Une vue simple montre le rôle de l’interface et des composants.', exercise: 'Fais une liste des éléments d’une application mobile simple : écran, bouton, texte, action.', resource: { title: 'Android Basics with Compose', url: 'https://developer.android.com/courses/android-basics-compose/course', language: 'Anglais', source: 'Android Developers' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que représente une interface Android ?', options: ['Le visuel et les composants avec lesquels l’utilisateur interagit.', 'Le type de prise électrique.', 'Un fichier PDF.', 'Un serveur web.'], answer: 0, explanation: 'L’interface regroupe les éléments visibles et interactifs d’une application.' }, { question: 'Pourquoi Kotlin est-il important pour Android ?', options: ['Parce qu’il sert à écrire le code de l’application.', 'Parce qu’il remplace le système d’exploitation.', 'Parce qu’il est uniquement utilisé pour les cartes.', 'Parce qu’il remplace les boutons.'], answer: 0, explanation: 'Kotlin est le langage principal utilisé pour construire des applications Android.' }] }] },
        { label: 'Semaine 2', title: 'Créer un premier écran avec Jetpack Compose', sessions: [{ title: 'Créer un écran simple', objective: 'Construire une interface simple et lisible.', explanation: 'Jetpack Compose permet de décrire l’écran en déclarant des composants comme des textes, des boutons et des colonnes. L’idée n’est pas de faire une grande application dès le départ, mais d’apprendre à organiser une interface lisible et cohérente.', exercise: 'Dessine ou crée un écran avec un titre, un sous-titre et un bouton de base.', resource: { title: 'Android Basics with Compose', url: 'https://developer.android.com/courses/android-basics-compose/course', language: 'Anglais', source: 'Android Developers' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que permet de faire Jetpack Compose ?', options: ['Décrire l’interface avec des composants visuels.', 'Supprimer entièrement le code.', 'Créer des fichiers audio.', 'Faire fonctionner le réseau.'], answer: 0, explanation: 'Compose décrit visuellement les éléments de l’interface.' }, { question: 'Pourquoi les éléments d’écran doivent-ils être lisibles ?', options: ['Pour que l’utilisateur comprenne rapidement ce qu’il peut faire.', 'Pour la seule esthétique du code.', 'Parce que le système d’exploitation en a besoin.', 'Parce que cela réduit automatiquement le stockage.'], answer: 0, explanation: 'La lisibilité est un élément clé de l’expérience utilisateur mobile.' }] }] },
        { label: 'Semaine 3', title: 'Boutons, interactions et navigation', sessions: [{ title: 'Créer des actions', objective: 'Ajouter de petits éléments interactifs à l’interface.', explanation: 'Les boutons, interactions et navigation permettent de réagir aux actions de l’utilisateur : démarrer une action, afficher un texte ou passer d’un écran à l’autre. Une bonne application donne du sens aux éléments et garde une logique simple.', exercise: 'Crée une mini application avec un bouton et un texte qui change lorsqu’on l’appuie.', resource: { title: 'Formations Android Developers', url: 'https://developer.android.com/courses', language: 'Anglais', source: 'Android Developers' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que fait un bouton dans une application ?', options: ['Il déclenche une action ou un changement dans l’interface.', 'Il remplace le texte.', 'Il n’a aucun rôle.', 'Il sert à supprimer la page.'], answer: 0, explanation: 'Un bouton permet de déclencher une action pour l’utilisateur.' }, { question: 'Pourquoi presser le bouton doit-il avoir un effet visible ?', options: ['Parce que la personne doit comprendre ce qui s’est passé.', 'Parce que le bouton doit être caché.', 'Parce que cela n’a aucune importance.', 'Parce qu’il faut éviter toutes interactions.'], answer: 0, explanation: 'Un retour visible est important pour une bonne expérience mobile.' }] }] },
        { label: 'Semaine 4', title: 'Tester dans un émulateur et améliorer l’accessibilité', sessions: [{ title: 'Tester et rendre l’interface plus accessible', objective: 'Valider son interface sur émulateur et améliorer la compréhension.', explanation: 'Le test sur un émulateur facilite la vérification et l’ajustement. L’accessibilité, par exemple l’usage de tailles lisibles et d’éléments bien identifiés, aide les utilisateurs à profiter de l’application. L’accent se place sur la clarté et la simplicité.', exercise: 'Ouvre ton projet dans l’émulateur, vérifie la taille du texte et les libellés des boutons, puis corrige un point de clarté.', resource: { title: 'Android Basics with Compose', url: 'https://developer.android.com/courses/android-basics-compose/course', language: 'Anglais', source: 'Android Developers' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi tester dans un émulateur est-il utile ?', options: ['Pour vérifier la disposition et les interactions sans sortir de l’environnement de développement.', 'Pour sortir l’application du smartphone.', 'Pour supprimer les erreurs.', 'Pour rendre l’application inaccessible.'], answer: 0, explanation: 'Le test sur émulateur aide à vérifier l’écran et les interactions sur un environnement contrôlé.' }, { question: 'Pourquoi l’accessibilité est-elle importante ?', options: ['Parce qu’une application doit rester compréhensible et exploitable par le plus grand nombre.', 'Parce qu’elle n’a d’intérêt qu’en production.', 'Parce qu’elle remplace le design.', 'Parce qu’elle est facultative.'], answer: 0, explanation: 'Une interface accessible améliore la compréhension et l’usage pour beaucoup de personnes.' }] }] }
      ],
      project: 'Créer une petite application Android adaptée aux débutants, avec un écran simple, un bouton ou un formulaire, et un texte explicite pour guider l’utilisateur.'
    },
    databases: {
      eyebrow: 'INFORMATIQUE · BASES DE DONNÉES',
      title: 'Bases de données et SQL',
      overview: 'Découvrir les tables, les données et les requêtes qui permettent de les explorer.',
      description: 'Tu apprendras à organiser des informations, créer des tables, écrire des requêtes SQL et comprendre les relations entre les données. Les exemples seront fictifs et sécurisés.',
      skills: ['Créer une structure de données simple', 'Écrire des requêtes SELECT et INSERT', 'Comprendre les jointures et les relations'],
      prerequisites: ['Aucune connaissance SQL préalable.', 'Un intérêt pour l’organisation de l’information.'],
      equipment: ['Ordinateur', 'Connexion Internet pour les ressources', 'Base de données simple ou environnement de test'],
      weeklyTime: '2 heures par semaine',
      resources: [
        { title: 'Tutoriel officiel PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial.html', language: 'Anglais', source: 'PostgreSQL' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Tables, lignes, colonnes et types de données', sessions: [{ title: 'Les bases de la structure des données', objective: 'Comprendre comment organiser des informations dans une table.', explanation: 'Une base de données regroupe des tables, chacune contenant des colonnes et des lignes. Les types de données indiquent ce qui peut être stocké : texte, nombre, date ou booléen. Une bonne structure sert à classer les informations utiles et éviter les erreurs.', exercise: 'Propose une table pour une bibliothèque fictive avec livre, auteur et catégorie.', resource: { title: 'Tutoriel officiel PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial.html', language: 'Anglais', source: 'PostgreSQL' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Qu’est-ce qu’une table dans une base de données ?', options: ['Une structure qui organise des informations sous forme de colonnes et lignes.', 'Un navigateur web.', 'Un écran d’ordinateur.', 'Un fichier texte sans organisation.'], answer: 0, explanation: 'Les tables organisent des données selon des colonnes et des lignes.' }, { question: 'À quoi sert un type de donnée ?', options: ['À dire quel type d’information est stocké dans une colonne.', 'À supprimer les lignes.', 'À cacher les tables.', 'À remplacer le code.'], answer: 0, explanation: 'Le type de données indique la nature de la valeur attendue : texte, nombre, date, etc.' }] }] },
        { label: 'Semaine 2', title: 'Premières requêtes SELECT, INSERT et WHERE', sessions: [{ title: 'Lire et enregistrer des données', objective: 'Comprendre les premières requêtes SQL utiles.', explanation: 'SELECT permet de lire des données. INSERT sert à ajouter des lignes. WHERE filtre les résultats selon une condition. Ces trois notions sont essentielles pour travailler avec des bases de données et questionner les informations organisées.', exercise: 'Écris des requêtes simples pour ajouter 2 livres et afficher ceux écrits par un auteur donné.', resource: { title: 'Tutoriel officiel PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial.html', language: 'Anglais', source: 'PostgreSQL' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que fait la commande SELECT ?', options: ['Elle lit les données stockées dans une table ou plusieurs tables.', 'Elle supprime la table.', 'Elle crée de nouveaux fichiers.', 'Elle change la couleur du site.'], answer: 0, explanation: 'SELECT sert à interroger les données existantes.' }, { question: 'À quoi sert la clause WHERE ?', options: ['À filtrer les lignes selon une condition.', 'À réécrire toute la table.', 'À supprimer les colonnes.', 'À démarrer le navigateur.'], answer: 0, explanation: 'WHERE permet de n’afficher que les lignes correspondant à une condition donnée.' }] }] },
        { label: 'Semaine 3', title: 'Relations, clés et jointures', sessions: [{ title: 'Relier les tables', objective: 'Comprendre la logique des relations entre données.', explanation: 'Les relations existent lorsque plusieurs tables partagent des informations. Les clés permettent d’identifier précisément une donnée. Les jointures réunissent les informations de plusieurs tables, ce qui est très utile pour des données cohérentes et lisibles.', exercise: 'Crée un mini schéma pour une bibliothèque avec livres et emprunteurs puis explique la jointure logique entre les deux tables.', resource: { title: 'Tutoriel officiel PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial.html', language: 'Anglais', source: 'PostgreSQL' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi utiliser une clé primaire ?', options: ['Pour identifier de manière unique chaque ligne d’une table.', 'Pour cacher les données.', 'Pour remplacer les colonnes.', 'Pour modifier la page web.'], answer: 0, explanation: 'Une clé primaire sert à distinguer chacun des enregistrements d’une table.' }, { question: 'Que fait une jointure ?', options: ['Elle associe des lignes de plusieurs tables selon une logique commune.', 'Elle vide la table.', 'Elle copie les valeurs dans un fichier texte.', 'Elle ouvre un navigateur.'], answer: 0, explanation: 'Les jointures relient des informations provenant de plusieurs tables pour mieux comprendre l’ensemble des données.' }] }] },
        { label: 'Semaine 4', title: 'Tri, regroupement et agrégation', sessions: [{ title: 'Analyser les données', objective: 'Découvrir comment trier et synthétiser des résultats.', explanation: 'ORDER BY permet de trier les résultats ; GROUP BY regroupe des lignes selon un critère ; COUNT, SUM ou AVG calculent des synthèses utiles. Ces outils sont précieux pour l’analyse et la compréhension locale des données.', exercise: 'Écris une requête qui compte le nombre de livres par catégorie dans une bibliothèque fictive.', resource: { title: 'Tutoriel officiel PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial.html', language: 'Anglais', source: 'PostgreSQL' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que fait ORDER BY ?', options: ['Il trie les résultats selon une colonne donnée.', 'Il supprime les données.', 'Il crée la table.', 'Il modifie l’interface utilisateur.'], answer: 0, explanation: 'ORDER BY permet de classer les données selon un critère défini.' }, { question: 'Pourquoi utiliser GROUP BY ?', options: ['Pour regrouper les lignes qui partagent une même valeur et calculer des synthèses.', 'Pour rendre le code invisible.', 'Pour afficher un simple mot.', 'Pour remplacer la date.'], answer: 0, explanation: 'GROUP BY est utile pour regrouper et agréger des informations.' }] }] }
      ],
      project: 'Créer le schéma d’une bibliothèque fictive et écrire quelques requêtes pour rechercher des informations, trier les résultats et comprendre les relations entre les tables.'
    },
    data: {
      eyebrow: 'INFORMATIQUE · IA',
      title: 'Données et intelligence artificielle',
      overview: 'Comprendre les données, les graphiques, les modèles simples et les limites de l’intelligence artificielle.',
      description: 'Tu découvres comment les données sont structurées, exploitées et interprétées. Le parcours met l’accent sur la compréhension, la visualisation, la classification, les biais et les limites des modèles d’IA, sans prétendre enseigner une expertise avancée.',
      skills: ['Identifier les données et leurs usages', 'Créer un graphique simple', 'Comprendre les concepts de base de l’IA'],
      prerequisites: ['Aucune connaissance en statistiques ou IA préalable.', 'Un intérêt pour les jeux de données, tableaux et graphiques.'],
      equipment: ['Ordinateur', 'Connexion Internet', 'Tableau ou feuille de calcul simple'],
      weeklyTime: '2 heures par semaine',
      resources: [
        { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', language: 'Anglais', source: 'Google' },
        { title: 'Exercices Google MLCC', url: 'https://developers.google.com/machine-learning/crash-course/exercises', language: 'Anglais', source: 'Google' },
        { title: 'Présentation du cours Google MLCC', url: 'https://www.youtube.com/watch?v=SAUeGtyLsrk', language: 'Anglais', source: 'YouTube' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Comprendre les données, variables et questions d’analyse', sessions: [{ title: 'Le point de départ : les données', objective: 'Comprendre ce qu’est un jeu de données et quelles questions il permet de répondre.', explanation: 'Les données sont des informations structurées, comme des nombres, des catégories ou des textes. Une question de données permet de définir ce que l’on cherche à comprendre. Sans question claire, il est difficile de donner du sens à un ensemble de données.', exercise: 'Choisis un petit sujet comme les goûts de musique, les températures ou les films, puis formule 3 questions d’analyse.', resource: { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', language: 'Anglais', source: 'Google' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que sont les données ?', options: ['Des informations structurées qui servent à poser et répondre à une question.', 'Des logiciels informatiques.', 'Des fichiers de sécurité.', 'Des éléments de réseau.'], answer: 0, explanation: 'Les données sont des informations qui peuvent être collectées, organisées et interprétées.' }, { question: 'Pourquoi formuler une question claire est important ?', options: ['Parce que cela oriente le type de données à utiliser et la manière de les interpréter.', 'Parce que cela évite toute utilisation d’outils.', 'Parce que les données sont toujours évidentes.', 'Parce que cela remplace la visualisation.'], answer: 0, explanation: 'Une bonne question aide à choisir les données pertinentes et à mesurer ce qu’on veut comprendre.' }] }] },
        { label: 'Semaine 2', title: 'Lire un tableau, créer un graphique et interpréter des résultats', sessions: [{ title: 'Visualiser les données', objective: 'Transformer un tableau en compréhension visuelle.', explanation: 'Un graphique aide à lire des tendances, des différences ou des distributions. Les labels, l’échelle et l’ordre des catégories sont importants : un graphisme mal choisi peut donner une mauvaise impression. L’objectif est de donner une lecture claire et honnête des données.', exercise: 'Crée un petit tableau avec 5 lignes et un graphique sur papier ou dans un tableur simple.', resource: { title: 'Exercices Google MLCC', url: 'https://developers.google.com/machine-learning/crash-course/exercises', language: 'Anglais', source: 'Google' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi un graphique peut-il être utile ?', options: ['Il rend plus visible une tendance ou une comparaison.', 'Il remplace la compréhension des données.', 'Il supprime la nécessité de poser une question.', 'Il est toujours plus précis qu’un tableau.'], answer: 0, explanation: 'Un graphique permet de voir rapidement des différences et des tendances.' }, { question: 'Quel point est important lorsqu’on lit un graphique ?', options: ['Le titre, les axes, les unités et la logique de comparaison.', 'Le nombre de couleurs uniquement.', 'La taille de l’écran.', 'Le nom du fichier.'], answer: 0, explanation: 'Un bon graphique doit être lisible et interprétable avec les bons éléments de contexte.' }] }] },
        { label: 'Semaine 3', title: 'Données d’entraînement, prédiction, classification et erreurs', sessions: [{ title: 'Prévision et classification', objective: 'Comprendre le rôle des données d’entraînement dans un modèle simple.', explanation: 'Un modèle d’IA apprend à partir d’exemples. Les données d’entraînement servent à identifier des régularités, puis à faire des prédictions ou classer des cas. Les erreurs ne sont pas un échec total : elles montrent ce que le modèle n’a pas bien appris.', exercise: 'Prenez 10 exemples de données simples et expliquez comment un modèle pourrait les classer ou les prédire.', resource: { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', language: 'Anglais', source: 'Google' }, video: 'Vidéo à vérifier', quiz: [{ question: 'À quoi servent les données d’entraînement ?', options: ['À aider un modèle à reconnaître les règles présentes dans des exemples.', 'À supprimer les erreurs humaines.', 'À remplacer la compréhension humaine.', 'À rendre l’algorithme meilleur sans données.'], answer: 0, explanation: 'Les données d’entraînement permettent de construire un premier repérage de la logique du modèle.' }, { question: 'Que signifie une erreur de prédiction ?', options: ['Le modèle n’a pas suffisamment appris ou les données sont insuffisantes.', 'Le programme a cessé de fonctionner.', 'Un signal d’attaque numérique.', 'Un problème de clavier.'], answer: 0, explanation: 'Une erreur de prédiction indique souvent un manque de données ou de qualité de représentation.' }] }] },
        { label: 'Semaine 4', title: 'Biais, limites, confidentialité et vérification des résultats', sessions: [{ title: 'Interpréter sans surinterpréter', objective: 'Comprendre les limites des analyses et des modèles.', explanation: 'Les biais peuvent venir des données, de la manière de les collecter ou du contexte. La confidentialité et le respect des personnes comptent également. Une conclusion ou une prédiction doit être vérifiée avec prudence et ne doit pas être présentée comme infaillible.', exercise: 'Analyse un petit jeu de données fictif et indique 2 limites possibles de la conclusion.', resource: { title: 'Présentation du cours Google MLCC', url: 'https://www.youtube.com/watch?v=SAUeGtyLsrk', language: 'Anglais', source: 'YouTube' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi faut-il se méfier du mot « fiable » sans nuance ?', options: ['Parce que les modèles ont des limites, des biais et des erreurs possibles.', 'Parce que les modèles ne peuvent jamais être utilisés.', 'Parce que les données sont toujours parfaites.', 'Parce que la visualisation ne sert à rien.'], answer: 0, explanation: 'L’IA ne se réduit pas à un jugement infaillible : les limites doivent toujours être prises en compte.' }, { question: 'Qu’est-ce qui est important pour la confidentialité ?', options: ['Protéger les données personnelles et ne pas utiliser d’informations sensibles sans justification claire.', 'Tout publier publiquement.', 'Tout rendre anonyme par défaut.', 'Ne plus tenir compte des données utilisateur.'], answer: 0, explanation: 'La confidentialité exige une gestion responsable des données collectées et traitées.' }] }] }
      ],
      project: 'Analyser un petit jeu de données public ou fictif, présenter un graphique simple avec une conclusion claire et expliquer ses limites, son contexte et sa fiabilité.'
    },
    cloud: {
      eyebrow: 'INFORMATIQUE · CLOUD',
      title: 'Cloud computing',
      overview: 'Découvrir le cloud, ses modèles de service, sa sécurité et son coût.',
      description: 'Tu apprendras le rôle du cloud dans le calcul, le stockage, le réseau et la sécurité, ainsi que la manière de concevoir une petite architecture de services. Le parcours insiste sur des services gratuits ou éducationnels et sur la compréhension des coûts.',
      skills: ['Différencier le cloud et un ordinateur local', 'Identifier les services de base', 'Concevoir une architecture simple'],
      prerequisites: ['Aucune connaissance du cloud nécessaire.', 'Un intérêt pour les services en ligne et les architectures de services.'],
      equipment: ['Ordinateur', 'Connexion Internet', 'Documentation des services cloud public ou niveau gratuit'],
      weeklyTime: '2 heures par semaine',
      resources: [
        { title: 'Microsoft Learn, formations Azure', url: 'https://learn.microsoft.com/en-us/training/azure', language: 'Anglais', source: 'Microsoft Learn' },
        { title: 'Microsoft Azure Fundamentals', url: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/', language: 'Anglais', source: 'Microsoft Learn' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Notions de cloud et comparaison avec un ordinateur local', sessions: [{ title: 'Le cloud, expliqué simplement', objective: 'Comprendre ce que le cloud apporte par rapport à un ordinateur local.', explanation: 'Le cloud permet d’utiliser des services informatiques à distance, souvent hébergés chez un fournisseur. Il fait appel à des serveurs partagés, des réseaux et des outils de gestion pour fournir de la puissance ou du stockage sans posséder tout le matériel chez soi.', exercise: 'Comparez un ordinateur portable d’un côté et un service cloud d’un autre : quel est le gain et la limite de chacun ?', resource: { title: 'Microsoft Learn, formations Azure', url: 'https://learn.microsoft.com/en-us/training/azure', language: 'Anglais', source: 'Microsoft Learn' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Qu’est-ce que le cloud ?', options: ['Des services informatiques accessibles via un réseau plutôt que sur un ordinateur local.', 'Une carte spécifique à un navigateur.', 'Un clavier sans fil.', 'Un élément de sécurité physique.'], answer: 0, explanation: 'Le cloud désigne des services informatiques offerts à distance et exploités via réseau.' }, { question: 'Pourquoi compare-t-on le cloud à un ordinateur local ?', options: ['Pour comprendre les différences de coût, de contrôle, de maintenance et d’accès.', 'Parce qu’ils sont toujours identiques.', 'Parce que l’un remplace forcément l’autre.', 'Parce que le cloud ne nécessite pas de réseau.'], answer: 0, explanation: 'Le cloud et un ordinateur local ont des forces et limites différentes selon le besoin.' }] }] },
        { label: 'Semaine 2', title: 'Calcul, stockage, réseau et bases de données', sessions: [{ title: 'Les services de base', objective: 'Identifier les briques d’une architecture cloud simple.', explanation: 'Les services cloud incluent souvent du calcul, du stockage, du réseau et des bases de données. Le but n’est pas de tout maîtriser, mais de comprendre que ces services sont séparés et qu’ils collaborent pour servir une application.', exercise: 'Dessinez une architecture simple : un site web, une base de données et un stockage de fichiers.', resource: { title: 'Microsoft Azure Fundamentals', url: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/', language: 'Anglais', source: 'Microsoft Learn' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Quel type de service cloud est souvent utilisé pour héberger une application ?', options: ['Un service de calcul ou d’hébergement d’application.', 'Un lecteur de musique.', 'Une clé USB.', 'Un système d’exploitation mobile.'], answer: 0, explanation: 'Le calcul cloud fournit la puissance nécessaire pour exécuter des services ou applications.' }, { question: 'Pourquoi séparer stockage et base de données ?', options: ['Parce qu’ils remplissent des rôles différents dans une architecture.', 'Parce qu’ils ne peuvent pas être utilisés ensemble.', 'Parce que l’un remplace l’autre.', 'Parce que la base de données n’a pas besoin de données.'], answer: 0, explanation: 'Les services distincts permettent une meilleure organisation, sécurité et évolutivité.' }] }] },
        { label: 'Semaine 3', title: 'Identité, permissions, sécurité et coûts', sessions: [{ title: 'Sécurité et gestion du cloud', objective: 'Comprendre les rôles, permissions et coût d’un environnement cloud.', explanation: 'Les services cloud s’appuient sur des comptes, des identités et des permissions. L’accès doit être bien géré pour éviter l’ouverture inutile de données. Les coûts sont également un point essentiel : les ressources facturent parfois selon l’usage, il faut donc surveiller les services activés.', exercise: 'Dressez une liste des permissions ou rôles que vous auriez besoin pour une application fictive assez simple.', resource: { title: 'Microsoft Learn, formations Azure', url: 'https://learn.microsoft.com/en-us/training/azure', language: 'Anglais', source: 'Microsoft Learn' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Que représente une permission dans le cloud ?', options: ['Le droit d’accéder à une ressource ou d’effectuer une action donnée.', 'La taille d’un fichier.', 'Le nom d’un bouton.', 'Le design d’une page.'], answer: 0, explanation: 'Les permissions guident quels utilisateurs ou services peuvent accéder à quoi.' }, { question: 'Pourquoi les coûts du cloud doivent-ils être compris ?', options: ['Parce que certains services et ressources peuvent être facturés selon leur utilisation.', 'Parce qu’il n’y a jamais de coût.', 'Parce que le cloud est uniquement gratuit.', 'Parce que cela ne concerne que les grands projets.'], answer: 0, explanation: 'Les ressources cloud peuvent entraîner des coûts selon la consommation, le stockage ou le fonctionnement.' }] }] },
        { label: 'Semaine 4', title: 'Concevoir une architecture simple et la documenter', sessions: [{ title: 'Réaliser une architecture cloud simple', objective: 'Appliquer les connaissances à une petite architecture de service.', explanation: 'Le design d’une architecture cloud part d’un besoin simple : un site web ou une API, un stockage de données, une base de données et parfois une couche de sécurité. Le point clé est la clarté du schéma, pas la complexité artificielle.', exercise: 'Dessinez l’architecture d’une application fictive telle qu’un blog ou un portail simple, en indiquant les services essentiels et leur rôle.', resource: { title: 'Microsoft Azure Fundamentals', url: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/', language: 'Anglais', source: 'Microsoft Learn' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi documenter une architecture cloud est important ?', options: ['Pour expliquer les services, les rôles et la logique du système de manière claire.', 'Parce que le code va se décrire tout seul.', 'Parce que ce n’est pas utile.', 'Parce que le code ne doit pas être lu.'], answer: 0, explanation: 'La documentation aide à comprendre le système et à éviter les erreurs de conception.' }, { question: 'Que faut-il éviter dans le cloud ?', options: ['Activer des services ou des accès coûteux ou inutilement ouverts sans raison.', 'Tout activer pour sécuriser le système.', 'Tout désactiver pour simplifier.', 'Ne jamais utiliser d’authentification.'], answer: 0, explanation: 'Le bon usage du cloud privilégie la sécurité, la compréhension et l’anticipation des coûts.' }] }] }
      ],
      project: 'Dessiner l’architecture d’une application fictive hébergée dans le cloud, expliquer les services utilisés, les éléments de sécurité et les coûts ou besoins de compte associés, sans activer de service payant.'
    },
    devops: {
      eyebrow: 'INFORMATIQUE · DEVOPS',
      title: 'DevOps, Git et conteneurs',
      overview: 'Découvrir le contrôle de versions, les dépôts, les conteneurs et la publication d’un petit projet.',
      description: 'Tu apprendras à organiser un projet avec Git, à publier du code avec GitHub et à comprendre les bases des conteneurs Docker. Le parcours met l’accent sur les bonnes pratiques, sans imposer un environnement coûteux ou un service payant.',
      skills: ['Utiliser Git de manière simple', 'Publier un petit projet avec GitHub', 'Comprendre les conteneurs de base'],
      prerequisites: ['Aucune connaissance Git ou Docker préalable.', 'Un ordinateur, un système de fichiers et un accès Internet.'],
      equipment: ['Ordinateur', 'Git installé', 'GitHub ou un dépôt en ligne de test', 'Docker seulement si l’environnement le permet'],
      weeklyTime: '2 heures par semaine',
      resources: [
        { title: 'GitHub Skills, cours interactifs', url: 'https://skills.github.com/', language: 'Anglais', source: 'GitHub Skills' },
        { title: 'Docker, parcours débutant', url: 'https://docs.docker.com/learn/paths/get-started-with-docker-containers/', language: 'Anglais', source: 'Docker Docs' }
      ],
      weeks: [
        { label: 'Semaine 1', title: 'Contrôle de versions et utilité de Git', sessions: [{ title: 'Comprendre Git', objective: 'Identifier le rôle du contrôle de versions et des commits.', explanation: 'Git sert à enregistrer les changements d’un projet dans le temps. Chaque modification peut être suivie, comparée, retirée ou revue. Les commits permettent de garder un historique et de collaborer plus facilement.', exercise: 'Crée un petit dossier de projet et explique la différence entre un fichier modifié et un fichier enregistré avec un commit.', resource: { title: 'GitHub Skills, cours interactifs', url: 'https://skills.github.com/', language: 'Anglais', source: 'GitHub Skills' }, video: 'Vidéo à vérifier', quiz: [{ question: 'À quoi sert Git ?', options: ['À suivre l’histoire des changements d’un projet et à revenir en arrière si besoin.', 'À supprimer les dossiers.', 'À remplacer le système d’exploitation.', 'À créer des images uniquement.'], answer: 0, explanation: 'Git garde une trace des modifications d’un projet et permet de retrouver un état précédent.' }, { question: 'Que représente un commit ?', options: ['Une sauvegarde ponctuelle d’un ensemble de changements.', 'Une page web.', 'Une erreur de système.', 'Une adresse réseau.'], answer: 0, explanation: 'Le commit enregistre un instant de travail avec son contenu et ses changements.' }] }] },
        { label: 'Semaine 2', title: 'Dépôt GitHub, commits et README', sessions: [{ title: 'Publier son projet', objective: 'Comprendre le rôle d’un dépôt et d’un README clair.', explanation: 'GitHub permet de stocker un dépôt en ligne, de partager des projets et de suivre les changements. Un README aide à expliquer le projet, son utilisation et son objectif à toute personne qui le découvre.', exercise: 'Crée un README simple pour un petit projet et note son but, son usage et ses fichiers clés.', resource: { title: 'GitHub Skills, cours interactifs', url: 'https://skills.github.com/', language: 'Anglais', source: 'GitHub Skills' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi un README est-il utile ?', options: ['Parce qu’il donne le contexte, le but et le lancement du projet.', 'Parce qu’il remplace le code.', 'Parce qu’il supprime les modifications.', 'Parce qu’il la rend visible par tout le monde.'], answer: 0, explanation: 'Un README aide à comprendre rapidement un projet sans avoir à lire tout le code.' }, { question: 'Que permet un dépôt distant ?', options: ['Publier, partager et conserver le projet en ligne.', 'Il remplace tous les fichiers locaux.', 'Il annule les commits.', 'Il rend le code illisible.'], answer: 0, explanation: 'Un dépôt distant sert à stocker, partager et gérer le projet dans un espace en ligne.' }] }] },
        { label: 'Semaine 3', title: 'Images et conteneurs avec les premières activités Docker', sessions: [{ title: 'Les conteneurs comme environnement portable', objective: 'Comprendre le rôle des conteneurs et des images.', explanation: 'Un conteneur regroupe une application et ses dépendances dans un environnement portable. Docker aide à construire et lancer ce conteneur de façon reproductible. L’objectif est de comprendre le concept, pas de maîtriser toute l’écosystème Docker.', exercise: 'Expliquez en 5 lignes la différence entre un projet local et un conteneur qui le lance.', resource: { title: 'Docker, parcours débutant', url: 'https://docs.docker.com/learn/paths/get-started-with-docker-containers/', language: 'Anglais', source: 'Docker Docs' }, video: 'Vidéo à vérifier', quiz: [{ question: 'À quoi sert Docker ?', options: ['À exécuter des applications dans des conteneurs reproductibles.', 'À écrire du HTML.', 'À remplacer Git.', 'À lister les fichiers uniquement.'], answer: 0, explanation: 'Docker permet d’isoler des applications et leurs dépendances dans un conteneur.' }, { question: 'Pourquoi les conteneurs sont-ils utiles ?', options: ['Ils aident à reproduire l’environnement d’exécution de manière plus fiable.', 'Ils remplacent toujours le code source.', 'Ils empêchent toute modification.', 'Ils suppriment les dépendances.'], answer: 0, explanation: 'Les conteneurs standardisent l’environnement et rendent les déploiements plus cohérents.' }] }] },
        { label: 'Semaine 4', title: 'Documentation du lancement d’une petite application', sessions: [{ title: 'Documenter et publier une petite application', objective: 'Rassembler les éléments clés pour rendre un projet compréhensible et exécutable.', explanation: 'Un projet prêt à partager a besoin d’un README, d’une description claire et d’un historique de changements. Ajouter un conteneur est utile si l’environnement le permet et si cela aide à lancer le projet de manière reproductible. La documentation doit rester claire et honnête.', exercise: 'Rédigez un mini README pour votre projet avec la description, les commandes de lancement, et la manière de le lancer en local ou dans un conteneur.', resource: { title: 'Docker, parcours débutant', url: 'https://docs.docker.com/learn/paths/get-started-with-docker-containers/', language: 'Anglais', source: 'Docker Docs' }, video: 'Vidéo à vérifier', quiz: [{ question: 'Pourquoi documenter la manière de lancer un projet est important ?', options: ['Parce que la personne qui le découvre doit savoir comment le démarrer et ce qu’il fait.', 'Parce que cela remplace le code.', 'Parce que le projet ne peut pas être publié.', 'Parce que les fichiers ne doivent pas être lus.'], answer: 0, explanation: 'La documentation facilite le lancement, la compréhension et le partage du projet.' }, { question: 'Quand ajouter un conteneur ?', options: ['Lorsque cela aide à reproduire l’environnement de façon fiable et qu’il est compatible avec le projet.', 'Toujours, sans vérification.', 'Jamais, pour ne pas changer la logique.', 'Seulement si le projet n’a pas de README.'], answer: 0, explanation: 'L’ajout d’un conteneur doit être utile et compatible : il ne s’impose pas automatiquement.' }] }] }
      ],
      project: 'Publier un petit projet avec un README clair et un historique de changements, puis ajouter un conteneur Docker uniquement si cela est adapté à l’environnement et au projet.'
    }
  };

  const pathwaySafetyNotes = {
    'metiers-techniques-industrie': 'Les exercices restent théoriques ou sur maquette papier. Ne manipule aucune installation, machine, outil dangereux ou système électrique sans formation, équipement et supervision qualifiés.',
    'agriculture-environnement': 'Les exercices ne demandent pas de manipuler machines, animaux, produits, aliments ou équipements dangereux. Toute activité de terrain doit respecter les consignes locales et être encadrée.',
    'sciences-ingenierie': 'N’effectue pas d’expérience avec des produits, outils ou appareils dangereux. Utilise une simulation ou un laboratoire encadré par une personne qualifiée.',
    'sante-accompagnement': 'Ce contenu est éducatif : il ne pose aucun diagnostic et ne recommande aucun traitement. Pour une situation réelle, contacte un professionnel ou service local compétent.',
    'droit-action-citoyenne': 'Les règles changent selon les pays et les situations. Ce parcours n’est pas un conseil juridique; vérifie les sources locales officielles ou consulte un service compétent.',
    'mobilite-accompagnement': 'Ces activités ne remplacent ni permis, ni règles locales, ni formation professionnelle. Ne pratique pas la conduite ou une opération réelle à partir de ce parcours seul.',
  };

  function topicWords(value) {
    const ignored = new Set(['avec', 'dans', 'pour', 'par', 'sur', 'des', 'les', 'une', 'aux', 'vers', 'après', 'avant', 'bases', 'cours', 'projet', 'premier', 'premiers', 'découvrir', 'appliquer', 'vérifier', 'présenter', 'et', 'du', 'de', 'la', 'le', 'un', 'en']);
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').match(/[a-z0-9]{3,}/g)?.filter(word => !ignored.has(word)) || [];
  }

  function chooseCourseResource(domain, topic, resources) {
    const keywords = [...new Set(topicWords(topic))];
    const threshold = keywords.length <= 2 ? 1 : 2;
    const ranked = resources.map(resource => {
      const searchable = new Set(topicWords(`${resource.title} ${resource.url}`));
      const score = keywords.filter(word => searchable.has(word)).length;
      return { resource, score };
    }).sort((left, right) => right.score - left.score);
    if (ranked[0]?.score >= threshold) return ranked[0].resource;
    const query = `${domain.name} ${topic} cours débutant ressource pédagogique`;
    return {
      title: `Recherche ciblée : ${domain.name} · ${topic}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      language: 'Résultats à vérifier', source: 'Recherche ciblée', isSearch: true,
    };
  }

  Object.entries(computerSpecialtyProfiles).forEach(([domainId, profile]) => {
    const domain = findDomain(domainId);
    if (!domain) return;
    profile.weeks.forEach(week => week.sessions.forEach(session => {
      session.resource = chooseCourseResource(domain, session.title || week.title, [session.resource, ...(profile.resources || [])].filter(Boolean));
    }));
  });

  const guidedDomainProfiles = Object.fromEntries(activeDomains
    .filter(domain => domain.id !== 'web' && !computerSpecialtyProfiles[domain.id])
    .map(domain => {
      const method = window.BesaPathwayMethods?.[domain.family];
      if (!method) return null;
      const domainTopics = window.BesaDomainTracks?.[domain.id] || method.weeks.map(week => week[0]);
      const resources = (domain.resources || []).filter(resource => /^https?:\/\//i.test(resource.url));
      const weeks = method.weeks.map(([title, explanation, exercise, question, options, answer, feedback], index) => {
        const topic = domainTopics[index] || title;
        const resource = chooseCourseResource(domain, topic, resources);
        const learningStages = [
          {
            title: `Découvrir : ${topic}`,
            objective: `Expliquer les notions essentielles de « ${topic} » dans le contexte de ${domain.name}.`,
            exercise: `Rédige une définition avec tes mots, puis donne un exemple simple lié à ${domain.name}. ${explanation}`,
            question: `Pour commencer à comprendre « ${topic} », quelle démarche est la plus adaptée ?`,
          },
          {
            title: `Mettre en pratique : ${topic}`,
            objective: `Appliquer « ${topic} » à un cas débutant et justifier tes choix.`,
            exercise: `${exercise} Utilise cette activité comme cas pratique sur « ${topic} » et note les étapes de ton raisonnement.`,
            question: `Dans un exercice débutant sur « ${topic} », quelle démarche aide à avancer de façon responsable ?`,
          },
          {
            title: `Vérifier et présenter : ${topic}`,
            objective: `Vérifier une démarche liée à « ${topic} », en expliquer les limites et présenter ce que tu as appris.`,
            exercise: `Prépare une courte fiche sur « ${topic} » : objectif, démarche, résultat ou constat, source consultée et une limite à garder en tête.`,
            question: `Avant de présenter ton travail sur « ${topic} », que faut-il faire ?`,
          },
        ];
        return {
          label: `Semaine ${index + 1}`, title: topic,
          sessions: learningStages.map(stage => ({
            title: stage.title,
            objective: stage.objective,
            explanation: `${explanation} Cette séance porte sur « ${topic} » en ${domain.name}. Vérifie les règles et informations propres à ton pays ou à ton contexte si nécessaire.`,
            exercise: stage.exercise, resource, video: '',
            quiz: [{ question: stage.question, options, answer, explanation: feedback }],
          })),
        };
      });
      return [domain.id, {
        title: domain.name,
        eyebrow: `${families.find(family => family.id === domain.family)?.name || 'Domaine'} · PARCOURS D’INITIATION`,
        overview: domain.description || `Découvrir les bases de ${domain.name}.`,
        description: `${domain.description || `Découvrir ${domain.name}.`} Ce parcours de quatre semaines suit une méthode adaptée à cette famille. Il propose des exercices d’initiation et ne remplace pas une qualification professionnelle.`,
        skills: method.skills, careers: method.careers,
        prerequisites: ['Aucun prérequis spécialisé pour cette initiation.', 'Curiosité et respect des règles propres au domaine.'],
        equipment: ['Papier et stylo ou un appareil connecté.', 'Aucun équipement spécialisé requis pour les activités proposées.'],
        weeklyTime: 'Environ 2 h 35 par semaine · 4 semaines · 12 cours',
        resources: resources.length ? resources : weeks.map(week => week.sessions[0].resource),
        weeks, project: `${method.project(domain.name)} Relie les étapes du projet aux thèmes du programme : ${domainTopics.join(' ; ')}.`, safetyNote: pathwaySafetyNotes[domain.family] || '', isGuidedIntro: true,
      }];
    }).filter(Boolean));

  activeDomains.forEach(domain => {
    if (guidedDomainProfiles[domain.id] || computerSpecialtyProfiles[domain.id]) domain.status = 'guided';
  });

  function getPathwayProfile(id) {
    return computerSpecialtyProfiles[id] || guidedDomainProfiles[id] || null;
  }

  const modules = [
    {
      id: 'explore',
      title: '1. Comprendre le web',
      description: 'Découvre comment une page arrive jusqu’à ton écran et prépare ton espace de création.',
      lessons: [
        {
          id: 'web-map', title: 'Une page web, du navigateur à l’écran', duration: 25,
          objective: 'Expliquer avec tes mots le rôle du navigateur, du site et du serveur.',
          explanation: 'Quand tu saisis une adresse, ton navigateur demande au serveur qui héberge le site de lui envoyer des fichiers. Le navigateur lit ces fichiers et affiche la page. Pour un premier site, tu écriras surtout du HTML pour le contenu, du CSS pour l’apparence et, plus tard, du JavaScript pour certaines interactions.',
          activity: 'Choisis un site que tu connais. Repère son adresse et dessine en trois étapes le trajet « adresse → demande → page affichée ». Indique ce que fait le navigateur.',
          resource: { title: 'Premiers pas sur le Web — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Getting_started/Your_first_website' },
          quiz: [
            { question: 'Quel est le rôle du navigateur dans cette histoire ?', options: ['Il affiche les fichiers reçus du site.', 'Il remplace toutes les pages du site.', 'Il écrit automatiquement le contenu à ta place.'], answer: 0, explanation: 'Le navigateur demande les fichiers du site puis les interprète pour afficher la page.' },
            { question: 'Quel langage décrit principalement le contenu et la structure d’une page ?', options: ['CSS', 'HTML', 'JavaScript'], answer: 1, explanation: 'HTML organise le contenu. CSS s’occupe de la présentation et JavaScript permet d’ajouter des comportements.' },
          ],
        },
        {
          id: 'web-first-site', title: 'Préparer son premier site', duration: 30,
          objective: 'Identifier les fichiers et les étapes nécessaires pour commencer un petit site.',
          explanation: 'Un site simple peut commencer avec un fichier HTML et un navigateur. Un éditeur de texte adapté au code rend l’écriture plus confortable, mais aucun compte ni logiciel payant n’est nécessaire pour comprendre les notions. Avance en petites étapes : planifier, écrire, enregistrer, ouvrir et corriger.',
          activity: 'Dans un carnet, écris le sujet de ta future page, son titre, trois informations à partager et une personne à qui elle pourrait servir.',
          resource: { title: 'Planifier ton site web — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Getting_started/Your_first_website/What_will_your_website_look_like' },
          quiz: [
            { question: 'Quelle est une bonne première étape avant d’écrire le code ?', options: ['Dessiner le contenu et le but de la page.', 'Acheter un serveur.', 'Apprendre plusieurs langages en même temps.'], answer: 0, explanation: 'Un petit plan aide à choisir le contenu utile avant de commencer à coder.' },
            { question: 'Pour ouvrir un fichier HTML local, quel outil est nécessaire ?', options: ['Un navigateur web.', 'Un compte sur un réseau social.', 'Une application payante obligatoire.'], answer: 0, explanation: 'Un navigateur courant peut afficher un fichier HTML enregistré sur ton appareil.' },
          ],
        },
        {
          id: 'web-setup', title: 'Créer et ouvrir un fichier HTML', duration: 35,
          objective: 'Enregistrer un fichier HTML puis l’ouvrir dans un navigateur.',
          explanation: 'Crée un fichier nommé « index.html » dans un dossier de projet. Le nom se termine par .html : cette extension indique le type de document. Après l’avoir enregistré, ouvre-le avec un navigateur. Modifie un mot, enregistre de nouveau et actualise la page pour voir le changement.',
          activity: 'Crée un fichier index.html avec un titre et un paragraphe. Enregistre-le, ouvre-le dans ton navigateur, puis change une phrase et actualise.',
          resource: { title: 'Installer les logiciels de base — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Getting_started/Environment_setup/Installing_software' },
          quiz: [
            { question: 'Quelle extension indique un fichier HTML ?', options: ['.html', '.image', '.webpage'], answer: 0, explanation: 'Les fichiers HTML utilisent l’extension .html, par exemple index.html.' },
            { question: 'Après avoir enregistré un changement, comment le voir dans le navigateur ?', options: ['Actualiser la page.', 'Supprimer le fichier.', 'Changer le nom du navigateur.'], answer: 0, explanation: 'En actualisant la page locale, le navigateur relit le fichier mis à jour.' },
          ],
        },
      ],
    },
    {
      id: 'structure', title: '2. Construire le contenu', description: 'Organise les informations avec du HTML clair et des éléments adaptés.', lessons: [
        {
          id: 'html-structure', title: 'Donner une structure à la page', duration: 35,
          objective: 'Créer une page avec un titre principal et des sections organisées.',
          explanation: 'Les éléments HTML décrivent le rôle du contenu. Une page bien structurée commence par un titre principal, puis des titres de section dans un ordre logique. Les balises indiquent au navigateur et aux technologies d’assistance comment les différentes parties s’articulent.',
          activity: 'Écris une page qui présente un sujet que tu aimes : un titre principal, deux titres de section et quelques phrases sous chaque titre.',
          resource: { title: 'Structurer le contenu HTML — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Structuring_content' },
          quiz: [
            { question: 'Combien de titres principaux h1 est-il préférable d’utiliser pour décrire le sujet d’une page ?', options: ['Un titre principal clair.', 'Un h1 pour chaque mot.', 'Aucun titre.'], answer: 0, explanation: 'Un h1 clair présente le sujet principal ; les titres suivants organisent les sections.' },
            { question: 'Pourquoi structurer le contenu avec des titres ?', options: ['Pour rendre l’ordre des idées compréhensible.', 'Pour remplacer les paragraphes par des images.', 'Pour cacher le contenu.'], answer: 0, explanation: 'Une hiérarchie de titres aide tout le monde à parcourir et comprendre la page.' },
          ],
        },
        {
          id: 'html-links-images', title: 'Ajouter des liens et des images utiles', duration: 35,
          objective: 'Créer un lien compréhensible et décrire une image informative.',
          explanation: 'Un lien doit annoncer clairement sa destination ou son action : « Lire le guide HTML » est plus explicite que « clique ici ». Une image qui transmet une information a besoin d’un texte alternatif concis. Une image purement décorative peut être ignorée par les technologies d’assistance.',
          activity: 'Ajoute un lien vers une ressource fiable sur ton sujet. Si ta page a une image informative, écris une courte description de ce qu’elle apporte.',
          resource: { title: 'Images en HTML — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Structuring_content/HTML_images' },
          quiz: [
            { question: 'Quel texte de lien aide le mieux à comprendre sa destination ?', options: ['Clique ici', 'Lire le guide HTML', 'Lien'], answer: 1, explanation: 'Un libellé précis annonce la destination sans obliger à deviner.' },
            { question: 'À quoi sert le texte alternatif d’une image informative ?', options: ['À communiquer son information essentielle.', 'À décorer le code source.', 'À ralentir le chargement.'], answer: 0, explanation: 'Le texte alternatif transmet la fonction ou l’information importante de l’image.' },
          ],
        },
        {
          id: 'html-semantics', title: 'Choisir les bons éléments HTML', duration: 30,
          objective: 'Distinguer titres, paragraphes, listes et éléments de navigation.',
          explanation: 'Choisir un élément selon le sens du contenu rend une page plus facile à parcourir. Utilise des titres pour les titres, des paragraphes pour le texte courant, une liste pour une série d’éléments et des liens pour aller ailleurs. Ces choix fournissent aussi des repères aux technologies d’assistance.',
          activity: 'Reprends ta page et transforme trois informations en une liste HTML. Vérifie que le titre de la liste annonce clairement son contenu.',
          resource: { title: 'Les bases du texte HTML — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs' },
          quiz: [
            { question: 'Quel élément convient à une suite d’éléments sans ordre particulier ?', options: ['Une liste ul avec des éléments li.', 'Un titre h1 pour chaque élément.', 'Un lien sans destination.'], answer: 0, explanation: 'Une liste non ordonnée ul regroupe des éléments li sans leur imposer un ordre.' },
            { question: 'Que décrit un élément HTML sémantique ?', options: ['Le rôle du contenu.', 'Uniquement sa couleur.', 'La vitesse du réseau.'], answer: 0, explanation: 'Le choix sémantique précise le rôle du contenu pour le navigateur et les personnes.' },
          ],
        },
      ],
    },
    {
      id: 'style', title: '3. Donner du style', description: 'Apprends à rendre la page agréable, lisible et adaptée aux petits écrans.', lessons: [
        {
          id: 'css-first-style', title: 'Relier une feuille de style CSS', duration: 30,
          objective: 'Relier un fichier CSS à la page et modifier quelques styles.',
          explanation: 'CSS décrit l’apparence des éléments HTML. Dans un fichier styles.css, un sélecteur vise un élément et des déclarations lui appliquent des styles. Relie le fichier à la page avec une balise link dans l’en-tête du document. Un navigateur applique alors les règles aux éléments ciblés.',
          activity: 'Crée styles.css et relie-le à ta page. Choisis une couleur de texte, une couleur de fond et une taille confortable pour le texte.',
          resource: { title: 'Premiers pas en CSS — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Styling_basics/Getting_started' },
          quiz: [
            { question: 'Quel est le rôle principal de CSS ?', options: ['Décrire la présentation visuelle.', 'Décrire uniquement les liens.', 'Remplacer le navigateur.'], answer: 0, explanation: 'CSS permet de définir les couleurs, tailles, espacements et mises en page.' },
            { question: 'Où la balise link vers styles.css se place-t-elle normalement ?', options: ['Dans head.', 'À l’intérieur du titre visible.', 'Après la fermeture du document.'], answer: 0, explanation: 'Le lien vers une feuille de style se place dans head afin que le navigateur la charge.' },
          ],
        },
        {
          id: 'css-layout', title: 'Couleurs, espacements et mise en page', duration: 40,
          objective: 'Améliorer la lisibilité à l’aide de règles CSS simples.',
          explanation: 'Les sélecteurs CSS ciblent des éléments HTML. Les propriétés comme color, background-color, margin et padding permettent de distinguer les zones et de laisser respirer le contenu. Vérifie le contraste entre le texte et son fond : une couleur jolie mais peu lisible rend la page difficile à utiliser.',
          activity: 'Ajoute de l’espace autour des sections et choisis des couleurs avec un contraste net. Relis le texte sur chaque fond.',
          resource: { title: 'Les bases de la mise en forme CSS — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Styling_basics' },
          quiz: [
            { question: 'Quelle propriété change la couleur du texte ?', options: ['color', 'padding', 'href'], answer: 0, explanation: 'color définit la couleur du texte ; padding règle l’espace intérieur.' },
            { question: 'Que faut-il vérifier pour que le texte reste lisible sur un fond ?', options: ['Le contraste des couleurs.', 'Le nombre de fichiers dans le dossier.', 'La présence d’une animation.'], answer: 0, explanation: 'Un contraste suffisant aide à lire le contenu dans des conditions variées.' },
          ],
        },
        {
          id: 'css-responsive', title: 'Adapter la page au téléphone', duration: 35,
          objective: 'Vérifier la page sur petit écran et éviter les débordements.',
          explanation: 'Une page doit rester utilisable sur de nombreuses largeurs d’écran. Commence par un contenu simple et fluide, laisse les blocs s’adapter à l’espace, puis teste une fenêtre étroite. Une requête média CSS peut ajuster une mise en page quand la largeur change ; elle ne remplace pas un test réel.',
          activity: 'Réduis la largeur de la fenêtre. Si un texte ou une image déborde, ajuste sa largeur et observe de nouveau le résultat.',
          resource: { title: 'Conception web adaptative — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/CSS_layout/Responsive_Design' },
          quiz: [
            { question: 'Comment vérifier simplement le début d’un rendu mobile ?', options: ['Réduire la largeur de la fenêtre et contrôler le contenu.', 'Supprimer toutes les règles CSS.', 'Ne tester que sur un écran large.'], answer: 0, explanation: 'Réduire la fenêtre révèle rapidement les éléments qui débordent ou deviennent illisibles.' },
            { question: 'À quoi sert une requête média CSS ?', options: ['Adapter certaines règles selon les caractéristiques de l’écran.', 'Envoyer un e-mail.', 'Créer un compte utilisateur.'], answer: 0, explanation: 'Les requêtes média permettent de changer une mise en page selon, par exemple, la largeur disponible.' },
          ],
        },
      ],
    },
    {
      id: 'interactions', title: '4. Ajouter des interactions', description: 'Découvre le JavaScript, puis vérifie la qualité de ton petit site.', lessons: [
        {
          id: 'js-first-steps', title: 'Découvrir JavaScript', duration: 40,
          objective: 'Comprendre le rôle de JavaScript et lire une instruction simple.',
          explanation: 'JavaScript est un langage qui peut ajouter des comportements aux pages web. Il complète HTML et CSS : son usage dépend du besoin. Dans le navigateur, un script peut réagir à une action, par exemple un clic sur un bouton, et modifier un texte. Commence par lire et modifier un petit exemple.',
          activity: 'Écris en toutes lettres ce que ton bouton devrait faire. Repère dans un exemple JavaScript la ligne qui sélectionne le bouton et celle qui réagit au clic.',
          resource: { title: 'Premiers pas en JavaScript — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Scripting/What_is_JavaScript' },
          quiz: [
            { question: 'Quel besoin JavaScript peut-il couvrir dans une page web ?', options: ['Réagir à un clic et mettre à jour un contenu.', 'Remplacer toujours HTML et CSS.', 'Fournir automatiquement un hébergement.'], answer: 0, explanation: 'JavaScript permet notamment de répondre aux actions et de modifier certains contenus.' },
            { question: 'Est-il obligatoire d’ajouter JavaScript à chaque page ?', options: ['Non, seulement si le projet en a besoin.', 'Oui, sans exception.', 'Oui, pour afficher du texte.'], answer: 0, explanation: 'Une page de contenu peut fonctionner sans JavaScript ; ajoute-le pour une interaction utile.' },
          ],
        },
        {
          id: 'js-events', title: 'Réagir à une action', duration: 40,
          objective: 'Décrire le lien entre un bouton, une action et un retour visible.',
          explanation: 'Une interaction utile part d’une action identifiable, comme le clic ou l’activation au clavier d’un bouton. Le script écoute l’événement puis réalise une action compréhensible. Prévois un retour visible et ne retire pas les comportements clavier natifs des éléments HTML.',
          activity: 'Sur papier, dessine le chemin de ton interaction : « je sélectionne le bouton → il se passe quoi ? → qu’est-ce que la personne voit ? ».',
          resource: { title: 'Événements — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Scripting/Events' },
          quiz: [
            { question: 'Un bouton utile doit pouvoir être activé comment ?', options: ['À la souris et au clavier.', 'Uniquement par un geste précis de souris.', 'Uniquement par un raccourci caché.'], answer: 0, explanation: 'Les boutons natifs sont utilisables au clavier comme au pointeur.' },
            { question: 'Après une action, pourquoi afficher un retour visible ?', options: ['Pour que la personne comprenne ce qui s’est passé.', 'Pour masquer le résultat.', 'Pour obliger à recommencer.'], answer: 0, explanation: 'Un retour clair confirme le résultat de l’action.' },
          ],
        },
        {
          id: 'web-quality', title: 'Vérifier et partager sa page', duration: 40,
          objective: 'Contrôler la navigation clavier, le rendu mobile et les liens avant de présenter la page.',
          explanation: 'La qualité ne se limite pas à l’apparence sur ton propre écran. Parcours les liens au clavier, vérifie que les libellés sont compréhensibles, contrôle la page sur petit écran et corrige les erreurs visibles. Demande à une autre personne si elle comprend facilement le but de la page. N’ajoute pas de données privées que tu ne souhaites pas partager.',
          activity: 'Utilise la liste de vérification du projet final. Présente ton site à une personne de confiance et note une amélioration à faire.',
          resource: { title: 'Accessibilité — MDN', url: 'https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Accessibility' },
          quiz: [
            { question: 'Quel test rapide vérifie l’accès clavier ?', options: ['Parcourir la page avec Tab et activer les commandes.', 'Vérifier uniquement la couleur du fond.', 'Masquer tous les liens.'], answer: 0, explanation: 'La touche Tab permet de vérifier l’ordre et la visibilité du focus clavier.' },
            { question: 'Avant de partager une page personnelle, que faut-il faire ?', options: ['Vérifier le contenu et retirer les informations privées inutiles.', 'Publier automatiquement toutes ses données.', 'Ignorer les liens.'], answer: 0, explanation: 'Relis la page, vérifie les liens et ne partage pas de renseignement personnel inutile.' },
          ],
        },
      ],
    },
  ];

  const lessons = modules.flatMap(module => module.lessons.map(lesson => ({ ...lesson, moduleId: module.id, moduleTitle: module.title })));
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const awards = {
    lesson: { xp: 20, coins: 5 },
    quiz: { xp: 10, coins: 3 },
    project: { xp: 40, coins: 12 },
  };
  const avatars = [
    { id: 'star', face: '✦', name: 'Étoile' },
    { id: 'sun', face: '☼', name: 'Soleil' },
    { id: 'leaf', face: '❋', name: 'Feuille' },
    { id: 'moon', face: '☾', name: 'Lune' },
    { id: 'book', face: '▤', name: 'Livre' },
    { id: 'spark', face: '✧', name: 'Étincelle' },
    { id: 'wave', face: '≈', name: 'Vague' },
    { id: 'compass', face: '⌖', name: 'Boussole' },
  ];
  const avatarColors = ['#b9d4ff', '#c5eadc', '#f3d9a4', '#ddcff2'];

  let state = defaultState();
  let currentRoute = 'book';
  let orientationAnswers = null;
  let selectedFilter = 'all';
  let searchTerm = '';
  let accountSession = null;
  let authMode = 'login';
  let mfaPending = null;
  let authPendingEmail = '';
  let syncTimer = null;
  let toastTimer = null;
  let focusTimerRemaining = 25 * 60;
  let focusTimerDuration = 25;
  let focusTimerInterval = null;

  function defaultState() {
    return {
      version: 3, domain: null, plan: 'flex', completed: [], quizAnswers: {}, quizResults: {}, specialtyProgress: {}, portfolio: [], savedResources: [],
      weeklyGoal: 3, activityDates: [],
      project: { checks: [], url: '', completed: false }, awards: [], xp: 0, coins: 0,
      avatar: { face: '✦', color: '#b9d4ff', accessory: null }, displayName: '',
      profile: { firstName: '', lastName: '', birthDate: '', interests: [], resourceLanguage: 'fr', theme: 'light', learningMode: 'guided', onboardingComplete: false },
    };
  }

  function normalizeState(raw) {
    const clean = defaultState();
    if (!raw || typeof raw !== 'object') return clean;
    clean.domain = findDomain(raw.domain)?.id || null;
    clean.plan = ['two-weeks', 'four-weeks', 'eight-weeks', 'flex'].includes(raw.plan) ? raw.plan : 'flex';
    clean.completed = Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(id => lessons.some(lesson => lesson.id === id)))] : [];
    clean.quizAnswers = raw.quizAnswers && typeof raw.quizAnswers === 'object' ? raw.quizAnswers : {};
    if (raw.quizResults && typeof raw.quizResults === 'object') {
      Object.entries(raw.quizResults).slice(0, 250).forEach(([key, result]) => {
        if (!result || typeof result !== 'object') return;
        let quiz = lessons.find(lesson => lesson.id === key)?.quiz;
        let canonicalKey = key;
        if (!quiz) {
          const match = key.match(/^specialty:([\w-]+):([\w-]+)$/);
          if (!match) return;
          const domainId = canonicalDomainId(match[1]);
          const profile = getPathwayProfile(domainId);
          const lesson = profile && getGuidedLessons(profile).find(item => item.id === match[2]);
          if (!lesson) return;
          quiz = lesson.quiz;
          canonicalKey = `specialty:${domainId}:${match[2]}`;
        }
        const count = quiz.length;
        const last = Number.isInteger(Number(result.last)) ? Math.max(0, Math.min(count, Number(result.last))) : 0;
        const best = Number.isInteger(Number(result.best)) ? Math.max(last, Math.min(count, Number(result.best))) : last;
        const answers = Array.isArray(result.lastAnswers) ? quiz.map((question, index) => Number.isInteger(Number(result.lastAnswers[index])) && Number(result.lastAnswers[index]) >= 0 && Number(result.lastAnswers[index]) < question.options.length ? Number(result.lastAnswers[index]) : -1) : [];
        clean.quizResults[canonicalKey] = { attempts: Math.max(1, Math.min(10000, Number(result.attempts) || 1)), last, best, lastAnswers: answers, questionCount: count };
      });
    }
    clean.savedResources = Array.isArray(raw.savedResources) ? raw.savedResources.slice(0, 100).filter(item => item && typeof item.url === 'string' && /^https:\/\//i.test(item.url) && typeof item.title === 'string').map(item => ({ url: item.url.slice(0, 1000), title: item.title.slice(0, 180), source: typeof item.source === 'string' ? item.source.slice(0, 100) : '' })) : [];
    clean.weeklyGoal = [2, 3, 5, 7].includes(Number(raw.weeklyGoal)) ? Number(raw.weeklyGoal) : 3;
    clean.activityDates = Array.isArray(raw.activityDates) ? [...new Set(raw.activityDates.filter(value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)))].slice(-400) : [];
    if (raw.specialtyProgress && typeof raw.specialtyProgress === 'object') {
      Object.entries(raw.specialtyProgress).forEach(([domainId, completed]) => {
        const canonicalId = canonicalDomainId(domainId);
        const profile = getPathwayProfile(canonicalId);
        if (!profile || !Array.isArray(completed)) return;
        const validSessions = new Set(profile.weeks.flatMap((week, weekIndex) =>
          week.sessions.map((_, sessionIndex) => `${weekIndex}-${sessionIndex}`)
        ));
        clean.specialtyProgress[canonicalId] = [...new Set(completed.filter(sessionId => validSessions.has(sessionId)))];
      });
    }
    clean.project = { ...clean.project, ...(raw.project && typeof raw.project === 'object' ? raw.project : {}) };
    clean.project.checks = Array.isArray(clean.project.checks) ? clean.project.checks.filter((_, index) => index < 6).map(Boolean) : [];
    clean.project.url = typeof clean.project.url === 'string' ? clean.project.url.slice(0, 500) : '';
    clean.project.completed = Boolean(clean.project.completed);
    clean.portfolio = Array.isArray(raw.portfolio) ? raw.portfolio.slice(0, 50).filter(item => item && typeof item.id === 'string').map(item => ({
      id: item.id.slice(0, 80),
      title: typeof item.title === 'string' ? item.title.slice(0, 100) : '',
      description: typeof item.description === 'string' ? item.description.slice(0, 3000) : '',
      domain: findDomain(item.domain)?.id || 'web',
      date: typeof item.date === 'string' ? item.date.slice(0, 20) : '',
      skills: typeof item.skills === 'string' ? item.skills.slice(0, 500) : '',
      difficulties: typeof item.difficulties === 'string' ? item.difficulties.slice(0, 1500) : '',
      learnings: typeof item.learnings === 'string' ? item.learnings.slice(0, 1500) : '',
      url: typeof item.url === 'string' && /^https:\/\//i.test(item.url) ? item.url.slice(0, 500) : '',
      visibility: 'private',
      files: Array.isArray(item.files) ? item.files.slice(0, 3).filter(file => file && typeof file.id === 'string' && ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)).map(file => ({
        id: file.id.slice(0, 100), name: String(file.name || '').slice(0, 160), type: file.type, size: Number(file.size) || 0,
      })) : [],
      createdAt: typeof item.createdAt === 'string' ? item.createdAt.slice(0, 40) : new Date().toISOString(),
    })).filter(item => item.title) : [];
    clean.awards = Array.isArray(raw.awards) ? [...new Set(raw.awards.filter(id => /^lesson:[\w-]+$|^quiz:[\w-]+$|^project:web$/.test(id)))] : [];
    clean.avatar = {
      face: avatars.some(item => item.face === raw.avatar?.face) ? raw.avatar.face : '✦',
      color: avatarColors.includes(raw.avatar?.color) ? raw.avatar.color : avatarColors[0],
      accessory: [null, 'spark', 'crown'].includes(raw.avatar?.accessory) ? raw.avatar.accessory : null,
    };
    clean.displayName = typeof raw.displayName === 'string' ? raw.displayName.slice(0, 60) : '';
    const savedProfile = raw.profile && typeof raw.profile === 'object' ? raw.profile : {};
    clean.profile = {
      firstName: typeof savedProfile.firstName === 'string' ? savedProfile.firstName.slice(0, 60) : '',
      lastName: typeof savedProfile.lastName === 'string' ? savedProfile.lastName.slice(0, 60) : '',
      birthDate: typeof savedProfile.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(savedProfile.birthDate) ? savedProfile.birthDate : '',
      interests: Array.isArray(savedProfile.interests) ? [...new Set(savedProfile.interests.filter(id => families.some(family => family.id === id)))].slice(0, 8) : [],
      resourceLanguage: ['fr', 'en', 'es'].includes(savedProfile.resourceLanguage) ? savedProfile.resourceLanguage : 'fr',
      theme: ['light', 'dark'].includes(savedProfile.theme) ? savedProfile.theme : 'light',
      learningMode: ['guided', 'free'].includes(savedProfile.learningMode) ? savedProfile.learningMode : 'guided',
      onboardingComplete: Boolean(savedProfile.onboardingComplete),
    };
    if (!clean.displayName && clean.profile.firstName) clean.displayName = clean.profile.firstName;
    recalculateRewards(clean);
    return clean;
  }

  function recalculateRewards(target) {
    target.xp = 0;
    target.coins = 0;
    target.awards.forEach(id => {
      const reward = id.startsWith('lesson:') ? awards.lesson : id.startsWith('quiz:') ? awards.quiz : awards.project;
      target.xp += reward.xp;
      target.coins += reward.coins;
    });
  }

  function cloneState() {
    return JSON.parse(JSON.stringify(state));
  }

  function readSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(sessionKey) || 'null');
      return saved && typeof saved.access_token === 'string' ? saved : null;
    } catch (error) {
      console.error('La session Supabase locale est illisible.', error);
      return null;
    }
  }

  function sessionAal() {
    try { return JSON.parse(atob(accountSession.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal || 'aal1'; }
    catch { return 'aal1'; }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
  }

  function externalLink(url, label, extra = '') {
    const saved = state.savedResources.some(item => item.url === url);
    const saveButton = `<button class="resource-save" type="button" data-action="toggle-resource" data-resource-url="${esc(url)}" data-resource-title="${esc(label)}" aria-pressed="${saved}" aria-label="${saved ? 'Retirer des' : 'Enregistrer dans'} mes ressources : ${esc(label)}">${saved ? '♥ Enregistrée' : '♡ Enregistrer'}</button>`;
    if (youtubeVideoId(url)) {
      return `<div class="resource-item inline-resource-video">${videoButton(url, label)}${saveButton}${extra ? `<small>${esc(extra)}</small>` : ''}</div>`;
    }
    return `<div class="resource-item"><a class="resource-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span>${extra ? `<small>${esc(extra)}</small>` : ''}</a>${saveButton}</div>`;
  }

  function renderSavedResources() {
    const items = state.savedResources;
    app.innerHTML = `<section class="page-shell">${pageHeader('MA BIBLIOTHÈQUE', 'Mes ressources enregistrées.', 'Retrouve ici les cours et vidéos que tu as gardés sur cet appareil.', 'catalog')}${items.length ? `<div class="resource-list">${items.map(item => `${externalLink(item.url, item.title, item.source || 'Lien enregistré · connexion Internet nécessaire')}`).join('')}</div>` : `<div class="empty-state"><span aria-hidden="true">♡</span><h2>Ta bibliothèque est vide</h2><p>Dans une fiche de cours ou une ressource, utilise « Enregistrer » pour retrouver le lien plus tard.</p><button class="button button-primary" type="button" data-route="catalog">Découvrir les domaines</button></div>`}<p class="storage-note">Cette bibliothèque est enregistrée uniquement dans ce navigateur. Elle ne se synchronise pas entre appareils.</p></section>`;
  }

  function renderQuizReview() {
    const retryable = lessons.map(lesson => ({ title: lesson.title, moduleTitle: lesson.moduleTitle, quiz: lesson.quiz, result: state.quizResults[lesson.id], route: `lesson/${lesson.id}` })).filter(item => item.result && item.result.last < item.quiz.length);
    Object.entries(state.quizResults).forEach(([key, result]) => {
      if (!key.startsWith('specialty:') || !result || !(result.last < result.questionCount)) return;
      const [, domainId, sessionId] = key.split(':');
      const domain = findDomain(domainId);
      const profile = getPathwayProfile(domainId);
      const lesson = profile && getGuidedLessons(profile).find(item => item.id === sessionId);
      if (domain && lesson) retryable.push({ title: lesson.title, moduleTitle: domain.name, quiz: lesson.quiz, result, route: `lesson/${domain.id}/${sessionId}` });
    });
    app.innerHTML = `<section class="page-shell">${pageHeader('RÉVISION PERSONNELLE', 'Reprendre les quiz.', 'Les quiz où tu as manqué une réponse sont réunis ici. Relis l’explication, puis réessaie sans pénalité.', 'progress')}${retryable.length ? `<div class="review-list">${retryable.map(item => { const missed = item.quiz.filter((question, index) => Number(item.result.lastAnswers?.[index]) !== question.answer); return `<article class="review-card"><div><p class="eyebrow">${esc(item.moduleTitle)}</p><h2>${esc(item.title)}</h2><p>Dernier résultat : ${item.result.last}/${item.quiz.length} · ${missed.length} point${missed.length > 1 ? 's' : ''} à revoir</p></div><ul>${missed.map(question => `<li>${esc(question.explanation)}</li>`).join('')}</ul><button class="button button-primary" type="button" data-route="${esc(item.route)}">Revoir le cours et réessayer</button></article>`; }).join('')}</div>` : `<div class="empty-state"><span aria-hidden="true">✓</span><h2>Aucun quiz à reprendre</h2><p>Les quiz où toutes les réponses sont correctes n’apparaissent pas ici. Tu peux revoir tes cours quand tu le souhaites.</p><button class="button button-primary" type="button" data-route="course/web/${state.plan}">Revoir les cours</button></div>`}</section>`;
  }

  function youtubeVideoId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'youtu.be') return /^[\w-]{11}$/.test(parsed.pathname.slice(1)) ? parsed.pathname.slice(1) : '';
      if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(parsed.hostname)) return '';
      const pathMatch = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      const id = parsed.searchParams.get('v') || pathMatch?.[1] || '';
      return /^[\w-]{11}$/.test(id || '') ? id : '';
    } catch { return ''; }
  }

  function videoButton(url, title = 'Regarder la vidéo dans Librescence') {
    const id = youtubeVideoId(url);
    return id ? `<button class="button button-primary video-open-button" type="button" data-video-id="${id}" data-video-title="${esc(title)}" data-video-watch="https://www.youtube.com/watch?v=${id}">▶ ${esc(title)}</button>` : '';
  }

  function setRoute(route, push = true) {
    const routeChanged = route !== currentRoute;
    currentRoute = route;
    if (push) history.pushState({ route }, '', `#${route}`);
    render();
    if (routeChanged && motionAllowed()) {
      const main = document.querySelector('#main');
      main.classList.remove('route-entering');
      void main.offsetWidth;
      main.classList.add('route-entering');
      setTimeout(() => main.classList.remove('route-entering'), 420);
    }
    document.querySelector('#main').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: motionAllowed() ? 'smooth' : 'auto' });
    closeMenu();
  }

  function routeFromHash() {
    const route = location.hash.slice(1);
    if (!route) return 'book';
    if (route === 'home' || route === 'onboarding' || route === 'catalog' || route === 'saved' || route === 'review' || route === 'progress' || route === 'project' || route === 'profile' || route === 'plan' || route === 'resources/web' || route === 'about' || route === 'contact' || route === 'privacy' || route === 'community' || route === 'portfolio') return route;
    if (/^domain\/[\w-]+$/.test(route) && findDomain(route.split('/')[1])) return route;
    if (/^course\/web\/(two-weeks|four-weeks|eight-weeks|flex)$/.test(route)) return route;
    if (/^portfolio\/edit\/[\w-]+$/.test(route) && state.portfolio.some(project => project.id === route.split('/')[2])) return route;
    if (route === 'portfolio/new') return route;
    if (/^lesson\/[\w-]+\/[\w-]+$/.test(route)) {
      const [, domainId, sessionId] = route.split('/');
      const profile = getPathwayProfile(domainId);
      if (profile && getGuidedLessons(profile).some(lesson => lesson.id === sessionId)) return route;
    }
    if (/^lesson\/[\w-]+$/.test(route) && lessons.some(lesson => lesson.id === route.split('/')[1])) return route;
    return 'home';
  }

  function motionAllowed() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function applyTheme() {
    document.body.dataset.theme = state.profile.theme || 'light';
    document.documentElement.style.colorScheme = state.profile.theme === 'dark' ? 'dark' : 'light';
  }

  function speakGuide() {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      return showToast('La lecture vocale n’est pas disponible dans ce navigateur. Tu peux lire les consignes affichées.', 'info');
    }
    window.speechSynthesis.cancel();
    let lessonVoiceText = '';
    if (currentRoute.startsWith('lesson/')) {
      const parts = currentRoute.split('/');
      if (parts.length >= 3) {
        const pathway = getPathwayProfile(parts[1]);
        const [weekIndex, sessionIndex] = parts[2].split('-').map(Number);
        const session = pathway?.weeks?.[weekIndex]?.sessions?.[sessionIndex];
        if (session) lessonVoiceText = `Séance : ${session.title}. Objectif : ${session.objective}. ${session.explanation} Activité proposée : ${session.exercise}`;
      } else {
        const lesson = lessons.find(item => item.id === parts[1]);
        if (lesson) lessonVoiceText = `Cours : ${lesson.title}. Objectif : ${lesson.objective}. Activité : ${lesson.activity}`;
      }
    }
    if (!lessonVoiceText && currentRoute.startsWith('course/')) {
      const [, domainId] = currentRoute.split('/');
      const pathway = getPathwayProfile(domainId);
      if (pathway) {
        const sessionTitles = pathway.weeks.flatMap(week => week.sessions.map(session => session.title)).slice(0, 8);
        lessonVoiceText = `Parcours guidé : ${pathway.title}. ${pathway.overview} Les étapes de départ sont : ${sessionTitles.join(', ')}. Tu peux avancer à ton rythme et écouter chaque séance séparément.`;
      } else {
        lessonVoiceText = `Parcours de développement web. Les modules sont : ${modules.map(module => module.title).join(', ')}. Les cours comprennent un objectif, une activité et un quiz.`;
      }
    }
    const domainId = currentRoute.split('/')[1];
    const domain = findDomain(domainId);
    const pathway = domain ? getPathwayProfile(domain.id) : null;
    const pageGuidance = currentRoute === 'book'
      ? 'Bienvenue sur Librescence. Le livre au centre est la porte d’entrée. Active le bouton du livre pour l’ouvrir et découvrir ton espace d’apprentissage.'
      : currentRoute === 'saved'
        ? `Tu es dans ta bibliothèque de ressources enregistrées. Ouvre un cours ou une vidéo pour reprendre. Utilise le bouton Enregistrée pour retirer un lien. La bibliothèque est conservée seulement sur cet appareil et ne se synchronise pas.`
      : currentRoute === 'review'
        ? 'La page de révision rassemble les quiz de développement web où tu as manqué au moins une réponse. Relis les explications puis ouvre un cours pour répondre de nouveau. Les tentatives ne retirent aucun point.'
        : currentRoute === 'catalog'
        ? 'Tu es dans le catalogue des domaines. Utilise la recherche ou le filtre pour trouver un sujet. Ouvre une carte pour lire la présentation, vérifier les prérequis, puis choisir un parcours guidé ou explorer les ressources. Les mentions à préparer signalent que le parcours n’est pas encore disponible.'
        : currentRoute.startsWith('domain/')
          ? domain ? `${domain.name}. ${domain.description || ''} ${pathway ? `${pathway.overview} Tu peux choisir un parcours guidé ou consulter librement les ressources.` : 'La fiche est en préparation. Consulte les pistes proposées et leur statut avant de commencer.'}` : 'Cette page présente un domaine. Reviens au catalogue pour choisir un sujet.'
          : currentRoute.startsWith('pathway-plan/')
            ? `Choisis la durée qui s’accorde à ton emploi du temps. Le contenu du parcours reste le même; seule la répartition change. Tu pourras ensuite consulter le programme, l’imprimer ou l’enregistrer en PDF. ${pathway?.title || ''}`
            : currentRoute.startsWith('resources/')
              ? `Tu explores les ressources librement${domain ? ` pour ${domain.name}` : ''}. Ouvre une ressource pour l’étudier. Les vidéos compatibles s’affichent dans une fenêtre intégrée; si leur auteur bloque l’intégration, le bouton de secours ouvre la vidéo sur son site d’origine.`
              : currentRoute === 'plan'
                ? 'Choisis un rythme pour répartir les séances de développement web. Tu peux modifier ce choix plus tard et conserver ta progression.'
                : currentRoute.startsWith('course/')
                  ? lessonVoiceText
                  : currentRoute.startsWith('lesson/')
                    ? lessonVoiceText
                    : currentRoute === 'progress'
                    ? 'Voici ta progression enregistrée sur cet appareil : les cours et quiz terminés, ton objectif hebdomadaire, tes jours actifs et la prochaine étape. Choisis un objectif réaliste et avance à ton rythme. Utilise les boutons pour reprendre un parcours ou revoir les quiz.'
                      : currentRoute === 'project'
                        ? 'Cette page présente le projet final. Lis les étapes, coche les éléments réalisés, ajoute le lien de ton travail et enregistre ta réalisation dans ton portfolio. Le site ne note pas automatiquement les projets.'
                        : currentRoute === 'portfolio' || currentRoute === 'portfolio/new' || currentRoute.startsWith('portfolio/edit/')
                          ? 'Dans ton portfolio privé, tu peux décrire un projet, indiquer les compétences utilisées, ajouter un lien ou un fichier et enregistrer une fiche PDF. Les données restent dans ce navigateur.'
                          : currentRoute === 'profile' || currentRoute === 'onboarding'
                            ? 'Bienvenue dans la préparation de ton espace. Tu peux indiquer un prénom ou un pseudo. Le nom de famille et la date de naissance sont facultatifs. Choisis tes centres d’intérêt, ton avatar, le thème clair ou sombre, la langue des recherches vidéo et ton mode d’apprentissage. Tes informations restent sur cet appareil.'
                            : currentRoute === 'about'
                              ? 'La page À propos explique la mission de Librescence, son fonctionnement et les limites actuelles des parcours. Tu peux aussi consulter les ressources partenaires sélectionnées.'
                              : currentRoute === 'contact'
                                ? 'La page Contact indique les moyens disponibles pour transmettre une question ou un retour sur le site.'
                                : currentRoute === 'privacy'
                                  ? 'Cette page décrit les informations conservées localement, les données qui ne sont pas envoyées et les limites de la synchronisation entre appareils.'
                                  : currentRoute === 'community'
                                    ? 'La communauté n’est pas encore ouverte. Cette page explique les protections de modération à mettre en place avant de permettre des échanges entre utilisateurs.'
                                    : currentRoute === 'home'
                                      ? `Bienvenue${state.profile.firstName ? ` ${state.profile.firstName}` : ''} sur Librescence. Choisis un domaine, demande une aide pour trouver ton orientation ou prépare ton espace. Les parcours se font à ton rythme et le profil est facultatif.`
                                      : 'Utilise le menu pour parcourir les domaines, consulter ta progression et retrouver ton portfolio. Tu peux choisir un parcours guidé ou explorer librement les ressources.';
    const text = lessonVoiceText || pageGuidance;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  function showToast(message, type = 'success') {
    let node = document.querySelector('.toast');
    if (!node) {
      node = document.createElement('div');
      node.className = 'toast';
      node.setAttribute('role', type === 'error' ? 'alert' : 'status');
      document.body.append(node);
    }
    node.className = `toast toast-${type}`;
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 4200);
  }

  function saveState(syncRemote = true) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      if (syncRemote && accountSession && supabaseUrl && supabaseKey && sessionAal() === 'aal2') {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => syncToSupabase().catch(reportSyncError), 900);
      }
    } catch (error) {
      console.error('Impossible d’enregistrer la progression locale de Librescence.', error);
      showToast('La progression n’a pas pu être enregistrée sur cet appareil.', 'error');
    }
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function recordStudyActivity() {
    const today = localDateKey();
    state.activityDates = [...new Set([...(state.activityDates || []), today])].slice(-400);
    saveState();
  }

  function studyActivitySummary() {
    const active = new Set(state.activityDates || []);
    const today = new Date();
    const weekDates = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      weekDates.push(localDateKey(date));
    }
    let streak = 0;
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!active.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (active.has(localDateKey(cursor)) && streak < 365) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const weekday = (today.getDay() + 6) % 7;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - weekday);
    const weekCount = [...active].filter(key => key >= localDateKey(monday) && key <= localDateKey(today)).length;
    return { streak, weekCount, weekDates };
  }

  function focusTimerMarkup() {
    return `<section class="focus-widget" aria-label="Minuteur de concentration"><div><p class="eyebrow">PAUSE ET CONCENTRATION</p><strong id="focus-time">${formatFocusTime(focusTimerRemaining)}</strong><small>Minuteur facultatif · reste sur cet appareil</small></div><label class="visually-hidden" for="focus-duration">Durée du minuteur</label><select id="focus-duration" aria-label="Durée du minuteur"><option value="15" ${focusTimerDuration === 15 ? 'selected' : ''}>15 minutes</option><option value="25" ${focusTimerDuration === 25 ? 'selected' : ''}>25 minutes</option><option value="45" ${focusTimerDuration === 45 ? 'selected' : ''}>45 minutes</option></select><div class="focus-actions"><button class="button button-primary" type="button" data-action="focus-toggle">Démarrer</button><button class="button button-quiet" type="button" data-action="focus-reset">Réinitialiser</button></div></section>`;
  }

  function formatFocusTime(seconds) {
    const minutes = Math.floor(Math.max(0, seconds) / 60);
    const remainder = Math.max(0, seconds) % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  function updateFocusTimerDisplay() {
    const display = document.querySelector('#focus-time');
    if (display) display.textContent = formatFocusTime(focusTimerRemaining);
    const button = document.querySelector('[data-action="focus-toggle"]');
    if (button) button.textContent = focusTimerInterval ? 'Mettre en pause' : 'Démarrer';
  }

  function toggleFocusTimer() {
    if (focusTimerInterval) {
      clearInterval(focusTimerInterval);
      focusTimerInterval = null;
      updateFocusTimerDisplay();
      return;
    }
    if (focusTimerRemaining <= 0) resetFocusTimer();
    focusTimerInterval = setInterval(() => {
      focusTimerRemaining -= 1;
      updateFocusTimerDisplay();
      if (focusTimerRemaining <= 0) {
        clearInterval(focusTimerInterval);
        focusTimerInterval = null;
        showToast('Séance de concentration terminée. Prends une petite pause.');
        updateFocusTimerDisplay();
      }
    }, 1000);
    updateFocusTimerDisplay();
  }

  function resetFocusTimer(minutes = Number(document.querySelector('#focus-duration')?.value || 25)) {
    clearInterval(focusTimerInterval);
    focusTimerInterval = null;
    focusTimerDuration = [15, 25, 45].includes(minutes) ? minutes : 25;
    focusTimerRemaining = focusTimerDuration * 60;
    updateFocusTimerDisplay();
  }

  function updateConnectionStatus() {
    const notice = document.querySelector('#connection-status');
    if (!notice) return;
    notice.hidden = navigator.onLine;
    if (!navigator.onLine) notice.textContent = 'Mode hors ligne : tes cours enregistrés restent accessibles. Les vidéos et liens externes nécessitent Internet.';
  }

  function registerOfflineApp() {
    updateConnectionStatus();
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Le mode hors ligne n’a pas pu être préparé.', error));
    }
  }

  function migrateLegacyProgress() {
    const legacy = localStorage.getItem('capClairCompleted');
    if (!legacy) return defaultState();
    try {
      const oldCompleted = JSON.parse(legacy);
      if (!Array.isArray(oldCompleted)) throw new Error('La progression précédente n’est pas une liste.');
      const mappedLessons = ['web-map', 'html-structure', 'css-first-style', 'js-first-steps', 'web-quality'];
      const migrated = defaultState();
      migrated.completed = [...new Set(oldCompleted
        .filter(index => Number.isInteger(index) && index >= 0 && index < mappedLessons.length)
        .map(index => mappedLessons[index]))];
      migrated.domain = 'web';
      migrated.awards = migrated.completed.map(id => `lesson:${id}`);
      recalculateRewards(migrated);
      localStorage.setItem(storageKey, JSON.stringify(migrated));
      return migrated;
    } catch (error) {
      console.error('La progression précédente de Librescence n’a pas pu être transférée.', error);
      showToast('La progression précédente est illisible. Tu peux reprendre les cours sans compte.', 'error');
      return defaultState();
    }
  }

  function loadGuestState() {
    try {
      const saved = localStorage.getItem(storageKey);
      const previousState = localStorage.getItem('capClair.learning.v2');
      if (saved) {
        state = normalizeState(JSON.parse(saved));
      } else if (previousState) {
        state = normalizeState(JSON.parse(previousState));
        localStorage.setItem(storageKey, JSON.stringify(state));
      } else {
        state = migrateLegacyProgress();
      }
    } catch (error) {
      console.error('La progression locale de Librescence est illisible.', error);
      state = defaultState();
      showToast('La progression locale est illisible ; un nouvel espace temporaire a été ouvert.', 'error');
    }
  }

  function routeButton(route, label, className = 'button button-primary') {
    return `<button type="button" class="${className}" data-route="${esc(route)}">${label}</button>`;
  }

  function pageHeader(eyebrow, title, description, backRoute = 'catalog') {
    return `<div class="page-heading"><button class="back-link" type="button" data-route="${esc(backRoute)}">← Retour</button><p class="eyebrow">${esc(eyebrow)}</p><h1>${title}</h1><p>${description}</p></div>`;
  }

  function progressSummary() {
    const done = state.completed.length;
    const percentage = Math.round(done / lessons.length * 100);
    return `<div class="progress-summary"><div class="progress-heading"><span>Ton parcours web</span><strong>${done} / ${lessons.length} cours · ${percentage}%</strong></div><div class="progress-track" role="progressbar" aria-label="Progression du parcours web" aria-valuemin="0" aria-valuemax="${lessons.length}" aria-valuenow="${done}"><span style="width:${percentage}%"></span></div></div>`;
  }

  function renderBook() {
    app.innerHTML = `<section class="book-screen" aria-label="Écran d’entrée Librescence">
      <button class="book-button" type="button" data-action="open-book" aria-label="Ouvrir le livre et entrer sur Librescence">
        <span class="book-glow" aria-hidden="true"></span>
        <span class="book" aria-hidden="true">
          <span class="book-cover-left"><span class="cover-mark">L.</span></span>
          <span class="book-cover-right"><span class="cover-sun"></span></span>
          <span class="book-pages"></span>
          <span class="book-spine"></span>
        </span>
      </button>
      <p class="book-instruction">Clique sur le livre pour l’ouvrir</p>
      <button class="book-skip" type="button" data-action="skip-book">Passer l’ouverture</button>
    </section>`;
  }

  function renderHome() {
    if (!state.profile.onboardingComplete) {
      app.innerHTML = `<section class="onboarding-welcome"><div class="onboarding-orbit" aria-hidden="true"><span>✦</span><i></i><b></b></div><p class="eyebrow">BIENVENUE DANS Librescence</p><h1>Un nouveau chemin<br><span>commence ici.</span></h1><p class="onboarding-lead">Librescence t’aide à découvrir ce qui t’intéresse, à apprendre étape par étape et à créer quelque chose de concret. Tu peux préparer un petit profil pour personnaliser ton expérience. Tes réponses restent enregistrées sur cet appareil.</p><div class="welcome-actions"><button class="button button-primary" type="button" data-route="onboarding">Préparer mon espace</button><button class="button button-outline" type="button" data-action="skip-profile">Explorer sans profil</button><button class="button button-quiet" type="button" data-action="speak-guide">▶ Écouter la présentation</button></div><p class="privacy-note">Pas de compte, pas de numéro de téléphone, pas d’envoi de données. La date de naissance est facultative.</p></section>`;
      return;
    }
    app.innerHTML = `<section class="welcome-screen">
      <div class="welcome-copy"><p class="eyebrow">BIENVENUE${state.profile.firstName ? `, ${esc(state.profile.firstName).toLocaleUpperCase('fr')}` : ' DANS Librescence'}</p><h1>Tu choisis la direction.<br><span>On avance ensemble.</span></h1><p>Découvre un domaine, apprends à ton rythme et donne vie à une idée concrète. Commence comme tu es, sans expérience ni compte obligatoire.</p>
        <div class="welcome-actions">
          ${routeButton('catalog', 'Je sais ce que je veux apprendre')}
          <button type="button" class="button button-outline" data-action="orientation">Aide-moi à choisir</button>
        </div>
        <div class="welcome-account"><button type="button" class="text-button" data-route="profile">Personnaliser mon profil</button><span>·</span><button type="button" class="text-button" data-route="catalog">Explorer les domaines</button></div>
      </div>
      <div class="welcome-visual"><div class="welcome-book" aria-hidden="true"><span class="welcome-book-spine"></span><span class="welcome-page"><span class="page-sun"></span><span class="page-orbit orbit-a"></span><span class="page-orbit orbit-b"></span><span class="page-word">à toi<br>de jouer.</span><span class="page-spark">✦</span></span></div><span class="visual-caption">Une idée. Un premier pas. Ton projet.</span></div>
      <div class="welcome-meta"><span>GRATUIT · SANS CLASSEMENT</span><span class="meta-line"></span><span>UNE ÉTAPE À LA FOIS</span></div>
    </section>
    <section class="welcome-next wrap"><div><p class="eyebrow">UN CHEMIN QUI T’APPARTIENT</p><h2>Pas besoin d’avoir tout décidé.</h2></div><p>Choisis une envie, explore les domaines ou commence directement le parcours pilote de développement web.</p>${routeButton('catalog', 'Explorer les domaines', 'button button-dark')}</section>`;
  }

  function renderOnboarding(editing = false) {
    const p = state.profile;
    const interestOptions = families.map(family => `<label class="interest-choice"><input type="checkbox" name="interest" value="${esc(family.id)}" ${p.interests.includes(family.id) ? 'checked' : ''}><span>${esc(family.name)}</span></label>`).join('');
    app.innerHTML = `<section class="page-shell onboarding-page"><div class="page-heading"><button class="back-link" type="button" data-route="home">← Retour</button><p class="eyebrow">TON ESPACE, À TON IMAGE</p><h1>${editing ? 'Personnalise ton espace.' : 'Préparons ton départ.'}</h1><p>Ces informations personnalisent ton expérience. Elles restent sur cet appareil et tu pourras les modifier plus tard.</p></div><form id="onboarding-form" class="onboarding-form"><section class="onboarding-card"><div class="onboarding-card-title"><span>01</span><div><h2>Faisons connaissance</h2><p>Seul le prénom est nécessaire. Tu peux utiliser un pseudo.</p></div></div><div class="form-pair"><label class="field-label">Prénom ou pseudo<input name="firstName" type="text" maxlength="60" autocomplete="given-name" value="${esc(p.firstName)}" required></label><label class="field-label">Nom de famille <span class="muted-copy">facultatif</span><input name="lastName" type="text" maxlength="60" autocomplete="family-name" value="${esc(p.lastName)}"></label></div><label class="field-label">Date de naissance <span class="muted-copy">facultative, conservée uniquement sur cet appareil</span><input name="birthDate" type="date" autocomplete="bday" value="${esc(p.birthDate)}"></label></section><section class="onboarding-card"><div class="onboarding-card-title"><span>02</span><div><h2>Ce qui t’intéresse</h2><p>Choisis quelques domaines. Tu peux changer d’avis à tout moment.</p></div></div><div class="interest-grid">${interestOptions}</div></section><section class="onboarding-card"><div class="onboarding-card-title"><span>03</span><div><h2>Ton espace et ton rythme</h2><p>Choisis les réglages qui te conviennent.</p></div></div><div class="profile-preview"><span class="avatar-preview avatar-large" style="--avatar-color:${esc(state.avatar.color)}">${esc(state.avatar.face)}</span><div><strong>${esc(p.firstName || 'Ton avatar')}</strong><small>Ton apparence peut évoluer à tout moment.</small></div></div><fieldset class="cosmetic-field"><legend>Choisir un avatar</legend><div class="avatar-options">${avatars.map(item => `<button type="button" class="avatar-option ${item.face === state.avatar.face ? 'selected' : ''}" data-avatar-face="${esc(item.face)}" aria-label="Avatar ${esc(item.name)}" aria-pressed="${item.face === state.avatar.face}">${esc(item.face)}</button>`).join('')}</div></fieldset><fieldset class="cosmetic-field"><legend>Couleur de ton avatar</legend><div class="color-options">${avatarColors.map(color => `<button type="button" class="color-option ${color === state.avatar.color ? 'selected' : ''}" data-avatar-color="${color}" style="--swatch:${color}" aria-label="Choisir la couleur ${color}" aria-pressed="${color === state.avatar.color}"></button>`).join('')}</div></fieldset><div class="form-pair"><label class="field-label">Apparence de l’application<select name="theme"><option value="light" ${p.theme === 'light' ? 'selected' : ''}>Claire</option><option value="dark" ${p.theme === 'dark' ? 'selected' : ''}>Sombre</option></select></label><label class="field-label">Langue préférée des recherches vidéo<select name="resourceLanguage"><option value="fr" ${p.resourceLanguage === 'fr' ? 'selected' : ''}>Français</option><option value="en" ${p.resourceLanguage === 'en' ? 'selected' : ''}>English</option><option value="es" ${p.resourceLanguage === 'es' ? 'selected' : ''}>Español</option></select></label></div><fieldset class="cosmetic-field"><legend>Comment veux-tu apprendre ?</legend><div class="mode-grid"><label class="mode-choice"><input type="radio" name="learningMode" value="guided" ${p.learningMode === 'guided' ? 'checked' : ''}><span><strong>Parcours guidé</strong><small>Un chemin organisé, des cours, des activités et des quiz.</small></span></label><label class="mode-choice"><input type="radio" name="learningMode" value="free" ${p.learningMode === 'free' ? 'checked' : ''}><span><strong>Explorer librement</strong><small>Je choisis un domaine et consulte les ressources dans l’ordre qui me plaît.</small></span></label></div></fieldset></section><div class="onboarding-actions"><button class="button button-primary" type="submit">${editing ? 'Enregistrer mes préférences' : 'Enregistrer mon espace et continuer'}</button><button class="button button-quiet" type="button" data-action="speak-guide">▶ Écouter les consignes</button></div></form></section>`;
  }

  function renderAbout() {
    app.innerHTML = `<section class="page-shell">${pageHeader('À PROPOS DE LIBRESCENCE', 'Apprendre libre. Grandir ensemble.', 'Une plateforme ouverte à toutes et tous pour explorer des domaines et avancer par projets.', 'home')}
      <div class="about-lead"><p>Librescence a pour mission de rendre la découverte et l’apprentissage de nouvelles compétences plus accessibles, quel que soit le point de départ.</p><p>La plateforme aide à comprendre un domaine, choisir un parcours, apprendre par petites étapes, pratiquer et présenter les projets réalisés.</p></div>
      <div class="about-grid"><article><span>MISSION</span><h2>Ouvrir des chemins d’apprentissage.</h2><p>Proposer une porte d’entrée claire vers des domaines et aider chacun à commencer sans expérience préalable.</p></article><article><span>RÔLE</span><h2>Guider sans décider à ta place.</h2><p>Les parcours sont des propositions. Tu peux explorer librement, changer de sujet et avancer à ton rythme.</p></article><article><span>VISION</span><h2>Apprendre en faisant.</h2><p>Associer des notions, de petites activités, des ressources attribuées et des projets concrets.</p></article><article><span>VALEURS</span><h2>Clarté, autonomie, prudence.</h2><p>Signaler ce qui est préparé, ce qui a été vérifié et les limites des apprentissages en ligne.</p></article></div>
      <section class="domain-section"><p class="eyebrow">COMMENT ÇA MARCHE</p><div class="learning-grid"><article><span>01</span><h3>Découvrir</h3><p>Parcourir les domaines et lire leur niveau de préparation.</p></article><article><span>02</span><h3>Apprendre & pratiquer</h3><p>Suivre les cours disponibles, ouvrir leurs ressources et essayer les activités.</p></article><article><span>03</span><h3>Réaliser & présenter</h3><p>Avancer vers un projet et garder une trace de ce que tu as appris.</p></article></div></section>
      <section class="domain-section"><p class="eyebrow">RESSOURCES À DÉCOUVRIR</p><h2>Des plateformes complémentaires.</h2><p class="muted-copy">Ces services ont inspiré des choix de conception : progression visible, exercices actifs, projets pratiques, contenus gratuits et ressources en français. Leur accès, leurs langues et leurs attestations varient selon le cours.</p><div class="source-grid">${externalLink('https://www.khanacademy.org/', 'Khan Academy', 'Cours, exercices et suivi des acquis')}${externalLink('https://www.freecodecamp.org/learn/', 'freeCodeCamp', 'Exercices interactifs et projets de programmation')}${externalLink('https://www.open.edu/openlearn/', 'OpenLearn', 'Cours ouverts, badges et attestations gratuits selon le cours')}${externalLink('https://www.saylor.org/CourseCatalog', 'Saylor University', 'Cours libres à rythme autonome, surtout en anglais')}${externalLink('https://www.fun-mooc.fr/fr/', 'FUN MOOC', 'Cours en ligne d’établissements francophones')}${externalLink('https://www.edx.org/school/edx', 'edX', 'Cours de domaines variés; accès gratuit selon la formule')}${externalLink('https://alison.com/', 'Alison', 'Cours gratuits; certificat payant en option selon l’offre')}${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development', 'MDN Web Docs', 'Documentation et parcours de développement web en français')}${externalLink('https://www.life-global.org/fr', 'HP LIFE', 'Cours gratuits de compétences numériques et entrepreneuriales')}${externalLink('https://developer.orange.com/blog/orange-digital-center-a-key-driver-in-cote-divoire/', 'Orange Digital Center en Côte d’Ivoire', 'Formation, mentorat et programmes numériques locaux')}</div><p class="external-note">Librescence s’inspire de formats d’apprentissage éprouvés, sans prétendre être partenaire de ces organisations. La progression, les quiz, les projets, le lecteur vidéo intégré lorsqu’il est autorisé et la bibliothèque locale sont disponibles dans le site. Les vidéos et cours externes peuvent demander une connexion ou un compte chez leur fournisseur.</p></section>
      <div class="catalog-note">Les parcours affichés comme « Contenu en préparation » ne sont pas encore proposés comme formations opérationnelles. Cette présentation n’implique aucune certification ni partenariat officiel. Le nom Librescence reste à vérifier auprès de l’OAPI avant le lancement public.</div></section>`;
  }

  function renderContact() {
    const whatsappConfigured = Boolean(getWhatsappContactNumber());
    app.innerHTML = `<section class="page-shell">
      ${pageHeader('CONTACT', 'Écrire à Librescence', 'Consulte les réponses fréquentes, puis écris-nous si tu as encore une question.', 'home')}
      <div class="contact-layout">
        <section class="contact-faq" aria-labelledby="contact-faq-title">
          <h2 id="contact-faq-title">Quelques réponses utiles</h2>
          <div class="contact-faq-list">
            <details class="contact-faq-item">
              <summary>Puis-je commencer sans expérience ?</summary>
              <p>Oui. Les parcours d’initiation sont conçus pour commencer sans expérience préalable. Tu peux aussi explorer librement les domaines et choisir ton rythme.</p>
            </details>
            <details class="contact-faq-item">
              <summary>Que signifie « parcours à préparer » ?</summary>
              <p>Le contenu est en préparation et n’est pas encore proposé comme une formation disponible. Les parcours marqués « parcours guidé » ou « parcours pilote » sont indiqués séparément dans le catalogue.</p>
            </details>
            <details class="contact-faq-item">
              <summary>Pourquoi une vidéo ne se lit-elle pas directement sur le site ?</summary>
              <p>Certaines vidéos YouTube ne peuvent pas être intégrées par leur auteur ou leur fournisseur. Dans ce cas, un lien permet de les ouvrir sur YouTube. Les vidéos et ressources externes peuvent aussi nécessiter une connexion Internet.</p>
            </details>
            <details class="contact-faq-item">
              <summary>Ma progression se synchronise-t-elle entre plusieurs appareils ?</summary>
              <p>Non. La progression et le profil restent actuellement enregistrés sur l’appareil et dans le navigateur utilisés. Ils ne se synchronisent pas entre appareils.</p>
            </details>
          </div>
        </section>

        <section class="contact-panel" aria-labelledby="contact-form-title">
          <p class="eyebrow">MESSAGE À LIBRESCENCE</p>
          <h2 id="contact-form-title">Comment pouvons-nous t’aider ?</h2>
          <p class="contact-intro">Le texte sera préparé dans WhatsApp afin que tu puisses le vérifier et le modifier avant de l’envoyer.</p>
          ${whatsappConfigured ? '' : '<p id="contact-whatsapp-config-notice" class="notice notice-warning">L’ouverture de WhatsApp est indisponible : configure le numéro officiel de Librescence dans config.js au format international, avec des chiffres uniquement et sans « + ». Tu peux toujours copier le message après validation.</p>'}
          <form id="contact-form" novalidate>
            <div class="contact-fields">
              <div class="contact-field">
                <label class="field-label" for="contact-name">Nom ou prénom <span aria-hidden="true">*</span></label>
                <input id="contact-name" name="name" type="text" maxlength="100" autocomplete="name" required aria-describedby="contact-name-error">
                <span id="contact-name-error" class="form-error" hidden></span>
              </div>
              <div class="contact-field">
                <label class="field-label" for="contact-phone">Numéro WhatsApp <span aria-hidden="true">*</span></label>
                <input id="contact-phone" name="phone" type="tel" inputmode="tel" maxlength="26" autocomplete="tel" placeholder="+225 07 00 00 00 00" required aria-describedby="contact-phone-hint contact-phone-error">
                <small id="contact-phone-hint" class="field-hint">Avec l’indicatif du pays, par exemple +225…</small>
                <span id="contact-phone-error" class="form-error" hidden></span>
              </div>
              <div class="contact-field">
                <label class="field-label" for="contact-subject">Sujet <span aria-hidden="true">*</span></label>
                <select id="contact-subject" name="subject" required aria-describedby="contact-subject-error">
                  <option value="" selected disabled>Choisir un sujet</option>
                  <option value="Question sur un parcours">Question sur un parcours</option>
                  <option value="Problème technique ou ressource">Problème technique ou ressource</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Autre">Autre</option>
                </select>
                <span id="contact-subject-error" class="form-error" hidden></span>
              </div>
              <div class="contact-field contact-field-message">
                <label class="field-label" for="contact-message">Message <span aria-hidden="true">*</span></label>
                <textarea id="contact-message" name="message" rows="6" required aria-describedby="contact-message-error"></textarea>
                <span id="contact-message-error" class="form-error" hidden></span>
              </div>
            </div>
            <div class="contact-consent-wrap">
              <label class="contact-consent" for="contact-consent">
                <input id="contact-consent" name="consent" type="checkbox" required aria-describedby="contact-consent-error">
                <span>Je consens à ce que mon nom, mon numéro WhatsApp, le sujet et mon message soient inclus dans le texte préparé pour WhatsApp. Librescence ne stocke pas ces renseignements et ne les envoie pas automatiquement : je pourrai vérifier ou modifier le texte dans WhatsApp, puis appuyer moi-même sur « Envoyer ». Librescence ne peut confirmer l’envoi ou la réception du message.</span>
              </label>
              <span id="contact-consent-error" class="form-error" hidden></span>
            </div>
            <div class="contact-actions">
              <button class="button button-primary" type="submit" ${whatsappConfigured ? '' : 'disabled aria-describedby="contact-whatsapp-config-notice"'}>Ouvrir WhatsApp</button>
              <button class="button button-outline" type="button" data-action="copy-contact-message">Copier le message</button>
            </div>
            <a id="contact-whatsapp-link" class="resource-link contact-whatsapp-link" target="_blank" rel="noopener noreferrer" hidden>Si WhatsApp ne s’est pas ouvert, ouvrir la conversation</a>
            <p id="contact-feedback" class="form-feedback" role="status" aria-live="polite"></p>
          </form>
        </section>
      </div>
    </section>`;
  }

  function getWhatsappContactNumber() {
    const number = window.BesaConfig?.whatsappContactNumber;
    return typeof number === 'string' && /^[1-9]\d{7,14}$/.test(number) ? number : '';
  }

  function setContactFeedback(message, isError = false) {
    const feedback = document.querySelector('#contact-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle('form-feedback-error', isError);
  }

  function clearContactFieldError(field) {
    if (field.form?.id !== 'contact-form') return;
    field.removeAttribute('aria-invalid');
    const error = document.getElementById(`${field.id}-error`);
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
    setContactFeedback('');
    const fallbackLink = document.querySelector('#contact-whatsapp-link');
    if (fallbackLink) fallbackLink.hidden = true;
  }

  function validateContactForm(form) {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const rawPhone = String(data.get('phone') || '').trim();
    const phone = rawPhone.replace(/[\s().-]/g, '');
    const subject = String(data.get('subject') || '');
    const message = String(data.get('message') || '').trim();
    const consent = data.get('consent') === 'on';
    const errors = {
      name: name ? '' : 'Indique ton nom ou ton prénom.',
      phone: /^\+[1-9]\d{7,14}$/.test(phone) ? '' : 'Entre un numéro international valide avec + et l’indicatif du pays, par exemple +225 07…',
      subject: ['Question sur un parcours', 'Problème technique ou ressource', 'Suggestion', 'Autre'].includes(subject) ? '' : 'Choisis un sujet dans la liste.',
      message: message ? '' : 'Écris un message avant de continuer.',
      consent: consent ? '' : 'Coche cette case pour confirmer le texte préparé pour WhatsApp.',
    };
    let firstInvalidField = null;
    Object.entries(errors).forEach(([name, errorMessage]) => {
      const field = form.elements.namedItem(name);
      const error = document.querySelector(`#contact-${name}-error`);
      if (error) {
        error.textContent = errorMessage;
        error.hidden = !errorMessage;
      }
      if (errorMessage) {
        field?.setAttribute('aria-invalid', 'true');
        firstInvalidField ||= field;
      } else {
        field?.removeAttribute('aria-invalid');
      }
    });
    if (firstInvalidField) {
      setContactFeedback('Vérifie les champs signalés avant de continuer.', true);
      firstInvalidField.focus();
      return null;
    }
    setContactFeedback('');
    return { name, phone, subject, message };
  }

  function buildContactMessage(values) {
    return `Nom : ${values.name}\nNuméro WhatsApp : ${values.phone}\nSujet : ${values.subject}\n\nMessage :\n${values.message}`;
  }

  function copyContactMessageFallback(message) {
    const previousFocus = document.activeElement;
    const temporaryField = document.createElement('textarea');
    temporaryField.value = message;
    temporaryField.setAttribute('readonly', '');
    temporaryField.setAttribute('aria-hidden', 'true');
    temporaryField.style.position = 'fixed';
    temporaryField.style.inset = '0 auto auto -10000px';
    document.body.append(temporaryField);
    temporaryField.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    temporaryField.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    return copied;
  }

  async function copyContactMessage() {
    const form = document.querySelector('#contact-form');
    if (!form) return;
    const values = validateContactForm(form);
    if (!values) return;
    const message = buildContactMessage(values);
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        copied = true;
      } catch {
        copied = copyContactMessageFallback(message);
      }
    } else {
      copied = copyContactMessageFallback(message);
    }
    setContactFeedback(
      copied
        ? 'Le texte a été copié. Tu peux le coller et le modifier dans WhatsApp. Librescence ne reçoit ni n’enregistre ce message.'
        : 'La copie a échoué. Autorise la copie dans ton navigateur ou sélectionne le texte préparé à nouveau.',
      !copied,
    );
  }

  function handleContactSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const values = validateContactForm(form);
    if (!values) return;
    const contactNumber = getWhatsappContactNumber();
    if (!contactNumber) {
      setContactFeedback('Le numéro officiel doit être configuré dans config.js avant de pouvoir ouvrir WhatsApp. Tu peux copier le message comme solution de secours.', true);
      return;
    }
    const url = `https://wa.me/${contactNumber}?text=${encodeURIComponent(buildContactMessage(values))}`;
    const fallbackLink = document.querySelector('#contact-whatsapp-link');
    fallbackLink.href = url;
    fallbackLink.hidden = false;
    let openingFailed = false;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      openingFailed = true;
    }
    setContactFeedback(
      openingFailed
        ? 'Le navigateur n’a pas pu ouvrir WhatsApp. Utilise le lien affiché ou copie le message. Aucun message n’a été envoyé automatiquement.'
        : 'La conversation a été demandée. Vérifie ou modifie le texte dans WhatsApp et appuie toi-même sur « Envoyer ». Si elle ne s’ouvre pas, utilise le lien affiché ou copie le message. Librescence ne peut confirmer l’envoi ou la réception.',
      openingFailed,
    );
  }

  function renderPrivacy() {
    app.innerHTML = `<section class="page-shell">${pageHeader('CONFIDENTIALITÉ', 'Tes informations restent ici.', 'Librescence fonctionne sans compte dans cette version.', 'home')}<div class="prepared-panel"><h2>Ce que tu peux renseigner</h2><p>Le prénom ou pseudo est utilisé pour personnaliser l’accueil. Le nom de famille et la date de naissance sont facultatifs. Tes intérêts, ton avatar, ton thème, la langue préférée des ressources et ta progression servent à personnaliser le site.</p><h2>Où ces données sont conservées</h2><p>Le profil, les préférences, les réponses aux quiz et le portfolio sont enregistrés dans le stockage local de ce navigateur. Ces données ne sont pas envoyées par Librescence à un service externe et ne sont pas synchronisées sur un autre appareil. Effacer les données du navigateur peut les supprimer.</p><h2>Contact par WhatsApp</h2><p>Si tu remplis le formulaire Contact et donnes ton accord, le site prépare un texte avec les informations saisies et ouvre WhatsApp. Le site ne conserve pas ces champs et n’envoie pas le message automatiquement. Tu peux relire ou modifier le texte; seul ton appui sur « Envoyer » transmet le message via WhatsApp. Librescence ne peut confirmer son envoi ou sa réception.</p><h2>Choix et contrôle</h2><p>Tu peux ignorer la création de profil et explorer le catalogue. Tu peux aussi modifier ton profil depuis « Mon profil » ou retirer les données de ce navigateur via les réglages de celui-ci. Évite d’ajouter des informations sensibles dans tes projets.</p><p class="notice notice-warning">La création de compte et la synchronisation entre appareils sont désactivées pour cette version. Elles ne seront proposées qu’après une configuration dédiée et une information claire sur les données concernées.</p></div></section>`;
  }

  function renderCommunity() {
    app.innerHTML = `<section class="page-shell">${pageHeader('COMMUNAUTÉ & MENTORAT', 'Un espace collectif, plus tard.', 'Il n’y a pas encore de communauté ni de programme de mentorat actif.', 'home')}
      <div class="prepared-panel"><span class="status-tag">EN ATTENTE</span><h2>La sécurité et la modération passent d’abord.</h2><p>Les échanges, profils publics et prises de contact ne sont pas activés. Aucun message privé ou annuaire de membres n’est disponible.</p><h3>Avant une ouverture, il faudra prévoir</h3><ul><li>des règles de conduite accessibles et un moyen de signalement ;</li><li>une équipe de modération et une procédure de traitement des signalements ;</li><li>des protections adaptées aux mineurs et des réglages de confidentialité ;</li><li>une politique de conservation et de suppression des données.</li></ul></div></section>`;
  }

  function renderCatalog() {
    const normalizedQuery = searchTerm.trim().toLocaleLowerCase('fr');
    const orderedFamilyIds = [...new Set([...state.profile.interests, ...families.map(family => family.id)])];
    const visibleFamilies = orderedFamilyIds.map(id => families.find(family => family.id === id)).filter(Boolean).map(family => {
      const items = activeDomains.filter(domain => domain.family === family.id && (selectedFilter === 'all' || selectedFilter === family.id))
        .filter(domain => !normalizedQuery || `${domain.name} ${domain.description || ''} ${family.name}`.toLocaleLowerCase('fr').includes(normalizedQuery));
      return items.length ? { ...family, items } : null;
    }).filter(Boolean);
    app.innerHTML = `<section class="page-shell">
      ${pageHeader('CHOISIR SON DOMAINE', 'Qu’est-ce qui t’intrigue&nbsp;?', 'Explore par famille ou cherche un sujet. Tu peux changer de direction quand tu veux.', 'home')}
      <div class="catalog-controls"><label class="search-box"><span aria-hidden="true">⌕</span><span class="visually-hidden">Rechercher un domaine</span><input id="catalog-search" type="search" value="${esc(searchTerm)}" placeholder="Rechercher un domaine…" autocomplete="off"></label>
      <label class="visually-hidden" for="family-filter">Filtrer par famille</label><select id="family-filter"><option value="all">Toutes les familles</option>${families.map(family => `<option value="${family.id}" ${selectedFilter === family.id ? 'selected' : ''}>${esc(family.name)}</option>`).join('')}</select>
      <button class="button button-quiet" type="button" data-action="orientation">Aide-moi à choisir</button></div>
      ${visibleFamilies.length ? visibleFamilies.map(family => `<section class="family-section"><div class="family-heading"><span class="family-icon" aria-hidden="true">${family.icon}</span><div><h2>${esc(family.name)}</h2><p>${esc(family.description)}</p></div></div><div class="domain-grid">${family.items.map(domain => `<button class="domain-card ${(domain.status === 'ready' || domain.status === 'guided') ? 'domain-ready' : ''}" type="button" data-domain-id="${esc(domain.id)}" data-route="domain/${domain.id}"><span class="domain-mark" aria-hidden="true">${(domain.status === 'ready' || domain.status === 'guided') ? '↗' : '✦'}</span><span class="domain-card-title">${esc(domain.name)}</span><span class="domain-card-description">${esc(domain.description || 'Contenu à vérifier avant de préparer un parcours.')}</span><span class="status-tag ${(domain.status === 'ready' || domain.status === 'guided') ? 'status-ready' : ''}">${domain.status === 'ready' ? 'PARCOURS PILOTE' : domain.status === 'guided' ? 'PARCOURS GUIDÉ' : 'À PRÉPARER'}</span></button>`).join('')}</div></section>`).join('') : `<div class="empty-state"><span aria-hidden="true">⌕</span><h2>Aucun domaine trouvé</h2><p>Essaie un autre mot ou enlève le filtre.</p><button class="button button-outline" type="button" data-action="clear-search">Effacer la recherche</button></div>`}
      <p class="catalog-note">Les parcours guidés sont des initiations à suivre à ton rythme. Les ressources externes peuvent être des catalogues généraux : vérifie leur langue, leur contenu et leurs conditions d’accès. Les activités ne remplacent pas une formation qualifiante ni l’encadrement requis.</p>
    </section>`;
    const input = document.querySelector('#catalog-search');
    input.addEventListener('input', () => {
      const cursor = input.selectionStart;
      searchTerm = input.value;
      renderCatalog();
      const refreshed = document.querySelector('#catalog-search');
      refreshed.focus();
      refreshed.setSelectionRange(cursor, cursor);
    });
    document.querySelector('#family-filter').addEventListener('change', event => {
      selectedFilter = event.target.value;
      renderCatalog();
    });
  }

  function buildSpecialtyQuizMarkup(quiz) {
    return quiz.map((question, questionIndex) => `
      <fieldset class="quiz-question">
        <legend>${questionIndex + 1}. ${esc(question.question)}</legend>
        ${question.options.map((option, optionIndex) => `
          <label class="quiz-option">
            <input type="radio" name="question-${questionIndex}" value="${optionIndex}" required>
            <span>${esc(option)}</span>
          </label>
        `).join('')}
      </fieldset>
    `).join('');
  }

  function handleSpecialtyQuizSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const quiz = JSON.parse(form.dataset.quiz || '[]');
    const answers = quiz.map((_, index) => Number(new FormData(form).get(`question-${index}`) ?? -1));
    const score = quiz.reduce((count, question, index) => count + (answers[index] === question.answer ? 1 : 0), 0);
    const result = form.nextElementSibling;
    if (!result) return;
    const explanations = quiz.map((question, index) => `<p><strong>${answers[index] === question.answer ? 'Bonne réponse.' : 'À revoir :'}</strong> ${esc(question.explanation)}</p>`).join('');
    result.hidden = false;
    result.classList.toggle('result-success', score === quiz.length);
    result.classList.toggle('result-retry', score < quiz.length);
    result.innerHTML = `<strong>Score : ${score} / ${quiz.length}</strong><p class="quiz-guidance">${score === quiz.length ? 'Tout juste, continue ainsi !' : 'Relis les explications et réessaie quand tu le souhaites.'}</p><div class="quiz-detail">${explanations}</div>`;
    form.querySelector('button[type="submit"]').textContent = 'Revoir le quiz';
    const domainId = form.dataset.domain;
    const sessionId = form.dataset.session;
    if (domainId && sessionId) {
      const key = `specialty:${domainId}:${sessionId}`;
      const previous = state.quizResults[key];
      state.quizResults[key] = { attempts: (previous?.attempts || 0) + 1, best: Math.max(previous?.best || 0, score), last: score, lastAnswers: answers, questionCount: quiz.length };
    }
    if (domainId && sessionId) {
      state.quizAnswers[`quiz-reviewed:${domainId}:${sessionId}`] = true;
      recordStudyActivity();
      saveState();
      document.querySelector(`[data-specialty-session="${domainId}"][data-session-id="${sessionId}"]`)?.removeAttribute('disabled');
      const hint = document.querySelector('#quiz-completion-hint');
      if (hint) hint.textContent = 'Quiz vérifié. Tu peux maintenant marquer ce cours comme terminé.';
    }
  }

  function renderSpecialtyDomain(id) {
    const profile = getPathwayProfile(id);
    const domain = findDomain(id);
    if (!profile || !domain) return setRoute('catalog', false);
    const related = activeDomains.filter(item => item.family === domain.family && item.id !== domain.id).slice(0, 4);
    const resourceSearchLanguage = { fr: 'français', en: 'English', es: 'Español' }[state.profile.resourceLanguage] || 'français';
    const guidedButtonStyle = state.profile.learningMode === 'free' ? 'button-outline' : 'button-primary';
    const freeButtonStyle = state.profile.learningMode === 'free' ? 'button-primary' : 'button-outline';
    const completedSessions = new Set(state.specialtyProgress[domain.id] || []);
    const sessionCount = profile.weeks.reduce((count, week) => count + week.sessions.length, 0);
    const completedCount = completedSessions.size;
    const progress = Math.round(completedCount / sessionCount * 100);
    const orderedSessionIds = profile.weeks.flatMap((week, weekIndex) => week.sessions.map((_, sessionIndex) => `${weekIndex}-${sessionIndex}`));
    const nextSessionId = orderedSessionIds.find(sessionId => !completedSessions.has(sessionId));
    const resourcesMarkup = profile.resources.map(resource => `<div class="source-resource">${externalLink(resource.url, `${resource.title} · ${resource.source}`, `${resource.language} · ${resource.source}`)}</div>`).join('');
    const weeksMarkup = profile.weeks.map((week, weekIndex) => `
      <article class="specialty-week">
        <p class="eyebrow">${esc(week.label)}</p>
        <h3>${esc(week.title)}</h3>
        <div class="specialty-sessions">
          ${week.sessions.map((session, sessionIndex) => {
            const sessionId = `${weekIndex}-${sessionIndex}`;
            const done = completedSessions.has(sessionId);
            const started = Boolean(state.quizResults[`specialty:${domain.id}:${sessionId}`]
              || state.quizAnswers[`note:${domain.id}:${sessionId}`]
              || state.quizAnswers[`quiz-reviewed:${domain.id}:${sessionId}`]);
            const isNext = !done && !started && sessionId === nextSessionId;
            const progressStatus = done ? 'Terminé' : started ? 'En cours' : isNext ? 'Prochaine étape' : 'À venir';
            const progressStatusClass = done ? 'is-done' : started ? 'is-started' : isNext ? 'is-next' : '';
            const resourceVideoId = youtubeVideoId(session.resource.url);
            const separateVideoId = youtubeVideoId(session.video);
            return `
            <section class="specialty-session">
              <h4>${esc(session.title)}</h4>
              <p><strong>Objectif :</strong> ${esc(session.objective)}</p>
              <p>${esc(session.explanation)}</p>
              <div class="lesson-resource">
                <p class="eyebrow">Ressource</p>
                ${externalLink(session.resource.url, session.resource.title, `${session.resource.language} · ${session.resource.source}`)}
              </div>
              <div class="resource-video">
                <p class="eyebrow">VIDÉO POUR CETTE SÉANCE</p>
                ${separateVideoId && separateVideoId !== resourceVideoId
                  ? `${videoButton(session.video, 'Regarder la vidéo du cours')}<p class="muted-copy">La vidéo se lit ici, dans Librescence.</p>`
                  : resourceVideoId
                    ? '<p class="muted-copy">La vidéo liée au cours se lit dans le lecteur intégré ci-dessus.</p>'
                  : `${externalLink(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${domain.name} ${session.title} ${resourceSearchLanguage}`)}`, `Chercher une vidéo sur « ${session.title} »`, `Résultats YouTube à vérifier · ${resourceSearchLanguage}`)}<p class="muted-copy">Aucune vidéo précise n’a encore été vérifiée pour cette séance.</p>`}
              </div>
              <div class="activity-card">
                <p class="eyebrow">EXERCICE PRATIQUE</p>
                <p>${esc(session.exercise)}</p>
              </div>
              <p class="lesson-status session-progress-status ${progressStatusClass}">${progressStatus}</p>
              <form class="specialty-quiz" data-quiz='${JSON.stringify(session.quiz).replace(/'/g, '&#39;')}' data-domain="${domain.id}" data-session="${weekIndex}-${sessionIndex}">
                ${buildSpecialtyQuizMarkup(session.quiz)}
                <button class="button button-outline" type="submit">Voir mon score</button>
              </form>
              <div class="quiz-result" hidden role="status" aria-live="polite"></div>
              <button class="button ${done ? 'button-complete' : 'button-outline'}" type="button" data-specialty-session="${domain.id}" data-session-id="${sessionId}" aria-pressed="${done}" ${!done && !state.quizAnswers[`quiz-reviewed:${domain.id}:${sessionId}`] ? 'disabled' : ''}>${done ? 'Séance terminée ✓' : 'Marquer la séance terminée'}</button>
            </section>
          `;
          }).join('')}
        </div>
      </article>
    `).join('');
    app.innerHTML = `<section class="page-shell">
      ${pageHeader(profile.eyebrow || 'INFORMATIQUE · PARCOURS Librescence', esc(profile.title), esc(profile.overview), 'catalog')}
      ${orientationAnswers ? `<aside class="orientation-summary"><strong>Ton point de départ</strong><p>${esc(orientationAnswers.level)} · ${esc(orientationAnswers.goal)} · ${esc(orientationAnswers.time)}</p><small>Ce conseil est facultatif. Tu peux changer de rythme ou de domaine.</small></aside>` : ''}
      <div class="domain-hero-grid">
        <div class="domain-intro">
          <p class="lead">${esc(profile.description)}</p>
          <div class="domain-actions">
            <button class="button ${guidedButtonStyle}" type="button" data-route="pathway-plan/${domain.id}">Choisir un parcours guidé</button>
            <button class="button ${freeButtonStyle}" type="button" data-route="resources/${domain.id}">Explorer librement les ressources</button>
            <button class="button button-quiet" type="button" data-route="catalog">Choisir un autre domaine</button>
          </div>
        </div>
        <aside class="domain-facts">
          <span class="status-tag">${profile.isGuidedIntro ? 'PARCOURS GUIDÉ · INITIATION' : 'PARCOURS INFORMATIQUE'}</span>
          <h2>Avant de commencer</h2>
          <dl>
            <div><dt>Compétences</dt><dd>${profile.skills.join(' · ')}</dd></div>
            <div><dt>Prérequis</dt><dd>${profile.prerequisites.map(item => esc(item)).join(' · ')}</dd></div>
            <div><dt>Matériel</dt><dd>${profile.equipment.map(item => esc(item)).join(' · ')}</dd></div>
            <div><dt>Temps estimé</dt><dd>${esc(profile.weeklyTime)}</dd></div>
          </dl>
        </aside>
      </div>
      <div class="notice notice-warning" role="status">${profile.isGuidedIntro ? 'Ce parcours propose une initiation en quatre étapes avec exercices, quiz et projet. Les liens sont des pistes de départ : vérifie leur adéquation et leur disponibilité. Les métiers cités sont des exemples, pas une promesse d’emploi.' : 'Cette version comprend déjà un programme, des séances, des activités, des quiz corrigés et un projet final. Les débouchés et vidéos restent à vérifier.'} La progression est enregistrée localement sur cet appareil.</div>
      ${profile.safetyNote ? `<aside class="risk-note"><strong>À garder en tête</strong><p>${esc(profile.safetyNote)}</p></aside>` : ''}
      <div class="progress-summary"><div class="progress-heading"><span>Progression de ce parcours</span><strong>${completedCount} / ${sessionCount} séances · ${progress}%</strong></div><div class="progress-track" role="progressbar" aria-label="Progression du parcours" aria-valuemin="0" aria-valuemax="${sessionCount}" aria-valuenow="${completedCount}"><span style="width:${progress}%"></span></div></div>
      <section class="domain-section">
        <p class="eyebrow">APERÇU DU PARCOURS</p>
        <h2>Quatre semaines, douze cours et un projet final</h2>
        <div class="learning-grid">
          ${profile.weeks.map((week, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(week.label)}</h3><p>${esc(week.title)}</p></article>`).join('')}
        </div>
      </section>
      <section class="domain-section">
        <p class="eyebrow">PISTES POUR LE DOMAINE</p>
        <h2>Explorer des ressources générales</h2>
        <div class="source-grid">${resourcesMarkup}</div>
        <p class="external-note">Ces pistes concernent le domaine dans son ensemble. Dans chaque cours, la ressource est choisie pour correspondre au thème de la séance; si aucun cours précis ne peut être confirmé, Librescence propose une recherche ciblée et l’indique clairement.</p>
      </section>
      <section class="domain-section">
        <p class="eyebrow">PISTES DE MÉTIERS</p>
        <h2>Des directions à explorer</h2>
        <p>${(profile.careers || []).map(esc).join(' · ') || 'Découvre les métiers du domaine et les formations reconnues dans ta région.'}</p>
        <p class="muted-copy">Ces exemples donnent des idées de métiers. Les compétences, diplômes et débouchés dépendent du pays et du poste visé.</p>
      </section>
      <section class="domain-section">
        <p class="eyebrow">PROJET FINAL</p>
        <h2>À réaliser à la fin du parcours</h2>
        <p>${esc(profile.project)}</p>
      </section>
      <section class="domain-section" id="specialty-sessions">
        <p class="eyebrow">SÉANCES</p>
        <h2>Choisis le rythme qui te convient pour ouvrir les cours dans l’ordre.</h2>
        <button class="button button-primary" type="button" data-route="pathway-plan/${domain.id}">Voir les durées et commencer</button>
      </section>
      <section class="domain-section">
        <button class="button button-primary" type="button" data-action="export-program">Imprimer ou télécharger le programme PDF</button>
      </section>
      <section class="domain-section"><p class="eyebrow">DOMAINE VOISIN</p><div class="chip-row">${related.map(item => `<button class="related-domain" type="button" data-route="domain/${item.id}">${esc(item.name)}</button>`).join('')}</div></section>
    </section>`;
  }

  function getGuidedLessons(profile) {
    return profile.weeks.flatMap((week, weekIndex) => week.sessions.map((session, sessionIndex) => ({
      ...session, id: `${weekIndex}-${sessionIndex}`, weekIndex, sessionIndex,
      weekLabel: week.label, weekTitle: week.title,
    })));
  }

  function formatStudyTime(minutes) {
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
  }

  function renderPathwayPlanPicker(id) {
    const domain = findDomain(id);
    const profile = getPathwayProfile(id);
    if (!domain || !profile) return setRoute('catalog', false);
    state.domain = domain.id;
    const count = getGuidedLessons(profile).length;
    const courseMinutes = count * 45;
    const reviewMinutes = profile.weeks.length * 20;
    const totalMinutes = courseMinutes + reviewMinutes;
    const options = [
      { id: 'two-weeks', title: '2 semaines', kicker: 'RYTHME SOUTENU', weeks: 2, detail: 'Deux cours environ par semaine.' },
      { id: 'four-weeks', title: '4 semaines', kicker: 'RYTHME PROGRESSIF', weeks: 4, detail: 'Un cours environ par semaine.' },
      { id: 'eight-weeks', title: '8 semaines', kicker: 'RYTHME DOUX', weeks: 8, detail: 'Un cours toutes les deux semaines, avec du temps pour réviser.' },
      { id: 'flex', title: 'À mon rythme', kicker: 'SANS CALENDRIER', weeks: 0, detail: 'Avance quand tu le souhaites, sans échéance.' },
    ];
    app.innerHTML = `<section class="page-shell">${pageHeader('CHOISIR SON RYTHME', `Parcours ${esc(domain.name)}`, 'Les cours, activités et quiz restent les mêmes; seul le calendrier change.', `domain/${domain.id}`)}
      <div class="plan-grid">${options.map(option => {
        const weeklyMinutes = option.weeks ? Math.ceil(totalMinutes / option.weeks) : 0;
        return `<button class="plan-card ${option.id === 'four-weeks' ? 'plan-card-featured' : ''}" type="button" data-pathway-plan="${option.id}"><span class="plan-kicker">${option.kicker}</span><strong>${option.title}</strong><span>${option.detail}</span><small>${count} cours · ${formatStudyTime(totalMinutes)} au total, révisions comprises · ${formatStudyTime(courseMinutes)} de cours et ${formatStudyTime(reviewMinutes)} de révision</small>${weeklyMinutes ? `<small>Environ ${formatStudyTime(weeklyMinutes)} par semaine</small>` : ''}<span class="plan-arrow">Choisir ce rythme →</span></button>`;
      }).join('')}</div><p class="muted-copy">Les durées sont des estimations. Tu peux changer de rythme sans perdre ta progression.</p></section>`;
  }

  function renderGuidedPathwayCourse(id, plan) {
    const domain = findDomain(id);
    const profile = getPathwayProfile(id);
    if (!domain || !profile) return setRoute('catalog', false);
    if (!['two-weeks', 'four-weeks', 'eight-weeks', 'flex'].includes(plan)) plan = 'four-weeks';
    state.domain = domain.id;
    state.plan = plan;
    const lessons = getGuidedLessons(profile);
    const done = new Set(state.specialtyProgress[domain.id] || []);
    const next = lessons.find(lesson => !done.has(lesson.id)) || lessons[lessons.length - 1];
    const courseMinutes = lessons.length * 45;
    const reviewMinutes = profile.weeks.length * 20;
    const totalMinutes = courseMinutes + reviewMinutes;
    const planNames = { 'two-weeks': '2 semaines', 'four-weeks': '4 semaines', 'eight-weeks': '8 semaines', flex: 'À mon rythme' };
    const weeks = { 'two-weeks': 2, 'four-weeks': 4, 'eight-weeks': 8, flex: 0 }[plan];
    const weeklyMinutes = weeks ? Math.ceil(totalMinutes / weeks) : 0;
    const progress = lessons.length ? Math.round(done.size / lessons.length * 100) : 0;
    app.innerHTML = `<section class="page-shell course-shell">${pageHeader(`PARCOURS GUIDÉ · ${esc(domain.name).toLocaleUpperCase('fr')}`, 'Ton chemin, dans l’ordre.', `${planNames[plan]} · ${lessons.length} cours · ${formatStudyTime(totalMinutes)} au total, révisions comprises${weeklyMinutes ? ` · environ ${formatStudyTime(weeklyMinutes)} par semaine` : ''}.`, `domain/${domain.id}`)}
      <div class="progress-summary"><div class="progress-heading"><span>${esc(domain.name)}</span><strong>${done.size} / ${lessons.length} cours · ${progress}%</strong></div><div class="progress-track" role="progressbar" aria-label="Progression de ${esc(domain.name)}" aria-valuemin="0" aria-valuemax="${lessons.length}" aria-valuenow="${done.size}"><span style="width:${progress}%"></span></div></div>
      <div class="course-intro"><div><p class="eyebrow">OBJECTIF DU PARCOURS</p><p>${esc(profile.description)}</p><p class="muted-copy">Cours estimés à 45 minutes chacun · ${formatStudyTime(reviewMinutes)} réservées à la révision · progression conservée sur cet appareil.</p></div><div class="course-intro-actions"><button class="button button-primary" type="button" data-route="lesson/${domain.id}/${next.id}">${done.size === lessons.length ? 'Revoir le dernier cours' : `Continuer : ${esc(next.title)}`} <span aria-hidden="true">→</span></button><button class="button button-outline" type="button" data-action="export-program">Imprimer / enregistrer le programme en PDF</button><button class="button button-quiet" type="button" data-action="change-pathway-plan">Changer de rythme</button></div></div>
      <div class="module-list">${profile.weeks.map((week, weekIndex) => `<section class="module-card"><div class="module-heading"><span class="module-index">${String(weekIndex + 1).padStart(2, '0')}</span><div><h2>${esc(week.title)}</h2><p>${esc(week.label)}</p></div><span class="module-count">${week.sessions.filter((_, sessionIndex) => done.has(`${weekIndex}-${sessionIndex}`)).length}/${week.sessions.length}</span></div><ol class="lesson-list">${week.sessions.map((lesson, sessionIndex) => { const sessionId = `${weekIndex}-${sessionIndex}`; const isDone = done.has(sessionId); const started = Boolean(state.quizResults[`specialty:${domain.id}:${sessionId}`] || state.quizAnswers[`note:${domain.id}:${sessionId}`] || state.quizAnswers[`quiz-reviewed:${domain.id}:${sessionId}`]); const isNext = !isDone && !started && next.id === sessionId; const status = isDone ? 'Terminé ✓' : started ? 'En cours' : isNext ? 'Prochaine étape' : 'À venir'; const statusClass = isDone ? 'is-done' : started ? 'is-started' : isNext ? 'is-next' : ''; return `<li><button class="lesson-row" type="button" data-route="lesson/${domain.id}/${sessionId}"><span class="lesson-number">${String(lessons.findIndex(item => item.id === sessionId) + 1).padStart(2, '0')}</span><span class="lesson-name">${esc(lesson.title)}<small>45 min · ressource, exercice et quiz</small></span><span class="lesson-status ${statusClass}">${status}</span></button></li>`; }).join('')}</ol></section>`).join('')}</div>
      ${done.size === lessons.length ? `<div class="finish-callout"><span class="badge-icon" aria-hidden="true">✦</span><div><strong>Les cours sont terminés !</strong><p>${esc(profile.project)}</p></div><button class="button button-primary" type="button" data-route="domain/${domain.id}">Voir le projet final</button></div>` : ''}
    </section>`;
  }

  function renderGuidedPathwayLesson(id, sessionId) {
    const domain = findDomain(id);
    const profile = getPathwayProfile(id);
    if (!domain || !profile) return setRoute('catalog', false);
    const lessons = getGuidedLessons(profile);
    const index = lessons.findIndex(lesson => lesson.id === sessionId);
    if (index < 0) return setRoute(`course/${domain.id}/${state.plan || 'four-weeks'}`, false);
    const lesson = lessons[index];
    const done = new Set(state.specialtyProgress[domain.id] || []).has(lesson.id);
    const completed = new Set(state.specialtyProgress[domain.id] || []);
    const percent = lessons.length ? Math.round(completed.size / lessons.length * 100) : 0;
    const quizMarkup = buildSpecialtyQuizMarkup(lesson.quiz);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${domain.name} ${lesson.title} cours français`)}`;
    const resourceVideoId = youtubeVideoId(lesson.resource.url);
    const lessonVideoId = youtubeVideoId(lesson.video);
    app.innerHTML = `<section class="page-shell lesson-shell">${pageHeader(`${esc(domain.name).toLocaleUpperCase('fr')} · COURS ${String(index + 1).padStart(2, '0')} / ${lessons.length}`, esc(lesson.title), 'Un cours à la fois, sans date limite.', `course/${domain.id}/${state.plan || 'four-weeks'}`)}
      <div class="progress-summary"><div class="progress-heading"><span>Progression du parcours</span><strong>${completed.size} / ${lessons.length} cours · ${percent}%</strong></div><div class="progress-track" role="progressbar" aria-label="Progression du parcours" aria-valuemin="0" aria-valuemax="${lessons.length}" aria-valuenow="${completed.size}"><span style="width:${percent}%"></span></div></div>${focusTimerMarkup()}
      <article class="lesson-card"><p class="eyebrow">OBJECTIF DU COURS</p><h2>${esc(lesson.objective)}</h2><p class="lesson-explanation">${esc(lesson.explanation)}</p>
        <div class="lesson-resource"><p class="eyebrow">RESSOURCE POUR CE COURS</p>${externalLink(lesson.resource.url, lesson.resource.title, `${lesson.resource.language || 'Langue à vérifier'} · ${lesson.resource.source || 'Source'}`)}<small>${lesson.resource.isSearch ? 'Aucun cours précis n’a été confirmé pour ce thème : cette recherche porte sur le titre exact de la séance. Vérifie le contenu avant de le suivre.' : 'Cette ressource a été retenue pour son lien avec le thème de la séance. Vérifie sa langue, son niveau et ses conditions d’accès.'}</small></div>
        <div class="resource-video"><p class="eyebrow">VIDÉO COMPLÉMENTAIRE</p>${lessonVideoId && lessonVideoId !== resourceVideoId ? `${videoButton(lesson.video, 'Regarder la vidéo du cours')}<p class="muted-copy">La vidéo se lit ici, dans Librescence.</p>` : resourceVideoId ? '<p class="muted-copy">La vidéo du cours se lit dans le lecteur intégré ci-dessus.</p>' : `${externalLink(youtubeUrl, `Chercher une vidéo sur ${lesson.title}`, 'La recherche YouTube s’ouvre séparément; choisis une vidéo intégrable pour la lire dans Librescence.')}<p class="muted-copy">Aucune vidéo précise n’a été vérifiée pour cette séance.</p>`}</div>
        <section class="activity-card"><p class="eyebrow">À TOI D’ESSAYER</p><h3>Activité pratique</h3><p>${esc(lesson.exercise)}</p><label for="pathway-note">Tes notes (facultatif, conservées sur cet appareil)</label><textarea id="pathway-note" rows="3" maxlength="1000" placeholder="Note ce que tu as essayé ou appris…">${esc(state.quizAnswers[`note:${domain.id}:${lesson.id}`] || '')}</textarea></section>
        <section class="quiz-card"><p class="eyebrow">VÉRIFIER CE QUE TU AS RETENU</p><h3>Petit quiz</h3><form class="specialty-quiz" data-quiz='${JSON.stringify(lesson.quiz).replace(/'/g, '&#39;')}' data-domain="${domain.id}" data-session="${lesson.id}">${quizMarkup}<button class="button button-outline" type="submit">Vérifier mes réponses</button></form><div class="quiz-result" hidden role="status"></div></section>
        <div class="lesson-completion"><button class="button ${done ? 'button-complete' : 'button-primary'}" type="button" data-specialty-session="${domain.id}" data-session-id="${lesson.id}" aria-pressed="${done}" ${!done && !state.quizAnswers[`quiz-reviewed:${domain.id}:${lesson.id}`] ? 'disabled' : ''}>${done ? 'Cours terminé ✓' : 'Marquer le cours terminé'}</button><span id="quiz-completion-hint">${done ? 'Ta progression est enregistrée.' : state.quizAnswers[`quiz-reviewed:${domain.id}:${lesson.id}`] ? 'Quiz vérifié : tu peux terminer ce cours.' : 'Réponds au quiz et vérifie tes réponses avant de terminer ce cours.'}</span></div>
      </article><div class="lesson-navigation">${index > 0 ? `<button class="button button-quiet" type="button" data-route="lesson/${domain.id}/${lessons[index - 1].id}">← Cours précédent</button>` : '<span></span>'}${index < lessons.length - 1 ? `<button class="button button-primary" type="button" data-route="lesson/${domain.id}/${lessons[index + 1].id}">Cours suivant →</button>` : `<button class="button button-primary" type="button" data-route="course/${domain.id}/${state.plan || 'four-weeks'}">Voir le projet final →</button>`}</div>
    </section>`;
    document.querySelector('#pathway-note').addEventListener('input', event => {
      state.quizAnswers[`note:${domain.id}:${lesson.id}`] = event.target.value;
      saveState();
    });
    updateFocusTimerDisplay();
  }

  function renderPathwayResources(id) {
    const domain = findDomain(id);
    const profile = getPathwayProfile(id);
    if (!domain || !profile) return setRoute('catalog', false);
    const unique = [...new Map(profile.resources.map(resource => [resource.url, resource])).values()];
    app.innerHTML = `<section class="page-shell">${pageHeader('RESSOURCES · ' + esc(domain.name).toLocaleUpperCase('fr'), 'Explorer librement.', `Des ressources pour découvrir ${esc(domain.name)} sans suivre le programme dans l’ordre.`, `domain/${domain.id}`)}<div class="resource-list">${unique.map(resource => externalLink(resource.url, `${resource.title} · ${resource.source || ''}`, `${resource.language || 'Langue à vérifier'} · vérifie les conditions d’accès`)).join('')}</div><p class="external-note">Les ressources s’ouvrent sur les sites de leurs fournisseurs. Certaines sont des catalogues et non un cours précis; vérifie qu’elles couvrent le sujet voulu.</p><button class="button button-primary" type="button" data-route="pathway-plan/${domain.id}">Choisir un parcours guidé</button></section>`;
  }

  function renderDomain(id) {
    const domain = findDomain(id);
    if (!domain) return setRoute('catalog', false);
    if (id !== domain.id) {
      currentRoute = `domain/${domain.id}`;
      history.replaceState({ route: currentRoute }, '', `#${currentRoute}`);
    }
    if (getPathwayProfile(domain.id)) return renderSpecialtyDomain(domain.id);
    if (domain.id !== 'web') {
      const family = families.find(item => item.id === domain.family);
      const related = activeDomains.filter(item => item.family === domain.family && item.id !== domain.id).slice(0, 4);
      const resources = domain.resources || [];
      const resourcesMarkup = resources.map(resource =>
        externalLink(resource.url, resource.title, `${resource.language || 'Langue à vérifier'} · ${resource.source || 'Source à vérifier'}`)
      ).join('');
      app.innerHTML = `<section class="page-shell">${pageHeader(family.name.toLocaleUpperCase('fr'), esc(domain.name), esc(domain.description || 'Découvrir ce domaine et ses possibilités.'), 'catalog')}
        ${orientationAnswers ? `<aside class="orientation-summary"><strong>Ton point de départ</strong><p>${esc(orientationAnswers.level)} · ${esc(orientationAnswers.goal)} · ${esc(orientationAnswers.time)}</p><small>Ce conseil est facultatif. Tu peux changer de rythme ou de domaine.</small></aside>` : ''}
        <div class="prepared-panel"><span class="status-tag">CONTENU EN PRÉPARATION</span><h2>La fiche du domaine est disponible; le parcours ne l’est pas encore.</h2><p>${esc(domain.description || 'La description de ce domaine reste à rédiger.')}</p><p>Le catalogue peut contenir des pistes externes, mais elles ne sont pas encore reliées à des séances vérifiées. Aucun cours n’est présenté ici comme terminé ou prêt à suivre.</p><h3>Éléments à préparer et contrôler</h3><ul>${contentMissing.map(item => `<li>${esc(item)}</li>`).join('')}</ul>${domainSafetyNotes[domain.id] ? `<aside class="risk-note"><strong>Point de vigilance à intégrer</strong><p>${esc(domainSafetyNotes[domain.id])}</p></aside>` : ''}<button class="button button-primary" type="button" data-route="catalog">Revenir au catalogue</button></div>
        ${resourcesMarkup ? `<section class="domain-section"><p class="eyebrow">PISTES EXTERNES À VÉRIFIER</p><div class="source-grid">${resourcesMarkup}</div><p class="external-note">Ces liens sont des pistes, parfois des catalogues généraux; leur disponibilité, leur langue, leur adéquation au sous-domaine et leurs conditions d’accès restent à contrôler. Ils ne remplacent pas des liens associés à des séances.</p></section>` : ''}
        <section class="domain-section"><p class="eyebrow">MÊME FAMILLE</p><h2>Quelques domaines voisins</h2><p class="muted-copy">Ces suggestions indiquent seulement leur famille dans le catalogue ; elles ne constituent pas une recommandation de parcours.</p><div class="chip-row">${related.map(item => `<button class="related-domain" type="button" data-route="domain/${item.id}">${esc(item.name)} · À préparer</button>`).join('')}</div></section></section>`;
      return;
    }
    const guidedButtonStyle = state.profile.learningMode === 'free' ? 'button-outline' : 'button-primary';
    const freeButtonStyle = state.profile.learningMode === 'free' ? 'button-primary' : 'button-outline';
    app.innerHTML = `<section class="page-shell">
      ${pageHeader('INFORMATIQUE · PARCOURS PILOTE', 'Développement web', 'Créer des pages utiles et accessibles, puis les partager.', 'catalog')}
      ${orientationAnswers ? `<aside class="orientation-summary"><strong>Ton point de départ</strong><p>${orientationAnswers.level} · ${orientationAnswers.goal} · ${orientationAnswers.time}</p><small>Ce conseil est facultatif. Tu peux changer de rythme ou de domaine.</small></aside>` : ''}
      <div class="domain-hero-grid"><div class="domain-intro"><p class="lead">Le développement web consiste à concevoir et construire les pages et services que l’on consulte dans un navigateur.</p><p>Tu apprendras à organiser du contenu avec HTML, à le rendre lisible avec CSS et à découvrir JavaScript pour ajouter de petites interactions. À la fin, tu pourras réaliser et présenter une page web personnelle.</p><div class="domain-actions"><button class="button ${guidedButtonStyle}" type="button" data-action="choose-plan">Choisir un parcours guidé</button><button class="button ${freeButtonStyle}" type="button" data-route="resources/web">Explorer librement les ressources</button></div></div>
      <aside class="domain-facts"><span class="status-tag status-ready">PARCOURS PILOTE DISPONIBLE</span><h2>Avant de commencer</h2><dl><div><dt>Prérequis</dt><dd>Aucune expérience en programmation nécessaire.</dd></div><div><dt>Matériel</dt><dd>Un ordinateur est recommandé pour écrire et tester les fichiers. Tu peux commencer à explorer avec un téléphone, mais le codage sera moins confortable.</dd></div><div><dt>Internet</dt><dd>Utile pour consulter les guides et ouvrir les ressources. Les fichiers d’exercice peuvent ensuite être travaillés hors ligne.</dd></div></dl></aside></div>
      <section class="domain-section"><p class="eyebrow">CE QUE TU VAS EXPLORER</p><h2>De la première page à un projet à toi.</h2><div class="learning-grid"><article><span>01</span><h3>Comprendre</h3><p>Le navigateur, les pages et les fichiers qui forment un site.</p></article><article><span>02</span><h3>Construire</h3><p>Des contenus structurés avec HTML et une présentation avec CSS.</p></article><article><span>03</span><h3>Essayer</h3><p>Les bases d’une interaction JavaScript et des vérifications utiles.</p></article></div></section>
      <section class="domain-section"><p class="eyebrow">COMPÉTENCES & OUTILS</p><div class="chip-row"><span>HTML</span><span>CSS</span><span>Premiers pas en JavaScript</span><span>Navigateur</span><span>Éditeur de texte</span><span>Accessibilité</span></div><p class="muted-copy">Ces outils commencent par des fichiers simples, gratuits à créer. Aucun hébergement payant n’est requis pour les exercices de ce parcours.</p></section>
      <section class="domain-section career-section"><div><p class="eyebrow">PISTES POUR PLUS TARD</p><h2>Un domaine, plusieurs directions.</h2><p>Les métiers du web comprennent notamment le développement front-end, l’intégration web, le développement back-end et la conception d’interfaces. Le parcours d’initiation ne qualifie pas à lui seul pour ces métiers ; il t’aide à découvrir les bases.</p></div><div class="project-preview"><span class="preview-symbol" aria-hidden="true">&lt;/&gt;</span><strong>Ton premier projet</strong><small>Une page ou un petit site que tu peux présenter.</small></div></section>
      <section class="domain-section source-section"><p class="eyebrow">RESSOURCES D’INTRODUCTION ATTRIBUÉES</p><h2>Des repères pour apprendre.</h2><div class="source-grid">${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development', 'Apprendre le développement web — MDN')}${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development/Getting_started/Your_first_website', 'Premiers pas sur le Web — MDN')}${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Accessibility', 'Accessibilité — MDN')}</div><p class="external-note">Liens externes : les pages s’ouvrent dans un nouvel onglet. Ces ressources sont principalement disponibles en français. Aucune vidéo n’est proposée tant qu’un contenu vidéo précis n’a pas été vérifié.</p></section>
    </section>`;
  }

  function renderResources() {
    app.innerHTML = `<section class="page-shell">${pageHeader('RESSOURCES WEB', 'Explorer librement.', 'Des guides attribués pour découvrir le développement web sans suivre un ordre imposé.', 'domain/web')}
      <div class="resource-list">${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development/Getting_started/Your_first_website', 'Créer son premier site web — MDN')}${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Structuring_content', 'Structurer le contenu HTML — MDN')}${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Styling_basics', 'Découvrir CSS — MDN')}${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Scripting', 'Découvrir JavaScript — MDN')}${externalLink('https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Accessibility', 'Accessibilité web — MDN')}</div>
      <p class="external-note">Les guides cités sont ceux du réseau de documentation MDN en français. Ils s’ouvrent sur un site externe et peuvent nécessiter une connexion Internet. Aucun lecteur vidéo n’est affiché : aucune vidéo spécifique n’a été vérifiée.</p>
      <button class="button button-primary" type="button" data-action="choose-plan">Choisir un parcours guidé</button></section>`;
  }

  function renderPlanPicker() {
    app.innerHTML = `<section class="page-shell">${pageHeader('CHOISIR SON RYTHME', 'Un programme, trois façons d’avancer.', 'Les cours sont identiques et dans le même ordre. Le rythme est une proposition flexible, pas une échéance.', 'domain/web')}
      <div class="plan-grid">
        <button class="plan-card" type="button" data-plan="two-weeks"><span class="plan-kicker">RYTHME SOUTENU</span><strong>2 semaines</strong><span>Environ 3 h 30 par semaine</span><small>${lessons.length} cours · environ ${Math.ceil(totalMinutes / 60)} h au total</small><span class="plan-arrow">Choisir ce rythme →</span></button>
        <button class="plan-card" type="button" data-plan="four-weeks"><span class="plan-kicker">RYTHME PROGRESSIF</span><strong>4 semaines</strong><span>Environ 1 h 45 par semaine</span><small>${lessons.length} cours · environ ${Math.ceil(totalMinutes / 60)} h au total</small><span class="plan-arrow">Choisir ce rythme →</span></button>
        <button class="plan-card" type="button" data-plan="eight-weeks"><span class="plan-kicker">RYTHME DOUX</span><strong>8 semaines</strong><span>Environ 1 h par semaine</span><small>${lessons.length} cours · environ ${Math.ceil(totalMinutes / 60)} h au total</small><span class="plan-arrow">Choisir ce rythme →</span></button>
        <button class="plan-card plan-card-featured" type="button" data-plan="flex"><span class="plan-kicker">SANS CALENDRIER</span><strong>À mon rythme</strong><span>Fais des pauses quand tu en as besoin.</span><small>Les cours restent dans l’ordre recommandé.</small><span class="plan-arrow">Choisir ce rythme →</span></button>
      </div><p class="muted-copy">Le temps annoncé est une estimation, pas une promesse de résultat. Tu peux changer de rythme sans perdre ta progression.</p></section>`;
  }

  function renderCourse(plan) {
    const planNames = { 'two-weeks': '2 semaines', 'four-weeks': '4 semaines', 'eight-weeks': '8 semaines', flex: 'À mon rythme' };
    const weeklyMinutes = plan === 'two-weeks' ? Math.ceil(totalMinutes / 2) : plan === 'four-weeks' ? Math.ceil(totalMinutes / 4) : plan === 'eight-weeks' ? Math.ceil(totalMinutes / 8) : 0;
    const hoursText = weeklyMinutes ? `${Math.floor(weeklyMinutes / 60)} h ${String(weeklyMinutes % 60).padStart(2, '0')} par semaine environ` : 'sans calendrier fixe';
    const next = lessons.find(lesson => !state.completed.includes(lesson.id)) || lessons[lessons.length - 1];
    app.innerHTML = `<section class="page-shell course-shell">${pageHeader('PARCOURS GUIDÉ · DÉVELOPPEMENT WEB', 'Ton chemin, dans l’ordre.', `${planNames[plan]} · ${lessons.length} cours · environ ${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} au total · ${hoursText}.`, 'domain/web')}
      ${progressSummary()}<div class="course-intro"><div><p class="eyebrow">OBJECTIF DU PARCOURS</p><p>Créer une page personnelle structurée, lisible et interactive, puis la présenter. Chaque module s’appuie sur le précédent ; tu peux cependant ouvrir n’importe quel cours.</p><p class="muted-copy">Niveau : débutant · aucun prérequis technique. L’ordinateur est recommandé pour écrire et tester les fichiers.</p></div><div class="course-intro-actions"><button class="button button-primary" type="button" data-route="lesson/${next.id}">${state.completed.length === lessons.length ? 'Revoir le dernier cours' : 'Continuer : ' + esc(next.title)} <span aria-hidden="true">→</span></button><button class="button button-outline" type="button" data-action="export-program">Imprimer / enregistrer le programme en PDF</button></div></div>
      <div class="module-list">${modules.map((module, moduleIndex) => `<section class="module-card"><div class="module-heading"><span class="module-index">0${moduleIndex + 1}</span><div><h2>${esc(module.title.replace(/^\d\. /, ''))}</h2><p>${esc(module.description)}</p></div><span class="module-count">${module.lessons.filter(item => state.completed.includes(item.id)).length}/${module.lessons.length}</span></div><ol class="lesson-list">${module.lessons.map(lesson => {
        const index = lessons.findIndex(item => item.id === lesson.id);
        const done = state.completed.includes(lesson.id);
        const started = Boolean(state.quizResults[lesson.id] || state.quizAnswers[`note:${lesson.id}`]);
        const isNext = !done && !started && lesson.id === next.id;
        const status = done ? 'Terminé ✓' : started ? 'En cours' : isNext ? 'Prochaine étape' : 'À venir';
        const statusClass = done ? 'is-done' : started ? 'is-started' : isNext ? 'is-next' : '';
        return `<li><button class="lesson-row" type="button" data-route="lesson/${lesson.id}"><span class="lesson-number">${String(index + 1).padStart(2, '0')}</span><span class="lesson-name">${esc(lesson.title)}<small>${lesson.duration} min · quiz et activité</small></span><span class="lesson-status ${statusClass}">${status}</span></button></li>`;
      }).join('')}</ol></section>`).join('')}</div>
      ${state.completed.length === lessons.length ? `<div class="finish-callout"><span class="badge-icon" aria-hidden="true">✦</span><div><strong>Les cours sont terminés !</strong><p>À toi de jouer avec le projet final.</p></div><button class="button button-primary" type="button" data-route="project">Voir le projet final</button></div>` : ''}
    </section>`;
  }

  function renderLesson(id) {
    const lesson = lessons.find(item => item.id === id);
    if (!lesson) return setRoute('catalog', false);
    const lessonIndex = lessons.findIndex(item => item.id === id);
    const savedAnswers = state.quizAnswers[id] || [];
    const result = state.quizResults[id];
    const done = state.completed.includes(id);
    app.innerHTML = `<section class="page-shell lesson-shell">${pageHeader(`${esc(lesson.moduleTitle)} · COURS ${String(lessonIndex + 1).padStart(2, '0')} / ${lessons.length}`, esc(lesson.title), `${lesson.duration} minutes environ · un cours à la fois, sans date limite.`, `course/web/${state.plan}`)}
      ${progressSummary()}${focusTimerMarkup()}<article class="lesson-card"><p class="eyebrow">OBJECTIF</p><h2>${esc(lesson.objective)}</h2><p class="lesson-explanation">${esc(lesson.explanation)}</p>
        <div class="lesson-resource"><p class="eyebrow">RESSOURCE VÉRIFIÉE · GUIDE ÉCRIT</p>${externalLink(lesson.resource.url, lesson.resource.title)}<small>Source : contributeurs MDN · Langue : français · Niveau : débutant · Liens contrôlés le 18 novembre 2026 · connexion Internet utile.</small></div>
        <aside class="no-video"><span aria-hidden="true">◉</span><p>Aucune vidéo vérifiée pour ce cours. Le guide écrit reste disponible, et le cours ne dépend pas d’une vidéo.</p></aside>
        <section class="activity-card"><p class="eyebrow">À TOI D’ESSAYER</p><h3>Petite activité</h3><p>${esc(lesson.activity)}</p><label for="activity-note">Tes notes (facultatif, enregistrées sur cet appareil)</label><textarea id="activity-note" rows="3" maxlength="1000" placeholder="Note une idée ou ce que tu as découvert…">${esc(state.quizAnswers[`note:${id}`] || '')}</textarea></section>
        <section class="quiz-card"><p class="eyebrow">VÉRIFIER CE QUE TU AS RETENU</p><h3>Petit quiz</h3><form id="quiz-form" data-lesson="${lesson.id}">${lesson.quiz.map((question, questionIndex) => `<fieldset class="quiz-question"><legend>${questionIndex + 1}. ${esc(question.question)}</legend>${question.options.map((option, optionIndex) => `<label class="quiz-option"><input type="radio" name="question-${questionIndex}" value="${optionIndex}" ${Number(savedAnswers[questionIndex]) === optionIndex ? 'checked' : ''} required><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}<button class="button button-outline" type="submit">Vérifier mes réponses</button></form>
        ${result ? `<div class="quiz-result ${result.last === lesson.quiz.length ? 'result-success' : 'result-retry'}" role="status"><strong>Meilleur résultat : ${result.best} / ${lesson.quiz.length}</strong><span>${result.attempts} tentative${result.attempts > 1 ? 's' : ''} · ${result.last === lesson.quiz.length ? 'Tout juste !' : 'Relis les explications et réessaie quand tu le souhaites.'}</span>${lesson.quiz.map((question, index) => `<p><b>${Number(result.lastAnswers?.[index]) === question.answer ? 'Bonne réponse.' : 'À revoir :'}</b> ${esc(question.explanation)}</p>`).join('')}</div>` : ''}
        </section>
        <div class="lesson-completion"><button class="button ${done ? 'button-complete' : 'button-primary'}" type="button" data-action="complete-lesson" data-lesson="${lesson.id}">${done ? 'Cours terminé ✓' : 'Marquer le cours terminé'}</button><span>${done ? 'Ta progression est enregistrée.' : 'Le quiz peut être réessayé sans pénalité.'}</span></div>
      </article>
      <div class="lesson-navigation">${lessonIndex > 0 ? `<button class="button button-quiet" type="button" data-route="lesson/${lessons[lessonIndex - 1].id}">← Cours précédent</button>` : '<span></span>'}${lessonIndex < lessons.length - 1 ? `<button class="button button-primary" type="button" data-route="lesson/${lessons[lessonIndex + 1].id}">Cours suivant →</button>` : state.completed.length === lessons.length ? `<button class="button button-primary" type="button" data-route="project">Découvrir le projet final →</button>` : `<button class="button button-primary" type="button" data-action="complete-lesson" data-lesson="${lesson.id}">Terminer ce cours →</button>`}</div>
    </section>`;
    const notes = document.querySelector('#activity-note');
    notes.addEventListener('input', () => {
      state.quizAnswers[`note:${id}`] = notes.value;
      saveState();
    });
    updateFocusTimerDisplay();
  }

  function renderProject() {
    if (state.completed.length < lessons.length) {
      const next = lessons.find(lesson => !state.completed.includes(lesson.id));
      app.innerHTML = `<section class="page-shell">${pageHeader('PROJET FINAL · DÉVELOPPEMENT WEB', 'Ton projet se débloque à la fin des cours.', 'Le projet final rassemble les compétences des quatre modules. Tu peux reprendre les cours à ton rythme.', `course/web/${state.plan}`)}<div class="prepared-panel"><h2>Encore ${lessons.length - state.completed.length} cours avant le projet.</h2><p>Tu peux explorer tous les cours, sans date limite. Le projet final sera disponible dès qu’ils seront terminés.</p><button class="button button-primary" type="button" data-route="lesson/${next.id}">Reprendre : ${esc(next.title)}</button></div></section>`;
      return;
    }
    const checklist = [
      'Choisir le sujet et le public de ma page.',
      'Écrire un titre, quelques informations et des liens utiles.',
      'Mettre en forme la page pour qu’elle soit lisible.',
      'Vérifier le rendu sur téléphone ou petite fenêtre.',
      'Parcourir les liens et les boutons au clavier.',
      'Présenter mon travail à une personne de confiance.',
    ];
    const allDone = checklist.every((_, index) => state.project.checks[index]);
    app.innerHTML = `<section class="page-shell project-shell">${pageHeader('PROJET FINAL · DÉVELOPPEMENT WEB', 'Une page qui parle de toi.', 'Crée une petite page ou une application web et présente-la. C’est ton projet : il n’est pas évalué automatiquement.', `course/web/${state.plan}`)}
      <div class="project-banner"><span class="project-symbol" aria-hidden="true">&lt;/&gt;</span><div><p class="eyebrow">LE DÉFI</p><h2>Rassemble tes nouvelles compétences.</h2><p>Réalise une page sur un sujet qui te plaît : une présentation, une idée, une passion ou un petit service imaginaire.</p></div></div>
      <div class="project-grid"><section class="project-instructions"><h2>Étapes proposées</h2><ol><li>Décris en une phrase à qui s’adresse ta page.</li><li>Organise son contenu en titres et petites sections.</li><li>Ajoute des styles lisibles et adapte la page à un petit écran.</li><li>Teste la navigation, puis partage ton travail si tu le souhaites.</li></ol><p>Tu peux travailler dans les fichiers que tu as créés pendant les cours. Rien n’est noté ni soumis automatiquement.</p><label class="field-label" for="project-url">Lien vers ton travail (facultatif)</label><input id="project-url" type="url" inputmode="url" placeholder="https://…" value="${esc(state.project.url)}"><small>Ajoute uniquement un lien public que tu souhaites partager.</small></section>
      <section class="checklist-card"><p class="eyebrow">LISTE DE VÉRIFICATION</p><h2>À vérifier avant de présenter</h2>${checklist.map((item, index) => `<label class="check-item"><input type="checkbox" data-project-check="${index}" ${state.project.checks[index] ? 'checked' : ''}><span>${esc(item)}</span></label>`).join('')}<button class="button button-primary" type="button" data-action="complete-project" ${allDone && state.project.completed ? 'disabled' : ''}>${state.project.completed ? 'Projet déclaré terminé ✓' : 'Déclarer mon projet terminé'}</button><p class="check-note">Tu peux déclarer le projet terminé même si tu n’as pas coché chaque étape.</p></section></div>
      ${state.project.completed ? `<section class="celebration-card"><div class="celebration-spark" aria-hidden="true">✦</div><span class="badge-icon" aria-hidden="true">✧</span><p class="eyebrow">TU AS CRÉÉ QUELQUE CHOSE</p><h2>Bravo pour ton projet !</h2><p>Tu as déclaré ton projet terminé. Tu as exploré ${lessons.length} cours, essayé le HTML, le CSS et JavaScript, et mené une idée jusqu’à une réalisation. Le projet n’a pas été évalué automatiquement.</p>${state.project.url ? externalLink(state.project.url, 'Voir le lien que tu as partagé') : ''}<div class="reward-row"><span>✦ ${state.xp} XP</span><span>◉ ${state.coins} pièces virtuelles</span><span>Badge : Premier projet</span></div><div class="portfolio-cta"><p>Tu peux garder une fiche de ton projet dans ton portfolio privé sur cet appareil.</p><button class="button button-outline" type="button" data-route="portfolio/new">Ajouter ce projet au portfolio</button><button class="button button-quiet" type="button" data-route="portfolio">Voir mon portfolio</button></div></section>` : ''}
    </section>`;
    document.querySelector('#project-url').addEventListener('change', event => {
      const value = event.target.value.trim();
      if (value && !/^https:\/\//i.test(value)) {
        event.target.setCustomValidity('Utilise un lien HTTPS.');
        event.target.reportValidity();
        return;
      }
      event.target.setCustomValidity('');
      state.project.url = value;
      saveState();
    });
  }

  function renderPortfolio() {
    const records = [...state.portfolio].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    app.innerHTML = `<section class="page-shell">${pageHeader('PORTFOLIO PERSONNEL', 'Les projets que tu as choisis de garder.', 'Ces fiches restent privées sur cet appareil. Rien n’est publié ni transmis.', 'progress')}
      <div class="portfolio-toolbar"><button class="button button-primary" type="button" data-route="portfolio/new">Ajouter un projet</button><button class="button button-outline" type="button" data-action="export-program">Imprimer le programme du parcours</button></div>
      <div class="notice notice-warning">Le portfolio n’est pas synchronisé entre appareils. Le partage par lien n’est pas activé faute de service sécurisé. Les pièces jointes restent dans le stockage local de ce navigateur.</div>
      ${records.length ? `<div class="portfolio-grid">${records.map(project => {
        const domain = findDomain(project.domain);
        return `<article class="portfolio-card"><p class="eyebrow">${esc(domain?.name || 'Domaine')} · ${esc(project.date || 'Date non précisée')}</p><h2>${esc(project.title)}</h2><p>${esc(project.description)}</p><dl>${project.skills ? `<div><dt>Compétences</dt><dd>${esc(project.skills)}</dd></div>` : ''}${project.difficulties ? `<div><dt>Difficultés</dt><dd>${esc(project.difficulties)}</dd></div>` : ''}${project.learnings ? `<div><dt>Apprentissages</dt><dd>${esc(project.learnings)}</dd></div>` : ''}</dl>${project.url ? externalLink(project.url, 'Voir le projet publié') : ''}${project.files.length ? `<div class="portfolio-files"><strong>Pièces jointes</strong>${project.files.map(file => `<button class="file-link" type="button" data-file-open="${esc(file.id)}">${esc(file.name)} · ${file.type === 'application/pdf' ? 'PDF' : 'image'}</button>`).join('')}</div>` : ''}<div class="portfolio-actions"><button class="button button-quiet" type="button" data-route="portfolio/edit/${project.id}">Modifier</button><button class="button button-quiet" type="button" data-action="export-project" data-project-id="${project.id}">Imprimer / PDF</button><button class="button button-quiet" type="button" data-action="delete-project" data-project-id="${project.id}">Supprimer</button><button class="button button-quiet" type="button" disabled title="Le partage nécessite un service de stockage public sécurisé.">Copier le lien — indisponible</button></div></article>`;
      }).join('')}</div>` : `<div class="empty-state"><span aria-hidden="true">✦</span><h2>Ton portfolio commence quand tu veux.</h2><p>Ajoute une fiche à partir d’un projet que tu as réalisé. Elle restera privée sur cet appareil.</p><button class="button button-primary" type="button" data-route="portfolio/new">Créer une fiche de projet</button></div>`}
    </section>`;
  }

  function renderPortfolioForm(projectId = '') {
    const existing = state.portfolio.find(item => item.id === projectId);
    if (projectId && !existing) return setRoute('portfolio', false);
    app.innerHTML = `<section class="page-shell">${pageHeader('PORTFOLIO PRIVÉ', existing ? 'Modifier une fiche.' : 'Décrire un projet.', 'Les informations saisies restent dans ce navigateur et ne sont pas publiées.', 'portfolio')}
      <form class="project-sheet-form" id="portfolio-form" data-project-id="${esc(existing?.id || '')}">
        <label class="field-label" for="sheet-title">Titre du projet *</label><input id="sheet-title" name="title" type="text" maxlength="100" required value="${esc(existing?.title || '')}">
        <label class="field-label" for="sheet-description">Description *</label><textarea id="sheet-description" name="description" rows="4" maxlength="3000" required>${esc(existing?.description || '')}</textarea>
        <div class="form-pair"><div><label class="field-label" for="sheet-domain">Domaine associé</label><select id="sheet-domain" name="domain">${activeDomains.map(domain => `<option value="${domain.id}" ${(findDomain(existing?.domain || state.domain || 'web')?.id || 'web') === domain.id ? 'selected' : ''}>${esc(domain.name)}${domain.id !== 'web' && !getPathwayProfile(domain.id) ? ' — contenu en préparation' : ''}</option>`).join('')}</select></div><div><label class="field-label" for="sheet-date">Date</label><input id="sheet-date" name="date" type="date" value="${esc(existing?.date || new Date().toISOString().slice(0, 10))}"></div></div>
        <label class="field-label" for="sheet-skills">Compétences utilisées</label><textarea id="sheet-skills" name="skills" rows="2" maxlength="500">${esc(existing?.skills || '')}</textarea>
        <label class="field-label" for="sheet-difficulties">Difficultés rencontrées</label><textarea id="sheet-difficulties" name="difficulties" rows="2" maxlength="1500">${esc(existing?.difficulties || '')}</textarea>
        <label class="field-label" for="sheet-learnings">Ce que j’ai appris</label><textarea id="sheet-learnings" name="learnings" rows="2" maxlength="1500">${esc(existing?.learnings || '')}</textarea>
        <label class="field-label" for="sheet-url">Lien public du projet (facultatif, HTTPS)</label><input id="sheet-url" name="url" type="url" inputmode="url" maxlength="500" placeholder="https://…" value="${esc(existing?.url || '')}">
        <label class="field-label" for="sheet-pdf">Joindre un PDF (facultatif, 5 Mo maximum)</label><input id="sheet-pdf" name="pdf" type="file" accept="application/pdf,.pdf"><small>Le fichier est contrôlé et conservé dans le stockage local de ce navigateur. Son contenu n’est pas exécuté.</small>
        <label class="field-label" for="sheet-image">Joindre une image (facultatif, 2 Mo maximum)</label><input id="sheet-image" name="image" type="file" accept="image/png,image/jpeg,image/webp"><small>Formats acceptés : PNG, JPEG, WebP. Max. 1 PDF et 1 image par fiche.</small>
        ${existing?.files.length ? `<div class="portfolio-files"><strong>Fichiers déjà joints</strong>${existing.files.map(file => `<button class="file-link" type="button" data-file-open="${esc(file.id)}">${esc(file.name)}</button>`).join('')}<small>Les nouveaux fichiers remplacent les fichiers du même type.</small></div>` : ''}
        <div class="visibility-card"><strong>Visibilité</strong><p><label><input type="radio" name="visibility" checked disabled> Privée sur cet appareil</label></p><p><label><input type="radio" disabled> Partage par lien — indisponible tant qu’un service sécurisé n’est pas configuré</label></p></div>
        <div class="dialog-actions"><button class="button button-primary" type="submit">${existing ? 'Enregistrer les modifications' : 'Ajouter à mon portfolio'}</button><button class="button button-quiet" type="button" data-route="portfolio">Annuler</button></div>
      </form></section>`;
  }

  function openPortfolioDb() {
    if (!window.indexedDB) return Promise.reject(new Error('Le stockage local de pièces jointes n’est pas disponible dans ce navigateur.'));
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('besa-portfolio-files', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onerror = () => reject(new Error('Impossible d’ouvrir le stockage local des pièces jointes.'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async function storePortfolioFile(id, file) {
    const db = await openPortfolioDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').put(file, id);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(new Error('Impossible d’enregistrer la pièce jointe sur cet appareil.')); };
      transaction.onabort = () => { db.close(); reject(new Error('Enregistrement local de la pièce jointe annulé.')); };
    });
  }

  async function readPortfolioFile(id) {
    const db = await openPortfolioDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const request = transaction.objectStore('files').get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Impossible de lire la pièce jointe.'));
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => { db.close(); reject(new Error('Impossible de lire le stockage local des pièces jointes.')); };
    });
  }

  async function removePortfolioFile(id) {
    const db = await openPortfolioDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').delete(id);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(new Error('Impossible de supprimer la pièce jointe locale.')); };
    });
  }

  function createId() {
    return window.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  async function validatePortfolioFile(file, type) {
    if (!file) return false;
    if (type === 'pdf') {
      if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) throw new Error('Choisis un PDF de 5 Mo maximum.');
      const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (new TextDecoder().decode(header) !== '%PDF-') throw new Error('Le fichier sélectionné ne semble pas être un PDF valide.');
      return true;
    }
    if (file.size > 2 * 1024 * 1024) throw new Error('Choisis une image de 2 Mo maximum.');
    const signatures = {
      'image/png': bytes => bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value),
      'image/jpeg': bytes => bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
      'image/webp': bytes => bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP',
    };
    const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!signatures[file.type]?.(signature)) throw new Error('Choisis une image PNG, JPEG ou WebP valide.');
    return true;
  }

  async function savePortfolioForm(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const description = String(data.get('description') || '').trim();
    const url = String(data.get('url') || '').trim();
    if (url && !/^https:\/\//i.test(url)) {
      form.elements.url.setCustomValidity('Le lien doit commencer par HTTPS.');
      form.elements.url.reportValidity();
      return;
    }
    form.elements.url.setCustomValidity('');
    const existing = state.portfolio.find(item => item.id === form.dataset.projectId);
    const projectId = existing?.id || createId();
    const newFiles = [];
    try {
      for (const [field, type] of [['pdf', 'pdf'], ['image', 'image']]) {
        const file = form.elements[field].files[0];
        if (!file) continue;
        await validatePortfolioFile(file, type);
        const id = `${projectId}-${type}`;
        await storePortfolioFile(id, file);
        newFiles.push({ id, name: file.name, size: file.size, type: file.type });
      }
      const keptFiles = (existing?.files || []).filter(file => !newFiles.some(incoming => incoming.type === file.type));
      const project = {
        id: projectId,
        title: title.slice(0, 100),
        description: description.slice(0, 3000),
        domain: String(data.get('domain') || 'web'),
        date: String(data.get('date') || '').slice(0, 20),
        skills: String(data.get('skills') || '').trim().slice(0, 500),
        difficulties: String(data.get('difficulties') || '').trim().slice(0, 1500),
        learnings: String(data.get('learnings') || '').trim().slice(0, 1500),
        url: url.slice(0, 500),
        visibility: 'private',
        files: [...keptFiles, ...newFiles],
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      state.portfolio = [...state.portfolio.filter(item => item.id !== projectId), project];
      saveState(false);
      setRoute('portfolio');
      showToast(existing ? 'Fiche de projet modifiée sur cet appareil.' : 'Fiche ajoutée au portfolio privé sur cet appareil.');
    } catch (error) {
      console.error('Échec de l’enregistrement de la fiche de portfolio.', error);
      showToast(error.message, 'error');
    }
  }

  function openPrintDocument(title, content) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Le navigateur a bloqué la fenêtre d’impression. Autorise une fenêtre temporaire pour créer un PDF.', 'error');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)} · Librescence</title><style>
      *{box-sizing:border-box}body{max-width:820px;margin:36px auto;padding:0 28px;color:#1d2234;font:14px/1.55 Arial,sans-serif}h1{font-size:30px;color:#10172f}h2{margin-top:27px;padding-bottom:5px;border-bottom:1px solid #dfe1e6;font-size:19px;color:#30375b}h3{margin:17px 0 4px;font-size:15px}p,li{max-width:75ch}small{color:#596175}a{color:#383bb0;overflow-wrap:anywhere}.meta{color:#596175}article{break-inside:avoid;border-bottom:1px solid #eee;padding-bottom:10px}.brand{font-weight:bold;letter-spacing:1px;color:#383bb0}.print-note{margin-top:30px;color:#667085;font-size:11px}@page{size:auto;margin:18mm}@media print{body{max-width:none;margin:0;padding:0}.print-note{display:none}}
    </style></head><body><p class="brand">Librescence · APPRENDRE LIBRE. GRANDIR ENSEMBLE.</p><main>${content}<p class="print-note">Dans la fenêtre d’impression, choisis « Enregistrer au format PDF » pour créer une copie PDF sur ton appareil.</p></main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`);
    printWindow.document.close();
  }

  function exportProgram() {
    const domainId = state.domain || 'web';
    const specialty = getPathwayProfile(domainId);
    if (specialty) {
      const sessionCount = specialty.weeks.reduce((count, week) => count + week.sessions.length, 0);
      const courseMinutes = sessionCount * 45;
      const reviewMinutes = specialty.weeks.length * 20;
      const totalMinutes = courseMinutes + reviewMinutes;
      const planNames = { 'two-weeks': '2 semaines', 'four-weeks': '4 semaines', 'eight-weeks': '8 semaines', flex: 'À mon rythme' };
      const planWeeks = { 'two-weeks': 2, 'four-weeks': 4, 'eight-weeks': 8, flex: 0 }[state.plan] || 0;
      const weeklyMinutes = planWeeks ? Math.ceil(totalMinutes / planWeeks) : 0;
      const weeksSummary = specialty.weeks.map(week => `<article><h3>${esc(week.label)} · ${esc(week.title)}</h3>${week.sessions.map(session => `<p><strong>${esc(session.title)} :</strong> ${esc(session.objective)}<br><strong>Exercice :</strong> ${esc(session.exercise)}<br><strong>Quiz :</strong> ${session.quiz.map(item => esc(item.question)).join(' · ')}<br><strong>Ressource :</strong> <a href="${esc(session.resource.url)}">${esc(session.resource.title)}</a></p>`).join('')}</article>`).join('');
      const content = `<h1>${esc(specialty.title)}</h1><p class="meta">Domaine : ${esc(specialty.title)} · Rythme choisi : ${planNames[state.plan] || 'À mon rythme'} · ${sessionCount} cours · ${formatStudyTime(totalMinutes)} au total, révisions comprises${weeklyMinutes ? ` · environ ${formatStudyTime(weeklyMinutes)} par semaine` : ''} · Objectif : ${esc(specialty.overview)}</p><p>Temps de cours : ${formatStudyTime(courseMinutes)} · Révisions : ${formatStudyTime(reviewMinutes)}</p><p>Prérequis : ${esc(specialty.prerequisites.join(' • '))}</p><p>Matériel : ${esc(specialty.equipment.join(' • '))}</p>${weeksSummary}<h2>Projet final</h2><p>${esc(specialty.project)}</p><h2>Ressources principales</h2><ul>${specialty.resources.map(resource => `<li><a href="${esc(resource.url)}">${esc(resource.title)}</a> · ${esc(resource.language)} · ${esc(resource.source)}</li>`).join('')}</ul>`;
      openPrintDocument(`${specialty.title} · programme Librescence`, content);
      return;
    }
    const planNames = { 'two-weeks': '2 semaines', 'four-weeks': '4 semaines', 'eight-weeks': '8 semaines', flex: 'À mon rythme' };
    const weeks = planNames[state.plan];
    const content = `<h1>Développement web · parcours débutant</h1><p class="meta">Durée : ${weeks} · ${lessons.length} cours · environ ${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} · Objectif : concevoir et présenter une page web structurée, lisible et accessible.</p><p>Niveau : débutant. Prérequis : aucun prérequis technique. Matériel conseillé : ordinateur, navigateur et éditeur de texte. Le rythme est une proposition flexible ; les pauses n’entraînent aucune perte.</p>${modules.map(module => `<h2>${esc(module.title)}</h2><p>${esc(module.description)}</p>${module.lessons.map(lesson => `<article><h3>${esc(lesson.title)} · ${lesson.duration} min</h3><p><strong>Objectif :</strong> ${esc(lesson.objective)}</p><p><strong>Activité :</strong> ${esc(lesson.activity)}</p><p><strong>Quiz :</strong> ${lesson.quiz.map(question => esc(question.question)).join(' · ')}</p><p><strong>Ressource :</strong> <a href="${esc(lesson.resource.url)}">${esc(lesson.resource.title)} — MDN (français, débutant, liens contrôlés le 18 novembre 2026)</a></p></article>`).join('')}`).join('')}<h2>Projet final</h2><p>Créer une petite page personnelle ou un site sur un sujet choisi ; vérifier sa lisibilité, son adaptation mobile et sa navigation au clavier ; présenter le travail. Le projet est déclaré par la personne et n’est pas évalué automatiquement.</p>`;
    openPrintDocument('Programme de développement web', content);
  }

  async function exportProject(id) {
    const project = state.portfolio.find(item => item.id === id);
    if (!project) return showToast('Cette fiche n’existe plus dans ce portfolio.', 'error');
    const domain = findDomain(project.domain);
    const content = `<h1>${esc(project.title)}</h1><p class="meta">Domaine : ${esc(domain?.name || 'Non précisé')} · Date : ${esc(project.date || 'Non précisée')}</p><h2>Description</h2><p>${esc(project.description)}</p>${project.skills ? `<h2>Compétences utilisées</h2><p>${esc(project.skills)}</p>` : ''}${project.difficulties ? `<h2>Difficultés rencontrées</h2><p>${esc(project.difficulties)}</p>` : ''}${project.learnings ? `<h2>Apprentissages</h2><p>${esc(project.learnings)}</p>` : ''}${project.url ? `<h2>Lien du projet</h2><p><a href="${esc(project.url)}">${esc(project.url)}</a></p>` : ''}${project.files.length ? `<h2>Pièces jointes conservées localement</h2><ul>${project.files.map(file => `<li>${esc(file.name)} (${file.type === 'application/pdf' ? 'PDF' : 'image'})</li>`).join('')}</ul>` : ''}`;
    openPrintDocument(project.title, content);
  }

  async function openPortfolioFile(id) {
    const metadata = state.portfolio.flatMap(project => project.files).find(file => file.id === id);
    if (!metadata) return showToast('Cette pièce jointe est introuvable.', 'error');
    try {
      const blob = await readPortfolioFile(id);
      if (!blob) throw new Error('Le fichier local n’existe plus dans ce navigateur.');
      const objectUrl = URL.createObjectURL(blob);
      if (metadata.type === 'application/pdf') {
        const opened = window.open(objectUrl, '_blank', 'noopener');
        if (!opened) showToast('Le navigateur a bloqué l’ouverture du PDF.', 'error');
      } else {
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = metadata.name;
        anchor.click();
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      console.error('Échec de l’ouverture d’une pièce jointe locale.', error);
      showToast(error.message, 'error');
    }
  }

  function renderProgress() {
    const completed = lessons.filter(lesson => state.completed.includes(lesson.id));
    const next = lessons.find(lesson => !state.completed.includes(lesson.id));
    const planNames = { 'two-weeks': '2 semaines', 'four-weeks': '4 semaines', 'eight-weeks': '8 semaines', flex: 'À mon rythme' };
    const currentDomain = findDomain(state.domain || 'web');
    const currentPathway = currentDomain ? getPathwayProfile(currentDomain.id) : null;
    const pathwayDone = currentDomain ? (state.specialtyProgress[currentDomain.id] || []).length : 0;
    const pathwayTotal = currentPathway ? currentPathway.weeks.reduce((total, week) => total + week.sessions.length, 0) : 0;
    const activity = studyActivitySummary();
    const dayLetters = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const goalPercent = Math.min(100, Math.round(activity.weekCount / state.weeklyGoal * 100));
    app.innerHTML = `<section class="page-shell">${pageHeader('TON ESPACE D’APPRENTISSAGE', 'Chaque pas compte.', 'Tu avances à ton rythme. Les pauses ne font pas perdre de progression.', 'home')}
      <section class="weekly-goal-card"><div class="weekly-goal-top"><div><p class="eyebrow">TON RYTHME, SANS PRESSION</p><h2>${activity.streak ? `Série de ${activity.streak} jour${activity.streak > 1 ? 's' : ''} ✦` : 'Choisis un petit objectif.'}</h2><p>${activity.weekCount} jour${activity.weekCount > 1 ? 's' : ''} actif${activity.weekCount > 1 ? 's' : ''} cette semaine · objectif : ${state.weeklyGoal} jours</p></div><label class="field-label" for="weekly-goal">Mon objectif hebdomadaire<select id="weekly-goal"><option value="2" ${state.weeklyGoal === 2 ? 'selected' : ''}>2 jours / semaine</option><option value="3" ${state.weeklyGoal === 3 ? 'selected' : ''}>3 jours / semaine</option><option value="5" ${state.weeklyGoal === 5 ? 'selected' : ''}>5 jours / semaine</option><option value="7" ${state.weeklyGoal === 7 ? 'selected' : ''}>7 jours / semaine</option></select></label></div><div class="progress-track" role="progressbar" aria-label="Objectif hebdomadaire" aria-valuemin="0" aria-valuemax="${state.weeklyGoal}" aria-valuenow="${Math.min(activity.weekCount, state.weeklyGoal)}"><span style="width:${goalPercent}%"></span></div><div class="activity-days" aria-label="Jours d’activité des sept derniers jours">${activity.weekDates.slice().reverse().map(key => { const date = new Date(`${key}T12:00:00`); return `<span class="activity-day ${state.activityDates.includes(key) ? 'is-active' : ''}" aria-label="${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${state.activityDates.includes(key) ? ', activité enregistrée' : ', aucune activité'}"><small>${dayLetters[date.getDay()]}</small><i>${date.getDate()}</i></span>`; }).join('')}</div><p class="muted-copy">Une journée compte après un quiz vérifié ou un cours terminé. Pas de pénalité en cas de pause.</p></section>
      ${currentPathway && currentDomain.id !== 'web' ? `<section class="progress-summary"><div class="progress-heading"><span>${esc(currentDomain.name)}</span><strong>${pathwayDone} / ${pathwayTotal} cours terminés</strong></div><div class="progress-track" role="progressbar" aria-label="Progression de ${esc(currentDomain.name)}" aria-valuemin="0" aria-valuemax="${pathwayTotal}" aria-valuenow="${pathwayDone}"><span style="width:${pathwayTotal ? Math.round(pathwayDone / pathwayTotal * 100) : 0}%"></span></div><button class="button button-primary" type="button" data-route="course/${currentDomain.id}/${state.plan}">Reprendre ce parcours →</button></section>` : progressSummary()}<div class="stats-grid"><article class="stat-card"><span>EXPÉRIENCE</span><strong>${state.xp} <small>XP</small></strong></article><article class="stat-card"><span>PIÈCES VIRTUELLES</span><strong>${state.coins} <small>◉</small></strong><p>Récompenses gratuites, sans achat.</p></article><article class="stat-card"><span>RYTHME CHOISI</span><strong class="stat-plan">${esc(planNames[state.plan])}</strong><button class="text-button" type="button" data-action="choose-plan">Changer de rythme</button></article></div>
      <div class="progress-columns"><section class="progress-panel"><h2>La prochaine étape</h2>${next ? `<p>${esc(next.title)}</p><button class="button button-primary" type="button" data-route="lesson/${next.id}">Reprendre mon parcours →</button>` : `<p>Tous les cours sont terminés. Ton projet final t’attend.</p><button class="button button-primary" type="button" data-route="project">Voir le projet final →</button>`}</section><section class="progress-panel"><h2>Ton activité</h2><p>${completed.length} cours terminés · ${Object.keys(state.quizResults).length} quiz tentés · ${state.portfolio.length} projet${state.portfolio.length > 1 ? 's' : ''} dans ton portfolio.</p><button class="button button-outline" type="button" data-route="course/web/${state.plan}">Voir les cours</button><button class="button button-quiet" type="button" data-route="review">Revoir mes quiz à reprendre</button></section></div>
      <div class="profile-prompt"><span class="avatar-preview" style="--avatar-color:${esc(state.avatar.color)}">${esc(state.avatar.face)}${state.avatar.accessory ? '<i aria-hidden="true">✦</i>' : ''}</span><div><strong>${esc(state.displayName || 'Ton avatar est facultatif')}</strong><p>Choisis un avatar ou continue sans personnaliser ton espace.</p></div><button class="button button-quiet" type="button" data-route="profile">Mon avatar →</button></div>
      <p class="storage-note">Ta progression et ton portfolio restent enregistrés localement dans ce navigateur.</p><div class="portfolio-toolbar"><button class="button button-outline" type="button" data-route="portfolio">Voir mon portfolio privé</button><button class="button button-quiet" type="button" data-route="profile">Mon profil et mes préférences</button></div>
    </section>`;
  }

  function renderProfile() { renderOnboarding(true); }

  function render() {
    if (!state.profile.onboardingComplete && !['book', 'home', 'onboarding', 'profile', 'about', 'contact', 'privacy', 'community'].includes(currentRoute)) {
      currentRoute = 'home';
      history.replaceState({ route: 'home' }, '', '#home');
    }
    const isBookView = currentRoute === 'book';
    document.body.classList.toggle('book-closed', isBookView);
    document.body.classList.toggle('book-opened', !isBookView);
    updateHeaderAccount();
    if (currentRoute === 'book') return renderBook();
    if (currentRoute === 'home') return renderHome();
    if (currentRoute === 'onboarding') return renderOnboarding(false);
    if (currentRoute === 'about') return renderAbout();
    if (currentRoute === 'contact') return renderContact();
    if (currentRoute === 'privacy') return renderPrivacy();
    if (currentRoute === 'community') return renderCommunity();
    if (currentRoute === 'catalog') return renderCatalog();
    if (currentRoute === 'saved') return renderSavedResources();
    if (currentRoute === 'review') return renderQuizReview();
    if (currentRoute === 'plan') return renderPlanPicker();
    if (currentRoute.startsWith('pathway-plan/')) return renderPathwayPlanPicker(currentRoute.split('/')[1]);
    if (currentRoute.startsWith('resources/') && currentRoute !== 'resources/web') return renderPathwayResources(currentRoute.split('/')[1]);
    if (currentRoute.startsWith('domain/')) {
      const id = currentRoute.split('/')[1];
      return id === 'resources' ? renderResources() : renderDomain(id);
    }
    if (currentRoute === 'resources/web') return renderResources();
    if (currentRoute.startsWith('course/web/')) return renderCourse(currentRoute.split('/')[2]);
    if (currentRoute.startsWith('course/')) {
      const [, domainId, plan] = currentRoute.split('/');
      return renderGuidedPathwayCourse(domainId, plan);
    }
    if (currentRoute.startsWith('lesson/')) {
      const parts = currentRoute.split('/');
      return parts.length >= 3 ? renderGuidedPathwayLesson(parts[1], parts[2]) : renderLesson(parts[1]);
    }
    if (currentRoute === 'project') return renderProject();
    if (currentRoute === 'portfolio') return renderPortfolio();
    if (currentRoute === 'portfolio/new') return renderPortfolioForm();
    if (currentRoute.startsWith('portfolio/edit/')) return renderPortfolioForm(currentRoute.split('/')[2]);
    if (currentRoute === 'progress') return renderProgress();
    if (currentRoute === 'profile') return renderProfile();
    renderHome();
  }

  function updateHeaderAccount() {
    applyTheme();
  }

  function openIntro() {
    const screen = document.querySelector('.book-screen');
    const button = screen?.querySelector('.book-button');
    if (!screen || !button || screen.dataset.opening === 'true') return;
    screen.dataset.opening = 'true';
    if (!motionAllowed()) {
      return setRoute('home');
    }
    const transition = screen.cloneNode(true);
    transition.classList.add('book-screen-transition');
    transition.setAttribute('aria-hidden', 'true');
    transition.querySelectorAll('button').forEach(item => { item.tabIndex = -1; });
    transition.querySelector('.book-button')?.classList.add('book-opening');
    setRoute('home');
    document.querySelector('#app').append(transition);
    window.setTimeout(() => transition.remove(), 640);
  }

  function openOrientation() {
    const select = document.querySelector('#interest-select');
    select.innerHTML = '<option value="">Je préfère choisir moi-même</option>' + families.map(family => `<optgroup label="${esc(family.name)}">${activeDomains.filter(domain => domain.family === family.id).map(domain => `<option value="${domain.id}">${esc(domain.name)}${!['ready','guided'].includes(domain.status) ? ' — À préparer' : ''}</option>`).join('')}</optgroup>`).join('');
    document.querySelector('#orientation-dialog').showModal();
    document.querySelector('#orientation-title').focus();
  }

  function renderAuthDialog(mode = 'login') {
    authMode = mode;
    const form = document.querySelector('#auth-form');
    const titles = { signup: 'Créer un compte', login: 'Me connecter', recover: 'Récupérer l’accès', update: 'Choisir un nouveau mot de passe', 'mfa-enroll': 'Sécuriser ton compte avec WhatsApp', 'mfa-code': 'Code de connexion WhatsApp' };
    const titleText = titles[mode] || titles.login;
    const emailValue = esc(authPendingEmail);
    const emailField = `<label class="field-label" for="auth-email">Adresse e-mail</label><input id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" required>`;
    const passwordField = `<label class="field-label" for="auth-password">${mode === 'update' ? 'Nouveau mot de passe' : 'Mot de passe'}</label><input id="auth-password" name="password" type="password" autocomplete="${mode === 'update' ? 'new-password' : mode === 'signup' ? 'new-password' : 'current-password'}" minlength="8" required>`;
    let fields = '';
    let actions = '';
    if (mode === 'signup') {
      fields = `<label class="field-label" for="auth-display-name">Nom d’affichage</label><input id="auth-display-name" name="displayName" type="text" maxlength="60" autocomplete="name" required>${emailField}${passwordField}<label class="field-label" for="auth-password-confirm">Confirmer le mot de passe</label><input id="auth-password-confirm" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required><label class="field-label" for="auth-phone">Numéro WhatsApp au format international</label><input id="auth-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+2250700000000" pattern="\\+[1-9][0-9]{7,14}" required><label class="checkbox-label"><input name="phoneConsent" type="checkbox" required> J’autorise Librescence à utiliser ce numéro uniquement pour mes codes de sécurité WhatsApp.</label><p class="muted-copy">Le numéro est traité par Supabase et ses prestataires de messagerie pour livrer les codes. Librescence ne l’utilise pas pour la publicité ni pour accéder aux contacts.</p>`;
      actions = `<button class="button button-primary" type="submit">Créer mon compte</button><button class="button button-quiet" type="button" data-action="switch-to-login">J’ai déjà un compte</button>`;
    } else if (mode === 'mfa-enroll') {
      fields = `<p>Ajoute ton numéro WhatsApp pour recevoir un code à chaque connexion. Utilise l’indicatif international, par exemple +225…</p><label class="field-label" for="auth-phone">Numéro WhatsApp</label><input id="auth-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+2250700000000" pattern="\\+[1-9][0-9]{7,14}" required><label class="checkbox-label"><input name="phoneConsent" type="checkbox" required> J’autorise l’envoi de mes seuls codes de connexion à ce numéro.</label><p class="muted-copy">Le numéro est conservé comme facteur de sécurité et transmis aux prestataires nécessaires à la livraison. Librescence ne l’utilise pas pour la publicité ni n’accède à tes contacts.</p>`;
      actions = `<button class="button button-primary" type="submit">Envoyer un code WhatsApp</button><button class="button button-quiet" type="button" data-action="abort-mfa">Annuler et me déconnecter</button>`;
    } else if (mode === 'mfa-code') {
      fields = `<p>Entre le code reçu sur WhatsApp au ${esc(mfaPending?.maskedPhone || 'numéro enregistré')}.</p><label class="field-label" for="auth-code">Code à 6 chiffres</label><input id="auth-code" name="token" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required>`;
      actions = `<button class="button button-primary" type="submit">Vérifier et continuer</button><button class="button button-quiet" type="button" data-action="resend-whatsapp-code">Renvoyer sur WhatsApp</button><button class="button button-quiet" type="button" data-action="abort-mfa">Annuler et me déconnecter</button>`;
    } else if (mode === 'login') {
      fields = `${emailField}${passwordField}`;
      actions = `<button class="button button-primary" type="submit">Me connecter</button><button class="button button-quiet" type="button" data-action="forgot-password">Mot de passe oublié ?</button><button class="button button-quiet" type="button" data-action="switch-to-signup">Créer un compte</button>`;
    } else if (mode === 'recover') {
      fields = emailField;
      actions = `<button class="button button-primary" type="submit">Envoyer le lien de réinitialisation</button><button class="button button-quiet" type="button" data-action="switch-to-login">Retour à la connexion</button>`;
    } else {
      fields = `${passwordField}<label class="field-label" for="auth-password-confirm">Confirmer le nouveau mot de passe</label><input id="auth-password-confirm" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required>`;
      actions = `<button class="button button-primary" type="submit">Enregistrer le nouveau mot de passe</button>`;
    }
    const descriptions = {
      signup: 'Crée ton compte puis confirme ton numéro WhatsApp avec un code de sécurité.',
      login: 'Ta progression sera chargée depuis ton compte après la connexion.',
      recover: 'Si un compte correspond à cette adresse, tu recevras un e-mail pour choisir un nouveau mot de passe.',
      update: 'Choisis un mot de passe d’au moins 8 caractères.',
      'mfa-enroll': 'Le code WhatsApp sert à sécuriser la connexion et la synchronisation.',
      'mfa-code': 'Ton espace et ta progression se déverrouillent après vérification du code.',
    };
    const locked = mode.startsWith('mfa-');
    form.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">TON ESPACE, SI TU LE SOUHAITES</p><h2 id="auth-title" tabindex="-1">${titleText}</h2><p id="auth-description">${descriptions[mode] || descriptions.login}</p></div>${locked ? '' : '<button class="icon-button" type="button" data-close-dialog aria-label="Fermer">×</button>'}</div>${!supabaseUrl || !supabaseKey ? '<div class="notice notice-warning">Les comptes ne sont pas encore activés. Ajoute les réglages Supabase dans config.js. Tu peux continuer à apprendre sans compte.</div>' : ''}<div class="auth-fields">${fields}</div><div id="auth-feedback" class="auth-feedback" role="status" aria-live="polite"></div><div class="dialog-actions">${actions}${locked ? '' : '<button class="button button-outline" type="button" data-close-dialog>Continuer sans compte</button>'}</div>`;
    const title = document.querySelector('#auth-title');
    const dialog = document.querySelector('#auth-dialog');
    if (!dialog.open) dialog.showModal();
    dialog.oncancel = event => { if (authMode.startsWith('mfa-')) event.preventDefault(); };
    title.focus();
  }

  function reportSyncError(error) {
    console.error('La synchronisation Librescence avec Supabase a échoué.', error);
    showToast(`Progression locale conservée. Synchronisation impossible : ${error.message}`, 'error');
  }

  function mergeStates(local, remote) {
    const merged = normalizeState(remote);
    merged.completed = [...new Set([...merged.completed, ...local.completed])];
    merged.awards = [...new Set([...merged.awards, ...local.awards])];
    merged.quizAnswers = { ...merged.quizAnswers, ...local.quizAnswers };
    merged.savedResources = [...new Map([...merged.savedResources, ...local.savedResources].map(item => [item.url, item])).values()].slice(-100);
    merged.activityDates = [...new Set([...merged.activityDates, ...local.activityDates])].slice(-400);
    merged.weeklyGoal = local.weeklyGoal || merged.weeklyGoal;
    Object.entries(local.specialtyProgress).forEach(([domainId, completed]) => {
      merged.specialtyProgress[domainId] = [...new Set([
        ...(merged.specialtyProgress[domainId] || []),
        ...completed,
      ])];
    });
    Object.entries(local.quizResults).forEach(([id, incoming]) => {
      const existing = merged.quizResults[id];
      if (!existing || (incoming.best || 0) > (existing.best || 0)) merged.quizResults[id] = incoming;
      else merged.quizResults[id] = { ...existing, attempts: (existing.attempts || 0) + (incoming.attempts || 0) };
    });
    merged.project.checks = merged.project.checks.map((checked, index) => checked || Boolean(local.project.checks[index]));
    merged.project.completed = merged.project.completed || local.project.completed;
    merged.project.url = local.project.url || merged.project.url;
    merged.domain = local.domain || merged.domain;
    merged.displayName = local.displayName || merged.displayName;
    if (local.avatar && (local.avatar.face !== '✦' || local.avatar.color !== avatarColors[0] || local.avatar.accessory)) merged.avatar = local.avatar;
    recalculateRewards(merged);
    return merged;
  }

  async function authRequest(path, body, method = 'POST', accessToken = '') {
    const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
      method,
      headers: {
        apikey: supabaseKey,
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Le service de compte a refusé la demande.');
    return data;
  }

  function saveSession(session) {
    accountSession = session;
    updateHeaderAccount();
    try {
      if (session) localStorage.setItem(sessionKey, JSON.stringify(session));
      else localStorage.removeItem(sessionKey);
    } catch (error) {
      console.error('Impossible d’enregistrer la session du compte sur cet appareil.', error);
      showToast('La session est active, mais le navigateur n’a pas pu la retenir.', 'error');
    }
  }

  async function supabaseRequest(table, query, options = {}) {
    if (!accountSession) throw new Error('Connecte-toi pour synchroniser tes données.');
    if (accountSession.refresh_token && accountSession.expires_at && Date.now() >= accountSession.expires_at - 60_000) {
      await refreshAccountSession();
    }
    let response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
      method: options.method || 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accountSession.access_token}`,
        'Content-Type': 'application/json',
        ...(options.prefer ? { Prefer: options.prefer } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
    if (response.status === 401 && accountSession.refresh_token) {
      await refreshAccountSession();
      response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
        method: options.method || 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accountSession.access_token}`,
          'Content-Type': 'application/json',
          ...(options.prefer ? { Prefer: options.prefer } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.msg || `Erreur Supabase (${response.status}).`);
    return data;
  }

  async function refreshAccountSession() {
    if (!accountSession?.refresh_token) throw new Error('La session a expiré. Connecte-toi de nouveau.');
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: accountSession.refresh_token }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      saveSession(null);
      throw new Error(data.msg || data.message || 'La session a expiré. Connecte-toi de nouveau.');
    }
    saveSession({ ...data, expires_at: Date.now() + (data.expires_in || 3600) * 1000 });
  }

  async function syncToSupabase(snapshot = state) {
    if (!accountSession || !supabaseUrl || !supabaseKey) return;
    const userId = accountSession.user?.id;
    if (!userId) throw new Error('La session ne contient pas d’identifiant de compte.');
    await supabaseRequest('profiles', '?on_conflict=id', {
      method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
      body: { id: userId, display_name: snapshot.displayName, avatar: snapshot.avatar, updated_at: new Date().toISOString() },
    });
    await supabaseRequest('learner_progress', '?on_conflict=user_id', {
      method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
      body: { user_id: userId, payload: snapshot, updated_at: new Date().toISOString() },
    });
    const status = document.querySelector('.storage-note');
    if (status) status.textContent = 'Progression synchronisée avec ton compte.';
  }

  async function pullFromSupabase(localState) {
    const userId = accountSession?.user?.id;
    if (!userId) throw new Error('La session ne contient pas d’identifiant de compte.');
    const id = encodeURIComponent(userId);
    const [remoteRows, profileRows] = await Promise.all([
      supabaseRequest('learner_progress', `?user_id=eq.${id}&select=payload`),
      supabaseRequest('profiles', `?id=eq.${id}&select=display_name,avatar`),
    ]);
    const remote = Array.isArray(remoteRows) && remoteRows[0]?.payload ? remoteRows[0].payload : defaultState();
    state = mergeStates(localState, remote);
    if (profileRows?.[0]) {
      state.displayName = localState.displayName || profileRows[0].display_name || state.displayName;
      if (!localState.displayName && profileRows[0].avatar) state.avatar = normalizeState({ avatar: profileRows[0].avatar }).avatar;
    }
    saveState(false);
    await syncToSupabase();
  }

  async function activateAccount(data, guestState, transferGuest) {
    if (!data?.access_token) throw new Error('La connexion n’a pas fourni de session. Vérifie le code et l’adresse e-mail.');
    saveSession({ ...data, expires_at: Date.now() + (data.expires_in || 3600) * 1000 });
    mfaPending = { guestState, transferGuest };
    await startWhatsAppMfa(true);
  }

  async function mfaRequest(path, body, method = 'POST') {
    if (accountSession?.refresh_token && accountSession.expires_at && Date.now() >= accountSession.expires_at - 60_000) await refreshAccountSession();
    const response = await fetch(`${supabaseUrl}/auth/v1/factors${path}`, {
      method,
      headers: { apikey: supabaseKey, Authorization: `Bearer ${accountSession?.access_token || ''}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'La vérification WhatsApp a échoué.');
    return data;
  }

  function maskedPhone(phone) { return phone ? `${phone.slice(0, 4)}••••${phone.slice(-3)}` : ''; }

  async function startWhatsAppMfa(enroll = false, phone = '') {
    if (enroll) {
      const enrolled = await mfaRequest('', { factor_type: 'phone', friendly_name: 'Librescence WhatsApp', phone });
      const factorId = enrolled.id || enrolled.factor?.id;
      if (!factorId) throw new Error('Le service n’a pas retourné de facteur WhatsApp. Vérifie la configuration MFA dans Supabase.');
      mfaPending = { ...mfaPending, factorId, phone, maskedPhone: maskedPhone(phone) };
    } else {
      const listed = await mfaRequest('', undefined, 'GET');
      const phones = (listed.all || listed.phone || []).filter(factor => factor.factor_type === 'phone' && factor.status === 'verified');
      if (!phones.length) { mfaPending = { ...mfaPending, needsEnrollment: true }; renderAuthDialog('mfa-enroll'); return; }
      const factor = phones[0];
      mfaPending = { ...mfaPending, factorId: factor.id, maskedPhone: maskedPhone(factor.phone || '') };
    }
    const challenge = await mfaRequest(`/${encodeURIComponent(mfaPending.factorId)}/challenge`, { channel: 'whatsapp' });
    mfaPending.challengeId = challenge.id || challenge.challenge_id;
    if (!mfaPending.challengeId) throw new Error('Le code n’a pas pu être demandé. Vérifie le fournisseur WhatsApp configuré.');
    renderAuthDialog('mfa-code');
    document.querySelector('#auth-feedback').textContent = 'Code WhatsApp envoyé. Il peut prendre quelques instants.';
  }

  async function finishWhatsAppMfa(code) {
    const verified = await mfaRequest(`/${encodeURIComponent(mfaPending.factorId)}/verify`, { challenge_id: mfaPending.challengeId, code });
    const sessionData = verified.access_token ? verified : verified.session;
    if (!sessionData?.access_token) throw new Error('Code vérifié, mais la session sécurisée manque. Reconnecte-toi.');
    saveSession({ ...accountSession, ...sessionData, expires_at: Date.now() + (sessionData.expires_in || 3600) * 1000 });
    const payload = JSON.parse(atob(accountSession.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.aal !== 'aal2') throw new Error('Le second facteur n’a pas été validé. La progression reste verrouillée.');
    const pending = mfaPending || {};
    await pullFromSupabase(pending.transferGuest ? pending.guestState : defaultState());
    mfaPending = null;
    document.querySelector('#auth-dialog').close();
    render();
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = name => String(form.elements[name]?.value || '').trim();
    const email = value('email') || authPendingEmail;
    const password = String(form.elements.password?.value || '');
    const feedback = document.querySelector('#auth-feedback');
    const submit = form.querySelector('button[type="submit"]');
    if (!supabaseUrl || !supabaseKey) {
      feedback.textContent = 'Supabase n’est pas configuré. Ajoute son URL et sa clé publique dans config.js. La progression locale reste disponible.';
      return;
    }
    if (authMode === 'signup' && password !== String(form.elements.confirmPassword?.value || '')) {
      feedback.textContent = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    if (authMode === 'update' && password !== String(form.elements.confirmPassword?.value || '')) {
      feedback.textContent = 'Les deux nouveaux mots de passe ne correspondent pas.';
      return;
    }
    submit.disabled = true;
    feedback.textContent = 'Connexion au service sécurisé…';
    try {
      if (authMode === 'mfa-enroll') {
        if (!form.elements.phoneConsent?.checked) throw new Error('Confirme ton accord avant de recevoir des codes WhatsApp.');
        const phone = value('phone');
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Saisis le numéro au format international, par exemple +2250700000000.');
        await startWhatsAppMfa(true, phone);
      } else if (authMode === 'mfa-code') {
        await finishWhatsAppMfa(value('token'));
      } else if (authMode === 'signup') {
        const guest = cloneState();
        const displayName = value('displayName').slice(0, 60);
        const data = await authRequest('signup', { email, password, data: { display_name: displayName } });
        if (!data.access_token) throw new Error('Supabase attend encore une confirmation par e-mail. Désactive la confirmation e-mail pour ce parcours WhatsApp, puis réessaie.');
        state.displayName = displayName;
        guest.displayName = displayName;
        saveState(false);
        authPendingEmail = email;
        mfaPending = { guestState: guest, transferGuest: true };
        saveSession({ ...data, expires_at: Date.now() + (data.expires_in || 3600) * 1000 });
        await startWhatsAppMfa(true, value('phone'));
      } else if (authMode === 'recover') {
        await authRequest(`recover?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, { email });
        feedback.textContent = 'Si cette adresse possède un compte, un e-mail de réinitialisation va lui être envoyé.';
      } else if (authMode === 'update') {
        await authRequest('user', { password }, 'PUT', accountSession?.access_token || '');
        feedback.textContent = 'Mot de passe modifié. Tu peux maintenant te connecter.';
        setTimeout(() => {
          saveSession(null);
          history.replaceState(null, '', location.pathname + location.search + '#home');
          currentRoute = 'home';
          document.querySelector('#auth-dialog').close();
          render();
        }, 900);
      } else {
        const guest = cloneState();
        const data = await authRequest('token?grant_type=password', { email, password });
        saveSession({ ...data, expires_at: Date.now() + (data.expires_in || 3600) * 1000 });
        const hasGuestProgress = guest.completed.length > 0 || guest.project.completed || Object.keys(guest.quizResults).length > 0
          || Object.keys(guest.quizAnswers).length > 0 || Boolean(guest.domain) || guest.awards.length > 0 || Boolean(guest.displayName);
        const transferGuest = !hasGuestProgress || window.confirm('Réunir la progression commencée sur cet appareil avec celle du compte ?');
        mfaPending = { guestState: guest, transferGuest };
        await startWhatsAppMfa(false);
      }
    } catch (error) {
      console.error('La demande de compte Librescence a échoué.', error);
      feedback.textContent = `Impossible de terminer cette demande : ${error.message}`;
    } finally {
      if (submit.isConnected) submit.disabled = false;
    }
  }

  async function resendWhatsAppCode() {
    try {
      const challenge = await mfaRequest(`/${encodeURIComponent(mfaPending.factorId)}/challenge`, { channel: 'whatsapp' });
      mfaPending.challengeId = challenge.id || challenge.challenge_id;
      document.querySelector('#auth-feedback').textContent = 'Un nouveau code WhatsApp a été demandé.';
    } catch (error) { document.querySelector('#auth-feedback').textContent = `Envoi impossible : ${error.message}`; }
  }

  async function signOut() {
    try {
      if (accountSession && supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: 'POST', headers: { apikey: supabaseKey, Authorization: `Bearer ${accountSession.access_token}` },
        });
        if (!response.ok) throw new Error(`Le service a répondu ${response.status}.`);
      }
      saveSession(null);
      mfaPending = null;
      const authDialog = document.querySelector('#auth-dialog');
      if (authDialog?.open) authDialog.close();
      loadGuestState();
      setRoute('home');
      showToast('Tu es déconnecté. La copie locale de cette session reste disponible.');
    } catch (error) {
      console.error('La déconnexion Supabase a échoué.', error);
      showToast(`Déconnexion impossible : ${error.message}`, 'error');
    }
  }

  async function consumeAuthRedirect() {
    if (!supabaseUrl || !supabaseKey) return '';
    const params = new URLSearchParams(location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type') || '';
    if (!accessToken || !type) return '';
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${accessToken}` },
    });
    const user = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(user.message || 'Le lien de confirmation a expiré. Demande un nouveau code.');
    saveSession({ access_token: accessToken, refresh_token: refreshToken, user, expires_at: Date.now() + Number(params.get('expires_in') || 3600) * 1000 });
    history.replaceState(null, '', `${location.pathname}${location.search}#home`);
    currentRoute = 'home';
    if (type === 'recovery') return 'recovery';
    mfaPending = { guestState: cloneState(), transferGuest: true };
    return 'mfa';
  }

  function initializeApp() {
    loadGuestState();
    accountSession = null;
    try { localStorage.removeItem(sessionKey); } catch { /* Storage may be unavailable; account access remains disabled in this version. */ }
    applyTheme();
    updateHeaderAccount();
    render();
  }

  function award(id) {
    if (state.awards.includes(id)) return false;
    state.awards.push(id);
    recalculateRewards(state);
    saveState();
    return true;
  }

  function handleQuizSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const lesson = lessons.find(item => item.id === form.dataset.lesson);
    const data = new FormData(form);
    const answers = lesson.quiz.map((_, index) => {
      const answer = data.get(`question-${index}`);
      return answer === null ? -1 : Number(answer);
    });
    if (answers.some(answer => !Number.isInteger(answer))) {
      showToast('Réponds aux deux questions pour voir la correction.', 'error');
      form.querySelector('input:not(:checked)')?.focus();
      return;
    }
    const score = lesson.quiz.reduce((sum, question, index) => sum + (question.answer === answers[index] ? 1 : 0), 0);
    const previous = state.quizResults[lesson.id];
    state.quizAnswers[lesson.id] = answers;
    state.quizResults[lesson.id] = {
      attempts: (previous?.attempts || 0) + 1,
      best: Math.max(previous?.best || 0, score),
      last: score,
      lastAnswers: answers,
    };
    recordStudyActivity();
    if (score === lesson.quiz.length) award(`quiz:${lesson.id}`);
    else saveState();
    renderLesson(lesson.id);
    document.querySelector('.quiz-result')?.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto', block: 'nearest' });
    showToast(score === lesson.quiz.length ? `Tout juste ! +${awards.quiz.xp} XP` : `Résultat : ${score}/${lesson.quiz.length}. Lis la correction et réessaie.`, score === lesson.quiz.length ? 'success' : 'info');
  }

  function completeLesson(id) {
    const newlyCompleted = !state.completed.includes(id);
    if (newlyCompleted) {
      state.completed.push(id);
      award(`lesson:${id}`);
      showToast(`Cours terminé · +${awards.lesson.xp} XP et ${awards.lesson.coins} pièces virtuelles.`);
    } else {
      showToast('Ce cours est déjà dans ta progression.');
    }
    recordStudyActivity();
    renderLesson(id);
    if (newlyCompleted) document.querySelector('.lesson-completion .button-complete')?.classList.add('completion-celebrate');
  }

  function completeProject() {
    if (state.project.url && !/^https:\/\//i.test(state.project.url)) {
      showToast('Le lien du projet doit commencer par HTTPS.', 'error');
      return;
    }
    state.project.completed = true;
    recordStudyActivity();
    award('project:web');
    renderProject();
    document.querySelector('.celebration-card')?.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto', block: 'center' });
    showToast(`Bravo ! Badge Premier projet · +${awards.project.xp} XP.`);
  }

  function closeMenu() {
    const menu = document.querySelector('.main-nav');
    const toggle = document.querySelector('.menu-toggle');
    if (!menu || !toggle) return;
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
  }

  document.addEventListener('click', event => {
    const videoTarget = event.target.closest('[data-video-id]');
    if (videoTarget) {
      const dialog = document.querySelector('#video-dialog');
      const frame = document.querySelector('#video-frame');
      frame.src = `https://www.youtube-nocookie.com/embed/${videoTarget.dataset.videoId}?autoplay=1&rel=0`;
      document.querySelector('#video-title').textContent = videoTarget.dataset.videoTitle || 'Vidéo du cours';
      const fallback = document.querySelector('#video-fallback');
      fallback.href = videoTarget.dataset.videoWatch;
      dialog.showModal();
      return;
    }
    const target = event.target.closest('[data-route], [data-action], [data-plan], [data-pathway-plan], [data-close-dialog], [data-close-video], [data-avatar-face], [data-avatar-color], [data-accessory], [data-file-open], [data-specialty-session]');
    if (!target) return;
    if (target.dataset.route) {
      event.preventDefault();
      let route = target.dataset.route;
      if (route.startsWith('domain/')) {
        const domain = findDomain(target.dataset.domainId || route.split('/')[1]);
        if (!domain) return setRoute('catalog');
        state.domain = domain.id;
        saveState();
        route = `domain/${domain.id}`;
      }
      if (route.startsWith('course/web/')) {
        state.plan = route.split('/')[2];
        saveState();
      } else if (route.startsWith('course/')) {
        const [, domainId, plan] = route.split('/');
        state.domain = findDomain(domainId)?.id || state.domain;
        state.plan = plan || state.plan;
        saveState();
      }
      setRoute(route);
      return;
    }
    if (target.dataset.specialtySession) {
      const domainId = canonicalDomainId(target.dataset.specialtySession);
      const profile = getPathwayProfile(domainId);
      const sessionId = target.dataset.sessionId;
      if (!profile || !profile.weeks.some((week, weekIndex) =>
        week.sessions.some((_, sessionIndex) => `${weekIndex}-${sessionIndex}` === sessionId)
      )) return;
      const completed = new Set(state.specialtyProgress[domainId] || []);
      const newlyCompleted = !completed.has(sessionId);
      if (!newlyCompleted) completed.delete(sessionId);
      else completed.add(sessionId);
      state.specialtyProgress[domainId] = [...completed];
      if (completed.has(sessionId)) recordStudyActivity();
      saveState();
      if (currentRoute.startsWith(`lesson/${domainId}/`)) {
        renderGuidedPathwayLesson(domainId, currentRoute.split('/')[2]);
        if (newlyCompleted) document.querySelector('.lesson-completion .button-complete')?.classList.add('completion-celebrate');
        return;
      }
      if (currentRoute.startsWith(`course/${domainId}/`)) {
        renderGuidedPathwayCourse(domainId, currentRoute.split('/')[2]);
        if (newlyCompleted) document.querySelector(`[data-route="lesson/${domainId}/${sessionId}"] .lesson-status`)?.classList.add('completion-celebrate');
        return;
      }
      renderSpecialtyDomain(domainId);
      if (newlyCompleted) document.querySelector(`[data-specialty-session="${domainId}"][data-session-id="${sessionId}"]`)?.classList.add('completion-celebrate');
      return;
    }
    if (target.dataset.pathwayPlan) {
      state.plan = target.dataset.pathwayPlan;
      saveState();
      return setRoute(`course/${state.domain}/${state.plan}`);
    }
    if (target.dataset.plan) {
      state.plan = target.dataset.plan;
      saveState();
      setRoute(`course/web/${state.plan}`);
      return;
    }
    if (target.hasAttribute('data-close-dialog')) {
      target.closest('dialog').close();
      return;
    }
    if (target.hasAttribute('data-close-video')) {
      document.querySelector('#video-dialog').close();
      document.querySelector('#video-frame').src = '';
      return;
    }
    if (target.dataset.fileOpen) return openPortfolioFile(target.dataset.fileOpen);
    if (target.dataset.avatarFace) {
      state.avatar.face = target.dataset.avatarFace;
      saveState();
      document.querySelectorAll('[data-avatar-face]').forEach(button => {
        const selected = button.dataset.avatarFace === state.avatar.face;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      const preview = document.querySelector('.profile-preview .avatar-preview');
      if (preview) preview.textContent = state.avatar.face;
      return;
    }
    if (target.dataset.avatarColor) {
      state.avatar.color = target.dataset.avatarColor;
      saveState();
      document.querySelectorAll('[data-avatar-color]').forEach(button => {
        const selected = button.dataset.avatarColor === state.avatar.color;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      const preview = document.querySelector('.profile-preview .avatar-preview');
      if (preview) preview.style.setProperty('--avatar-color', state.avatar.color);
      return;
    }
    if (target.dataset.accessory) {
      const accessory = target.dataset.accessory === 'none' ? null : target.dataset.accessory;
      const unlock = accessory === 'crown' ? 250 : accessory === 'spark' ? 100 : 0;
      if (state.xp < unlock) return showToast(`Gagne ${unlock - state.xp} XP de plus pour débloquer cet élément.`, 'info');
      state.avatar.accessory = accessory;
      saveState();
      renderProfile();
      return;
    }
    const action = target.dataset.action;
    if (action === 'speak-guide') return speakGuide();
    if (action === 'copy-contact-message') return copyContactMessage();
    if (action === 'focus-toggle') return toggleFocusTimer();
    if (action === 'focus-reset') return resetFocusTimer();
    if (action === 'toggle-resource') {
      const url = target.dataset.resourceUrl;
      const existing = state.savedResources.find(item => item.url === url);
      state.savedResources = existing
        ? state.savedResources.filter(item => item.url !== url)
        : [...state.savedResources, { url, title: target.dataset.resourceTitle || 'Ressource', source: '' }].slice(-100);
      saveState();
      render();
      showToast(existing ? 'Ressource retirée de ta bibliothèque.' : 'Ressource enregistrée dans ta bibliothèque.');
      return;
    }
    if (action === 'skip-profile') {
      state.profile.onboardingComplete = true;
      state.profile.learningMode = 'free';
      saveState(false);
      return setRoute('catalog');
    }
    if (action === 'open-book') return openIntro();
    if (action === 'skip-book') return setRoute('home');
    if (action === 'orientation') return openOrientation();
    if (action === 'skip-orientation') {
      document.querySelector('#orientation-dialog').close();
      return setRoute('catalog');
    }
    if (action === 'choose-plan') return state.domain && state.domain !== 'web' ? setRoute(`pathway-plan/${state.domain}`) : setRoute('plan');
    if (action === 'change-pathway-plan') return setRoute(`pathway-plan/${state.domain || 'web'}`);
    if (action === 'start-specialty') {
      const sessions = document.querySelector('#specialty-sessions');
      sessions?.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto', block: 'start' });
      sessions?.querySelector('button')?.focus({ preventScroll: true });
      return;
    }
    if (action === 'account-profile') return setRoute('profile');
    if (action === 'complete-lesson') return completeLesson(target.dataset.lesson);
    if (action === 'complete-project') return completeProject();
    if (action === 'export-program') return exportProgram();
    if (action === 'export-project') return exportProject(target.dataset.projectId);
    if (action === 'delete-project') {
      const project = state.portfolio.find(item => item.id === target.dataset.projectId);
      if (!project) return showToast('Cette fiche n’existe plus dans ce portfolio.', 'error');
      if (!window.confirm(`Supprimer la fiche « ${project.title} » et ses pièces jointes de ce navigateur ?`)) return;
      Promise.all(project.files.map(file => removePortfolioFile(file.id)))
        .then(() => {
          state.portfolio = state.portfolio.filter(item => item.id !== project.id);
          saveState(false);
          renderPortfolio();
          showToast('Fiche et pièces jointes supprimées de ce navigateur.');
        })
        .catch(error => {
          console.error('Échec de la suppression d’une fiche de portfolio.', error);
          showToast(error.message, 'error');
        });
      return;
    }
    if (action === 'clear-search') {
      searchTerm = '';
      selectedFilter = 'all';
      return renderCatalog();
    }
  });

  document.querySelector('#video-dialog').addEventListener('close', () => {
    document.querySelector('#video-frame').src = '';
  });

  document.querySelector('#orientation-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selected = String(form.get('interest') || '');
    orientationAnswers = {
      level: String(form.get('level') || 'Je ne sais pas encore'),
      goal: String(form.get('goal') || 'Je veux explorer'),
      time: String(form.get('time') || 'À mon rythme'),
    };
    document.querySelector('#orientation-dialog').close();
    if (selected) {
      const domain = findDomain(selected);
      if (domain) {
        state.domain = domain.id;
        saveState();
        setRoute(`domain/${domain.id}`);
        return;
      }
    }
    orientationAnswers = null;
    setRoute('catalog');
  });

  document.addEventListener('submit', event => {
    if (event.target.id === 'contact-form') return handleContactSubmit(event);
    if (event.target.id === 'onboarding-form') {
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      const birthDate = String(data.get('birthDate') || '');
      if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) return showToast('La date de naissance ne peut pas être dans le futur.', 'error');
      const editing = currentRoute === 'profile';
      state.profile = {
        ...state.profile,
        firstName: String(data.get('firstName') || '').trim().slice(0, 60),
        lastName: String(data.get('lastName') || '').trim().slice(0, 60),
        birthDate,
        interests: data.getAll('interest').filter(id => families.some(family => family.id === id)).slice(0, 8),
        theme: data.get('theme') === 'dark' ? 'dark' : 'light',
        resourceLanguage: ['fr', 'en', 'es'].includes(data.get('resourceLanguage')) ? data.get('resourceLanguage') : 'fr',
        learningMode: data.get('learningMode') === 'free' ? 'free' : 'guided',
        onboardingComplete: true,
      };
      state.displayName = state.profile.firstName;
      applyTheme();
      saveState(false);
      showToast(editing ? 'Tes préférences sont enregistrées sur cet appareil.' : 'Ton espace est prêt. Bienvenue dans Librescence !');
      setRoute(editing ? 'home' : 'catalog');
      return;
    }
    if (event.target.id === 'quiz-form') handleQuizSubmit(event);
    if (event.target.id === 'portfolio-form') savePortfolioForm(event);
    if (event.target.matches('.specialty-quiz')) handleSpecialtyQuizSubmit(event);
  });

  document.addEventListener('change', event => {
    if (event.target.form?.id === 'contact-form') return clearContactFieldError(event.target);
    if (event.target.id === 'weekly-goal') {
      const selected = Number(event.target.value);
      state.weeklyGoal = [2, 3, 5, 7].includes(selected) ? selected : 3;
      saveState();
      return renderProgress();
    }
    if (event.target.id === 'focus-duration') {
      resetFocusTimer(Number(event.target.value));
      return;
    }
    if (event.target.name === 'theme' && ['onboarding', 'profile'].includes(currentRoute)) {
      document.body.dataset.theme = event.target.value;
      document.documentElement.style.colorScheme = event.target.value === 'dark' ? 'dark' : 'light';
    }
    if (event.target.matches('[data-project-check]')) {
      const index = Number(event.target.dataset.projectCheck);
      state.project.checks[index] = event.target.checked;
      saveState();
    }
    if (event.target.id === 'profile-name') {
      state.displayName = event.target.value.trim().slice(0, 60);
      updateHeaderAccount();
      saveState();
      const name = document.querySelector('.avatar-stage p');
      if (name) name.textContent = state.displayName || 'Apprenant ou apprenante';
    }
  });

  document.addEventListener('input', event => {
    if (event.target.form?.id === 'contact-form') return clearContactFieldError(event.target);
    if (event.target.name === 'firstName' && currentRoute === 'onboarding') {
      const previewName = document.querySelector('.profile-preview strong');
      if (previewName) previewName.textContent = event.target.value.trim() || 'Ton avatar';
    }
  });

  document.querySelector('.menu-toggle').addEventListener('click', event => {
    const toggle = event.currentTarget;
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.querySelector('#main-nav').classList.toggle('open', open);
  });

  window.addEventListener('hashchange', () => {
    currentRoute = routeFromHash();
    render();
  });
  window.addEventListener('popstate', () => {
    currentRoute = routeFromHash();
    render();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.book-button')) {
      event.preventDefault();
      openIntro();
    }
  });

  if (location.hash && !new URLSearchParams(location.hash.slice(1)).has('access_token')) currentRoute = routeFromHash();
  registerOfflineApp();
  initializeApp();
})();
