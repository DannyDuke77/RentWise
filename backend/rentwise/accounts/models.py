import uuid
import io

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, UserManager, PermissionsMixin
from PIL import Image
from django.core.files.base import ContentFile

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
        extra_fields.setdefault('user_type', 'landlord')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(name, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPES = (
        ('admin', 'Admin'),
        ('landlord', 'Landlord'),
        ('tenant', 'Tenant'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.ImageField(upload_to='uploads/avatars/', null=True, blank=True)

    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='landlord')

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


class Business(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    logo = models.ImageField(upload_to="branding/", null=True, blank=True)
    currency = models.CharField(max_length=10, default="KES")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name

    def logo_url(self):
        if self.logo:
            return f'{settings.WEBSITE_URL}{self.logo.url}'
        return None

    def save(self, *args, **kwargs):
        if self.logo and hasattr(self.logo.file, 'content_type'):
            self.logo.file.seek(0)
            img = Image.open(self.logo)

            # Preserve format (PNG, JPEG, WEBP), fallback to JPEG
            img_format = img.format if img.format else 'JPEG'

            # Convert RGBA/P to RGB if saving as JPEG (JPEG doesn't support transparency)
            if img.mode in ('RGBA', 'P') and img_format.upper() in ('JPEG', 'JPG'):
                img = img.convert('RGB')

            # Max dimensions for a high-res logo header (e.g., 800x800)
            max_size = (800, 800)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Compress image buffer
            buffer = io.BytesIO()
            save_kwargs = {'format': img_format, 'optimize': True}
            if img_format.upper() in ('JPEG', 'JPG', 'WEBP'):
                save_kwargs['quality'] = 80  # Ideal balance between size and quality

            img.save(buffer, **save_kwargs)
            buffer.seek(0)

            # Replace the original uploaded file with the compressed file stream
            self.logo.save(
                self.logo.name,
                ContentFile(buffer.getvalue()),
                save=False  # Avoid recursive save call loops
            )

        super().save(*args, **kwargs)
    
class BusinessMembership(models.Model):
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='business_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['business', 'user'], name='unique_business_membership')
        ]

    def __str__(self):
        return f"{self.user.name} - {self.business.company_name} ({self.role})"

class BusinessInvitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=BusinessMembership.ROLE_CHOICES, default="staff")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_accepted(self):
        return self.accepted_at is not None

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_cancelled(self):
        return self.cancelled_at is not None