from celery import shared_task
from django.core.management import call_command


@shared_task
def generate_rent_charges_task():
    call_command("generate_rent_charges")