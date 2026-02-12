#!/bin/sh

if [ "$DATABASE" = "postgres" ]; then
    echo "Waiting for Postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
      sleep 0.1
    done

    echo "Postgres started"
fi

python manage.py makemigrations
python manage.py migrate

exec "$@"