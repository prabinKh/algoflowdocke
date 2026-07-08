from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ChatMessageViewSet, ChatSessionViewSet

router = DefaultRouter()
router.register(r"chat-sessions", ChatSessionViewSet, basename="chat-sessions")
router.register(r"chat-messages", ChatMessageViewSet, basename="chat-messages")

urlpatterns = [
    path("", include(router.urls)),
]
