from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from PIL import Image
from rest_framework.exceptions import AuthenticationFailed

from .models import Business, User, BusinessMembership, BusinessInvitation
from .validators import normalize_kenyan_phone
from .services import register_business_owner

from properties.models import Tenant

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['name'] = user.name
        token['email'] = user.email
        token["sub"] = str(user.id)

        return token
    
    def validate(self, attrs):
        try:
            data = super().validate(attrs)

            user = self.user

            data["portal_access"] = {
                "tenant": Tenant.objects.filter(user=user).exists(),
                "landlord": BusinessMembership.objects.filter(user=user).exists(),
                "admin": user.is_staff or user.is_superuser
            }

            return data

        except AuthenticationFailed:
            raise AuthenticationFailed(
                "Invalid credentials, please try again."
            )

class CustomRegisterSerializer(RegisterSerializer):
    username = None

    name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    company_name = serializers.CharField(required=True)

    def validate_avatar(self, value):
        # Max file size: 2MB
        max_size = 2 * 1024 * 1024  # 2 MB

        if value.size > max_size:
            raise serializers.ValidationError(
                "Avatar file too large. Maximum size is 2MB."
            )

        img = Image.open(value)
        max_width = 2000
        max_height = 2000

        if img.width > max_width or img.height > max_height:
            raise serializers.ValidationError(
                "Avatar image dimensions too large."
            )

        return value
    
    def validate_phone_number(self, value):
        return normalize_kenyan_phone(value)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['name'] = self.validated_data.get('name', '')
        data['email'] = self.validated_data.get('email', '')
        data['phone_number'] = self.validated_data.get('phone_number', '')
        data['address'] = self.validated_data.get('address', '')
        data['avatar'] = self.validated_data.get('avatar', None)
        data['company_name'] = self.validated_data.get('company_name', '')
        return data
    
    def validate(self, attrs):
        if attrs.get('password1') != attrs.get('password2'):
            raise serializers.ValidationError({
                'password2': ['The two password fields did not match.']
            })
        return super().validate(attrs)

    def save(self, request):
        user, business = register_business_owner(
            name=self.validated_data["name"],
            email=self.validated_data["email"],
            password=self.validated_data["password1"],
            company_name=self.validated_data["company_name"],
            phone_number=self.validated_data.get("phone_number"),
            address=self.validated_data.get("address"),
            avatar=self.validated_data.get("avatar"),
        )

        return user
    
class UserDetailSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'phone_number', 'address', 'avatar_url')
    
    def get_avatar_url(self, obj):
        return obj.avatar_url() if obj.avatar else None
    
class UserSettingsSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["name", "email", "password", "phone_number", "address"]

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        instance.save()
        return instance
    
class BusinessSerializer(serializers.ModelSerializer):
    membership_role = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ["id", "company_name", "email", "phone", "address", "logo", "currency", "updated_at", 'membership_role']
        read_only_fields = ["id", "updated_at"]

    def get_membership_role(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None

        membership = obj.memberships.filter(user=request.user).first()

        return membership.role if membership else None

    def validate_logo(self, value):
        max_size = 5 * 1024 * 1024  # 5 MB

        if value.size > max_size:
            raise serializers.ValidationError(
                f"Logo file too large. Maximum size is 5MB."
            )

        return value

    def validate(self, attrs):
        if self.instance and "currency" in attrs:
            if attrs["currency"] != self.instance.currency:
                raise serializers.ValidationError(
                    {"currency": ["Currency change is not supported."]}
                )

        return attrs

class BusinessInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessInvitation
        fields = ["id", "email", "role", "token", "expires_at", "accepted_at", "cancelled_at", "created_at",]
        read_only_fields = ["id", "token", "expires_at", "accepted_at", "cancelled_at", "created_at",]

class BusinessMembershipSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = BusinessMembership
        fields = ["id", "user_id", "name", "email", "role", "joined_at",]
        read_only_fields = ["id", "user_id", "name", "email", "joined_at",]