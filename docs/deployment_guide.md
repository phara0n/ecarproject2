# Guide de Déploiement ECAR

Ce document décrit la procédure complète pour déployer l'application ECAR (backend Django + frontend React).

## Prérequis

### Système
- Python 3.10+ 
- Node.js 18+ et npm
- PostgreSQL 13+
- Serveur web (Nginx recommandé)
- Supervisord (pour la gestion des processus)

### Packages système (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx supervisor git
```

## 1. Cloner le dépôt

```bash
# Cloner le dépôt
git clone https://repository.url/ecar-project.git
cd ecar-project
```

## 2. Configuration de la base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE DATABASE ecar_db;
CREATE USER ecar_user WITH PASSWORD 'mot_de_passe_securise';
ALTER ROLE ecar_user SET client_encoding TO 'utf8';
ALTER ROLE ecar_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ecar_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ecar_db TO ecar_user;
\q
```

## 3. Configuration du Backend (Django)

```bash
# Créer et activer l'environnement virtuel
cd backend
python3 -m venv .venv
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer un fichier .env
cat > .env << EOL
DEBUG=False
SECRET_KEY=votre_cle_secrete_tres_longue_et_aleatoire
DATABASE_URL=postgres://ecar_user:mot_de_passe_securise@localhost/ecar_db
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com,IP_du_serveur
CORS_ALLOWED_ORIGINS=https://votre-domaine.com
MEDIA_ROOT=/chemin/vers/media
STATIC_ROOT=/chemin/vers/static
EOL

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Collecter les fichiers statiques
python manage.py collectstatic --no-input

# Créer les groupes nécessaires
python manage.py shell -c "from django.contrib.auth.models import Group; Group.objects.get_or_create(name='Customers'); Group.objects.get_or_create(name='Mechanics'); Group.objects.get_or_create(name='Admins')"
```

## 4. Configuration du Frontend (React)

```bash
# Installer les dépendances
cd ../admin-web
npm install --legacy-peer-deps

# Créer un fichier .env pour la production
cat > .env.production << EOL
VITE_API_URL=https://api.votre-domaine.com
EOL

# Construire l'application
npm run build
```

## 5. Configuration de Nginx

```bash
# Créer un fichier de configuration pour le backend
sudo nano /etc/nginx/sites-available/ecar-backend

# Ajouter la configuration suivante
server {
    listen 80;
    server_name api.votre-domaine.com;

    location /static/ {
        alias /chemin/vers/ecar-project/backend/static/;
    }

    location /media/ {
        alias /chemin/vers/ecar-project/backend/media/;
    }

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://localhost:8000;
    }
}

# Créer un fichier de configuration pour le frontend
sudo nano /etc/nginx/sites-available/ecar-frontend

# Ajouter la configuration suivante
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    root /chemin/vers/ecar-project/admin-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Activer les configurations
sudo ln -s /etc/nginx/sites-available/ecar-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ecar-frontend /etc/nginx/sites-enabled/

# Vérifier la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

## 6. Configuration de Supervisord pour Gunicorn

```bash
# Installer Gunicorn dans l'environnement virtuel
cd /chemin/vers/ecar-project/backend
source .venv/bin/activate
pip install gunicorn

# Créer un fichier de configuration pour Supervisor
sudo nano /etc/supervisor/conf.d/ecar.conf

# Ajouter la configuration suivante
[program:ecar]
command=/chemin/vers/ecar-project/backend/.venv/bin/gunicorn core.wsgi:application --workers 3 --bind 127.0.0.1:8000
directory=/chemin/vers/ecar-project/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/ecar.log
environment=DJANGO_SETTINGS_MODULE="core.settings"

# Mettre à jour Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ecar
```

## 7. Configuration HTTPS (optionnel mais recommandé)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir les certificats
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com -d api.votre-domaine.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

## 8. Maintenance et mises à jour

Pour mettre à jour l'application après des modifications du code :

### Backend
```bash
cd /chemin/vers/ecar-project
git pull
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --no-input
sudo supervisorctl restart ecar
```

### Frontend
```bash
cd /chemin/vers/ecar-project
git pull
cd admin-web
npm install --legacy-peer-deps
npm run build
```

## 9. Surveillance et logs

- **Logs Nginx**: `/var/log/nginx/access.log` et `/var/log/nginx/error.log`
- **Logs Django (via Supervisor)**: `/var/log/ecar.log`
- **Status Supervisor**: `sudo supervisorctl status ecar`

## 10. Backup

Il est recommandé de configurer des sauvegardes régulières :

```bash
# Sauvegarde de la base de données
pg_dump -U ecar_user ecar_db > backup_$(date +%Y-%m-%d).sql

# Sauvegarde des fichiers médias
rsync -av /chemin/vers/ecar-project/backend/media/ /chemin/vers/backup/media/
```

## Dépannage

1. **Le backend ne démarre pas**:
   - Vérifier les logs: `sudo supervisorctl tail ecar`
   - Vérifier la configuration Django: `cd backend && source .venv/bin/activate && python manage.py check`

2. **Le frontend ne s'affiche pas correctement**:
   - Vérifier la console du navigateur pour les erreurs
   - Vérifier que l'URL de l'API est correctement configurée

3. **Erreurs de base de données**:
   - Vérifier la connexion: `psql -U ecar_user -h localhost ecar_db`
   - Vérifier les logs PostgreSQL: `/var/log/postgresql/postgresql-XX-main.log` 