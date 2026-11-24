# Vigilia123

Création d'un SaaS indépendant de surveillance intelligente des applications numériques



1. Vision du projet



Je souhaite créer une nouvelle plateforme SaaS indépendante, moderne et évolutive, spécialisée dans la surveillance intelligente des applications, des sites web, des API et des infrastructures numériques.



Cette plateforme doit permettre à plusieurs utilisateurs et entreprises de connecter leurs applications, de surveiller leur fonctionnement, de détecter les anomalies, d'analyser les problèmes avec l'intelligence artificielle et de recevoir des rapports automatiques par e-mail.



Important : ce projet est un nouveau SaaS indépendant de MarketNet. Il ne doit pas être ajouté à MarketNet, ni modifier son code source.



Le produit doit être conçu dès le départ pour pouvoir accueillir plusieurs clients et devenir éventuellement une solution commercialisable.



2. Gestion des applications surveillées



Créer un espace permettant à chaque utilisateur de :



- Ajouter plusieurs applications et sites web.

- Enregistrer le nom, l'URL, la description et l'environnement de chaque application.

- Organiser les applications par catégories.

- Configurer les fréquences de surveillance.

- Consulter l'historique des contrôles.

- Consulter les performances et les incidents.

- Activer ou désactiver individuellement une surveillance.



Prévoir plusieurs environnements : production, staging et développement.



3. Surveillance technique



Mettre en place une surveillance automatisée comprenant :



- Vérification de disponibilité HTTP/HTTPS.

- Détection des erreurs HTTP (4xx, 5xx).

- Mesure du temps de réponse.

- Détection des interruptions de service.

- Surveillance de l'expiration des certificats SSL.

- Vérification des endpoints API.

- Surveillance des changements de disponibilité.

- Historique des performances.

- Détection des anomalies et alertes.



Prévoir une architecture extensible permettant d'ajouter ultérieurement des agents de surveillance et des intégrations supplémentaires.



Ne pas prétendre mesurer les ressources internes d'un serveur sans agent, API ou connexion adaptée.



4. Intégration GitHub en lecture seule



Créer une intégration GitHub sécurisée permettant de connecter des dépôts pour analyser leur code source.



Premier dépôt à connecter :



- Organisation : marketnet243

- Dépôt : MarketNet

- URL : https://github.com/marketnet243/MarketNet



Cette intégration doit utiliser de préférence une GitHub App avec des permissions minimales.



Permissions souhaitées :



- Repository metadata : Read-only.

- Contents : Read-only.

- Pull requests : Read-only.

- Commit information : Read-only.

- GitHub Actions : Read-only, si nécessaire.



Fonctionnalités :



- Lire et analyser les fichiers du dépôt.

- Identifier les technologies et l'architecture.

- Analyser les dépendances et leurs versions.

- Repérer les configurations potentiellement dangereuses.

- Détecter les vulnérabilités potentielles.

- Analyser les changements de code et les commits.

- Examiner les pull requests.

- Identifier les problèmes susceptibles d'affecter la disponibilité ou la sécurité de l'application.

- Produire des rapports techniques compréhensibles.

- Associer les résultats aux applications correspondantes.



Restrictions impératives :



- Aucun droit d'écriture sur les dépôts.

- Aucun commit, push, merge ou modification de branche.

- Aucune suppression ou création de fichiers.

- Aucune modification des paramètres GitHub.

- Ne jamais demander des permissions supérieures à celles nécessaires.



Prévoir la possibilité de connecter plusieurs dépôts GitHub pour différents projets et clients.



L'intégration GitHub doit être facultative : la surveillance HTTP/HTTPS doit fonctionner même sans connexion GitHub.



5. Surveillance métier et intégrations



Prévoir des intégrations pour surveiller les fonctionnalités réelles des applications, au-delà de leur simple disponibilité.



Exemples :



- API et endpoints personnalisés.

- Webhooks.

- Vérification de processus métier.

- Contrôle des connexions aux services externes.

- Vérification de certaines opérations critiques.



Les connexions doivent être explicites et sécurisées. Ne jamais supposer avoir accès aux données internes d'une application sans autorisation.



6. Intelligence artificielle – Google Gemini



Je souhaite pouvoir configurer moi-même ma clé API Google Gemini depuis l'espace administrateur.



Créer une rubrique :



Paramètres → Intelligence artificielle → Google Gemini



Fonctionnalités :



- Champ de saisie de la clé API.

- Bouton pour tester la connexion.

- Activation et désactivation de Gemini.

- Indication de l'état de connexion.

- Gestion des erreurs.

- Possibilité de remplacer la clé.



Sécurité obligatoire :



- Stocker la clé exclusivement côté serveur.

- Chiffrer les clés au repos.

- Isoler les clés par compte utilisateur ou organisation.

- Ne jamais exposer les clés dans le navigateur.

- Ne jamais inscrire les clés dans les journaux.

- Ne jamais intégrer de clé API directement dans le code source.



Utiliser Gemini pour :



- Analyser les incidents.

- Expliquer les erreurs techniques.

- Identifier les causes probables.

- Détecter les anomalies.

- Produire des recommandations.

- Générer des synthèses et des rapports intelligents.



7. Gestion des incidents



Créer un module complet de gestion des incidents.



Chaque incident doit comporter :



- Application concernée.

- Date et heure.

- Type d'incident.

- Niveau de gravité : faible, moyen, élevé ou critique.

- Description.

- État : ouvert, en cours, résolu.

- Durée de l'interruption.

- Historique des événements.

- Analyse IA lorsque disponible.

- Recommandations de résolution.



Prévoir un historique consultable et des statistiques sur les incidents.



8. Rapports automatiques par e-mail



Créer un système de rapports programmés.



Types de rapports :



- Quotidiens.

- Hebdomadaires.

- Mensuels.

- Rapports d'incidents.

- Rapports de performances.

- Rapports d'analyse technique.



Configuration initiale :



- Adresse de réception : marketnet243@gmail.com

- Heure : 07h00.

- Fuseau horaire : Africa/Lubumbashi.

- Canal de notification : e-mail uniquement.



L'utilisateur doit pouvoir modifier les destinataires, la fréquence et l'heure d'envoi.



Ne pas intégrer Telegram ou WhatsApp comme canaux de notification par défaut.



Les rapports doivent présenter les informations essentielles de manière claire et professionnelle.



9. Tableau de bord



Créer un tableau de bord moderne présentant :



- Nombre total d'applications.

- Applications disponibles.

- Applications indisponibles.

- Taux de disponibilité.

- Temps de réponse moyen.

- Incidents actifs.

- Incidents résolus.

- Alertes récentes.

- Évolution des performances.

- État des intégrations GitHub.

- Dernières analyses IA.



Utiliser des graphiques et des indicateurs visuels pertinents.



10. Architecture SaaS multi-utilisateurs



Construire une architecture multi-tenant.



Chaque organisation doit disposer de :



- Ses utilisateurs.

- Ses applications.

- Ses dépôts GitHub connectés.

- Ses intégrations.

- Ses paramètres Gemini.

- Ses rapports.

- Ses incidents.

- Ses historiques de surveillance.



Garantir une isolation stricte des données entre organisations.



Prévoir les rôles suivants :



- Super administrateur.

- Administrateur d'organisation.

- Responsable technique.

- Utilisateur en lecture seule.



Prévoir une architecture évolutive permettant d'ajouter ultérieurement des abonnements, des plans tarifaires, des quotas et une facturation.



11. Sécurité



Mettre en place :



- Authentification sécurisée.

- Gestion des sessions.

- Contrôle des autorisations.

- Isolation des organisations.

- Chiffrement des secrets.

- Protection des API.

- Validation des entrées.

- Journaux d'activité.

- Gestion sécurisée des intégrations.

- Protection contre les accès non autorisés.



La plateforme doit également être protégée contre les abus de surveillance, notamment les requêtes vers des adresses internes ou privées (protection SSRF).



12. Interface et expérience utilisateur



Créer une interface professionnelle, moderne, épurée et responsive.



Pages principales :



1. Tableau de bord.

2. Applications.

3. Surveillance.

4. Incidents.

5. Dépôts GitHub.

6. Analyse intelligente.

7. Rapports.

8. Intégrations.

9. Utilisateurs et organisations.

10. Paramètres.

11. Abonnements (préparation future).



L'interface doit être agréable sur ordinateur, tablette et smartphone.



Prévoir une navigation simple et une présentation claire des informations techniques.



13. Architecture technique



Choisir une architecture adaptée à un SaaS de surveillance :



- Frontend moderne et responsive.

- Backend sécurisé.

- Base de données relationnelle.

- Système de tâches planifiées.

- File de traitement des contrôles et analyses.

- Service d'envoi d'e-mails.

- Gestion sécurisée des secrets.

- Intégration Google Gemini.

- Intégration GitHub.



Séparer clairement les responsabilités du frontend, du backend et des services de surveillance.



Ne pas exposer les opérations sensibles au frontend.



14. Méthode de développement



Développer progressivement en plusieurs étapes :



Phase 1 : Fondation



- Initialisation du projet.

- Architecture générale.

- Authentification.

- Base de données.

- Gestion des organisations.



Phase 2 : Gestion des applications



- Création et gestion des applications.

- Configuration des surveillances.

- Tableau de bord.



Phase 3 : Surveillance technique



- Contrôles HTTP/HTTPS.

- Temps de réponse.

- Certificats SSL.

- Historique et alertes.



Phase 4 : Intégration GitHub



- Connexion sécurisée.

- Accès en lecture seule.

- Analyse du code source.

- Analyse des commits et dépendances.

- Rapports techniques.



Phase 5 : Intelligence artificielle



- Configuration personnelle de Gemini.

- Analyse des incidents.

- Recommandations intelligentes.



Phase 6 : Rapports



- Programmation des rapports.

- Envoi par e-mail.

- Historique des rapports.



Phase 7 : Sécurité et finalisation



- Tests.

- Vérification de l'isolation multi-tenant.

- Vérification des permissions GitHub.

- Vérification du stockage des secrets.

- Optimisation des performances.

- Préparation au déploiement.



15. Consignes importantes



Ne construis pas une simple maquette avec des données fictives présentées comme réelles.



Les fonctionnalités doivent être réellement opérationnelles, avec des connexions et des traitements backend.



Ne modifie jamais le dépôt MarketNet. Il sert uniquement de premier dépôt à analyser en lecture seule.



Ne considère pas qu'une simple vérification HTTP suffit à analyser toute une application.



Construis une base solide, sécurisée, modulaire et évolutive, capable de devenir un véritable produit SaaS commercialisable.



Avant chaque phase, vérifie la cohérence de l'architecture et la sécurité des fonctionnalités déjà développées. Fournis un compte rendu des éléments réellement implémentés et des éléments restant à faire.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vigilia123.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a607ba83-89fe-4f63-a10e-9c379fdd3855).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
