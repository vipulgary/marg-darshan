"""Celery app; tasks live in app/tasks.py (AMX-047)."""
from celery import Celery
from celery.schedules import crontab

from app.config import REDIS_URL

celery = Celery("astromax", broker=REDIS_URL, backend=REDIS_URL, include=["app.tasks"])
celery.conf.update(task_acks_late=True, worker_prefetch_multiplier=1, timezone="Asia/Kolkata")

# AMX-121: weekly panchang newsletter draft, Sunday 06:00 IST (run `celery -A app.worker beat`).
celery.conf.beat_schedule = {
    "weekly-panchang-digest": {
        "task": "astromax.weekly_panchang_digest",
        "schedule": crontab(minute=0, hour=6, day_of_week="sun"),
    },
}
