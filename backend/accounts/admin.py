
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CommunityComment,
    CommunityPost,
    LoginAudit,
    StudentDoubt,
    StudentReview,
    TrainerResource,
    TrainerSession,
    User,
)


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ("title", "post_type", "author", "course", "updated_at")
    search_fields = ("title", "content", "course", "author__username")
    list_filter = ("post_type", "created_at")


@admin.register(CommunityComment)
class CommunityCommentAdmin(admin.ModelAdmin):
    list_display = ("post", "author", "created_at")
    search_fields = ("content", "author__username", "post__title")


@admin.register(StudentReview)
class StudentReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "rating", "updated_at")
    search_fields = ("user__username", "content")
    list_filter = ("rating", "updated_at")


@admin.register(TrainerResource)
class TrainerResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "trainer", "course", "created_at")
    search_fields = ("title", "course", "trainer__username", "trainer__email")


@admin.register(TrainerSession)
class TrainerSessionAdmin(admin.ModelAdmin):
    list_display = ("title", "trainer", "scheduled_for", "duration_minutes")
    search_fields = ("title", "trainer__username", "trainer__email")
    list_filter = ("scheduled_for",)


@admin.register(LoginAudit)
class LoginAuditAdmin(admin.ModelAdmin):
    list_display = ("user", "logged_in_at")
    list_filter = ("logged_in_at",)
    search_fields = ("user__username", "user__email")
    readonly_fields = ("user", "logged_in_at")


@admin.register(StudentDoubt)
class StudentDoubtAdmin(admin.ModelAdmin):
    list_display = ("subject", "student", "answered_by", "status", "updated_at")
    search_fields = ("subject", "question", "answer", "student__username")
    list_filter = ("status", "created_at")


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Learnova Profile", {"fields": ("role", "last_seen_at")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Learnova Profile", {"fields": ("role",)}),
    )

    list_display = (
        "username",
        "email",
        "role",
        "last_seen_at",
        "is_staff",
        "is_active",
    )

    list_filter = ("role", "is_staff", "is_active")
