# NAVIX
Drone Terrestre Autonome de Livraison

	- Présentation du projet

NAVIX est un robot mobile autonome dédié à la livraison de petits colis en environnement intérieur.

Avec l’essor de la logistique et de la livraison urbaine, les robots terrestres de livraison se développent. Ce projet propose de concevoir un mini-drone terrestre capable d’assurer la livraison d’un courrier ou petit colis entre deux points, en autonomie et en toute sécurité.

Année académique : 2025–2026

~ Objectifs du projet ~

--Objectifs techniques

	- Concevoir une plateforme mobile stable capable de transporter une charge légère
	- Implémenter une navigation autonome point A → point B
	- Intégrer des capteurs pour la détection et l’évitement d’obstacles
	- Garantir un arrêt précis et un signalement fiable à destination

--Objectifs pédagogiques

	- Maîtriser l’architecture d’un système embarqué
	- Intégrer et exploiter des capteurs en temps réel
	- Développer une logique de navigation autonome
	- Structurer un projet technique complet (mécanique, électronique, logiciel)

~ Cahier des charges fonctionnel ~

NAVIX doit être capable de :

	- Transporter un petit colis dans un compartiment sécurisé
	- Se déplacer de manière autonome entre deux points prédéfinis
	- Détecter et éviter les obstacles
	- S’arrêter automatiquement à destination
	- Signaler son arrivée par LED ou buzzer

~ Fonctions optionnelles ~

	- Confirmation de réception via bouton
	- Authentification simple avant ouverture du compartiment
	- Gestion de plusieurs destinations

~ Architecture du système ~
1. Partie mécanique

	- Châssis robot mobile (2 ou 4 roues motrices)
	- Compartiment ou tiroir intégré
	- Structure stable adaptée à un usage intérieur

2. Partie électronique

	- Microcontrôleur : Arduino ou ESP32
	- Capteurs ultrason et/ou infrarouge
	- Capteurs de suivi de ligne (option)
	- Moteurs DC avec module de pilotage
	- Dispositif de signalisation (LED / buzzer)

3. Partie logicielle

	- Algorithme de navigation
	- Gestion des trajectoires et des virages
	- Traitement des données capteurs
	- Gestion des événements (obstacle, arrivée)
	- Procédure d’arrêt sécurisé

~ Démonstration attendue ~

	- Parcours prédéfini en salle ou en couloir
	- Livraison autonome d’un petit objet
	- Fonctionnement sans intervention humaine

~ Critères de validation ~

	- Transport et dépôt correct du colis
	- Déplacement autonome complet
	- Évitement fonctionnel des obstacles
	- Signalement d’arrivée opérationnel
