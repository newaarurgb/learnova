
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    CommunityComment,
    CommunityPost,
    StudentDoubt,
    StudentReview,
    TrainerResource,
    TrainerSession,
    User,
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "role",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm": "Passwords do not match."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs["password"]
        role = attrs["role"]

        try:
            user_record = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        user = authenticate(
            request=self.context.get("request"),
            username=user_record.username,
            password=password,
        )

        if user is None or not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if user.role != role and not user.is_superuser:
            raise serializers.ValidationError(
                {"detail": "This account cannot sign in with that role."}
            )

        refresh = RefreshToken.for_user(user)

        attrs["user"] = user
        attrs["tokens"] = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
        return attrs


class TrainerResourceSerializer(serializers.ModelSerializer):
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainerResource
        fields = (
            "id",
            "title",
            "course",
            "video_url",
            "notes",
            "duration_minutes",
            "trainer_name",
            "created_at",
        )
        read_only_fields = ("id", "trainer_name", "created_at")

    def get_trainer_name(self, resource):
        return resource.trainer.get_full_name() or resource.trainer.username

    def validate(self, attrs):
        video_url = attrs.get("video_url", "")
        notes = attrs.get("notes", "")
        if not video_url and not notes.strip():
            raise serializers.ValidationError(
                "Add notes, a video URL, or both before sharing."
            )
        return attrs

    def validate_duration_minutes(self, value):
        if not 10 <= value <= 480:
            raise serializers.ValidationError(
                "Lecture duration must be between 10 minutes and 8 hours."
            )
        return value


class TrainerSessionSerializer(serializers.ModelSerializer):
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainerSession
        fields = (
            "id",
            "title",
            "description",
            "scheduled_for",
            "duration_minutes",
            "meeting_url",
            "trainer_name",
            "created_at",
        )
        read_only_fields = ("id", "trainer_name", "created_at")

    def get_trainer_name(self, session):
        return session.trainer.get_full_name() or session.trainer.username

    def validate_scheduled_for(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Choose a future date and time.")
        return value

    def validate_duration_minutes(self, value):
        if not 10 <= value <= 480:
            raise serializers.ValidationError(
                "Session duration must be between 10 minutes and 8 hours."
            )
        return value


class StudentDoubtSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentDoubt
        fields = (
            "id",
            "subject",
            "question",
            "answer",
            "status",
            "student_name",
            "trainer_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "answer",
            "status",
            "student_name",
            "trainer_name",
            "created_at",
            "updated_at",
        )

    def get_student_name(self, doubt):
        return doubt.student.get_full_name() or doubt.student.username

    def get_trainer_name(self, doubt):
        if not doubt.answered_by:
            return ""
        return doubt.answered_by.get_full_name() or doubt.answered_by.username


class TrainerDoubtReplySerializer(serializers.ModelSerializer):
    answer = serializers.CharField(max_length=5000, required=False)

    class Meta:
        model = StudentDoubt
        fields = ("answer", "status")

    def validate(self, attrs):
        answer = attrs.get("answer", self.instance.answer)
        new_status = attrs.get("status", self.instance.status)
        if new_status in (StudentDoubt.Status.ANSWERED, StudentDoubt.Status.RESOLVED) and not answer.strip():
            raise serializers.ValidationError(
                {"answer": "Write an answer before marking this doubt answered."}
            )
        return attrs


class CommunityPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = (
            "id",
            "post_type",
            "title",
            "course",
            "content",
            "link_url",
            "author_name",
            "comment_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "author_name",
            "comment_count",
            "created_at",
            "updated_at",
        )

    def get_author_name(self, post):
        return post.author.get_full_name() or post.author.username

    def get_comment_count(self, post):
        if hasattr(post, "comment_count"):
            return post.comment_count
        return post.comments.count()

    def validate(self, attrs):
        if attrs.get("post_type", CommunityPost.PostType.DISCUSSION) == CommunityPost.PostType.NOTE:
            if not attrs.get("content", "").strip() and not attrs.get("link_url", "").strip():
                raise serializers.ValidationError(
                    "Add note content or a link before sharing."
                )
        return attrs


class CommunityCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = CommunityComment
        fields = ("id", "content", "author_name", "created_at")
        read_only_fields = ("id", "author_name", "created_at")

    def get_author_name(self, comment):
        return comment.author.get_full_name() or comment.author.username


class StudentReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    content = serializers.CharField(max_length=1200, min_length=8)

    class Meta:
        model = StudentReview
        fields = (
            "id",
            "author_name",
            "rating",
            "content",
            "is_mine",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "author_name",
            "is_mine",
            "created_at",
            "updated_at",
        )

    def get_author_name(self, review):
        return review.user.get_full_name() or review.user.username

    def get_is_mine(self, review):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and review.user_id == request.user.id)
