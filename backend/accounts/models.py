
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class LoginAudit(models.Model):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="login_events",
    )
    logged_in_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-logged_in_at",)

    def __str__(self):
        return f"{self.user.username} signed in at {self.logged_in_at}"


class StudentDoubt(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ANSWERED = "answered", "Answered"
        RESOLVED = "resolved", "Resolved"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="doubts",
    )
    subject = models.CharField(max_length=160)
    question = models.TextField(max_length=5000)
    answer = models.TextField(blank=True)
    answered_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="answered_doubts",
    )
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)

    def __str__(self):
        return f"{self.subject} ({self.status})"


class CommunityPost(models.Model):
    class PostType(models.TextChoices):
        DOUBT = "doubt", "Doubt"
        DISCUSSION = "discussion", "Discussion"
        NOTE = "note", "Shared note"

    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="community_posts",
    )
    post_type = models.CharField(
        max_length=12,
        choices=PostType.choices,
        default=PostType.DISCUSSION,
    )
    title = models.CharField(max_length=160)
    course = models.CharField(max_length=120, blank=True)
    content = models.TextField(max_length=5000)
    link_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)

    def __str__(self):
        return self.title


class CommunityComment(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="community_comments",
    )
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self):
        return f"Comment on {self.post_id}"


class StudentReview(models.Model):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="student_review",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )
    content = models.TextField(max_length=1200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)

    def __str__(self):
        return f"{self.rating}/5 review by {self.user.username}"


class TrainerResource(models.Model):
    trainer = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="learning_resources",
    )
    title = models.CharField(max_length=160)
    course = models.CharField(max_length=120, blank=True)
    video_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title


class TrainerSession(models.Model):
    trainer = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="teaching_sessions",
    )
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    scheduled_for = models.DateTimeField()
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    meeting_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("scheduled_for",)

    def __str__(self):
        return self.title


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        TRAINER = "trainer", "Trainer"

    email = models.EmailField(unique=True)
    last_seen_at = models.DateTimeField(blank=True, null=True)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
