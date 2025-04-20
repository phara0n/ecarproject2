import json
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from ..models import Vehicle, MileageRecord, CustomerProfile

User = get_user_model()

class MileageRecordAPITests(APITestCase):
    """Tests for the MileageRecord API endpoints."""

    @classmethod
    def setUpTestData(cls):
        """Set up data for the whole TestCase."""
        # Create users
        cls.client_user = User.objects.create_user(
            username='testclient', 
            password='testpassword123', 
            email='client@example.com'
        )
        cls.admin_user = User.objects.create_user(
            username='testadmin', 
            password='testpassword123', 
            email='admin@example.com',
            is_staff=True, 
            is_superuser=True
        )
        cls.other_client_user = User.objects.create_user(
            username='otherclient',
            password='testpassword123',
            email='other@example.com'
        )

        # Create CustomerProfile instances 
        # Required if phone number is needed or permissions check profile existence.
        cls.client_profile = CustomerProfile.objects.create(user=cls.client_user, phone_number='+21612345678')
        cls.other_client_profile = CustomerProfile.objects.create(user=cls.other_client_user, phone_number='+21611223344')
        # Admin might not need a profile, depending on logic
        
        # Create vehicles
        cls.client_vehicle = Vehicle.objects.create(
            owner=cls.client_user,
            make='Renault',
            model='Clio',
            registration_number='123TU4567',
            initial_mileage=10000 
        )
        cls.other_vehicle = Vehicle.objects.create(
            owner=cls.other_client_user,
            make='Peugeot',
            model='208',
            registration_number='987RS6543',
            initial_mileage=5000
        )
        
        # Get/Create the initial mileage records explicitly
        try:
            cls.initial_mileage_record = MileageRecord.objects.get(vehicle=cls.client_vehicle, mileage=10000, source='INITIAL')
        except MileageRecord.DoesNotExist:
             cls.initial_mileage_record = MileageRecord.objects.create(
                 vehicle=cls.client_vehicle, 
                 mileage=10000, 
                 source='INITIAL',
                 recorded_by=cls.client_user 
             )
        # Explicitly create/get for other_vehicle too
        try:
            cls.other_initial_mileage_record = MileageRecord.objects.get(vehicle=cls.other_vehicle, mileage=5000, source='INITIAL')
        except MileageRecord.DoesNotExist:
            cls.other_initial_mileage_record = MileageRecord.objects.create(
                 vehicle=cls.other_vehicle,
                 mileage=5000,
                 source='INITIAL',
                 recorded_by=cls.other_client_user
             )
             
        # Ensure we handle MultipleObjectsReturned for both if necessary (less likely now)
        except MileageRecord.MultipleObjectsReturned:
             cls.initial_mileage_record = MileageRecord.objects.filter(vehicle=cls.client_vehicle, mileage=10000, source='INITIAL').first()
             cls.other_initial_mileage_record = MileageRecord.objects.filter(vehicle=cls.other_vehicle, mileage=5000, source='INITIAL').first()

        # URLs
        cls.list_create_url = reverse('mileagerecord-list') 
        cls.detail_url = lambda pk: reverse('mileagerecord-detail', kwargs={'pk': pk})

    def setUp(self):
        """Set up for each test method."""
        self.client = APIClient()
        # Authenticate as client_user by default for many tests
        self.client.force_authenticate(user=self.client_user)

    # --- Test Cases will go here ---

    def test_client_can_create_mileage_record_for_own_vehicle(self):
        """Test authenticated client can create a mileage record for their own vehicle."""
        data = {
            'vehicle_id': self.client_vehicle.pk,
            'mileage': 12000, # Higher than initial
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MileageRecord.objects.count(), 3) # Initial for client + Initial for other + New one
        new_record = MileageRecord.objects.latest('recorded_at')
        self.assertEqual(new_record.vehicle, self.client_vehicle)
        self.assertEqual(new_record.mileage, 12000)
        self.assertEqual(new_record.recorded_by, self.client_user)
        self.assertEqual(new_record.source, 'CUSTOMER')

    def test_client_cannot_create_mileage_record_for_other_vehicle(self):
        """Test authenticated client cannot create a mileage record for another user's vehicle."""
        data = {
            'vehicle_id': self.other_vehicle.pk,
            'mileage': 6000, 
        }
        response = self.client.post(self.list_create_url, data, format='json')
        # Assuming perform_create checks ownership and raises PermissionDenied (403) 
        # or serializer validation fails if vehicle isn't in allowed queryset (400)
        # Let's expect 400 based on typical serializer validation with filtered querysets
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])
        self.assertEqual(MileageRecord.objects.count(), 2) # Should not have increased

    def test_unauthenticated_user_cannot_create_mileage_record(self):
        """Test unauthenticated users cannot create mileage records."""
        self.client.logout() # Log out the default client user
        data = {
            'vehicle_id': self.client_vehicle.pk,
            'mileage': 11000,
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) # Or 403 if auth is required but handled differently
        self.assertEqual(MileageRecord.objects.count(), 2)

    def test_admin_can_create_mileage_record_for_any_vehicle(self):
        """Test admin user can create a mileage record for any vehicle."""
        self.client.force_authenticate(user=self.admin_user)
        data_for_client_vehicle = {
            'vehicle_id': self.client_vehicle.pk,
            'mileage': 15000, # Higher than initial
        }
        response_client = self.client.post(self.list_create_url, data_for_client_vehicle, format='json')
        self.assertEqual(response_client.status_code, status.HTTP_201_CREATED)
        
        data_for_other_vehicle = {
            'vehicle_id': self.other_vehicle.pk,
            'mileage': 7000, # Higher than initial
        }
        response_other = self.client.post(self.list_create_url, data_for_other_vehicle, format='json')
        self.assertEqual(response_other.status_code, status.HTTP_201_CREATED)
        
        self.assertEqual(MileageRecord.objects.count(), 4) # 2 initial + 2 admin-created
        
        # Check source is ADMIN
        admin_record = MileageRecord.objects.get(vehicle=self.client_vehicle, mileage=15000)
        self.assertEqual(admin_record.recorded_by, self.admin_user)
        self.assertEqual(admin_record.source, 'ADMIN')

    def test_cannot_create_mileage_record_less_than_last(self):
        """Test creating a mileage record with value less than the latest fails."""
        # Initial mileage for client_vehicle is 10000
        data = {
            'vehicle_id': self.client_vehicle.pk,
            'mileage': 9000, # Less than initial
        }
        response = self.client.post(self.list_create_url, data, format='json')
        # Expecting 400, can now uncomment assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mileage', response.data) # Check that the error is related to the mileage field
        # Ensure the error message mentions the constraint 
        if isinstance(response.data['mileage'], list):
            self.assertTrue(any('inférieur' in str(msg).lower() or 'less than' in str(msg).lower() for msg in response.data['mileage']))
        else:
             self.assertTrue('inférieur' in str(response.data['mileage']).lower() or 'less than' in str(response.data['mileage']).lower())
        self.assertEqual(MileageRecord.objects.count(), 2) # Should still be 2 initial records

    def test_client_can_list_only_own_mileage_records(self):
        """Test client lists only records for their vehicles."""
        # Create an additional record for the client's vehicle for testing list
        MileageRecord.objects.create(vehicle=self.client_vehicle, mileage=11000, recorded_by=self.client_user)
        # We now have: 
        # 1. Initial record for client_vehicle (10000)
        # 2. Second record for client_vehicle (11000)
        # 3. Initial record for other_vehicle (5000)
        
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assuming no pagination or default pagination is small enough for this test
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        
        self.assertEqual(len(results), 2) # Should only see the 2 records for client_vehicle
        # Check the IDs match the records owned by the client
        client_record_pks = {self.initial_mileage_record.pk, MileageRecord.objects.get(mileage=11000).pk}
        response_pks = {record['id'] for record in results}
        self.assertEqual(response_pks, client_record_pks)

    def test_admin_can_list_all_mileage_records(self):
        """Test admin user can list records for all vehicles."""
        # Create an additional record for the client's vehicle 
        MileageRecord.objects.create(vehicle=self.client_vehicle, mileage=11000, recorded_by=self.client_user)
        # Total records = 3 (initial_client, second_client, initial_other)
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        
        self.assertEqual(len(results), 3) # Admin should see all records

    def test_client_can_retrieve_own_mileage_record(self):
        """Test client can retrieve a specific mileage record they own."""
        url = self.detail_url(self.initial_mileage_record.pk)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.initial_mileage_record.pk)
        self.assertEqual(response.data['mileage'], 10000)

    def test_client_cannot_retrieve_other_mileage_record(self):
        """Test client cannot retrieve a specific record for another user's vehicle."""
        # Use the explicitly created/fetched record for other_vehicle
        url = self.detail_url(self.other_initial_mileage_record.pk) 
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_client_cannot_update_mileage_record(self):
        """Test client cannot update (PUT/PATCH) a mileage record."""
        url = self.detail_url(self.initial_mileage_record.pk)
        # Remove 'notes' from data, as it doesn't exist on MileageRecord
        data_put = { 'mileage': 10500, 'vehicle_id': self.client_vehicle.pk }
        data_patch = { 'mileage': 10501 } # Update mileage instead of non-existent notes
        
        response_put = self.client.put(url, data_put, format='json')
        self.assertEqual(response_put.status_code, status.HTTP_403_FORBIDDEN)
        
        response_patch = self.client.patch(url, data_patch, format='json')
        self.assertEqual(response_patch.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify the record was not changed
        self.initial_mileage_record.refresh_from_db()
        self.assertEqual(self.initial_mileage_record.mileage, 10000)
        # Removed check for notes

    def test_client_cannot_delete_mileage_record(self):
        """Test client cannot delete a mileage record."""
        url = self.detail_url(self.initial_mileage_record.pk)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(MileageRecord.objects.filter(pk=self.initial_mileage_record.pk).exists())

    def test_admin_can_update_mileage_record(self):
        """Test admin can update (PATCH) any mileage record."""
        self.client.force_authenticate(user=self.admin_user)
        url = self.detail_url(self.initial_mileage_record.pk)
        # Update mileage instead of non-existent notes
        data_patch = { 'mileage': 10505 } 
        
        response_patch = self.client.patch(url, data_patch, format='json')
        self.assertEqual(response_patch.status_code, status.HTTP_200_OK)
        self.initial_mileage_record.refresh_from_db()
        self.assertEqual(self.initial_mileage_record.mileage, 10505)
        # Removed check for notes

    def test_admin_can_delete_mileage_record(self):
         """Test admin can delete any mileage record."""
         self.client.force_authenticate(user=self.admin_user)
         record_to_delete_pk = self.initial_mileage_record.pk
         url = self.detail_url(record_to_delete_pk)
         
         response = self.client.delete(url)
         self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
         self.assertFalse(MileageRecord.objects.filter(pk=record_to_delete_pk).exists())
         # Count should now be 1 (other_initial_mileage_record remains)
         self.assertEqual(MileageRecord.objects.count(), 1) 

    # End of tests for now

    # ... more tests ... 