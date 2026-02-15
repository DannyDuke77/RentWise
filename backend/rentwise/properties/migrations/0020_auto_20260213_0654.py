from django.db import migrations, models
import uuid

def migrate_m2m_to_through(apps, schema_editor):
    Tenancy = apps.get_model('properties', 'Tenancy')
    TenancyMember = apps.get_model('properties', 'TenancyMember')
    
    # We use .through to access the hidden table Django created for the old M2M
    # We iterate through all current relationships and create TenancyMember records
    for tenancy in Tenancy.objects.all():
        for tenant in tenancy.tenants_old.all():
            TenancyMember.objects.create(
                tenancy=tenancy,
                tenant=tenant,
                is_active=tenancy.is_active, # If lease is active, member is active
                joined_at=tenancy.created_at # Fallback for join date
            )

class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0019_unitpayment_notes'), # Ensure this matches your last SUCCESSFUL migration
    ]

    operations = [
        # 1. Create the new TenancyMember model
        migrations.CreateModel(
            name='TenancyMember',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('left_at', models.DateTimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('tenant', models.ForeignKey(on_delete=models.deletion.CASCADE, to='properties.tenant')),
                ('tenancy', models.ForeignKey(on_delete=models.deletion.CASCADE, to='properties.tenancy')),
            ],
            options={
                'unique_together': {('tenancy', 'tenant')},
            },
        ),

        # 2. Rename existing 'tenants' field to 'tenants_old'
        migrations.RenameField(
            model_name='tenancy',
            old_name='tenants',
            new_name='tenants_old',
        ),

        # 3. Create the new 'tenants' field with the 'through' model
        migrations.AddField(
            model_name='tenancy',
            name='tenants',
            field=models.ManyToManyField(related_name='tenancies', through='properties.TenancyMember', to='properties.tenant'),
        ),

        # 4. Run the data migration script
        migrations.RunPython(migrate_m2m_to_through),

        # 5. Remove the old field
        migrations.RemoveField(
            model_name='tenancy',
            name='tenants_old',
        ),
    ]