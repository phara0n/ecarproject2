from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from .models import Vehicle, MileageRecord # Import Vehicle

User = get_user_model()

class RegistrationAPITestCase(APITestCase):
    """Test suite for the User Registration API endpoint."""

    def setUp(self):
        """Create necessary groups before tests run."""
        # Ensure the 'Customers' group exists (migration should handle this, but good practice for tests)
        Group.objects.get_or_create(name='Customers')
        self.register_url = reverse('register') # Use reverse lookup for URL

    def test_register_valid_user(self):
        """Ensure we can register a new user with valid data."""
        user_data = {
            'username': 'testuser1',
            'email': 'test1@example.com',
            'password': 'StrongP@ssw0rd',
            'password2': 'StrongP@ssw0rd',
            'phone_number': '+21699123456' # Valid Tunisian format
        }

        response = self.client.post(self.register_url, user_data, format='json')
        
        # 1. Check Status Code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Check User Existence
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser1')
        
        # 3. Check Group Assignment
        user = User.objects.get(username='testuser1')
        self.assertTrue(user.groups.filter(name='Customers').exists())
        print("\nRegistration Test: User created and added to Customers group.") # Feedback

    def test_register_password_mismatch(self):
        """Ensure registration fails if passwords do not match."""
        user_data = {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'password': 'StrongP@ssw0rd',
            'password2': 'WrongPassword', # Mismatch
            'phone_number': '+21699123457'
        }

        response = self.client.post(self.register_url, user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data) # Check if error is related to password
        self.assertEqual(User.objects.count(), 0) # No user should be created
        print("Registration Test: Password mismatch prevented registration.") # Feedback

    def test_register_invalid_phone(self):
        """Ensure registration fails with an invalid phone number format."""
        user_data = {
            'username': 'testuser3',
            'email': 'test3@example.com',
            'password': 'StrongP@ssw0rd',
            'password2': 'StrongP@ssw0rd',
            'phone_number': '12345678' # Invalid format
        }

        response = self.client.post(self.register_url, user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data) # Check if error is related to phone
        self.assertEqual(User.objects.count(), 0)
        print("Registration Test: Invalid phone number prevented registration.") # Feedback

    # Add more tests: duplicate username, duplicate email, duplicate phone, missing fields etc.

class VehicleAPITestCase(APITestCase):
    """Test suite for the Vehicle API endpoint."""

    def setUp(self):
        """Set up test users and initial data."""
        # Create Groups
        self.customer_group, _ = Group.objects.get_or_create(name='Customers')
        self.admin_group, _ = Group.objects.get_or_create(name='Admins')

        # Create Users
        self.customer_user = User.objects.create_user(username='cust1', password='custpass', email='cust1@example.com')
        self.customer_user.groups.add(self.customer_group)

        self.other_customer_user = User.objects.create_user(username='cust2', password='custpass2', email='cust2@example.com')
        self.other_customer_user.groups.add(self.customer_group)

        self.admin_user = User.objects.create_superuser(username='admin1', password='adminpass', email='admin1@example.com')
        # Superusers don't necessarily need to be in the Admins group, but doesn't hurt
        self.admin_user.groups.add(self.admin_group)

        # Create some vehicles
        self.vehicle1 = Vehicle.objects.create(
            owner=self.customer_user, 
            make='Renault', 
            model='Clio', 
            registration_number='101TU1010', 
            initial_mileage=1000
        )
        # Auto-create initial mileage record (manually simulate for test setup clarity if needed)
        MileageRecord.objects.get_or_create(
            vehicle=self.vehicle1,
            mileage=self.vehicle1.initial_mileage,
            source='INITIAL',
            recorded_by=self.customer_user
        )

        self.vehicle2 = Vehicle.objects.create(
            owner=self.other_customer_user, 
            make='Peugeot', 
            model='208', 
            registration_number='202RS2020', 
            initial_mileage=2000
        )
        MileageRecord.objects.get_or_create(
            vehicle=self.vehicle2,
            mileage=self.vehicle2.initial_mileage,
            source='INITIAL',
            recorded_by=self.other_customer_user
        )

        self.vehicles_url = reverse('vehicle-list') # Corresponds to basename='vehicle' in router
        self.vehicle1_detail_url = reverse('vehicle-detail', kwargs={'pk': self.vehicle1.pk})
        self.vehicle2_detail_url = reverse('vehicle-detail', kwargs={'pk': self.vehicle2.pk})

    # --- List Tests --- 
    def test_list_vehicles_customer_sees_own(self):
        """Ensure customer only sees their own vehicles."""
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.vehicles_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1) # Should only see vehicle1
        self.assertEqual(response.data[0]['registration_number'], self.vehicle1.registration_number)
        print("Vehicle Test: Customer list sees own vehicle.")

    def test_list_vehicles_admin_sees_all(self):
        """Ensure admin sees all vehicles."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.vehicles_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # Should see both vehicles
        print("Vehicle Test: Admin list sees all vehicles.")

    def test_list_vehicles_unauthenticated(self):
        """Ensure unauthenticated users cannot list vehicles."""
        self.client.force_authenticate(user=None) # Log out
        response = self.client.get(self.vehicles_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        print("Vehicle Test: Unauthenticated list denied.")

    # --- Create Tests --- 
    def test_create_vehicle_customer(self):
        """Ensure customer can create a vehicle (owner is set automatically)."""
        self.client.force_authenticate(user=self.customer_user)
        vehicle_data = {
            'make': 'Fiat',
            'model': 'Punto',
            'registration_number': '303TU3030',
            'initial_mileage': 3000
        }
        response = self.client.post(self.vehicles_url, vehicle_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vehicle.objects.count(), 3)
        new_vehicle = Vehicle.objects.get(registration_number='303TU3030')
        self.assertEqual(new_vehicle.owner, self.customer_user)
        # Check initial mileage record was created
        self.assertTrue(MileageRecord.objects.filter(vehicle=new_vehicle, mileage=3000, source='INITIAL').exists())
        print("Vehicle Test: Customer created vehicle, owner set, initial mileage record created.")

    def test_create_vehicle_unauthenticated(self):
        """Ensure unauthenticated user cannot create vehicle."""
        self.client.force_authenticate(user=None)
        vehicle_data = {'make': 'VW', 'model': 'Golf', 'registration_number': '404TU4040', 'initial_mileage': 4000}
        response = self.client.post(self.vehicles_url, vehicle_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        print("Vehicle Test: Unauthenticated create denied.")

    # --- Retrieve Tests --- 
    def test_retrieve_own_vehicle_customer(self):
        """Ensure customer can retrieve their own vehicle."""
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.vehicle1_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['registration_number'], self.vehicle1.registration_number)
        print("Vehicle Test: Customer retrieve own vehicle OK.")

    def test_retrieve_other_vehicle_customer(self):
        """Ensure customer cannot retrieve another user's vehicle."""
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.vehicle2_detail_url) 
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Filtered by queryset
        print("Vehicle Test: Customer retrieve other vehicle denied (404).")

    def test_retrieve_any_vehicle_admin(self):
        """Ensure admin can retrieve any vehicle."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.vehicle2_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['registration_number'], self.vehicle2.registration_number)
        print("Vehicle Test: Admin retrieve any vehicle OK.")

    # --- Update Tests --- 
    def test_update_own_vehicle_customer(self):
        """Ensure customer can update their own vehicle."""
        self.client.force_authenticate(user=self.customer_user)
        update_data = {'model': 'Clio Updated', 'initial_mileage': 1100} # Required fields for partial update might differ
        response = self.client.patch(self.vehicle1_detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vehicle1.refresh_from_db()
        self.assertEqual(self.vehicle1.model, 'Clio Updated')
        self.assertEqual(self.vehicle1.initial_mileage, 1100)
        print("Vehicle Test: Customer update own vehicle OK.")

    def test_update_other_vehicle_customer(self):
        """Ensure customer cannot update another user's vehicle."""
        self.client.force_authenticate(user=self.customer_user)
        update_data = {'model': '208 Updated'}
        response = self.client.patch(self.vehicle2_detail_url, update_data, format='json')
        # Queryset filter results in 404 before permission check
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        print("Vehicle Test: Customer update other vehicle denied (404).") 

    def test_update_any_vehicle_admin(self):
        """Ensure admin can update any vehicle."""
        self.client.force_authenticate(user=self.admin_user)
        update_data = {'model': '208 Admin Update'}
        response = self.client.patch(self.vehicle2_detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vehicle2.refresh_from_db()
        self.assertEqual(self.vehicle2.model, '208 Admin Update')
        print("Vehicle Test: Admin update any vehicle OK.")

    # --- Delete Tests --- 
    def test_delete_own_vehicle_customer(self):
        """Ensure customer can delete their own vehicle."""
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.delete(self.vehicle1_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Vehicle.objects.count(), 1)
        print("Vehicle Test: Customer delete own vehicle OK.")

    def test_delete_other_vehicle_customer(self):
        """Ensure customer cannot delete another user's vehicle."""
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.delete(self.vehicle2_detail_url)
        # Queryset filter results in 404 before permission check
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Vehicle.objects.count(), 2)
        print("Vehicle Test: Customer delete other vehicle denied (404).")

    def test_delete_any_vehicle_admin(self):
        """Ensure admin can delete any vehicle."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.vehicle2_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Vehicle.objects.count(), 1)
        print("Vehicle Test: Admin delete any vehicle OK.")
