
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    TrainerDirectoryView,
    TrainerPresenceView,
    TrainerResourceDetailView,
    TrainerResourceListCreateView,
    TrainerStarterLecturesView,
    TrainerSessionDetailView,
    TrainerSessionListCreateView,
    StudentDoubtDetailView,
    StudentDoubtListCreateView,
    StudentCommunityCommentsView,
    StudentCommunityPostsView,
    StudentReviewListCreateView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("presence/", TrainerPresenceView.as_view(), name="trainer-presence"),
    path("trainers/", TrainerDirectoryView.as_view(), name="trainer-directory"),
    path("resources/", TrainerResourceListCreateView.as_view(), name="trainer-resources"),
    path(
        "resources/starter-lectures/",
        TrainerStarterLecturesView.as_view(),
        name="trainer-starter-lectures",
    ),
    path(
        "resources/<int:resource_id>/",
        TrainerResourceDetailView.as_view(),
        name="trainer-resource-detail",
    ),
    path("teaching-sessions/", TrainerSessionListCreateView.as_view(), name="trainer-sessions"),
    path(
        "teaching-sessions/<int:session_id>/",
        TrainerSessionDetailView.as_view(),
        name="trainer-session-detail",
    ),
    path("doubts/", StudentDoubtListCreateView.as_view(), name="student-doubts"),
    path(
        "doubts/<int:doubt_id>/",
        StudentDoubtDetailView.as_view(),
        name="student-doubt-detail",
    ),
    path("community/posts/", StudentCommunityPostsView.as_view(), name="community-posts"),
    path(
        "community/posts/<int:post_id>/comments/",
        StudentCommunityCommentsView.as_view(),
        name="community-comments",
    ),
    path("reviews/", StudentReviewListCreateView.as_view(), name="student-reviews"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
