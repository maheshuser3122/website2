#!/bin/bash

# Website2 Deployment Script for Linux Server
# Run this on your Linux server: bash deploy-server.sh

set -e

echo "================================"
echo "Website2 - Server Deployment"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/website2"
DOMAIN="mcharvtechlabs.com"
NODE_VERSION="18"
REPO_URL="https://github.com/maheshuser3122/website2.git"

# Step 1: Update system
echo -e "${YELLOW}[1/7]${NC} Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install Node.js
echo -e "${YELLOW}[2/7]${NC} Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Step 3: Install Git
echo -e "${YELLOW}[3/7]${NC} Installing Git..."
sudo apt-get install -y git

# Step 4: Clone repository
echo -e "${YELLOW}[4/7]${NC} Cloning Website2 repository..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull origin main
else
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone $REPO_URL "$APP_DIR"
    cd "$APP_DIR"
fi

# Step 5: Install dependencies and build
echo -e "${YELLOW}[5/7]${NC} Installing dependencies and building..."
npm ci
cd apps/report-generator/frontend
npm ci
npm run build
cd ../../../

# Step 6: Create dist directory
echo -e "${YELLOW}[6/7]${NC} Creating distribution directory..."
mkdir -p /var/www/html/website2

cp apps/dashboard/index.html /var/www/html/website2/ || true
cp apps/dashboard/admin.html /var/www/html/website2/ || true
cp apps/dashboard/api-client.js /var/www/html/website2/ || true
cp -r public/* /var/www/html/website2/ 2>/dev/null || true
cp -r apps/report-generator/frontend/dist/* /var/www/html/website2/ 2>/dev/null || true
mkdir -p /var/www/html/website2/invoice-generator
mkdir -p /var/www/html/website2/resume-builder
mkdir -p /var/www/html/website2/tds-manager
cp -r apps/invoice-generator/frontend/* /var/www/html/website2/invoice-generator/ 2>/dev/null || true
cp -r apps/resume-builder/frontend/* /var/www/html/website2/resume-builder/ 2>/dev/null || true
cp -r apps/tds-manager/* /var/www/html/website2/tds-manager/ 2>/dev/null || true

sudo chown -R www-data:www-data /var/www/html/website2
sudo chmod -R 755 /var/www/html/website2

# Step 7: Configure Nginx
echo -e "${YELLOW}[7/7]${NC} Configuring Nginx..."
sudo tee /etc/nginx/sites-available/website2 > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    root /var/www/html/website2;
    index index.html;
    
    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/website2 /etc/nginx/sites-enabled/website2

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured and restarted${NC}"

# Step 8: Install Certbot for SSL (optional)
echo -e "${YELLOW}[BONUS] Installing Certbot for free SSL...${NC}"
sudo apt-get install -y certbot python3-certbot-nginx

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update DNS at Hostinger:"
echo "   - Type: A Record"
echo "   - Name: @"
echo "   - Value: 4.247.147.62"
echo ""
echo "2. Setup SSL (after DNS propagates, ~5-30 min):"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "3. Your site will be live at:"
echo "   http://$DOMAIN"
echo ""
echo "Logs:"
echo "   Nginx: sudo tail -f /var/log/nginx/access.log"
echo "   Errors: sudo tail -f /var/log/nginx/error.log"
