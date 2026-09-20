from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User, Business, BusinessMembership
from .models import Property


class PropertyBusinessIsolationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # User who belongs to Business A
        self.user = User.objects.create_user(
            name="Danny",
            email="danny@example.com",
            password="testpassword123",
        )

        self.business_a = Business.objects.create(
            company_name="Business A",
        )

        BusinessMembership.objects.create(
            user=self.user,
            business=self.business_a,
            role="owner",
        )

        # Business B
        self.business_b = Business.objects.create(
            company_name="Business B",
        )

        # Property belonging to Business A
        self.property_a = Property.objects.create(
            business=self.business_a,
            name="Property A",
            location="Naivasha",
        )

        # Property belonging to Business B
        self.property_b = Property.objects.create(
            business=self.business_b,
            name="Property B",
            location="Nakuru",
        )

        self.client.force_authenticate(user=self.user)

    def test_user_can_access_property_in_their_business(self):
        response = self.client.get(
            f"/api/properties/{self.property_a.id}/",
            HTTP_X_BUSINESS_ID=str(self.business_a.id),
        )

        self.assertEqual(response.status_code, 200)

    def test_user_cannot_access_property_from_another_business(self):
        response = self.client.get(
            f"/api/properties/{self.property_b.id}/",
            HTTP_X_BUSINESS_ID=str(self.business_a.id),
        )

        self.assertEqual(response.status_code, 404)