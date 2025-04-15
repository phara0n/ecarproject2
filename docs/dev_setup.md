# Guide d'installation pour l'environnement de développement ECAR

Ce document explique comment configurer l'environnement de développement pour le projet ECAR.

## Prérequis

- Python 3.10+
- Node.js 18+ et npm
- PostgreSQL 13+
- Git

## 1. Cloner le dépôt

```bash
git clone https://repository.url/ecar-project.git
cd ecar-project
```

## 2. Configuration de la base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur (pour le développement)
CREATE DATABASE ecar_dev;
CREATE USER ecar_dev WITH PASSWORD 'dev_password';
ALTER ROLE ecar_dev SET client_encoding TO 'utf8';
ALTER ROLE ecar_dev SET default_transaction_isolation TO 'read committed';
ALTER ROLE ecar_dev SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ecar_dev TO ecar_dev;
\q
```

## 3. Configuration du Backend (Django)

```bash
# Créer et activer l'environnement virtuel
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Créer un fichier .env pour le développement
cat > .env << EOL
DEBUG=True
SECRET_KEY=dev_secret_key_for_local_use_only
DATABASE_URL=postgres://ecar_dev:dev_password@localhost/ecar_dev
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
EOL

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Charger des données initiales (optionnel)
python manage.py loaddata initial_data.json

# Créer les groupes nécessaires
python manage.py shell -c "from django.contrib.auth.models import Group; Group.objects.get_or_create(name='Customers'); Group.objects.get_or_create(name='Mechanics'); Group.objects.get_or_create(name='Admins')"
```

## 4. Configuration du Frontend (React/Vite)

```bash
# Installer les dépendances
cd ../admin-web
npm install --legacy-peer-deps

# Créer un fichier .env.development
cat > .env.development << EOL
VITE_API_URL=http://localhost:8000
EOL
```

## 5. Lancement des serveurs de développement

### Backend
```bash
# Dans un terminal
cd backend
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
# Dans un autre terminal
cd admin-web
npm run dev
```

## 6. Gestion des migrations et génération de données

### Créer une migration après modification des modèles
```bash
cd backend
source .venv/bin/activate
python manage.py makemigrations
python manage.py migrate
```

### Générer des données fictives pour le développement
```bash
cd backend
source .venv/bin/activate
python manage.py shell

# Dans le shell Python
from django.contrib.auth.models import User, Group
from garage.models import Vehicle, ServiceType, MileageRecord, ServiceEvent

# Créer un utilisateur client
user = User.objects.create_user(username='client1', password='client1password', email='client1@example.com')
customers_group = Group.objects.get(name='Customers')
user.groups.add(customers_group)

# Créer un véhicule
vehicle = Vehicle.objects.create(
    owner=user,
    make='Renault',
    model='Clio',
    year=2018,
    registration_number='123TU4567',
    initial_mileage=50000
)

# Créer des types de service
oil_change = ServiceType.objects.create(
    name='Vidange',
    description='Changement d\'huile et filtre',
    default_interval_km=10000,
    default_interval_months=12
)

# Créer un relevé de kilométrage
MileageRecord.objects.create(
    vehicle=vehicle,
    mileage=55000,
    source='CUSTOMER',
    recorded_by=user
)

# Créer un événement de service
ServiceEvent.objects.create(
    vehicle=vehicle,
    service_type=oil_change,
    mileage_at_service=52500,
    notes='Vidange effectuée'
)

exit()
```

## 7. Outils de développement recommandés

- **Éditeur de code**: VS Code avec extensions Python et JavaScript/TypeScript
- **Client API**: Postman ou Insomnia pour tester les API
- **Gestionnaire de base de données**: pgAdmin ou DBeaver

## 8. Debugging

### Backend
1. Utilisez `python manage.py runserver --nothreading --noreload` pour un débogage plus facile
2. Ajoutez des instructions `import pdb; pdb.set_trace()` ou utilisez l'extension Debugger de VS Code

### Frontend
1. Utilisez les outils de développement du navigateur (Chrome DevTools)
2. Utilisez les React Developer Tools
3. Configurez le débogueur dans VS Code

## 9. Tests

### Backend
```bash
cd backend
source .venv/bin/activate
python manage.py test
```

### Frontend
```bash
cd admin-web
npm test
```

## 10. Documentation API

Une fois le serveur backend lancé, la documentation Swagger est disponible à:

- http://localhost:8000/api/schema/swagger-ui/
- http://localhost:8000/api/schema/redoc/

## 11. Workflow Git recommandé

1. Créez une branche pour chaque fonctionnalité: `git checkout -b feature/nom-de-fonctionnalite`
2. Faites des commits fréquents et significatifs
3. Poussez vers le dépôt distant: `git push origin feature/nom-de-fonctionnalite`
4. Créez une Pull Request pour la revue de code
5. Après approbation, fusionnez la branche avec master/main

---

Ce guide est conçu pour le développement local. Pour le déploiement en production, consultez le document `deployment_guide.md`. 