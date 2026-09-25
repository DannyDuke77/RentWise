# properties/management/commands/generate_rent_charges.py
from django.core.management.base import BaseCommand
from properties.models import Tenancy
from properties.services.billing import ensure_rent_charge_for_period


class Command(BaseCommand):
    help = "Ensure every active tenancy has a rent charge for the current period."

    def handle(self, *args, **options):
        created_count = 0
        for tenancy in Tenancy.objects.filter(is_active=True).iterator(chunk_size=200):
            _, created = ensure_rent_charge_for_period(tenancy)
            if created:
                created_count += 1
        self.stdout.write(self.style.SUCCESS(f"Created {created_count} rent charges."))