from rest_framework import serializers
from decimal import Decimal

from .models import MpesaConfiguration

class MpesaConfigurationSerializer(serializers.ModelSerializer):
    consumer_secret = serializers.CharField(write_only=True, required=True,)
    passkey = serializers.CharField(write_only=True, required=True,)

    class Meta:
        model = MpesaConfiguration
        fields = [
            "id",
            "consumer_key",
            "consumer_secret",
            "shortcode",
            "passkey",
            "account_type",
            "environment",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        from .services.mpesa_config_service import save_mpesa_configuration

        business = validated_data.pop("business")

        return save_mpesa_configuration(business=business, **validated_data)

    def update(self, instance, validated_data):
        from .services.mpesa_config_service import save_mpesa_configuration

        business = instance.business

        return save_mpesa_configuration(business=business, **validated_data,)

class MpesaPaymentSerializer(serializers.Serializer):
    tenancy_id = serializers.UUIDField()
    phone_number = serializers.CharField(max_length=15)
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("1.00"),
    )
    category = serializers.ChoiceField(
    choices=[
                ("rent", "Rent"),
                ("deposit", "Security Deposit"),
            ],
            default="rent",
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )

