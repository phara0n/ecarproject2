from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from ..models import Vehicle, ServiceType, ServiceEvent, CustomerProfile

User = get_user_model()

class ServiceAPITests(APITestCase):
    """Tests for the ServiceType and ServiceEvent API endpoints."""

    @classmethod
    def setUpTestData(cls):
        """Set up data for the whole TestCase."""
        # Create users
        cls.client_user = User.objects.create_user(
            username='servicetestclient', 
            password='testpassword123'
        )
        cls.admin_user = User.objects.create_user(
            username='servicetestadmin', 
            password='testpassword123',
            is_staff=True, 
            is_superuser=True
        )
        # Create profiles if needed by logic/permissions
        CustomerProfile.objects.create(user=cls.client_user, phone_number='+21655555555')
        
        # Create a vehicle owned by the client
        cls.client_vehicle = Vehicle.objects.create(
            owner=cls.client_user,
            make='TestMake',
            model='TestModel',
            registration_number='111TU222',
            initial_mileage=1000
        )
        
        # Create a basic service type
        cls.service_type_vidange = ServiceType.objects.create(
            name="Vidange Simple",
            description="Changement huile et filtre.",
            default_interval_km=10000
        )
        
        # URLs
        # Service Type (Admin Only)
        cls.service_type_list_create_url = reverse('servicetype-list')
        cls.service_type_detail_url = lambda pk: reverse('servicetype-detail', kwargs={'pk': pk})
        
        # Service Event
        cls.service_event_list_create_url = reverse('serviceevent-list')
        cls.service_event_detail_url = lambda pk: reverse('serviceevent-detail', kwargs={'pk': pk})

    def setUp(self):
        """Set up for each test method."""
        self.client = APIClient()
        # Default to client auth, override when testing admin actions
        self.client.force_authenticate(user=self.client_user)

    # --- ServiceType Tests (Admin Only) ---

    def test_client_cannot_access_service_types(self):
        """Test non-admin user gets 403 Forbidden for ServiceType endpoints."""
        # List
        response_list = self.client.get(self.service_type_list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_403_FORBIDDEN)
        
        # Create attempt
        data = {'name': 'New Service', 'default_interval_km': 5000}
        response_create = self.client.post(self.service_type_list_create_url, data, format='json')
        self.assertEqual(response_create.status_code, status.HTTP_403_FORBIDDEN)
        
        # Retrieve attempt (using existing type)
        url_detail = self.service_type_detail_url(self.service_type_vidange.pk)
        response_retrieve = self.client.get(url_detail)
        self.assertEqual(response_retrieve.status_code, status.HTTP_403_FORBIDDEN)
        
        # Update attempt
        response_patch = self.client.patch(url_detail, {'description': 'Updated'}, format='json')
        self.assertEqual(response_patch.status_code, status.HTTP_403_FORBIDDEN)
        
        # Delete attempt
        response_delete = self.client.delete(url_detail)
        self.assertEqual(response_delete.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_crud_service_types(self):
        """Test admin user can perform CRUD operations on ServiceType."""
        self.client.force_authenticate(user=self.admin_user)
        
        # 1. List existing types
        response_list = self.client.get(self.service_type_list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_200_OK)
        # Assuming setUpTestData creates 1 type initially
        initial_count = ServiceType.objects.count()
        results = response_list.data if not isinstance(response_list.data, dict) or 'results' not in response_list.data else response_list.data['results']
        self.assertEqual(len(results), initial_count)
        
        # 2. Create a new type
        new_service_data = {
            'name': 'Changement Pneus',
            'description': 'Remplacement des 4 pneus',
            'default_interval_km': 40000
        }
        response_create = self.client.post(self.service_type_list_create_url, new_service_data, format='json')
        self.assertEqual(response_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ServiceType.objects.count(), initial_count + 1)
        new_service_pk = response_create.data['id']
        
        # 3. Retrieve the newly created type
        url_detail = self.service_type_detail_url(new_service_pk)
        response_retrieve = self.client.get(url_detail)
        self.assertEqual(response_retrieve.status_code, status.HTTP_200_OK)
        self.assertEqual(response_retrieve.data['name'], 'Changement Pneus')
        
        # 4. Update the type (PATCH)
        update_data = {'description': 'Remplacement et équilibrage.'}
        response_patch = self.client.patch(url_detail, update_data, format='json')
        self.assertEqual(response_patch.status_code, status.HTTP_200_OK)
        updated_service = ServiceType.objects.get(pk=new_service_pk)
        self.assertEqual(updated_service.description, 'Remplacement et équilibrage.')
        
        # 5. Delete the type
        response_delete = self.client.delete(url_detail)
        self.assertEqual(response_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ServiceType.objects.count(), initial_count) # Back to original count
        self.assertFalse(ServiceType.objects.filter(pk=new_service_pk).exists())

    # --- ServiceEvent Tests --- 

    def test_client_cannot_modify_service_events(self):
        """Test client user cannot Create, Update, or Delete ServiceEvents."""
        # Create an initial event first (e.g., by admin in setup or here)
        # We need an event to attempt to modify/delete
        self.client.force_authenticate(user=self.admin_user)
        initial_event_data = {
            'vehicle_id': self.client_vehicle.pk, 
            'service_type_id': self.service_type_vidange.pk, 
            'event_date': '2024-01-15', 
            'mileage_at_service': 10500
        }
        create_response = self.client.post(self.service_event_list_create_url, initial_event_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        event_pk = create_response.data['id']
        self.client.force_authenticate(user=self.client_user) # Switch back to client
        
        event_detail_url = self.service_event_detail_url(event_pk)
        
        # Attempt Create (as client)
        new_event_data = {
            'vehicle_id': self.client_vehicle.pk, 
            'service_type_id': self.service_type_vidange.pk, 
            'event_date': '2024-05-20', 
            'mileage_at_service': 20000
        }
        response_create = self.client.post(self.service_event_list_create_url, new_event_data, format='json')
        self.assertEqual(response_create.status_code, status.HTTP_403_FORBIDDEN)
        
        # Attempt Update (PATCH)
        update_data = {'notes': 'Client tried to update'}
        response_patch = self.client.patch(event_detail_url, update_data, format='json')
        self.assertEqual(response_patch.status_code, status.HTTP_403_FORBIDDEN)

        # Attempt Delete
        response_delete = self.client.delete(event_detail_url)
        self.assertEqual(response_delete.status_code, status.HTTP_403_FORBIDDEN)
        
        # Ensure the event still exists and wasn't changed by PATCH attempt
        self.assertTrue(ServiceEvent.objects.filter(pk=event_pk).exists())
        event = ServiceEvent.objects.get(pk=event_pk)
        self.assertIsNone(event.notes)

    def test_admin_can_crud_service_events(self):
        """Test admin can perform CRUD on ServiceEvents for any vehicle."""
        self.client.force_authenticate(user=self.admin_user)
        initial_count = ServiceEvent.objects.count()
        
        # Create
        event_data = {
            'vehicle_id': self.client_vehicle.pk, 
            'service_type_id': self.service_type_vidange.pk, 
            'event_date': '2024-02-10', 
            'mileage_at_service': 11000,
            'notes': 'Admin added event'
        }
        response_create = self.client.post(self.service_event_list_create_url, event_data, format='json')
        self.assertEqual(response_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ServiceEvent.objects.count(), initial_count + 1)
        event_pk = response_create.data['id']
        
        # Retrieve
        detail_url = self.service_event_detail_url(event_pk)
        response_retrieve = self.client.get(detail_url)
        self.assertEqual(response_retrieve.status_code, status.HTTP_200_OK)
        self.assertEqual(response_retrieve.data['notes'], 'Admin added event')
        
        # Update (PATCH)
        update_data = {'mileage_at_service': 11050}
        response_patch = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response_patch.status_code, status.HTTP_200_OK)
        updated_event = ServiceEvent.objects.get(pk=event_pk)
        self.assertEqual(updated_event.mileage_at_service, 11050)
        
        # Delete
        response_delete = self.client.delete(detail_url)
        self.assertEqual(response_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ServiceEvent.objects.count(), initial_count)

    def test_client_can_list_retrieve_own_service_events(self):
        """Test client can list and retrieve only their own service events."""
        # Create event for client vehicle (by admin)
        self.client.force_authenticate(user=self.admin_user)
        client_event_data = {
            'vehicle_id': self.client_vehicle.pk, 
            'service_type_id': self.service_type_vidange.pk, 
            'event_date': '2024-03-10', 
            'mileage_at_service': 12000
        }
        client_event_resp = self.client.post(self.service_event_list_create_url, client_event_data, format='json')
        client_event_pk = client_event_resp.data['id']
        
        # Create event for another vehicle (owned by admin, for simplicity)
        admin_vehicle = Vehicle.objects.create(
             owner=self.admin_user, make='AdminCar', model='AC', 
             registration_number='ADMIN1', initial_mileage=500
        )
        other_event_data = {
            'vehicle_id': admin_vehicle.pk, 
            'service_type_id': self.service_type_vidange.pk, 
            'event_date': '2024-03-11', 
            'mileage_at_service': 1000
        }
        self.client.post(self.service_event_list_create_url, other_event_data, format='json')
        
        # Switch back to client
        self.client.force_authenticate(user=self.client_user)
        
        # Test List
        response_list = self.client.get(self.service_event_list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_200_OK)
        results = response_list.data if not isinstance(response_list.data, dict) or 'results' not in response_list.data else response_list.data['results']
        self.assertEqual(len(results), 1) # Should only see their own event
        self.assertEqual(results[0]['id'], client_event_pk)
        
        # Test Retrieve Own
        detail_url_own = self.service_event_detail_url(client_event_pk)
        response_retrieve_own = self.client.get(detail_url_own)
        self.assertEqual(response_retrieve_own.status_code, status.HTTP_200_OK)
        self.assertEqual(response_retrieve_own.data['id'], client_event_pk)
        
        # Test Retrieve Other (should fail, 404)
        # Get the PK of the event associated with admin_vehicle
        other_event_pk = ServiceEvent.objects.get(vehicle=admin_vehicle).pk
        detail_url_other = self.service_event_detail_url(other_event_pk)
        response_retrieve_other = self.client.get(detail_url_other)
        self.assertEqual(response_retrieve_other.status_code, status.HTTP_404_NOT_FOUND)

    # More ServiceEvent tests (e.g., validation) can go here 