from rest_framework import serializers

from eadmin.models import ChatMessage, ChatSession


class ChatMessageSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)
    type = serializers.CharField(source="msg_type", read_only=True)
    msg_type = serializers.CharField(required=False)

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "session",
            "sender",
            "text",
            "type",
            "msg_type",
            "timestamp",
            "status",
            "metadata",
            "attachments",
        )
        extra_kwargs = {
            "msg_type": {"write_only": True},
        }

    def to_internal_value(self, data):
        # Map frontend sender names to model choices
        if "sender" in data:
            if data["sender"] == "ai":
                data["sender"] = "assistant"
            elif data["sender"] == "human":
                data["sender"] = "admin"
        return super().to_internal_value(data)


class ChatSessionSerializer(serializers.ModelSerializer):
    unreadAdminCount = serializers.IntegerField(source="unread_admin_count", read_only=True)
    unreadUserCount = serializers.IntegerField(source="unread_user_count", read_only=True)
    userId = serializers.CharField(source="user_id_str", required=False, allow_blank=True)
    userEmail = serializers.CharField(source="user_email", required=False, allow_null=True, allow_blank=True)
    userName = serializers.CharField(source="user_name", required=False, allow_blank=True)
    lastMessage = serializers.CharField(source="last_message", read_only=True)
    lastMessageTime = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ChatSession
        fields = (
            "id",
            "company",
            "user",
            "user_id_str",
            "userId",
            "user_email",
            "userEmail",
            "user_name",
            "userName",
            "status",
            "assigned_to",
            "last_message",
            "lastMessage",
            "unread_admin_count",
            "unreadAdminCount",
            "unread_user_count",
            "unreadUserCount",
            "last_message_time",
            "lastMessageTime",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "user_id_str": {"required": False},
            "user_email": {"required": False},
            "user_name": {"required": False},
            "company": {"required": False},
        }

