#!/bin/sh
set -e

echo "⏳ Esperando base de datos..."
sleep 8

echo "🧹 Limpiando caché..."
php artisan config:clear
php artisan cache:clear

echo "✅ Iniciando servidor Diana Tours..."
exec php artisan serve --host=0.0.0.0 --port=8000