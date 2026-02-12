from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from PIL import Image
from rest_framework.exceptions import AuthenticationFailed

from .models import BusinessProfile, User
from .validators import normalize_kenyan_phone

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['name'] = user.name
        token['user_type'] = user.user_type
        token['email'] = user.email
        token["sub"] = str(user.id)

        return token
    
    def validate(self, attrs):
        try:
            return super().validate(attrs)
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

    def validate_avatar(self, value):
        # Max file size: 2MB
        max_size = 2 * 1024 * 1024  # 2 MB

        if value.size > max_size:
            raise serializers.ValidationError(
                "Avatar file too large. Maximum size is 2MB."
            )

        # Optional but strongly recommended: dimension check
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
        return data
    
    def validate(self, attrs):
        if attrs.get('password1') != attrs.get('password2'):
            raise serializers.ValidationError({
                'password2': ['The two password fields did not match.']
            })
        return super().validate(attrs)

    def save(self, request):
        user = super().save(request)
        user.name = self.validated_data.get('name')
        user.email = self.validated_data.get('email')
        user.phone_number = self.validated_data.get('phone_number')
        user.address = self.validated_data.get('address')
        user.avatar = self.validated_data.get('avatar', None)
        user.save()
        return user
    
class UserDetailSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'phone_number', 'address', 'avatar_url')
    
    def get_avatar_url(self, obj):
        # Call the model's avatar_url method
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
    
class BusinessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = [
            "id",
            "company_name",
            "email",
            "phone",
            "address",
            "logo_url",
            "currency",
        ]