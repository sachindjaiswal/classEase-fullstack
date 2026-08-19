#!/bin/sh
set -e

# First-run setup: create .env if missing
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    php artisan key:generate --ansi
fi

# Install PHP deps if vendor/ is missing
if [ ! -f "vendor/autoload.php" ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist
fi

# Install Node deps + build assets if node_modules/ is missing
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo "Building frontend assets..."
    npm run build
fi

# Ensure storage permissions
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Run the command passed to the container (php-fpm or queue worker)
exec "$@"
