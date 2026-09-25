from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_businessinvitation_cancelled_at"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS accounts_authhandoff CASCADE;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]