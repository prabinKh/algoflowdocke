from rest_framework import serializers
from .models import Company, CompanyGalleryImage, FooterSettings
from efrontend.models import StoreLocation
from efrontend.serializers import ProductSerializer

class CompanyGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyGalleryImage
        fields = ['id', 'image', 'created_at']


class FooterSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterSettings
        fields = '__all__'
        read_only_fields = ['id', 'company']


class StoreLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreLocation
        fields = '__all__'
        read_only_fields = ['id', 'company']


class CompanySerializer(serializers.ModelSerializer):
    gallery_images = CompanyGalleryImageSerializer(many=True, read_only=True)
    footer_settings = FooterSettingsSerializer(read_only=True)
    store_locations = StoreLocationSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.name', read_only=True, default='')
    owner_email = serializers.CharField(source='owner.email', read_only=True, default='')
    product_count = serializers.IntegerField(read_only=True)
    order_count = serializers.IntegerField(read_only=True)
    total_revenue = serializers.FloatField(read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'category', 'description', 'logo', 'banner',
            'email', 'phone', 'address', 'website', 'business_registration',
            'ip_address', 'domain_name',
            'theme_color', 'theme_color_secondary',
            'owner', 'owner_name', 'owner_email',
            'is_active', 'plan', 'created_at', 'updated_at',
            'gallery_images', 'uploaded_images',
            'footer_settings', 'store_locations',
            'product_count', 'order_count', 'total_revenue',
        ]
        read_only_fields = ['id', 'slug', 'owner', 'created_at', 'updated_at', 'product_count', 'order_count', 'total_revenue']

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        company = super().create(validated_data)
        for image_url in uploaded_images:
            CompanyGalleryImage.objects.create(company=company, image=image_url)
        # Create default footer settings
        FooterSettings.objects.create(company=company)
        return company

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        company = super().update(instance, validated_data)
        for image_url in uploaded_images:
            CompanyGalleryImage.objects.create(company=company, image=image_url)
        return company


class CompanyPublicSerializer(serializers.ModelSerializer):
    """Minimal info for public storefront."""
    gallery_images = CompanyGalleryImageSerializer(many=True, read_only=True)
    footer_settings = FooterSettingsSerializer(read_only=True)
    store_locations = StoreLocationSerializer(many=True, read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'category', 'description', 'logo', 'banner',
            'email', 'phone', 'address', 'website',
            'ip_address', 'domain_name',
            'theme_color', 'theme_color_secondary',
            'gallery_images', 'footer_settings', 'store_locations'
        ]
        read_only_fields = [
            'id', 'name', 'slug', 'category', 'description', 'logo', 'banner',
            'email', 'phone', 'address', 'website',
            'ip_address', 'domain_name',
            'theme_color', 'theme_color_secondary'
        ]
