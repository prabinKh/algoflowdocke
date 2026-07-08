import os

import requests
from celery import shared_task

from eadmin.models import ChatMessage, ChatSession


@shared_task
def generate_ai_response(session_id, user_message_text):
    try:
        session = ChatSession.objects.get(id=session_id)
        api_key = os.environ.get("GEMINI_API_KEY")

        if not api_key:
            ChatMessage.objects.create(
                session=session,
                sender="assistant",
                text="I'm sorry, my AI is not configured yet (missing API key).",
                status="sent",
            )
            return

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                "You are a helpful customer support assistant for FixItAll, "
                                "an electronics repair and store. "
                                f"User says: {user_message_text}"
                            )
                        }
                    ]
                }
            ]
        }
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()
        ai_text = data["candidates"][0]["content"]["parts"][0]["text"]

        ChatMessage.objects.create(
            session=session,
            sender="assistant",
            text=ai_text,
            status="sent",
        )

        session.last_message = ai_text
        session.unread_user_count = (session.unread_user_count or 0) + 1
        session.save(update_fields=["last_message", "unread_user_count", "last_message_time", "updated_at"])
    except Exception:
        try:
            session = ChatSession.objects.get(id=session_id)
            ChatMessage.objects.create(
                session=session,
                sender="assistant",
                text="I encountered an error while processing your request. Please try again later.",
                status="sent",
            )
        except Exception:
            pass
