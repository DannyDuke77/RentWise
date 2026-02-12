from django.db import models
import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, UserManager, PermissionsMixin

from .validators import normalize_kenyan_phone

# Create your models here.
class CustomUserManager(UserManager):
    def _create_user(self, name, email, password, **extra_fields):
        if not name:
            raise ValueError('The given name must be set')
        
        email = self.normalize_email(email)
        user = self.model(name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_user(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(name, email, password, **extra_fields)
    
    def create_superuser(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(name, email, password, **extra_fields)
    
class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.ImageField(upload_to='uploads/avatars/', null=True, blank=True)

    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='user')

    is_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email
    
    def avatar_url(self):
        if self.avatar:
            return f'{settings.WEBSITE_URL}{self.avatar.url}'
        return f'{settings.WEBSITE_URL}/static/default-avatar.png'
    
    def clean(self):
        super().clean()
        if self.phone_number:
            self.phone_number = normalize_kenyan_phone(self.phone_number)


class BusinessProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_profile"
    )

    company_name = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    logo = models.ImageField(upload_to="branding/", null=True, blank=True)
    currency = models.CharField(max_length=10, default="KES")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.name} - {self.company_name}'
    
    def logo_url(self):
        if self.logo:
            return f'{settings.WEBSITE_URL}{self.logo.url}'
        return f'{settings.WEBSITE_URL}/media/branding/no-logo.png'
    
