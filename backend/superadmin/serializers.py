from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from company.models import Company, CompanyGalleryImage
import secrets, string

User = get_user_model()


class CompanyStatsSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    order_count = serializers.IntegerField(read_only=True)
    total_revenue = serializers.FloatField(read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True, default='')
    owner_name = serializers.CharField(source='owner.name', read_only=True, default='')

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'email', 'phone', 'address',
            'logo', 'banner', 'theme_color', 'theme_color_secondary',
            'description', 'business_registration',
            'is_active', 'plan', 'created_at', 'updated_at',
            'admin_name', 'admin_email',
            'owner_email', 'owner_name',
            'product_count', 'order_count', 'total_revenue',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class CreateCompanySerializer(serializers.Serializer):
    """Used by super-admin to create a company + its admin user atomically."""
    name = serializers.CharField(max_length=200)
    slug = serializers.SlugField(max_length=250, required=False)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    logo = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    banner = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    theme_color = serializers.CharField(max_length=20, required=False, default='#6366f1')
    theme_color_secondary = serializers.CharField(max_length=20, required=False, default='#4f46e5')
    plan = serializers.ChoiceField(choices=['free', 'starter', 'pro', 'enterprise'], default='free')
    business_registration = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    # Admin credentials
    admin_name = serializers.CharField(max_length=200)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(required=False, allow_blank=True)

    def validate_admin_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_email(self, value):
        return value.lower()

    @transaction.atomic
    def create(self, validated_data):
        admin_name = validated_data.pop('admin_name')
        admin_email = validated_data.pop('admin_email')
        admin_password = validated_data.pop('admin_password', None)

        if not admin_password:
            # Auto-generate a secure password
            chars = string.ascii_letters + string.digits + '!@#$'
            admin_password = ''.join(secrets.choice(chars) for _ in range(14))

        # Create company admin user
        admin_user = User.objects.create_user(
            email=admin_email,
            name=admin_name,
            password=admin_password,
            role='company_admin',
            is_staff=True,
            is_admin=True,
            is_active=True,
            email_verified=True,
        )

        # Create company
        company = Company.objects.create(
            owner=admin_user,
            admin_name=admin_name,
            admin_email=admin_email,
            admin_password='',  # Never store plain text
            **validated_data
        )

        # Link user to company
        admin_user.company = company
        admin_user.save(update_fields=['company'])

        return {
            'company': company,
            'admin_user': admin_user,
            'generated_password': admin_password,
        }
