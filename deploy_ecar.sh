#!/bin/bash
# Script de déploiement ECAR projet sur VPS
# Déploie le backend et frontend en Docker avec HTTPS
# Gère automatiquement la création d'utilisateur si exécuté en root

# Couleurs pour la lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Script de déploiement ECAR projet ===${NC}"

# Vérifier si l'utilisateur est root, si oui, créer l'utilisateur ecar avec droits sudo
if [ "$(id -u)" == "0" ]; then
    echo -e "${YELLOW}Script exécuté en tant que root. Vérification de l'utilisateur ecar...${NC}"
    
    # Vérifier si l'utilisateur ecar existe
    if id "ecar" &>/dev/null; then
        echo -e "${GREEN}L'utilisateur ecar existe déjà.${NC}"
    else
        echo -e "${GREEN}Création de l'utilisateur ecar...${NC}"
        # Créer l'utilisateur ecar
        useradd -m -s /bin/bash ecar
        
        # Définir un mot de passe pour ecar
        echo -e "${YELLOW}Définition du mot de passe pour l'utilisateur ecar${NC}"
        passwd ecar
        
        # Ajouter ecar au groupe sudo
        usermod -aG sudo ecar
        echo -e "${GREEN}Utilisateur ecar ajouté au groupe sudo.${NC}"
        
        # S'assurer que le répertoire home existe
        mkdir -p /home/ecar
        chown ecar:ecar /home/ecar
    fi
    
    # Demander si l'utilisateur souhaite continuer en tant que root ou passer à ecar
    read -p "Voulez-vous continuer le déploiement en tant que root? (o/n): " continue_as_root
    if [[ $continue_as_root != "o" && $continue_as_root != "O" ]]; then
        echo -e "${GREEN}Le script va se terminer. Reconnectez-vous en tant qu'utilisateur ecar pour continuer.${NC}"
        echo -e "${YELLOW}Utilisez: su - ecar${NC}"
        exit 0
    fi
else
    # Vérifier si l'utilisateur actuel est ecar
    if [ "$(whoami)" != "ecar" ]; then
        echo -e "${YELLOW}ATTENTION: Vous n'êtes pas connecté en tant qu'utilisateur 'ecar'.${NC}"
        read -p "Voulez-vous continuer avec l'utilisateur actuel ($(whoami))? (o/n): " continue_with_current
        if [[ $continue_with_current != "o" && $continue_with_current != "O" ]]; then
            echo -e "${GREEN}Arrêt du script. Connectez-vous en tant qu'utilisateur ecar pour continuer.${NC}"
            exit 0
        fi
    fi
fi

# Demander l'URL du site
read -p "Entrez le domaine pour le site (ex: ecar.example.com): " DOMAIN_NAME

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}Installation de Docker...${NC}"
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    # Méthode d'installation plus récente pour Docker
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $(whoami)
    echo -e "${GREEN}Docker installé avec succès!${NC}"
    echo -e "${YELLOW}IMPORTANT: Vous devrez peut-être vous déconnecter et vous reconnecter pour que les changements de groupe prennent effet.${NC}"
else
    echo -e "${GREEN}Docker est déjà installé.${NC}"
fi

# Vérifier si Docker Compose est installé
if ! command -v docker compose &> /dev/null; then
    echo -e "${GREEN}Installation de Docker Compose...${NC}"
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installé avec succès!${NC}"
else
    echo -e "${GREEN}Docker Compose est déjà installé.${NC}"
fi

# Vérifier et configurer UFW (Uncomplicated Firewall)
echo -e "${GREEN}Vérification et configuration du pare-feu UFW...${NC}"
if ! command -v ufw &> /dev/null; then
    echo -e "${YELLOW}UFW n'est pas installé. Installation...${NC}"
    sudo apt-get update
    sudo apt-get install -y ufw
fi

# Vérifier si UFW est déjà activé
if sudo ufw status | grep -q "Status: active"; then
    echo -e "${YELLOW}UFW est déjà activé. Vérification des règles...${NC}"
else
    echo -e "${GREEN}Configuration des règles UFW...${NC}"
    
    # Configurer les règles de base
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Autoriser SSH pour éviter de se bloquer
    sudo ufw allow ssh
    
    # Autoriser HTTP et HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Demander confirmation avant d'activer UFW
    echo -e "${RED}ATTENTION: Activation d'UFW. Assurez-vous que SSH (port 22) est autorisé!${NC}"
    read -p "Activer UFW maintenant? (o/n): " enable_ufw
    
    if [[ $enable_ufw == "o" || $enable_ufw == "O" ]]; then
        echo -e "${YELLOW}Activation d'UFW...${NC}"
        sudo ufw --force enable
        echo -e "${GREEN}UFW activé et configuré avec succès!${NC}"
    else
        echo -e "${YELLOW}UFW n'a pas été activé. Vous pouvez l'activer manuellement plus tard avec 'sudo ufw enable'${NC}"
    fi
fi

# Afficher le statut UFW
echo -e "${GREEN}Statut actuel d'UFW:${NC}"
sudo ufw status

# Créer le répertoire principal pour le projet
DEPLOY_DIR="/opt/ecar-project"
echo -e "${GREEN}Création du répertoire de déploiement $DEPLOY_DIR...${NC}"
sudo mkdir -p $DEPLOY_DIR
sudo chown $(whoami):$(whoami) $DEPLOY_DIR
cd $DEPLOY_DIR

# Cloner le repo GitHub spécifié
echo -e "${GREEN}Clonage du répertoire GitHub spécifié...${NC}"
if [ -d ".git" ]; then
    echo -e "${YELLOW}Répertoire Git existant détecté. Mise à jour...${NC}"
    git pull
else
    echo -e "${GREEN}Clonage du dépôt depuis https://github.com/phara0n/ecarproject2.git${NC}"
    git clone https://github.com/phara0n/ecarproject2.git .
fi

# Créer le répertoire pour les volumes Docker
mkdir -p postgres_data
mkdir -p media
mkdir -p static
mkdir -p nginx/conf.d
mkdir -p certbot/www
mkdir -p certbot/conf

# Créer le fichier docker-compose.yml
echo -e "${GREEN}Création du fichier docker-compose.yml...${NC}"
cat > docker-compose.yml << EOF
version: '3.8'

services:
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - ./.env
    restart: unless-stopped
    networks:
      - ecar-network

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    depends_on:
      - db
    env_file:
      - ./.env
    volumes:
      - ./static:/app/staticfiles
      - ./media:/app/media
    restart: unless-stopped
    networks:
      - ecar-network

  frontend:
    build:
      context: ./admin-web
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=https://${DOMAIN_NAME}/api
    restart: unless-stopped
    networks:
      - ecar-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./static:/var/www/static
      - ./media:/var/www/media
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - ecar-network

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"
    networks:
      - ecar-network

volumes:
  postgres_data:

networks:
  ecar-network:
    driver: bridge
EOF

# Créer les Dockerfiles pour le backend (Django)
echo -e "${GREEN}Création du Dockerfile pour le backend...${NC}"
cat > backend/Dockerfile << EOF
FROM python:3.10-slim-bullseye as builder

WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.10-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=core.settings

WORKDIR /app

COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

COPY . .

RUN pip install gunicorn
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]
EOF

# Créer le Dockerfile pour le frontend (React)
echo -e "${GREEN}Création du Dockerfile pour le frontend...${NC}"
cat > admin-web/Dockerfile << EOF
FROM node:18-alpine as build

WORKDIR /app

# Transférer les fichiers de dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Construire l'application
ARG VITE_API_URL
ENV VITE_API_URL=\${VITE_API_URL}
RUN npm run build

# Étape 2: Utiliser Nginx pour servir le frontend
FROM nginx:alpine

# Copier le build depuis l'étape précédente
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx s'exécutera sur le port 80
EXPOSE 80

# Nginx démarre automatiquement dans l'image, pas besoin de CMD
EOF

# Créer le fichier .env pour les variables d'environnement
echo -e "${GREEN}Configuration des variables d'environnement (.env)...${NC}"
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
SECRET_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 50)

# Variables par défaut
ENV_VARS="# PostgreSQL
POSTGRES_DB=ecardb
POSTGRES_USER=ecaruser
POSTGRES_PASSWORD=${DB_PASSWORD}

# Django
DEBUG=False
SECRET_KEY=${SECRET_KEY}
ALLOWED_HOSTS=${DOMAIN_NAME}
DATABASE_URL=postgresql://ecaruser:${DB_PASSWORD}@db/ecardb"

# Demander à l'utilisateur s'il souhaite ajouter des variables personnalisées
echo -e "${YELLOW}Souhaitez-vous ajouter des variables d'environnement personnalisées?${NC}"
read -p "Ajouter des variables personnalisées? (o/n): " add_custom_vars

if [[ $add_custom_vars == "o" || $add_custom_vars == "O" ]]; then
    echo -e "${GREEN}Configuration des variables d'environnement personnalisées${NC}"
    echo -e "${YELLOW}Saisissez chaque variable au format CLÉ=VALEUR (ex: API_KEY=abcdef123456)${NC}"
    echo -e "${YELLOW}Appuyez sur Entrée sans rien saisir quand vous avez terminé${NC}"
    
    # Liste des sections prédéfinies
    echo -e "${BLUE}Sections disponibles:${NC}"
    echo -e "1. Email configuration"
    echo -e "2. API Keys"
    echo -e "3. External Services"
    echo -e "4. Mobile App settings"
    echo -e "5. Authentication"
    echo -e "6. Autre (personnalisé)"
    
    # Création des variables d'environnement par section
    declare -A sections
    
    while true; do
        read -p "Choisissez une section (1-6) ou appuyez sur Entrée pour terminer: " section_choice
        
        # Sortir si aucune section n'est choisie
        if [[ -z $section_choice ]]; then
            break
        fi
        
        # Déterminer le nom de la section
        case $section_choice in
            1) section_name="# Email configuration" ;;
            2) section_name="# API Keys" ;;
            3) section_name="# External Services" ;;
            4) section_name="# Mobile App settings" ;;
            5) section_name="# Authentication" ;;
            6) 
                read -p "Nom de la section personnalisée: " custom_section
                section_name="# ${custom_section}" 
                ;;
            *) 
                echo -e "${RED}Choix invalide. Veuillez saisir un nombre entre 1 et 6.${NC}"
                continue
                ;;
        esac
        
        echo -e "${BLUE}Configuration pour la section: ${section_name}${NC}"
        echo -e "${YELLOW}Saisissez chaque variable au format CLÉ=VALEUR, Entrée vide pour terminer cette section${NC}"
        
        section_vars=""
        while true; do
            read -p "Variable (format CLÉ=VALEUR): " custom_var
            
            # Sortir de cette section si aucune variable n'est saisie
            if [[ -z $custom_var ]]; then
                break
            fi
            
            # Vérifier le format CLÉ=VALEUR
            if [[ ! $custom_var =~ ^[A-Za-z0-9_]+=.+$ ]]; then
                echo -e "${RED}Format invalide. Utilisez le format CLÉ=VALEUR${NC}"
                continue
            fi
            
            # Ajouter à la section
            section_vars="${section_vars}${custom_var}\n"
            echo -e "${GREEN}Variable ajoutée: ${custom_var}${NC}"
        done
        
        # Stocker les variables de cette section
        if [[ ! -z $section_vars ]]; then
            sections["$section_name"]=$section_vars
        fi
    done
    
    # Ajouter les sections et leurs variables au fichier .env
    for section in "${!sections[@]}"; do
        ENV_VARS="${ENV_VARS}\n\n${section}\n${sections[$section]}"
    done
fi

# Écrire le fichier .env
echo -e $ENV_VARS > .env

# Afficher les variables configurées
echo -e "${GREEN}Variables d'environnement configurées:${NC}"
cat .env

# Configuration Nginx avec redirection vers HTTPS
echo -e "${GREEN}Configuration de Nginx...${NC}"
cat > nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN_NAME};
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Fichiers statiques
    location /static/ {
        alias /var/www/static/;
    }

    location /media/ {
        alias /var/www/media/;
    }

    # API et admin Django
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend React
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Script d'initialisation SSL
echo -e "${GREEN}Création du script d'initialisation SSL...${NC}"
cat > init-letsencrypt.sh << 'EOF'
#!/bin/bash

if ! [ -x "$(command -v docker compose)" ]; then
  echo 'Error: docker compose is not installed.' >&2
  exit 1
fi

domains=$1
rsa_key_size=4096
data_path="./certbot"
email="" # Laisser vide pour désactiver les notifications par e-mail

if [ -d "$data_path/conf/live/$domains" ]; then
  read -p "Certificats existants pour $domains. Les supprimer et en obtenir de nouveaux? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

echo "### Création d'un certificat dummy..."
mkdir -p "$data_path/conf/live/$domains"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '/etc/letsencrypt/live/$domains/privkey.pem' \
    -out '/etc/letsencrypt/live/$domains/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "### Démarrage nginx..."
docker compose up --force-recreate -d nginx

echo "### Suppression du certificat dummy..."
docker compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot

echo "### Demande d'un certificat réel..."
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $email \
    -d $domains \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot

echo "### Redémarrage nginx..."
docker compose exec nginx nginx -s reload
EOF

chmod +x init-letsencrypt.sh

echo -e "${GREEN}Configuration terminée. Lancement du déploiement...${NC}"

# Lancer le déploiement
docker compose up -d db
echo -e "${GREEN}Base de données démarrée. Attente de 10 secondes...${NC}"
sleep 10

# Installer les dépendances et exécuter les migrations Django
echo -e "${GREEN}Configuration de Django et création d'un superuser...${NC}"
read -p "Nom d'utilisateur pour le superuser Django: " DJANGO_ADMIN_USER
read -s -p "Mot de passe pour le superuser Django: " DJANGO_ADMIN_PASSWORD
echo ""
read -p "Email pour le superuser Django: " DJANGO_ADMIN_EMAIL

# Démarrer les autres services
docker compose up -d

# Attendre que le backend soit prêt
echo -e "${GREEN}Attente du démarrage des services (30 secondes)...${NC}"
sleep 30

# Créer le superuser Django
echo -e "${GREEN}Création du superuser Django...${NC}"
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('$DJANGO_ADMIN_USER', '$DJANGO_ADMIN_EMAIL', '$DJANGO_ADMIN_PASSWORD') if not User.objects.filter(username='$DJANGO_ADMIN_USER').exists() else None"

# Initialiser Let's Encrypt
echo -e "${GREEN}Initialisation des certificats SSL...${NC}"
./init-letsencrypt.sh $DOMAIN_NAME

# Script pour gérer les variables d'environnement ultérieurement
echo -e "${GREEN}Création d'un script utilitaire pour gérer les variables d'environnement...${NC}"
cat > manage_env.sh << 'EOF'
#!/bin/bash

# Couleurs pour la lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

ENV_FILE="/opt/ecar-project/.env"
BACKUP_DIR="/opt/ecar-project/env_backups"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Fonction pour afficher le menu
show_menu() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}   Gestion des variables d'environnement   ${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo -e "1. Afficher les variables actuelles"
    echo -e "2. Ajouter/Modifier une variable"
    echo -e "3. Supprimer une variable"
    echo -e "4. Ajouter une nouvelle section"
    echo -e "5. Sauvegarder le fichier .env"
    echo -e "6. Restaurer une sauvegarde"
    echo -e "7. Redémarrer les services Docker"
    echo -e "8. Quitter"
    echo -e "${BLUE}=======================================${NC}"
}

# Fonction pour afficher les variables actuelles
show_variables() {
    echo -e "${GREEN}Variables d'environnement actuelles:${NC}"
    cat $ENV_FILE
    echo ""
}

# Fonction pour ajouter/modifier une variable
add_variable() {
    echo -e "${YELLOW}Ajouter ou modifier une variable${NC}"
    read -p "Nom de la variable: " var_name
    read -p "Valeur de la variable: " var_value
    
    # Vérifier si la variable existe déjà
    if grep -q "^$var_name=" $ENV_FILE; then
        # Remplacer la valeur existante
        sed -i "s/^$var_name=.*/$var_name=$var_value/" $ENV_FILE
        echo -e "${GREEN}Variable $var_name mise à jour.${NC}"
    else
        # Ajouter la nouvelle variable
        echo "$var_name=$var_value" >> $ENV_FILE
        echo -e "${GREEN}Variable $var_name ajoutée.${NC}"
    fi
}

# Fonction pour supprimer une variable
delete_variable() {
    echo -e "${YELLOW}Supprimer une variable${NC}"
    read -p "Nom de la variable à supprimer: " var_name
    
    # Vérifier si la variable existe
    if grep -q "^$var_name=" $ENV_FILE; then
        # Supprimer la variable
        sed -i "/^$var_name=/d" $ENV_FILE
        echo -e "${GREEN}Variable $var_name supprimée.${NC}"
    else
        echo -e "${RED}Variable $var_name non trouvée.${NC}"
    fi
}

# Fonction pour ajouter une nouvelle section
add_section() {
    echo -e "${YELLOW}Ajouter une nouvelle section${NC}"
    read -p "Nom de la section: " section_name
    
    # Ajouter la section au fichier
    echo "" >> $ENV_FILE
    echo "# $section_name" >> $ENV_FILE
    echo -e "${GREEN}Section # $section_name ajoutée.${NC}"
    
    # Demander s'il faut ajouter des variables à cette section
    read -p "Voulez-vous ajouter des variables à cette section? (o/n): " add_vars
    if [[ $add_vars == "o" || $add_vars == "O" ]]; then
        while true; do
            read -p "Variable (format CLÉ=VALEUR) ou Entrée pour terminer: " custom_var
            
            # Sortir si aucune variable n'est saisie
            if [[ -z $custom_var ]]; then
                break
            fi
            
            # Vérifier le format CLÉ=VALEUR
            if [[ ! $custom_var =~ ^[A-Za-z0-9_]+=.+$ ]]; then
                echo -e "${RED}Format invalide. Utilisez le format CLÉ=VALEUR${NC}"
                continue
            fi
            
            # Ajouter la variable
            echo "$custom_var" >> $ENV_FILE
            echo -e "${GREEN}Variable ajoutée: ${custom_var}${NC}"
        done
    fi
}

# Fonction pour sauvegarder le fichier .env
backup_env() {
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="$BACKUP_DIR/env_backup_$timestamp.env"
    cp $ENV_FILE $backup_file
    echo -e "${GREEN}Fichier .env sauvegardé dans $backup_file${NC}"
}

# Fonction pour restaurer une sauvegarde
restore_backup() {
    echo -e "${YELLOW}Restaurer une sauvegarde${NC}"
    
    # Lister les sauvegardes disponibles
    echo -e "${BLUE}Sauvegardes disponibles:${NC}"
    backups=($(ls -1 $BACKUP_DIR))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo -e "${RED}Aucune sauvegarde trouvée.${NC}"
        return
    fi
    
    for i in "${!backups[@]}"; do
        echo "$((i+1)). ${backups[$i]}"
    done
    
    # Demander quelle sauvegarde restaurer
    read -p "Numéro de la sauvegarde à restaurer (1-${#backups[@]}): " backup_num
    
    if [[ ! $backup_num =~ ^[0-9]+$ ]] || [ $backup_num -lt 1 ] || [ $backup_num -gt ${#backups[@]} ]; then
        echo -e "${RED}Numéro invalide.${NC}"
        return
    fi
    
    # Sauvegarder l'état actuel avant de restaurer
    backup_env
    
    # Restaurer la sauvegarde choisie
    cp "$BACKUP_DIR/${backups[$((backup_num-1))]}" $ENV_FILE
    echo -e "${GREEN}Sauvegarde ${backups[$((backup_num-1))]} restaurée.${NC}"
}

# Fonction pour redémarrer les services Docker
restart_services() {
    echo -e "${YELLOW}Redémarrage des services Docker...${NC}"
    cd /opt/ecar-project
    docker compose down
    docker compose up -d
    echo -e "${GREEN}Services redémarrés avec les nouvelles variables d'environnement.${NC}"
}

# Boucle principale
while true; do
    show_menu
    read -p "Choisissez une option (1-8): " choice
    
    case $choice in
        1) show_variables ;;
        2) add_variable ;;
        3) delete_variable ;;
        4) add_section ;;
        5) backup_env ;;
        6) restore_backup ;;
        7) restart_services ;;
        8) 
            echo -e "${GREEN}Au revoir!${NC}"
            exit 0
            ;;
        *) echo -e "${RED}Option invalide. Veuillez réessayer.${NC}" ;;
    esac
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
done
EOF

chmod +x manage_env.sh

# Créer un lien symbolique pour l'accès facile
sudo ln -sf "$DEPLOY_DIR/manage_env.sh" /usr/local/bin/manage_env

# Afficher les informations récapitulatives
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}           DÉPLOIEMENT TERMINÉ!                  ${NC}"
echo -e "${GREEN}==================================================${NC}"
echo -e "Votre application est accessible à l'adresse: https://${DOMAIN_NAME}"
echo -e "Interface d'administration: https://${DOMAIN_NAME}/admin/"
echo -e "API: https://${DOMAIN_NAME}/api/"
echo -e "${YELLOW}INFORMATION UTILISATEUR:${NC}"
echo -e "Nom d'utilisateur système: ecar"
echo -e "${RED}IMPORTANT: CONSERVEZ CES INFORMATIONS EN LIEU SÛR${NC}"
echo -e "Base de données: ecardb"
echo -e "Utilisateur BD: ecaruser"
echo -e "Mot de passe BD: ${DB_PASSWORD}"
echo -e "Admin Django: ${DJANGO_ADMIN_USER}"
echo -e "Chemin du fichier .env: ${DEPLOY_DIR}/.env"
echo -e ""
echo -e "${GREEN}CONFIGURATION DE SÉCURITÉ:${NC}"
echo -e "Pare-feu UFW: $(sudo ufw status | grep Status | cut -d' ' -f2)"
echo -e "Ports ouverts: SSH (22), HTTP (80), HTTPS (443)"
echo -e ""
echo -e "${GREEN}GESTION DES VARIABLES D'ENVIRONNEMENT:${NC}"
echo -e "Pour gérer vos variables d'environnement ultérieurement, utilisez:"
echo -e "${YELLOW}sudo manage_env${NC} (disponible globalement)"
echo -e "Ou directement: ${YELLOW}sudo ${DEPLOY_DIR}/manage_env.sh${NC}" 