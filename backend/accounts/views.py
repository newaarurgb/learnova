
from datetime import timedelta

from django.db import transaction
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import (
    CommunityPost,
    LoginAudit,
    StudentDoubt,
    StudentReview,
    TrainerResource,
    TrainerSession,
    User,
)
from .serializers import (
    CommunityCommentSerializer,
    CommunityPostSerializer,
    LoginSerializer,
    RegisterSerializer,
    StudentDoubtSerializer,
    StudentReviewSerializer,
    TrainerResourceSerializer,
    TrainerSessionSerializer,
    TrainerDoubtReplySerializer,
)

def build_python_lecture_notes(objectives, concepts, walkthrough, practice, challenge):
    return (
        "60-MINUTE SAMPLE MEETING SLIDES\n"
        "Use this outline as live-class slides and learner notes. Ask learners to predict "
        "the output before revealing each code example.\n\n"
        "SLIDE 1 · WELCOME AND LEARNING GOALS · 5 MIN\n"
        f"By the end, learners can: {objectives}\n"
        "Opening prompt: Where have you seen this idea in a small Python program?\n\n"
        "SLIDE 2 · CORE IDEAS · 10 MIN\n"
        f"{concepts}\n"
        "Check for understanding: ask a learner to explain one idea in their own words.\n\n"
        "SLIDE 3 · TRAINER WALKTHROUGH · 15 MIN\n"
        f"{walkthrough}\n"
        "Pause after each step. Predict, run, observe, and explain the result together.\n\n"
        "SLIDE 4 · GUIDED PRACTICE · 15 MIN\n"
        f"{practice}\n"
        "Work in pairs. Invite learners to share one working solution and one question.\n\n"
        "SLIDE 5 · CHALLENGE AND DISCUSSION · 10 MIN\n"
        f"{challenge}\n"
        "Review edge cases and compare two clear approaches; keep the discussion supportive.\n\n"
        "SLIDE 6 · RECAP AND EXIT TICKET · 5 MIN\n"
        "Recap the key terms, answer final questions, and ask each learner to write one "
        "thing they learned and one thing they want to practise next."
    )


PYTHON_LECTURES = (
    (
        "Python 01 · Setup, REPL, and syntax",
        "Set up and run a Python file; distinguish expressions from statements; use indentation and comments.",
        "Python executes statements from top to bottom. The interactive shell evaluates expressions immediately; a .py file saves a repeatable program. Indentation defines code blocks.",
        'print("Hello, Learnova!")\nname = "Asha"\nprint(f"Welcome, {name}")\n# This is a comment',
        "Create hello.py, run it, change the message, and run it again. Add a comment that explains the program's purpose.",
        "A classmate sees an indentation error. Explain why indentation matters and show the corrected two-line block.",
    ),
    (
        "Python 02 · Variables and data types",
        "Name values clearly; identify int, float, str, and bool values; convert input before doing arithmetic.",
        "Variables are names bound to objects. input() returns text, even when a learner types digits. Use int() or float() for numeric input and type() to inspect a value.",
        'name = input("Name: ")\nage = int(input("Age: "))\nprint(f"{name} will be {age + 1} next year.")\nis_enrolled = True',
        "Build a learner profile that asks for a name and current course, then prints a friendly summary.",
        "Ask what happens if int() receives the word 'ten'. Discuss validating user input before converting it.",
    ),
    (
        "Python 03 · Operators and expressions",
        "Use arithmetic, comparison, and logical operators; understand precedence; compose readable conditions.",
        "Arithmetic includes +, -, *, /, //, %, and **. Comparisons produce booleans. and, or, and not combine conditions; parentheses make intent and precedence clear.",
        "minutes = 125\nhours = minutes // 60\nremaining = minutes % 60\nprint(hours, remaining)\nprint(18 >= 18 and True)",
        "Convert a total number of minutes into hours and remaining minutes; add a boolean check for a minimum age.",
        "Predict the result of 7 + 3 * 2 and (7 + 3) * 2. Explain why the parentheses change the result.",
    ),
    (
        "Python 04 · Strings and text formatting",
        "Index and slice strings; use common string methods; format output with f-strings.",
        "Strings are immutable sequences. Indexing starts at zero, slicing uses an exclusive end, and methods such as strip(), lower(), and replace() return useful text values.",
        'course = "  Python Basics  "\nclean = course.strip()\nprint(clean.lower())\nprint(f"Welcome to {clean}!")',
        "Ask for a full name, trim extra spaces, and display the initials and a normalized greeting.",
        "A title contains mixed capitalization and spaces. Decide which cleanup steps improve a search key without changing the displayed title.",
    ),
    (
        "Python 05 · Lists and tuples",
        "Create ordered collections; access and slice items; update lists safely; choose tuple for fixed records.",
        "Lists are ordered and mutable: append(), remove(), and indexing are common operations. Tuples are ordered but immutable and suit fixed grouped values.",
        'topics = ["strings", "lists", "loops"]\ntopics.append("functions")\nprint(topics[0:2])\nlesson = ("Python", 60)',
        "Build a study checklist, add one topic, mark a completed item, and print the remaining topics.",
        "Two variables point at the same list. Demonstrate why changing one reference affects the other, then show a copy with list(items).",
    ),
    (
        "Python 06 · Dictionaries and sets",
        "Model labelled data with dictionaries; retrieve and update values; use sets to remove duplicates.",
        "A dictionary maps unique keys to values and is ideal for named attributes. A set stores unique hashable items and supports membership and set operations.",
        'student = {"name": "Asha", "course": "Python"}\nstudent["lesson"] = 6\nskills = {"loops", "lists", "loops"}\nprint(student["course"], sorted(skills))',
        "Represent a course enrolment as a dictionary and collect unique submitted topic tags in a set.",
        "Look up a key that may not exist. Compare direct indexing with get() and decide how the app should handle missing information.",
    ),
    (
        "Python 07 · Conditions and loops",
        "Branch with if/elif/else; iterate over sequences; use range() and enumerate() appropriately.",
        "Conditions choose a path when their expression is true. for loops process an iterable; while loops repeat while a condition stays true. Avoid loops whose exit condition cannot be reached.",
        'scores = [72, 91, 58]\nfor index, score in enumerate(scores, start=1):\n    result = "pass" if score >= 60 else "retry"\n    print(index, result)',
        "Loop through a list of scores, count passes, and print a clear result for every learner.",
        "A while loop never stops. Identify the state that must change each iteration and add a safe stopping condition.",
    ),
    (
        "Python 08 · Functions and scope",
        "Define reusable functions; pass parameters; return results; use defaults and local variables clearly.",
        "A function gives a behaviour a name. Parameters receive inputs, return sends a result back, and local variables belong to a function call. Prefer explicit return values over hidden side effects.",
        'def course_summary(title, minutes=60):\n    return f"{title}: {minutes} minutes"\n\nprint(course_summary("Python functions"))',
        "Write a function that accepts a list of scores and returns the average; test it with at least two inputs.",
        "A function prints a result but another function needs to use it. Change the first function to return the value.",
    ),
    (
        "Python 09 · Modules and file handling",
        "Import standard-library modules; use pathlib for paths; read and write text files with a context manager.",
        "Modules organize reusable code. import makes module names available. with open(...) closes a file reliably, including when an error occurs; choose an explicit encoding for text.",
        'from pathlib import Path\nnotes = Path("study-notes.txt")\nnotes.write_text("Review functions", encoding="utf-8")\nprint(notes.read_text(encoding="utf-8"))',
        "Save a short revision note to a text file, read it back, and explain where the file is created.",
        "Discuss why a context manager is safer than opening a file and hoping every code path closes it.",
    ),
    (
        "Python 10 · Exceptions, debugging, and testing",
        "Read tracebacks from the bottom up; catch expected exceptions; add assertions for simple checks.",
        "Exceptions report runtime problems. Catch only errors the program can handle, keep the try block focused, and provide a useful message. Assertions check assumptions during development.",
        'def parse_age(value):\n    try:\n        return int(value)\n    except ValueError:\n        return None\n\nassert parse_age("20") == 20\nassert parse_age("unknown") is None',
        "Extend parse_age with a clear user-facing message and test valid, empty, and non-numeric values.",
        "Read a sample ValueError traceback, identify the file and line, reproduce the input, and describe the smallest safe fix.",
    ),
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = serializer.validated_data["tokens"]
        with transaction.atomic():
            LoginAudit.objects.create(user=user)
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

        return Response(
            {
                "message": "Login successful.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "role": user.role,
                },
                "tokens": tokens,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            if str(token["user_id"]) != str(request.user.id):
                return Response(
                    {"detail": "Invalid refresh token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_205_RESET_CONTENT)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
        })


class TrainerPresenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.TRAINER:
            return Response(
                {"detail": "Only trainers can update their presence."},
                status=status.HTTP_403_FORBIDDEN,
            )

        is_online = request.data.get("is_online", True)
        if not isinstance(is_online, bool):
            return Response(
                {"is_online": ["This field must be true or false."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.last_seen_at = timezone.now() if is_online else None
        request.user.save(update_fields=["last_seen_at"])
        return Response(
            {
                "is_online": is_online,
                "last_seen_at": request.user.last_seen_at,
            },
            status=status.HTTP_200_OK,
        )


class TrainerDirectoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        online_since = timezone.now() - timedelta(seconds=90)
        trainers = User.objects.filter(
            role=User.Role.TRAINER,
            is_active=True,
        ).order_by("first_name", "username")

        return Response([
            {
                "id": trainer.id,
                "name": trainer.get_full_name() or trainer.username,
                "is_online": (
                    trainer.last_seen_at is not None
                    and trainer.last_seen_at >= online_since
                ),
                "last_seen_at": trainer.last_seen_at,
            }
            for trainer in trainers
        ])


class TrainerResourceListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        resources = TrainerResource.objects.select_related("trainer")
        if request.user.role == User.Role.TRAINER:
            resources = resources.filter(trainer=request.user)
        else:
            resources = resources.filter(trainer__is_active=True)
        serializer = TrainerResourceSerializer(resources, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != User.Role.TRAINER:
            raise PermissionDenied("Only trainers can share learning resources.")
        serializer = TrainerResourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(trainer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TrainerStarterLecturesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.TRAINER:
            raise PermissionDenied("Only trainers can add starter lecture notes.")

        with transaction.atomic():
            trainer = User.objects.select_for_update().get(pk=request.user.pk)
            existing_titles = set(
                TrainerResource.objects.filter(
                    trainer=trainer,
                    course="Python Programming",
                ).values_list("title", flat=True)
            )
            missing_lectures = [
                lecture for lecture in PYTHON_LECTURES if lecture[0] not in existing_titles
            ]
            if missing_lectures:
                TrainerResource.objects.bulk_create([
                    TrainerResource(
                        trainer=trainer,
                        title=title,
                        course="Python Programming",
                        notes=build_python_lecture_notes(*lecture),
                        duration_minutes=60,
                    )
                    for title, *lecture in missing_lectures
                ])
            resources = TrainerResource.objects.filter(trainer=trainer)
            return Response(
                {
                    "created": len(missing_lectures),
                    "python_lectures": len(PYTHON_LECTURES),
                    "resources": TrainerResourceSerializer(resources, many=True).data,
                },
                status=status.HTTP_201_CREATED if missing_lectures else status.HTTP_200_OK,
            )


class TrainerResourceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, resource_id):
        if request.user.role != User.Role.TRAINER:
            raise PermissionDenied("Only trainers can manage learning resources.")
        try:
            resource = TrainerResource.objects.get(
                id=resource_id,
                trainer=request.user,
            )
        except TrainerResource.DoesNotExist:
            return Response(
                {"detail": "Resource not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        resource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TrainerSessionListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = TrainerSession.objects.select_related("trainer")
        if request.user.role == User.Role.TRAINER:
            sessions = sessions.filter(trainer=request.user)
        else:
            sessions = sessions.filter(
                trainer__is_active=True,
                scheduled_for__gte=timezone.now(),
            )
        return Response(TrainerSessionSerializer(sessions, many=True).data)

    def post(self, request):
        if request.user.role != User.Role.TRAINER:
            raise PermissionDenied("Only trainers can schedule sessions.")
        serializer = TrainerSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(trainer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TrainerSessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_id):
        if request.user.role != User.Role.TRAINER:
            raise PermissionDenied("Only trainers can manage sessions.")
        try:
            session = TrainerSession.objects.get(
                id=session_id,
                trainer=request.user,
            )
        except TrainerSession.DoesNotExist:
            return Response(
                {"detail": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentDoubtListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doubts = StudentDoubt.objects.select_related("student", "answered_by")
        if request.user.role == User.Role.STUDENT:
            doubts = doubts.filter(student=request.user)
        return Response(StudentDoubtSerializer(doubts, many=True).data)

    def post(self, request):
        if request.user.role != User.Role.STUDENT:
            raise PermissionDenied("Only students can post a doubt.")
        serializer = StudentDoubtSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doubt = serializer.save(student=request.user)
        return Response(
            StudentDoubtSerializer(doubt).data,
            status=status.HTTP_201_CREATED,
        )


class StudentDoubtDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, doubt_id):
        if request.user.role != User.Role.TRAINER:
            raise PermissionDenied("Only trainers can answer student doubts.")
        try:
            doubt = StudentDoubt.objects.select_related(
                "student",
                "answered_by",
            ).get(id=doubt_id)
        except StudentDoubt.DoesNotExist:
            return Response(
                {"detail": "Doubt not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TrainerDoubtReplySerializer(
            doubt,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        updated_doubt = serializer.save(answered_by=request.user)
        return Response(StudentDoubtSerializer(updated_doubt).data)


class StudentCommunityPostsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.STUDENT:
            raise PermissionDenied("The student community is only available to students.")
        posts = (
            CommunityPost.objects.select_related("author")
            .annotate(comment_count=Count("comments"))
            .all()[:100]
        )
        return Response(CommunityPostSerializer(posts, many=True).data)

    def post(self, request):
        if request.user.role != User.Role.STUDENT:
            raise PermissionDenied("Only students can share in the student community.")
        serializer = CommunityPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(author=request.user)
        return Response(
            CommunityPostSerializer(
                post,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class StudentCommunityCommentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_post(self, request, post_id):
        if request.user.role != User.Role.STUDENT:
            raise PermissionDenied("The student community is only available to students.")
        try:
            return CommunityPost.objects.get(id=post_id)
        except CommunityPost.DoesNotExist:
            return None

    def get(self, request, post_id):
        post = self.get_post(request, post_id)
        if post is None:
            return Response(
                {"detail": "Community post not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        comments = post.comments.select_related("author")
        return Response(CommunityCommentSerializer(comments, many=True).data)

    def post(self, request, post_id):
        post = self.get_post(request, post_id)
        if post is None:
            return Response(
                {"detail": "Community post not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CommunityCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(post=post, author=request.user)
        return Response(
            CommunityCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )


class StudentReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        reviews = StudentReview.objects.select_related("user")
        summary = reviews.aggregate(average=Avg("rating"), total=Count("id"))
        latest_reviews = reviews[:12]
        own_review = None
        if request.user.is_authenticated and request.user.role == User.Role.STUDENT:
            own_review = reviews.filter(user=request.user).first()
        return Response({
            "average_rating": round(summary["average"] or 0, 1),
            "total_reviews": summary["total"],
            "results": StudentReviewSerializer(
                latest_reviews,
                many=True,
                context={"request": request},
            ).data,
            "my_review": (
                StudentReviewSerializer(
                    own_review,
                    context={"request": request},
                ).data
                if own_review
                else None
            ),
        })

    def post(self, request):
        if request.user.role != User.Role.STUDENT:
            raise PermissionDenied("Only students can leave a review.")
        serializer = StudentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review, created = StudentReview.objects.update_or_create(
            user=request.user,
            defaults=serializer.validated_data,
        )
        return Response(
            StudentReviewSerializer(
                review,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
