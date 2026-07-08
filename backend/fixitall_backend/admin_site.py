"""
Custom Django Admin Site for FixItAll.

Groups all models into logical categories:
  - 👤 User & Authentication
  - 📦 Products & Catalog
  - 🛒 Orders & Cart
  - 💬 Chat & Messages
  - 🔧 Service & Support
  - 👥 Staff Management
  - 📊 Analytics & Activity
  - 🏪 Store & Settings
"""

from django.contrib import admin
from django.contrib.admin.apps import AdminConfig


class FixItAllAdminSite(admin.AdminSite):
    site_header = "FixItAll Administration"
    site_title = "FixItAll Admin"
    index_title = "Dashboard"

    def has_permission(self, request):
        """
        Only superusers are allowed to access the Django admin backend.
        """
        return request.user.is_active and request.user.is_superuser

    def get_app_list(self, request, app_label=None):
        """
        Override the default app list to group models into custom categories.
        """
        # Get the default app list first
        app_list = super().get_app_list(request, app_label=app_label)

        # Build a flat dict of all models keyed by "app_label.model_name"
        model_dict = {}
        for app in app_list:
            for model in app.get("models", []):
                key = f"{app['app_label']}.{model['object_name']}"
                model["original_app"] = app["app_label"]
                model_dict[key] = model

        # Define custom category groupings
        categories = [
            {
                "name": "👤 User & Authentication",
                "app_label": "user_auth",
                "models": [
                    "account.MyUser",
                    "account.LoginAttempt",
                    "account.Note",
                    "auth.Group",
                ],
            },
            {
                "name": "📦 Products & Catalog",
                "app_label": "products_catalog",
                "models": [
                    "efrontend.Product",
                    "efrontend.Category",
                    "efrontend.Brand",
                    "efrontend.Review",
                    "eadmin.CategoryFeature",
                ],
            },
            {
                "name": "🛒 Orders & Cart",
                "app_label": "orders_cart",
                "models": [
                    "efrontend.Order",
                    "efrontend.OrderItem",
                    "efrontend.Wishlist",
                    "eadmin.POSSale",
                ],
            },
            {
                "name": "💬 Chat & Messages",
                "app_label": "chat_messages",
                "models": [
                    "eadmin.ChatSession",
                    "eadmin.ChatMessage",
                    "eadmin.ContactMessage",
                ],
            },
            {
                "name": "🔧 Service & Support",
                "app_label": "service_support",
                "models": [
                    "eadmin.ServiceTicket",
                ],
            },
            {
                "name": "🏢 Vendor Management",
                "app_label": "vendor_management",
                "models": [
                    "company.Company",
                ],
            },
            {
                "name": "👥 Staff Management",
                "app_label": "staff_management",
                "models": [
                    "eadmin.StaffRole",
                    "eadmin.StaffMember",
                ],
            },
            {
                "name": "📊 Analytics & Activity",
                "app_label": "analytics_activity",
                "models": [
                    "eadmin.UserActivity",
                ],
            },
            {
                "name": "🏪 Store & Settings",
                "app_label": "store_settings",
                "models": [
                    "efrontend.HeroSetting",
                    "efrontend.StoreLocation",
                    "efrontend.AIRecommendation",
                ],
            },
        ]

        # Build the new grouped app list
        new_app_list = []
        used_keys = set()

        for category in categories:
            models = []
            for model_key in category["models"]:
                if model_key in model_dict:
                    models.append(model_dict[model_key])
                    used_keys.add(model_key)

            if models:
                new_app_list.append({
                    "name": category["name"],
                    "app_label": category["app_label"],
                    "app_url": f"/django-admin/",
                    "has_module_perms": True,
                    "models": models,
                })

        # Collect any remaining models not assigned to a category
        uncategorized = []
        for key, model in model_dict.items():
            if key not in used_keys:
                uncategorized.append(model)

        if uncategorized:
            new_app_list.append({
                "name": "⚙️ Other",
                "app_label": "other",
                "app_url": "/django-admin/",
                "has_module_perms": True,
                "models": uncategorized,
            })

        return new_app_list


# Create the custom admin site instance
fixitall_admin = FixItAllAdminSite(name="fixitall_admin")
