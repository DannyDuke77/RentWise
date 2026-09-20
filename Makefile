.PHONY: dev down devup restart superuser

# Start dev environment
dev:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up --build -d

# Start dev environment in detached mode
devup:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

down:
	docker compose --env-file .env.dev -f docker-compose.dev.yml down

restart:
	docker compose --env-file .env.dev -f docker-compose.dev.yml restart

superuser:
	docker compose --env-file .env.dev -f docker-compose.dev.yml exec backend python manage.py createsuperuser