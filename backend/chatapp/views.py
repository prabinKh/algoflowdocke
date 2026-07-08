from rest_framework import permissions, viewsets

from eadmin.models import ChatMessage, ChatSession

from .serializers import ChatMessageSerializer, ChatSessionSerializer
from .tasks import generate_ai_response


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from eadmin.views import get_company_filter

@method_decorator(csrf_exempt, name='dispatch')
class ChatSessionViewSet(viewsets.ModelViewSet):
    queryset = ChatSession.objects.all().select_related('company', 'user').order_by("-last_message_time")
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        cf = get_company_filter(self.request)

        if user.is_authenticated and (
            getattr(user, "is_admin", False) or getattr(user, "is_superuser", False) or getattr(user, "role", "") in ('superadmin', 'company_admin', 'staff')
        ):
            # Admin/Staff: Use shared company filter
            from django.db.models import Q
            return ChatSession.objects.filter(**cf).filter(
                Q(last_message__isnull=False) & ~Q(last_message="") | 
                Q(unread_admin_count__gt=0)
            ).select_related('company', 'user').order_by("-last_message_time")

        if user.is_authenticated:
            return ChatSession.objects.filter(user=user, **cf).select_related('company', 'user').order_by("-last_message_time")

        guest_id = self.request.query_params.get("guest_id")
        if guest_id:
            return ChatSession.objects.filter(user_id_str=guest_id, **cf).select_related('company', 'user').order_by("-last_message_time")

        return ChatSession.objects.none()

    def get_object(self):
        import uuid
        from django.http import Http404
        from django.core.exceptions import ValidationError
        pk = self.kwargs.get("pk")
        try:
            uuid.UUID(str(pk))
        except ValueError:
            raise Http404("Invalid UUID format")
        try:
            return super().get_object()
        except ValidationError:
            raise Http404("Invalid UUID")

    def create(self, request, *args, **kwargs):
        # Prevent duplicates: check if session already exists for this user/guest
        from company.models import Company
        company = Company.resolve_from_request(self.request)
        
        user = self.request.user
        user_id_str = request.data.get("user_id_str")
        
        existing = None
        # 1. Try to find by user account
        if user.is_authenticated:
            existing = ChatSession.objects.filter(company=company, user=user).first()
            
        # 2. If not found by user, try by guest ID
        if not existing and user_id_str:
            existing = ChatSession.objects.filter(company=company, user_id_str=user_id_str).first()
            # If found by guest ID but user is now logged in, link the account
            if existing and user.is_authenticated and not existing.user:
                existing.user = user
                existing.save(update_fields=['user', 'updated_at'])
            
        if existing:
            from rest_framework.response import Response
            serializer = self.get_serializer(existing)
            return Response(serializer.data)
            
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        from company.models import Company
        company = Company.resolve_from_request(self.request)
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(company=company, user=user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if self.request.data.get("unreadAdminCount") == 0 or self.request.data.get("unread_admin_count") == 0:
            instance.unread_admin_count = 0
            instance.save(update_fields=["unread_admin_count", "updated_at"])
        if self.request.data.get("unreadUserCount") == 0 or self.request.data.get("unread_user_count") == 0:
            instance.unread_user_count = 0
            instance.save(update_fields=["unread_user_count", "updated_at"])


@method_decorator(csrf_exempt, name='dispatch')
class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all().select_related('session')
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        session_id = self.request.query_params.get("session_id")
        if session_id:
            import uuid
            try:
                uuid.UUID(str(session_id))
                qs = ChatMessage.objects.filter(session_id=session_id).order_by("timestamp")
                
                # Incremental polling optimization
                since = self.request.query_params.get("since")
                if since:
                    qs = qs.filter(timestamp__gt=since)
                
                # History filtering: 20 days for users, all for admins
                user = self.request.user
                is_admin = False
                if user.is_authenticated:
                    is_admin = getattr(user, "is_admin", False) or getattr(user, "is_superuser", False) or getattr(user, "role", "") == 'superadmin'
                
                if not is_admin and not since:
                    from django.utils import timezone
                    from datetime import timedelta
                    cutoff = timezone.now() - timedelta(days=20)
                    qs = qs.filter(timestamp__gte=cutoff)
                
                return qs
            except ValueError:
                return ChatMessage.objects.none()
        return ChatMessage.objects.none()

    def get_object(self):
        import uuid
        from django.http import Http404
        from django.core.exceptions import ValidationError
        pk = self.kwargs.get("pk")
        try:
            uuid.UUID(str(pk))
        except ValueError:
            raise Http404("Invalid UUID format")
        try:
            return super().get_object()
        except ValidationError:
            raise Http404("Invalid UUID")

    def perform_create(self, serializer):
        message = serializer.save()
        session = message.session

        session.last_message = message.text
        if message.sender in ["user"]:
            session.unread_admin_count = (session.unread_admin_count or 0) + 1
        else:
            session.unread_user_count = (session.unread_user_count or 0) + 1
        session.save(update_fields=["last_message", "unread_admin_count", "unread_user_count", "last_message_time", "updated_at"])

        if message.sender == "user":
            try:
                generate_ai_response.delay(message.session.id, message.text)
            except Exception:
                pass

