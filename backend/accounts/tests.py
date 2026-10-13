from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase


class RegisterViewTests(APITestCase):
    def test_registration_persists_user_with_hashed_password(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "new_student",
                "email": "new_student@example.com",
                "password": "Distinct-Passphrase-492!",
                "password_confirm": "Distinct-Passphrase-492!",
                "first_name": "New",
                "last_name": "Student",
                "role": "student",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        user = get_user_model().objects.get(username="new_student")
        self.assertEqual(user.email, "new_student@example.com")
        self.assertTrue(user.check_password("Distinct-Passphrase-492!"))

    def test_trainer_can_register_themselves(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "new_trainer",
                "email": "new_trainer@example.com",
                "password": "Distinct-Passphrase-492!",
                "password_confirm": "Distinct-Passphrase-492!",
                "first_name": "New",
                "last_name": "Trainer",
                "role": "trainer",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        user = get_user_model().objects.get(username="new_trainer")
        self.assertEqual(user.role, "trainer")


class LoginViewTests(APITestCase):
    def test_login_returns_tokens_for_registered_user(self):
        password = "Distinct-Passphrase-492!"
        get_user_model().objects.create_user(
            username="registered_student",
            email="registered_student@example.com",
            password=password,
            role="student",
        )

        response = self.client.post(
            reverse("login"),
            {
                "email": "registered_student@example.com",
                "password": password,
                "role": "student",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["user"]["email"], "registered_student@example.com")
        self.assertTrue(response.data["tokens"]["access"])
        self.assertTrue(response.data["tokens"]["refresh"])
        from .models import LoginAudit
        user = get_user_model().objects.get(email="registered_student@example.com")
        self.assertTrue(
            LoginAudit.objects.filter(user__email="registered_student@example.com").exists()
        )
        self.assertIsNotNone(user.last_login)

    def test_trainer_can_log_in_with_trainer_role(self):
        password = "Distinct-Passphrase-492!"
        get_user_model().objects.create_user(
            username="registered_trainer",
            email="registered_trainer@example.com",
            password=password,
            role="trainer",
        )

        response = self.client.post(
            reverse("login"),
            {
                "email": "registered_trainer@example.com",
                "password": password,
                "role": "trainer",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["user"]["role"], "trainer")
        self.assertTrue(response.data["tokens"]["access"])


class TrainerPresenceViewTests(APITestCase):
    def setUp(self):
        self.trainer = get_user_model().objects.create_user(
            username="presence_trainer",
            email="presence_trainer@example.com",
            password="Distinct-Passphrase-492!",
            role="trainer",
        )

    def test_trainer_can_mark_online_and_offline(self):
        self.client.force_authenticate(self.trainer)

        online_response = self.client.post(
            reverse("trainer-presence"),
            {"is_online": True},
            format="json",
        )
        self.assertEqual(online_response.status_code, 200)
        self.trainer.refresh_from_db()
        self.assertIsNotNone(self.trainer.last_seen_at)
        directory_response = self.client.get(reverse("trainer-directory"))
        self.assertTrue(directory_response.data[0]["is_online"])

        offline_response = self.client.post(
            reverse("trainer-presence"),
            {"is_online": False},
            format="json",
        )
        self.assertEqual(offline_response.status_code, 200)
        self.trainer.refresh_from_db()
        self.assertIsNone(self.trainer.last_seen_at)
        directory_response = self.client.get(reverse("trainer-directory"))
        self.assertFalse(directory_response.data[0]["is_online"])

    def test_presence_rejects_non_boolean_status(self):
        self.client.force_authenticate(self.trainer)

        response = self.client.post(
            reverse("trainer-presence"),
            {"is_online": "yes"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_trainer_directory_expires_stale_presence(self):
        self.trainer.last_seen_at = timezone.now() - timedelta(seconds=91)
        self.trainer.save(update_fields=["last_seen_at"])
        self.client.force_authenticate(self.trainer)

        response = self.client.get(reverse("trainer-directory"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["is_online"], False)

    def test_students_cannot_update_trainer_presence(self):
        student = get_user_model().objects.create_user(
            username="presence_student",
            email="presence_student@example.com",
            password="Distinct-Passphrase-492!",
            role="student",
        )
        self.client.force_authenticate(student)

        response = self.client.post(
            reverse("trainer-presence"),
            {"is_online": True},
            format="json",
        )

        self.assertEqual(response.status_code, 403)


class TrainerWorkspaceViewTests(APITestCase):
    def setUp(self):
        self.user_model = get_user_model()
        self.trainer = self.user_model.objects.create_user(
            username="workspace_trainer",
            email="workspace_trainer@example.com",
            password="Distinct-Passphrase-492!",
            role="trainer",
        )
        self.student = self.user_model.objects.create_user(
            username="workspace_student",
            email="workspace_student@example.com",
            password="Distinct-Passphrase-492!",
            role="student",
        )
        self.other_trainer = self.user_model.objects.create_user(
            username="other_trainer",
            email="other_trainer@example.com",
            password="Distinct-Passphrase-492!",
            role="trainer",
        )

    def test_trainer_shares_resources_with_students(self):
        self.client.force_authenticate(self.trainer)
        created = self.client.post(
            reverse("trainer-resources"),
            {
                "title": "Python functions",
                "course": "Python",
                "notes": "Functions package reusable logic.",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data["trainer_name"], "workspace_trainer")

        self.client.force_authenticate(self.student)
        listed = self.client.get(reverse("trainer-resources"))

        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]["title"], "Python functions")

    def test_students_cannot_publish_resources_or_schedule_sessions(self):
        self.client.force_authenticate(self.student)

        resource_response = self.client.post(
            reverse("trainer-resources"),
            {"title": "Student resource", "notes": "Not allowed"},
            format="json",
        )
        session_response = self.client.post(
            reverse("trainer-sessions"),
            {
                "title": "Student session",
                "scheduled_for": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(resource_response.status_code, 403)
        self.assertEqual(session_response.status_code, 403)

    def test_trainer_can_schedule_session_students_can_view_it(self):
        scheduled_for = timezone.now() + timedelta(days=1)
        self.client.force_authenticate(self.trainer)
        created = self.client.post(
            reverse("trainer-sessions"),
            {
                "title": "React live Q&A",
                "description": "Bring your project questions.",
                "scheduled_for": scheduled_for.isoformat(),
                "duration_minutes": 45,
                "meeting_url": "https://meet.example.com/react",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)

        self.client.force_authenticate(self.student)
        listed = self.client.get(reverse("trainer-sessions"))

        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]["title"], "React live Q&A")
        self.assertEqual(listed.data[0]["trainer_name"], "workspace_trainer")

    def test_trainers_only_see_and_remove_their_own_resources(self):
        from .models import TrainerResource

        resource = TrainerResource.objects.create(
            trainer=self.other_trainer,
            title="Private trainer resource",
            notes="The other trainer owns this.",
        )
        self.client.force_authenticate(self.trainer)

        listed = self.client.get(reverse("trainer-resources"))
        deletion = self.client.delete(
            reverse("trainer-resource-detail", args=[resource.id])
        )

        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.data, [])
        self.assertEqual(deletion.status_code, 404)
        self.assertTrue(TrainerResource.objects.filter(id=resource.id).exists())

    def test_empty_trainer_workspace_gets_ten_student_visible_starter_lectures(self):
        self.client.force_authenticate(self.trainer)

        seeded = self.client.post(reverse("trainer-starter-lectures"))
        repeated = self.client.post(reverse("trainer-starter-lectures"))

        self.assertEqual(seeded.status_code, 201, seeded.data)
        self.assertEqual(seeded.data["created"], 10)
        self.assertEqual(seeded.data["python_lectures"], 10)
        self.assertEqual(len(seeded.data["resources"]), 10)
        self.assertEqual(repeated.status_code, 200, repeated.data)
        self.assertEqual(repeated.data["created"], 0)
        self.assertEqual(len(repeated.data["resources"]), 10)
        self.assertEqual(
            {item["title"] for item in seeded.data["resources"]},
            {
                "Python 01 · Setup, REPL, and syntax",
                "Python 02 · Variables and data types",
                "Python 03 · Operators and expressions",
                "Python 04 · Strings and text formatting",
                "Python 05 · Lists and tuples",
                "Python 06 · Dictionaries and sets",
                "Python 07 · Conditions and loops",
                "Python 08 · Functions and scope",
                "Python 09 · Modules and file handling",
                "Python 10 · Exceptions, debugging, and testing",
            },
        )
        self.assertTrue(all(item["duration_minutes"] == 60 for item in seeded.data["resources"]))
        self.assertTrue(all("SLIDE 6" in item["notes"] for item in seeded.data["resources"]))

        self.client.force_authenticate(self.student)
        student_resources = self.client.get(reverse("trainer-resources"))
        self.assertEqual(student_resources.status_code, 200)
        self.assertEqual(len(student_resources.data), 10)
        self.assertTrue(all(item["notes"] for item in student_resources.data))
        self.assertTrue(all(item["duration_minutes"] == 60 for item in student_resources.data))

    def test_starter_lectures_are_added_without_replacing_existing_trainer_resources(self):
        from .models import TrainerResource

        TrainerResource.objects.create(
            trainer=self.trainer,
            title="Trainer's own lesson",
            course="Custom course",
            notes="Keep this trainer-authored material.",
        )
        self.client.force_authenticate(self.trainer)

        seeded = self.client.post(reverse("trainer-starter-lectures"))

        self.assertEqual(seeded.status_code, 201, seeded.data)
        self.assertEqual(seeded.data["created"], 10)
        self.assertEqual(len(seeded.data["resources"]), 11)
        self.assertTrue(
            any(
                resource["title"] == "Trainer's own lesson"
                and resource["notes"] == "Keep this trainer-authored material."
                for resource in seeded.data["resources"]
            )
        )

    def test_students_cannot_add_trainer_starter_lectures(self):
        self.client.force_authenticate(self.student)

        response = self.client.post(reverse("trainer-starter-lectures"))

        self.assertEqual(response.status_code, 403)


class StudentDoubtViewTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.student = user_model.objects.create_user(
            username="doubt_student",
            email="doubt_student@example.com",
            password="Distinct-Passphrase-492!",
            role="student",
        )
        self.trainer = user_model.objects.create_user(
            username="doubt_trainer",
            email="doubt_trainer@example.com",
            password="Distinct-Passphrase-492!",
            role="trainer",
        )
        self.other_student = user_model.objects.create_user(
            username="other_doubt_student",
            email="other_doubt_student@example.com",
            password="Distinct-Passphrase-492!",
            role="student",
        )

    def test_student_posts_private_doubt_and_trainer_answers_and_resolves_it(self):
        from .models import StudentDoubt

        self.client.force_authenticate(self.student)
        created = self.client.post(
            reverse("student-doubts"),
            {
                "subject": "React state",
                "question": "Why does my component render again?",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        doubt_id = created.data["id"]

        self.client.force_authenticate(self.trainer)
        trainer_inbox = self.client.get(reverse("student-doubts"))
        self.assertEqual(trainer_inbox.status_code, 200)
        self.assertEqual(len(trainer_inbox.data), 1)
        self.assertEqual(trainer_inbox.data[0]["id"], doubt_id)
        replied = self.client.patch(
            reverse("student-doubt-detail", args=[doubt_id]),
            {
                "answer": "State changes trigger a new render.",
                "status": StudentDoubt.Status.ANSWERED,
            },
            format="json",
        )
        self.assertEqual(replied.status_code, 200, replied.data)
        self.assertEqual(replied.data["trainer_name"], "doubt_trainer")

        resolved = self.client.patch(
            reverse("student-doubt-detail", args=[doubt_id]),
            {
                "answer": replied.data["answer"],
                "status": StudentDoubt.Status.RESOLVED,
            },
            format="json",
        )
        self.assertEqual(resolved.status_code, 200, resolved.data)
        self.assertEqual(resolved.data["status"], StudentDoubt.Status.RESOLVED)

        self.client.force_authenticate(self.student)
        listed = self.client.get(reverse("student-doubts"))
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]["answer"], "State changes trigger a new render.")
        self.assertEqual(listed.data[0]["status"], StudentDoubt.Status.RESOLVED)

    def test_student_only_sees_own_doubts_and_cannot_answer(self):
        from .models import StudentDoubt

        doubt = StudentDoubt.objects.create(
            student=self.other_student,
            subject="Private question",
            question="This should not be visible to another student.",
        )
        self.client.force_authenticate(self.student)

        listed = self.client.get(reverse("student-doubts"))
        denied = self.client.patch(
            reverse("student-doubt-detail", args=[doubt.id]),
            {"answer": "No", "status": "answered"},
            format="json",
        )

        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.data, [])
        self.assertEqual(denied.status_code, 403)

    def test_trainer_cannot_resolve_without_an_answer(self):
        from .models import StudentDoubt

        doubt = StudentDoubt.objects.create(
            student=self.student,
            subject="Unanswered question",
            question="Can this be resolved without explanation?",
        )
        self.client.force_authenticate(self.trainer)

        response = self.client.patch(
            reverse("student-doubt-detail", args=[doubt.id]),
            {"status": StudentDoubt.Status.RESOLVED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)


class StudentCommunityViewTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.student = user_model.objects.create_user(
            username="community_student",
            email="community_student@example.com",
            password="Distinct-Passphrase-492!",
            first_name="Community",
            role="student",
        )
        self.other_student = user_model.objects.create_user(
            username="community_peer",
            email="community_peer@example.com",
            password="Distinct-Passphrase-492!",
            first_name="Learning",
            role="student",
        )
        self.trainer = user_model.objects.create_user(
            username="community_trainer",
            email="community_trainer@example.com",
            password="Distinct-Passphrase-492!",
            role="trainer",
        )

    def test_students_share_notes_and_discuss_them_together(self):
        self.client.force_authenticate(self.student)
        created = self.client.post(
            reverse("community-posts"),
            {
                "post_type": "note",
                "title": "Python loop notes",
                "course": "Python",
                "content": "Use a for loop to iterate over each item.",
                "link_url": "https://example.com/loops",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        post_id = created.data["id"]
        self.assertEqual(created.data["author_name"], "Community")
        self.assertEqual(created.data["comment_count"], 0)

        self.client.force_authenticate(self.other_student)
        comment = self.client.post(
            reverse("community-comments", args=[post_id]),
            {"content": "Thanks, this helped me understand loops!"},
            format="json",
        )
        self.assertEqual(comment.status_code, 201, comment.data)
        self.assertEqual(comment.data["author_name"], "Learning")

        listed = self.client.get(reverse("community-posts"))
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]["comment_count"], 1)
        comments = self.client.get(
            reverse("community-comments", args=[post_id])
        )
        self.assertEqual(len(comments.data), 1)
        self.assertEqual(
            comments.data[0]["content"],
            "Thanks, this helped me understand loops!",
        )

    def test_students_can_post_doubts_and_trainers_are_not_in_community(self):
        self.client.force_authenticate(self.student)
        doubt = self.client.post(
            reverse("community-posts"),
            {
                "post_type": "doubt",
                "title": "When should I use a dictionary?",
                "content": "I am not sure which situations are best for a dictionary.",
            },
            format="json",
        )
        self.assertEqual(doubt.status_code, 201, doubt.data)

        self.client.force_authenticate(self.trainer)
        listed = self.client.get(reverse("community-posts"))
        posted = self.client.post(
            reverse("community-posts"),
            {
                "post_type": "discussion",
                "title": "Trainer post",
                "content": "This is not a student post.",
            },
            format="json",
        )
        self.assertEqual(listed.status_code, 403)
        self.assertEqual(posted.status_code, 403)

    def test_shared_note_requires_content_or_a_link(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            reverse("community-posts"),
            {"post_type": "note", "title": "Empty note"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class StudentReviewViewTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.student = user_model.objects.create_user(
            username="review_student",
            email="review_student@example.com",
            password="Distinct-Passphrase-492!",
            first_name="Review",
            role="student",
        )
        self.trainer = user_model.objects.create_user(
            username="review_trainer",
            email="review_trainer@example.com",
            password="Distinct-Passphrase-492!",
            role="trainer",
        )

    def test_student_review_is_public_and_can_be_updated(self):
        self.client.force_authenticate(self.student)
        created = self.client.post(
            reverse("student-reviews"),
            {"rating": 5, "content": "The lessons and notes are really helpful."},
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        self.assertTrue(created.data["is_mine"])

        updated = self.client.post(
            reverse("student-reviews"),
            {"rating": 4, "content": "The lessons are great and easy to follow."},
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)

        self.client.force_authenticate(user=None)
        public_reviews = self.client.get(reverse("student-reviews"))
        self.assertEqual(public_reviews.status_code, 200)
        self.assertEqual(public_reviews.data["average_rating"], 4)
        self.assertEqual(public_reviews.data["total_reviews"], 1)
        self.assertEqual(len(public_reviews.data["results"]), 1)
        self.assertEqual(
            public_reviews.data["results"][0]["content"],
            "The lessons are great and easy to follow.",
        )
        self.assertFalse(public_reviews.data["results"][0]["is_mine"])

    def test_only_students_can_leave_valid_rated_reviews(self):
        self.client.force_authenticate(self.trainer)
        denied = self.client.post(
            reverse("student-reviews"),
            {"rating": 5, "content": "Trainer review"},
            format="json",
        )
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.student)
        invalid = self.client.post(
            reverse("student-reviews"),
            {"rating": 6, "content": "Invalid score"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)
