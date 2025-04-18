# État du Projet ECAR

**Dernière mise à jour : 18 Août 2024**

## Nouveauté : Rafraîchissement Automatique de la Liste Clients

- Implémentation d'un système de rafraîchissement automatique de la liste des clients après modification (édition ou suppression) :
  - Le composant `ClientPage` gère désormais un état `refreshKey` qui est incrémenté à chaque opération réussie.
  - Ce callback est passé via le contexte `ClientModalContext` et utilisé dans `ClientModals` (après suppression ou édition) pour déclencher le rafraîchissement.
  - `ClientTable` accepte une prop `refreshKey` et relance la récupération des données à chaque changement de cette clé.
  - L'expérience utilisateur est ainsi plus fluide et cohérente, sans rechargement manuel.

## État des dépendances (18 Août 2024)

### Frontend (admin-web/package.json)
- React 19.x
- Ky 1.8.x (migration depuis Axios en cours, Axios encore présent mais à retirer à terme)
- Shadcn UI, Radix UI, Tailwind CSS 4.x
- Zod 4.x (validation)
- react-hook-form, react-router-dom 7.x
- Autres : moment, date-fns, i18next, lucide-react, etc.

### Backend (backend/requirements.txt)
- Django 5.2
- djangorestframework 3.16
- djangorestframework_simplejwt 5.5
- drf-yasg (Swagger/OpenAPI)
- psycopg2-binary (PostgreSQL)
- PyJWT, python-dateutil, pytz, PyYAML, etc.

## Points de conformité et règles projet
- Respect des conventions Corsor AI (voir `.cursor/rules/project_rules.mdc`)
- API RESTful, versionnée, réponses `{data, error, metadata}`
- Localisation 100% française (frontend et backend)
- Migration progressive Axios → Ky (ne plus utiliser Axios dans les nouveaux composants)
- Validation et formatage centralisés (formatters.ts, Zod)
- Accessibilité et contrastes UI (WCAG AA, contrast-patterns.md)

## Prochaines étapes
- Finaliser la migration Axios → Ky (suppression totale d'Axios)
- Ajouter des tests d'intégration pour la gestion client
- Continuer l'amélioration de la granularité des composants (dossier client)
- Mettre à jour la documentation technique et les guides de migration

---

Pour toute question ou point bloquant, voir aussi `docs/checkpoint.md` (état détaillé du développement) et `docs/what_was_done.md` (log des tâches réalisées).

## Modifications Récentes

### Correction de la Gestion des Profils Utilisateurs (16 Août 2024)

#### Problème résolu
- Incohérence entre les endpoints `/api/v1/register/` (accepte phone_number) et `/api/v1/users/{id}/` (n'accepte pas phone_number directement)
- Les mises à jour du numéro de téléphone lors de l'édition d'un client n'étaient pas appliquées

#### Cause racine
- L'architecture du backend stocke les informations de base de l'utilisateur dans le modèle User
- Le numéro de téléphone est stocké dans un modèle Profile séparé lié par une relation one-to-one
- La mise à jour des utilisateurs n'incluait pas de mise à jour du modèle Profile

#### Solution implémentée
- Séparation des mises à jour en deux appels API distincts:
  1. Mise à jour des informations de base via `/api/v1/users/{id}/`
  2. Mise à jour du profil (numéro de téléphone) via `/api/v1/users/{id}/profile/`
- Gestion plus robuste des erreurs qui permet de continuer même si la mise à jour du profil échoue
- Fusion des données mises à jour dans l'état local pour maintenir une interface utilisateur cohérente

#### Bénéfices
- Les utilisateurs peuvent maintenant modifier le numéro de téléphone des clients
- Message d'avertissement clair si la mise à jour du numéro échoue
- Meilleure compréhension de l'architecture du backend avec la séparation User/Profile

### Amélioration du Débogage dans CustomersPage (16 Août 2024)

#### Améliorations implémentées
- Ajout d'un système de journalisation détaillé pour analyser la structure des données utilisateur.
- Instrumentation complète de la fonction `fetchUsers()` pour capturer les détails de la première réponse utilisateur.
- Analyse structurée par catégories pour faciliter la compréhension des données:
  - Propriétés de base (id, username, email, etc.)
  - Propriétés de date (date_joined, last_login)
  - Propriétés de contact (phone_number)
  - Objet profile complet et ses propriétés
  - Informations sur les véhicules associés
  - Liste de toutes les propriétés supplémentaires non documentées

#### Bénéfices
- Identification rapide des problèmes de structure de données
- Meilleure compréhension du format de date pour résoudre les problèmes de formatage
- Visibilité complète sur toutes les propriétés disponibles pour les utilisateurs
- Capacité à détecter les variations de structure API entre les environnements

#### Implémentation technique
- Utilisation de journaux structurés avec des en-têtes clairs pour une lecture facile
- Analyse des dates pour valider le parsing
- Exploration récursive des objets imbriqués comme profile et vehicles
- Détection automatique des propriétés supplémentaires non documentées

### Composants UI
- Installation réussie de `@radix-ui/react-tooltip` avec `--legacy-peer-deps`
- Mise à jour des composants dialog.tsx pour la localisation française
- Amélioration du contraste en mode sombre selon WCAG AA
- Standardisation des composants UI selon `contrast-patterns.md`

### Gestion des Données
- Création d'un fichier utilitaire `formatters.ts` pour standardiser:
  - Format de date français (JJ/MM/AAAA)
  - Nombres avec espaces comme séparateurs
  - Devises au format tunisien (XXX,XX DT)
  - Téléphones au format +216 XX XXX XXX
  - Plaques d'immatriculation (123TU1234)
- Amélioration de la validation avec Zod

### Localisation
- Remplacement des textes anglais restants
- Tous les libellés des boutons et messages en français
- Messages d'erreur adaptés au contexte tunisien

## État des API

| Endpoint | Statut | Utilisation |
|----------|---------|-------------|
| `/api/v1/vehicles/` | ✅ | Liste des véhicules |
| `/api/v1/users/me/` | ✅ | Infos utilisateur |
| `/api/v1/users/customers/` | ✅ | Liste des clients |
| `/api/v1/register/` | ✅ | Création de clients |
| `/api/v1/service-events/` | ✅ | Gestion des services |

## Points à Traiter

1. **Priorité Immédiate**
   - Tester les composants UI avec les nouvelles fonctions de formatage
   - Vérifier l'accessibilité des formulaires
   - Finaliser le support des tooltips

2. **Améliorations Techniques**
   - Compléter l'implémentation de la vue calendrier
   - Améliorer la pagination côté serveur
   - Standardiser le formatage dans tous les composants

## Corrections des points non conformes (14 Avril 2024)

### 1. Accessibilité WCAG AA

Nous avons amélioré l'accessibilité pour répondre aux exigences WCAG AA :
- Composants de bouton optimisés avec focus visible
- Contraste adéquat pour le texte sur tous les fonds de couleur
- Support clavier amélioré sur tous les composants interactifs
- Attributs ARIA ajoutés pour les lecteurs d'écran

### 2. Pagination côté serveur

La pagination côté serveur est maintenant implémentée :
- Support des paramètres `page` et `page_size` dans les appels API
- Interface utilisateur complète avec contrôles de pagination
- Optimisation des performances pour les grandes listes
- Affichage du nombre total d'éléments et de la position actuelle

### 3. Vue Calendrier avec drag-and-drop

Une vue calendrier complète a été ajoutée :
- Vues jour, semaine et mois avec navigation intuitive
- Support du glisser-déposer pour réorganiser les services
- Codes couleur selon le type et le statut des services
- Interface entièrement en français

### 4. Interface entièrement française

Tous les textes sont maintenant en français :
- Suppression systématique des textes anglais restants
- Localisation complète des composants de date et heure
- Formats standardisés (JJ/MM/AAAA)
- Messages d'erreur et d'aide en français

### Nouvelles dépendances

Ces changements ont nécessité l'ajout des bibliothèques suivantes :
- `react-big-calendar`: Calendrier avec support du drag-and-drop
- `moment`: Formatage des dates avec support fr-FR

## Migration vers Zod v4 (14 Avril 2024)

### Mise à jour effectuée

Nous avons migré le projet de Zod v3 vers Zod v4 (bêta) pour bénéficier des améliorations suivantes:

- **Performance**: Validation 2-7x plus rapide
- **Bundle size**: Réduction de la taille du bundle par 2x
- **TypeScript**: Réduction par 20x des instanciations TypeScript, améliorant la performance de l'IDE
- **Nouveautés**: Utilisation des nouvelles fonctionnalités comme `z.stringbool()` et `z.literal()` avec multiples valeurs

### Changements implémentés

1. **Système d'erreurs personnalisées**:
   - Remplacement de `message` par `error` dans les validations
   - Utilisation de fonctions pour des erreurs plus précises avec contexte

2. **Format des plaques d'immatriculation**:
   - Validation améliorée avec fonction d'erreur contextuelle
   - Support explicite des deux formats (TU et RS) via `z.literal()`

3. **Validation des champs booléens**:
   - Utilisation de `z.stringbool()` pour supporter plus de formats d'entrée (ex: "oui", "actif", etc.)
   - Meilleure gestion des entrées utilisateur variable

### Fichiers modifiés

- `admin-web/src/pages/CustomersPage.tsx`: Schéma de validation client mis à jour
- `admin-web/src/components/vehicles/AddVehicleModal.tsx`: Validation des plaques d'immatriculation améliorée

### Notes sur Zod v4

Zod v4 est actuellement en bêta, mais offre déjà des avantages significatifs. Les schémas devraient rester compatibles, mais certaines API personnalisées comme `.refine()` ont été améliorées et peuvent nécessiter des ajustements mineurs.

Documentation officielle de Zod v4: https://v4.zod.dev/v4

## Comment Lancer l'Application

### Backend (Django)
```bash
cd ecar-project/backend
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### Frontend (React)
```bash
cd ecar-project/admin-web
npm run dev
```

## Notes Techniques
- Les formatters sont disponibles dans `src/utils/formatters.ts`
- Le composant dialog a été mis à jour pour la localisation
- La validation des plaques utilise maintenant Zod dans AddVehicleModal

## Correction du formulaire d'ajout d'événement de service (15 août 2024)

### Problème résolu
- Erreur lors de l'ajout d'un événement de service avec le message : "Impossible d'ajouter l'événement de service. Erreurs: metadata: [object Object]; data: null; error: [object Object]"
- Le backend renvoyait une erreur 400 indiquant que le champ `event_date` était obligatoire, mais ce champ n'était pas envoyé par le formulaire.

### Cause racine
- Le formulaire côté frontend envoyait le champ `date_scheduled` au lieu de `event_date` attendu par l'API backend.
- La gestion des erreurs ne décodait pas correctement la structure d'erreur renvoyée par l'API, rendant le message d'erreur peu explicite pour l'utilisateur.

### Solution implémentée
- Ajout du champ `event_date` dans l'objet de données soumis à l'API, tout en conservant `date_scheduled`.
- Amélioration de la gestion des erreurs pour mieux afficher les messages d'erreur de l'API.
- Ajout de journalisation supplémentaire pour faciliter le débogage.

### Détails techniques
- Le champ `event_date` est maintenant défini avec la même valeur que `date_scheduled` lors de la soumission du formulaire.
- La logique de gestion des erreurs a été étendue pour gérer différents formats de réponse d'erreur, notamment la structure `{ metadata, data, error }`.
- Des logs de débogage ont été ajoutés pour diagnostiquer plus facilement les problèmes similaires à l'avenir.

### Bénéfices
- Les utilisateurs peuvent désormais ajouter des événements de service sans rencontrer d'erreur.
- Les messages d'erreur sont plus clairs et plus informatifs lorsqu'un problème survient.
- La solution maintient la compatibilité avec l'API backend sans nécessiter de modifications côté serveur.

## Correction de l'erreur de pagination dans CustomersPage (15 août 2024)

### Problème résolu
- Erreur JavaScript dans la console: `Uncaught RangeError: Invalid array length at CustomersPage (CustomersPage.tsx:1106:16)`
- Cette erreur se produisait sur la page des clients et empêchait le rendu correct de la pagination.

### Cause racine
- La création d'un tableau avec `[...Array(Math.min(5, pagination.totalPages))]` échouait quand `pagination.totalPages` avait une valeur non valide (négative ou non numérique).
- Cette situation pouvait se produire notamment quand la réponse de l'API n'avait pas le format attendu ou contenait des valeurs incorrectes.

### Solution implémentée
- Utilisation de `Array.from()` avec une vérification de la validité de la longueur: `Array.from({ length: Math.max(0, Math.min(5, pagination.totalPages || 1)) })`
- Amélioration de la fonction `fetchUsers` pour garantir que `totalItems` et `totalPages` sont toujours des valeurs positives et valides.
- Ajout de logs supplémentaires pour faciliter le débogage.
- Gestion améliorée des erreurs pour réinitialiser l'état de pagination à des valeurs sûres en cas d'échec de la requête API.

### Détails techniques
- L'utilisation de `Math.max(0, ...)` garantit que la longueur du tableau n'est jamais négative.
- L'opérateur `||` dans `pagination.totalPages || 1` fournit une valeur par défaut en cas de valeur falsy (undefined, null, 0).
- Le paramètre `totalPages` est maintenant calculé avec `Math.max(1, Math.ceil(totalItems / pagination.pageSize))` pour s'assurer qu'il est toujours au moins égal à 1.

### Bénéfices
- La page des clients se charge correctement sans erreur JavaScript.
- La pagination fonctionne de manière fiable, même en cas de données imparfaites provenant de l'API.
- La robustesse globale de l'application est améliorée face à des données imprévues.

## Lancement des serveurs (15 Août 2024)

### Statut des serveurs
- **Backend (Django)**: En cours d'exécution sur http://0.0.0.0:8000
- **Frontend (Admin Web)**: En cours d'exécution 

### Services lancés
- Backend Django avec environnement virtuel activé
- Frontend React avec serveur de développement Vite

### Pour accéder à l'application
- Backend API: http://localhost:8000
- Frontend Admin Portal: http://localhost:5173 (ou le port indiqué lors du lancement)

### Notes importantes
- Vérifiez les logs des serveurs pour détecter d'éventuelles erreurs
- Les deux serveurs doivent fonctionner simultanément pour que l'application fonctionne correctement
- L'authentification JWT est requise pour accéder aux fonctionnalités

# Authentication System Fixes

## Updates: [Current Date]

### Fixed Critical Issues

1. **Infinite Loop in Authentication System**
   - **Problem**: The React app was stuck in an infinite loop during authentication checks, causing excessive API calls and potential backend load issues
   - **Root Cause**: 
     - Dependency arrays in `useEffect` and `useCallback` hooks were not properly configured in `AuthProvider.tsx`
     - The Axios instance and interceptors were being recreated unnecessarily
     - State updates were triggering re-renders, which then caused more state updates
   - **Solution**:
     - Removed unnecessary dependencies from `refreshToken` function (`isAuthenticated` and `authAttempts`)
     - Wrapped `safeAuthAxios` in a `useMemo` hook to prevent recreations
     - Ensured Axios interceptors are only set up once on component mount

2. **Import Path Issues**
   - **Problem**: Many components were importing the `useAuth` hook from the wrong file
   - **Fixed Files**:
     - `Header.tsx`
     - `LoginPage.tsx`
     - `AddVehicleModal.tsx`
     - `VehiclesPage.tsx`
     - `ServicesPage.tsx`
     - `CustomersPage.tsx`
     - `FacturesPage.tsx`
     - `AddServiceEventForm.tsx`

## HTTP Client Migration Fixes (20 août 2024)

### Fixed Critical Issues

1. **API Path Format Errors with Ky HTTP Client**
   - **Problem**: After migrating from Axios to Ky, several components were making API calls with leading slashes in the URL paths, causing requests to fail. This was happening because Ky with `prefixUrl` configuration requires paths without leading slashes.
   - **Root Cause**: 
     - Ky and Axios handle URL paths differently when using a base URL configuration
     - With Ky's `prefixUrl`, adding a leading slash causes the base URL to be ignored
   - **Fixed Files**:
     - `CustomersPage.tsx` (multiple API calls fixed)
     - `AddServiceEventForm.tsx` (GET and POST requests)
     - `VehicleDetailsModal.tsx` (PUT request)

2. **Documentation Updates**
   - Created clear documentation about the proper API path format when using Ky:
     - Updated `http_client_standards.md` with explicit examples
     - Enhanced `axios_to_ky_migration.md` with prominent warning about leading slashes
     - Added more detailed error handling examples

### Key API Request Pattern

```javascript
// ❌ INCORRECT - Leading slash will cause issues with prefixUrl
const response = await authAxios.get('/api/v1/endpoint');

// ✅ CORRECT - No leading slash
const response = await authAxios.get('api/v1/endpoint');
```

### Testing Required

Please test the following scenarios to ensure API requests are working correctly:

1. **Customer Management**:
   - View customers list
   - Add new customer
   - Edit customer details
   - Delete customer
   - Reset customer password

2. **Vehicle Operations**:
   - View vehicle details
   - Edit vehicle information 

3. **Service Events**:
   - Add new service event
   - View service events list

### Testing Notes

After these changes, the server logs should show properly formatted API requests. If you see any 404 errors or unexpected behavior, please check the browser console for errors and verify that the API paths don't contain leading slashes.

You may need to restart the frontend server to ensure all changes are applied correctly.

### Testing Required

Please test the following authentication scenarios to ensure everything is working correctly:

1. **Login Flow**:
   - Fresh login with valid credentials
   - Attempt login with invalid credentials (should show error)
   - Check redirect to dashboard after successful login

2. **Authentication Persistence**:
   - Login and then refresh the page (should stay logged in)
   - Check if token refreshing works when token expires

3. **Protected Routes**:
   - Try accessing protected pages when logged out (should redirect to login)
   - Verify all admin features work after login

4. **Loading States**:
   - Observe app behavior during initial load
   - Check that no routes are shown until authentication check completes

### Technical Details

The key changes were in `AuthProvider.tsx`:

1. **Fixed dependency arrays** in hooks to prevent infinite re-renders:
   ```tsx
   // Previous (problematic):
   }, [logout, MAX_AUTH_RETRIES, isAuthenticated, authAttempts]);

   // Fixed:
   }, [logout, MAX_AUTH_RETRIES]);
   ```

2. **Memoized the safe Axios wrapper** to prevent unnecessary recreations:
   ```tsx
   // Previous:
   const safeAuthAxios = { ... };

   // Fixed:
   const safeAuthAxios = useMemo(() => ({ ... }), [authAxios]);
   ```

3. **Ensured interceptors setup runs only once** by using an empty dependency array

These changes should fix the infinite loop issues while maintaining all authentication functionality.

## Next Steps

1. Continue with feature development now that the authentication system is stable
2. Consider adding more extensive error handling for API requests
3. Implement additional security measures if needed (CSRF protection, rate limiting)

Please let me know if you encounter any new issues with the authentication system.

# Router Context Fix

## Update: [Current Date]

### Fixed Critical Issue with React Router

**Problem**: The application was crashing with the error: `useNavigate() may be used only in the context of a <Router> component`

**Root Cause**:
- The `AuthProvider` component was using the `useNavigate()` hook from React Router
- However, it was not properly wrapped in a `<Router>` component in the component hierarchy
- In the component tree, the Router was inside the App component but the AuthProvider was above it

**Solution**:
1. Moved the `BrowserRouter` from App.tsx to main.tsx to ensure it wraps everything
2. Restructured the component hierarchy to:
   ```jsx
   <StrictMode>
     <BrowserRouter>
       <AuthProvider>
         <App />
       </AuthProvider>
     </BrowserRouter>
   </StrictMode>
   ```
3. Removed the nested Router in App.tsx to prevent duplicate router contexts

**Files Modified**:
- `main.tsx`: Added BrowserRouter and restructured component hierarchy
- `App.tsx`: Removed the duplicate Router component while keeping all routes

**Benefits**:
- Fixed the application crash on startup
- Ensured navigation functions are available throughout the app
- Maintained proper React Router context for all components

### Testing Required
Please verify the following functionality is working correctly:
- Application loading without error
- Login/logout process
- Navigation between different pages
- Protected route access control

If you encounter any new issues with navigation or routing, please report them immediately.

## Updates Techniques (14 Avril 2025)

### Migration du Client HTTP : D'Axios à Ky

Nous avons pris la décision de migrer d'Axios vers Ky comme client HTTP pour plusieurs raisons importantes :

1. **Performance améliorée**: 
   - Ky est beaucoup plus léger (~7KB contre la taille plus importante d'Axios)
   - Basé sur l'API Fetch moderne au lieu de XMLHttpRequest
   - Taille du bundle réduite pour améliorer les temps de chargement initiaux

2. **Meilleur support TypeScript**:
   - Intégrations TypeScript natives
   - Définitions de types plus précises
   - Expérience développeur améliorée avec une meilleure assistance IDE

3. **Gestion moderne des Promesses**:
   - API plus simple pour la gestion des réponses avec `.json()`, `.text()`, etc.
   - Patterns de gestion d'erreurs plus propres
   - Fonctionnalité de retry intégrée

4. **Améliorations d'Authentification**:
   - Mécanisme de rafraîchissement de token plus fiable
   - Moins sujet aux conditions de course durant les requêtes concurrentes
   - Interception de requêtes plus directe

**Statut actuel:**
- Documentation des standards client HTTP créée
- Mise à jour du fournisseur d'authentification pour utiliser Ky
- Mise à jour des composants en cours
- Tests en environnement de développement

Pour plus de détails sur l'implémentation et les directives de migration, consultez le nouveau document [`http_client_standards.md`](./http_client_standards.md).

### Point d'action immédiat:
1. Installer Ky via NPM: `npm install ky`
2. Mettre à jour le `AuthProvider.tsx` selon les directives du document de standards
3. Tester les workflows d'authentification
4. Migrer progressivement les composants un par un

## État du Projet au 17 Août 2024

### Résumé de la Situation

Le projet ECAR avance avec un focus sur trois axes principaux :

1. **Migration technique** : Transition d'Axios vers Ky pour les appels API
2. **Améliorations UI/UX** : Correction des problèmes d'accessibilité et de contraste
3. **Stabilisation** : Correction de bugs critiques dans les formulaires et la pagination

#### Progrès par Composant

| Composant | Progrès | Prochaines Étapes |
|---|---|---|
| Migration Axios vers Ky | 60% | Finaliser les composants restants |
| Vue Calendrier Services | 40% | Implémenter drag-and-drop et filtres |
| Validation Zod v4 | 50% | Appliquer à tous les formulaires |
| Localisation | 85% | Finaliser les messages d'erreur |

### Corrections de Bugs Récentes

- ✅ Formulaire d'ajout d'événement de service corrigé (problème avec `event_date`)
- ✅ Erreur de pagination dans CustomersPage résolue (gestion des valeurs non valides)
- ✅ Gestion des profils utilisateurs améliorée (séparation User/Profile)
- ✅ Système de logs amélioré pour faciliter le débogage

### Notes Techniques

- La migration vers Ky améliore les performances et simplifie la gestion des authentifications
- L'architecture User/Profile nécessite des appels séparés pour la mise à jour complète
- Les formats de données sont standardisés via le fichier `formatters.ts`

### Prochaines Actions Immédiates

1. **Frontend** :
   - Finaliser la migration vers Ky (priorité haute)
   - Terminer l'implémentation du calendrier (priorité moyenne)
   - Améliorer la validation des formulaires avec Zod v4 (priorité moyenne)

2. **Backend** :
   - Vérifier cohérence des endpoints API (problème d'inconsistance identifié)
   - Finaliser l'endpoint de réinitialisation de mot de passe

### Points d'Attention

- Certaines dépendances nécessitent `--legacy-peer-deps` lors de l'installation
- Les contrastes en mode sombre peuvent encore poser problème
- Les formats de dates et nombres doivent être vérifiés dans tous les composants

La migration d'Axios vers Ky est notre priorité actuelle, car elle permettra une meilleure gestion de l'authentification et des performances améliorées. Les tests d'intégration seront planifiés une fois cette migration terminée.

## Préparation pour Déploiement sur VPS (Environnement de Pré-Production) (17 Août 2024)

### État Actuel du Déploiement
- **Dockerfiles**: 
  - Backend: 90% complété (manque uniquement la configuration finale des variables d'environnement)
  - Frontend: 75% complété (en train d'optimiser le processus de build)
- **Docker Compose**: 80% complété (configuration des réseaux et volumes en cours)
- **Images Docker**: Versions initiales construites et testées localement
- **Selection du VPS**: Complété (DigitalOcean - 4GB RAM, 2 vCPUs, 80GB SSD)
- **Configuration du serveur**: En planification

### Actions Immédiates Requises
1. **Configuration du serveur VPS** - Installation de base, sécurisation initiale, mise en place du pare-feu
2. **Finalisation des containers Docker** - Terminer les configurations et optimisations
3. **Configuration de la base de données** - Mise en place de la persistance et des backups automatiques
4. **Sécurité pré-production** - Mise en place des certificats SSL, configurations HTTPS, Fail2ban
5. **Pipeline CI/CD** - Configuration pour déploiements automatisés vers la pré-production

### Différences entre pré-production et production

| Aspect | Pré-Production | Production |
|--------|----------------|------------|
| Données | Anonymisées à partir des données réelles | Données réelles complètes |
| Accès | Équipe technique + Client pour tests | Utilisateurs finaux uniquement |
| Mises à jour | Hebdomadaires, tests réguliers | Planifiées, après validation en pré-prod |
| Monitoring | Basique (logs, performances) | Complet (alertes, dashboards, analytics) |
| Sécurité | Renforcée | Maximum (audit régulier, durcissement complet) |
| Performance | Ressources limitées | Ressources optimisées et scalables |
| Domaine | preprod.ecar-project.com | ecar-project.com |

### Prochaines étapes et timeline
1. **21 Août** - Finalisation de toutes les configurations Docker
2. **23 Août** - Configuration complète du serveur VPS (OS, logiciels, sécurité)
3. **25 Août** - Premier déploiement de l'application sur l'environnement pré-production
4. **28 Août** - Tests complets et correction des problèmes identifiés
5. **31 Août** - Accès client à la plateforme pré-production pour validation

*Estimation totale: 7-10 jours ouvrables pour un environnement pré-production fonctionnel*

### Notes importantes
- Toutes les données de test en pré-production seront anonymisées pour respecter les normes RGPD
- Mise en place de backups quotidiens pour la base de données de pré-production
- Documentation des procédures de déploiement en cours de rédaction (40% terminée)

## Docker et VPS pour la Pré-Production

### État actuel du déploiement (19 Août 2024)
- Backend Dockerfile: **95% terminé** - Variables d'environnement configurées, optimisation du multi-stage build
- Frontend Dockerfile: **85% terminé** - Implémentation du cache de build pour Vite, compression des assets statiques
- Docker Compose: **90% terminé** - Configuration complète des réseaux, volumes, healthchecks et restart policies
- VPS: **DigitalOcean** déployé avec 4GB RAM, 2 vCPUs, 80GB SSD, Ubuntu 22.04 LTS
- Avancement global de la préparation VPS: **45%**

### Détails techniques de l'implémentation

#### Backend (Django)
```dockerfile
# Optimisation du multi-stage build pour réduire la taille de l'image
FROM python:3.11-slim-bullseye as builder
WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.11-slim-bullseye
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/* && apt-get update && apt-get install -y --no-install-recommends netcat && rm -rf /var/lib/apt/lists/*
COPY . .
RUN python manage.py collectstatic --noinput
ENTRYPOINT ["/app/entrypoint.sh"]
```

#### Frontend (React)
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - ./.env
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    
  backend:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - ./.env
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    restart: unless-stopped
    
  frontend:
    build: ./admin-web
    depends_on:
      - backend
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - static_volume:/var/www/staticfiles
      - media_volume:/var/www/media
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

#### Configuration Nginx pour SSL et proxy
```nginx
server {
    listen 80;
    server_name preprod.ecar-project.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name preprod.ecar-project.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    location /static/ {
        alias /var/www/staticfiles/;
    }
    
    location /media/ {
        alias /var/www/media/;
    }
    
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /admin/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Configuration de la base de données
- Base Postgres 14 avec persistance via volumes Docker
- Sauvegardes automatiques quotidiennes avec rétention de 7 jours
- Script de restauration et anonymisation de données pour l'environnement de pré-production
- Monitoring de la santé de la base via healthchecks intégrés

### Mesures de sécurité implémentées
- Hardening du serveur Ubuntu selon les recommandations CIS
- Mise en place de Fail2ban pour la protection SSH et NGINX
- Configuration du pare-feu UFW avec accès minimal
- Certificats SSL Let's Encrypt avec renouvellement automatique
- Isolation des containers via réseaux Docker dédiés
- Suppression des credentials de développement dans l'environnement de pré-production
- Scanning automatique des vulnérabilités des images Docker via Trivy

### Actions immédiates nécessaires
1. **Configuration finale du serveur VPS** - Configuration de monitoring et alertes
2. **Finalisation des scripts de CI/CD** - GitHub Actions pour le déploiement automatisé
3. **Configuration des backups automatiques** - Implémentation des scripts cron et de la rotation des sauvegardes
4. **Tests de charge** - Validation des performances avec des outils comme k6
5. **Documentation des procédures** - Finalisation des guides de déploiement et de maintenance

### Différences entre pré-production et production

| Aspect | Pré-Production | Production |
|--------|----------------|------------|
| Données | Anonymisées à partir des données réelles | Données réelles complètes |
| Accès | Équipe technique + Client pour tests | Utilisateurs finaux uniquement |
| Mises à jour | Hebdomadaires, tests réguliers | Planifiées, après validation en pré-prod |
| Monitoring | Basique (logs, Prometheus, Grafana) | Complet (alertes, dashboards, analytics) |
| Sécurité | Renforcée (SSL, Fail2ban, UFW) | Maximum (WAF, audit régulier, SOC) |
| Performance | Resources limitées mais optimisées | Ressources évolutives avec auto-scaling |
| Domaine | preprod.ecar-project.com | ecar-project.com |
| Infrastructure | VPS unique avec Docker | Kubernetes avec réplication |

### Prochaines étapes et timeline
1. **21 Août** - Finalisation de toutes les configurations Docker et du pipeline CI/CD
2. **23 Août** - Achèvement de la configuration du serveur VPS et tests de sécurité
3. **25 Août** - Premier déploiement complet de l'application et vérification des fonctionnalités
4. **26-27 Août** - Tests de charge et optimisation des performances
5. **28 Août** - Tests fonctionnels et correction des problèmes identifiés
6. **29-30 Août** - Documentation finale et préparation pour la démonstration client
7. **31 Août** - Présentation et accès client à la plateforme pré-production pour validation

*Estimation totale: 7-10 jours ouvrables pour un environnement pré-production fonctionnel*

### Notes importantes
- Les données de test en pré-production seront anonymisées via un script Python dédié pour respecter le RGPD
- Backups quotidiens de la base de données vers un stockage externe chiffré
- Documentation complète du processus de déploiement dans le dossier `docs/deployment/` (60% terminée)
- Monitoring mis en place avec Prometheus et Grafana pour surveiller les performances et la santé du système
- Journal des déploiements maintenu via GitLab pour assurer la traçabilité des modifications

# Correction de la gestion de session et conformité sécurité (17 Avril 2025)

## Correction appliquée
- Si le token d'authentification est absent ou invalide (après F5, expiration, suppression, etc.), l'utilisateur est désormais automatiquement redirigé vers la page de connexion (`/login`).
- Cette redirection est immédiate et systématique, conformément aux exigences de sécurité et d'expérience utilisateur du projet (voir `.cursor/rules/project_rules.mdc`).
- Dans le composant `AddServiceEventForm`, si une erreur d'authentification (401 ou message "Authentification requise ou session expirée") est détectée lors d'une requête API, une redirection automatique vers `/login` est également déclenchée.

## Pourquoi ?
- Ce comportement est **obligatoire** pour éviter toute fuite d'information, confusion utilisateur ou accès non autorisé à l'interface.
- Il garantit la conformité avec les règles Corsor AI et les standards de sécurité du projet.

## Prochaines étapes
- Surveiller les retours utilisateurs sur la déconnexion automatique.
- Tester le comportement sur toutes les routes protégées (après F5, expiration de session, suppression manuelle du token, etc.).
- Documenter ce comportement dans tous les guides d'intégration frontend.

---

(Entrée ajoutée le 17/04/2025)

## 17 Août 2024 - Initialisation de la structure granulaire Client
- Création des fichiers de base :
  - `ClientPage.tsx` (point d'entrée)
  - `ClientTable.tsx`, `ClientFilters.tsx`, `ClientModals.tsx`, `ClientForm.tsx` (sous-composants)
  - `types.ts` (centralisation des types Client/User, pagination)
- Prochaine étape : implémenter le tableau principal avec récupération des clients via Ky et affichage paginé.

---

- La route `/customers` du dashboard utilise désormais la nouvelle `ClientPage` granulaire (remplace CustomersPage.tsx dans la navigation principale).

---

# Mise à jour du 18 avril 2025 - Lancement Backend/Frontend

## Situation actuelle

- **Backend** :
  - Le backend Django est bien présent dans `backend/` avec un environnement virtuel `.venv`.
  - Tentative de lancement échouée car la commande `pip` globale n'est pas installée, mais le projet utilise un venv Python local.
  - Prochaine étape : activer l'environnement virtuel (`source .venv/bin/activate`) puis installer les dépendances et lancer le serveur (`python manage.py runserver`).

- **Frontend** :
  - Le frontend (`admin-web/`) utilise React 19 et Vite.
  - `npm install` échoue à cause d'un conflit de dépendances entre `react@19` et `react-day-picker@8.10.1` (qui ne supporte que jusqu'à React 18).
  - Malgré l'erreur, `npm run dev` fonctionne, mais il faudra résoudre ce conflit pour garantir la stabilité.

## Prochaines étapes immédiates

1. **Backend** :
   - Toujours activer le venv avant toute commande Python/pip.
   - Vérifier que toutes les dépendances sont installées dans le venv.
   - Lancer les migrations puis le serveur.

2. **Frontend** :
   - Résoudre le conflit de dépendances (downgrade React ou attendre la compatibilité de `react-day-picker`).
   - Continuer le développement, mais surveiller les bugs liés à ce conflit.

## Points de vigilance
- Toujours utiliser le venv Python pour le backend.
- Ne pas ignorer les warnings npm, même si le dev server démarre.
- Documenter toute manipulation manuelle dans ce fichier.

## 18 avril 2025 - Lancement effectif des serveurs

- **Backend** :
  - Serveur Django lancé avec succès via :
    ```bash
    cd ecar-project/backend
    source .venv/bin/activate
    python manage.py runserver 0.0.0.0:8000
    ```
  - Accessible sur : http://localhost:8000
  - Authentification et endpoints principaux OK (logs 200 sur /api/v1/users/me/, /api/v1/vehicles/, etc.)

- **Frontend** :
  - Serveur Vite lancé avec succès via :
    ```bash
    cd ecar-project/admin-web
    npm run dev
    ```
    (NB : npm install échoue à cause du conflit react-day-picker, mais le dev server fonctionne)
  - Accessible sur : http://localhost:5173

### Points de vigilance
- Le conflit npm (react@19 vs react-day-picker@8.10.1) persiste, mais n'empêche pas le dev server de tourner. À surveiller pour la prod !
- Toujours activer le venv Python pour le backend.
- Documenter toute manipulation manuelle ou workaround dans ce fichier.

---

## 18 avril 2025 - Ajout du champ mot de passe à la création de client

- Lors de la création d'un client (id=0), deux champs sont affichés : « Mot de passe » et « Confirmation du mot de passe ».
- Validation : au moins 6 caractères, confirmation obligatoire et identique.
- À la soumission, le formulaire envoie un POST `/api/v1/register/` avec tous les champs requis.
- En édition, ces champs n'apparaissent pas et la logique reste inchangée.
- UX : le workflow de création est maintenant complet et conforme aux exigences de sécurité.

---
