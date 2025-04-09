import os
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from ..models import Vehicle, Invoice, CustomerProfile

User = get_user_model()

# Helper function to create a dummy PDF file for testing
def create_dummy_pdf(filename="dummy_invoice.pdf"):
    """Creates a simple dummy file to simulate PDF upload."""
    # Simple text content is fine for testing upload mechanism
    content = b"%PDF-1.4\n% Test PDF content\n%%EOF"
    return SimpleUploadedFile(filename, content, content_type="application/pdf")

class InvoiceAPITests(APITestCase):
    """Tests for the Invoice API endpoint (including file uploads)."""

    @classmethod
    def setUpTestData(cls):
        """Set up data for the whole TestCase."""
        # Users
        cls.client_user = User.objects.create_user('invoicetestclient', password='testpass')
        cls.admin_user = User.objects.create_user('invoicetestadmin', password='testpass', is_staff=True)
        CustomerProfile.objects.create(user=cls.client_user, phone_number='+21688888888')
        
        # Vehicle
        cls.client_vehicle = Vehicle.objects.create(
            owner=cls.client_user, make='InvoiceMake', model='InvModel',
            registration_number='INV456', initial_mileage=30000
        )
        
        # URLs
        cls.list_create_url = reverse('invoice-list')
        cls.detail_url = lambda pk: reverse('invoice-detail', kwargs={'pk': pk})

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.client_user)
        # Ensure MEDIA_ROOT exists for file uploads during tests
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

    def tearDown(self):
        # Clean up uploaded files after tests if necessary
        # This can be more complex depending on storage backend and isolation needs.
        # For local file storage, simple removal might work, but be careful.
        # Example (use with caution, adjust path as needed):
        # for root, dirs, files in os.walk(settings.MEDIA_ROOT, topdown=False):
        #     for name in files:
        #         os.remove(os.path.join(root, name))
        #     for name in dirs:
        #         os.rmdir(os.path.join(root, name))
        pass # Avoid auto-deletion for now unless it causes issues

    # --- Invoice Tests --- 

    def test_client_cannot_modify_invoices(self):
        """Test client gets 403 Forbidden for Invoice CUD operations."""
        # Create an initial invoice via Admin first to test update/delete
        self.client.force_authenticate(user=self.admin_user)
        dummy_file_initial = create_dummy_pdf("initial.pdf")
        initial_data = {
            'vehicle_id': self.client_vehicle.pk,
            'final_amount': 150.75,
            'pdf_file': dummy_file_initial
        }
        # Use format='multipart' for file uploads
        create_response = self.client.post(self.list_create_url, initial_data, format='multipart')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        invoice_pk = create_response.data['id']
        
        # Switch back to client
        self.client.force_authenticate(user=self.client_user)
        detail_url = self.detail_url(invoice_pk)
        
        # Attempt Create (as client)
        dummy_file_client = create_dummy_pdf("client_attempt.pdf")
        client_create_data = {
            'vehicle_id': self.client_vehicle.pk,
            'final_amount': 50.00,
            'pdf_file': dummy_file_client
        }
        response_create = self.client.post(self.list_create_url, client_create_data, format='multipart')
        self.assertEqual(response_create.status_code, status.HTTP_403_FORBIDDEN)
        
        # Attempt Update (PATCH)
        # Note: File updates via PATCH can be tricky, testing non-file field update
        update_data = {'final_amount': 155.00}
        response_patch = self.client.patch(detail_url, update_data, format='multipart') # format might still be needed
        self.assertEqual(response_patch.status_code, status.HTTP_403_FORBIDDEN)
        
        # Attempt Delete
        response_delete = self.client.delete(detail_url)
        self.assertEqual(response_delete.status_code, status.HTTP_403_FORBIDDEN)
        
        # Check invoice still exists and amount wasn't changed
        self.assertTrue(Invoice.objects.filter(pk=invoice_pk).exists())
        invoice = Invoice.objects.get(pk=invoice_pk)
        self.assertEqual(float(invoice.final_amount), 150.75) # Compare as float or Decimal

    def test_admin_can_crud_invoices(self):
        """Test admin can upload, retrieve, update, and delete invoices."""
        self.client.force_authenticate(user=self.admin_user)
        initial_count = Invoice.objects.count()
        
        # 1. Create/Upload
        dummy_file = create_dummy_pdf("admin_invoice.pdf")
        create_data = {
            'vehicle_id': self.client_vehicle.pk,
            'final_amount': 250.00,
            'invoice_date': '2024-04-01',
            'pdf_file': dummy_file
        }
        response_create = self.client.post(self.list_create_url, create_data, format='multipart')
        self.assertEqual(response_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Invoice.objects.count(), initial_count + 1)
        invoice_pk = response_create.data['id']
        # Check if file exists (basic check)
        invoice = Invoice.objects.get(pk=invoice_pk)
        self.assertTrue(invoice.pdf_file.name.endswith('admin_invoice.pdf'))
        self.assertTrue(os.path.exists(invoice.pdf_file.path))

        # 2. Retrieve
        detail_url = self.detail_url(invoice_pk)
        response_retrieve = self.client.get(detail_url)
        self.assertEqual(response_retrieve.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response_retrieve.data['final_amount']), 250.00)
        self.assertTrue('pdf_file_url' in response_retrieve.data)
        
        # 3. Update (PATCH - non-file field)
        update_data = {'final_amount': 255.50}
        response_patch = self.client.patch(detail_url, update_data, format='multipart') # Use multipart even if not changing file?
        self.assertEqual(response_patch.status_code, status.HTTP_200_OK)
        invoice.refresh_from_db()
        self.assertEqual(float(invoice.final_amount), 255.50)
        
        # 4. Delete
        response_delete = self.client.delete(detail_url)
        self.assertEqual(response_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Invoice.objects.count(), initial_count)
        self.assertFalse(Invoice.objects.filter(pk=invoice_pk).exists())
        # Optional: Check if file was physically deleted (depends on storage backend setup)
        # self.assertFalse(os.path.exists(invoice.pdf_file.path)) # This might fail if deletion signal/logic isn't implemented

    def test_client_can_list_retrieve_own_invoices(self):
        """Test client can list/retrieve own invoices but not others."""
        # Create invoice for client vehicle (by admin)
        self.client.force_authenticate(user=self.admin_user)
        client_invoice_file = create_dummy_pdf("client_inv.pdf")
        client_invoice_data = {
            'vehicle_id': self.client_vehicle.pk, 
            'final_amount': 99.00, 
            'pdf_file': client_invoice_file
        }
        client_invoice_resp = self.client.post(self.list_create_url, client_invoice_data, format='multipart')
        client_invoice_pk = client_invoice_resp.data['id']
        
        # Create invoice for admin vehicle
        admin_vehicle = Vehicle.objects.create(
             owner=self.admin_user, make='AdminInvCar', model='AIC', 
             registration_number='ADMININV1', initial_mileage=100
        )
        admin_invoice_file = create_dummy_pdf("admin_inv.pdf")
        other_invoice_data = {
            'vehicle_id': admin_vehicle.pk, 
            'final_amount': 500.00, 
            'pdf_file': admin_invoice_file
        }
        other_invoice_resp = self.client.post(self.list_create_url, other_invoice_data, format='multipart')
        other_invoice_pk = other_invoice_resp.data['id']

        # Switch back to client
        self.client.force_authenticate(user=self.client_user)
        
        # Test List
        response_list = self.client.get(self.list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_200_OK)
        results = response_list.data if not isinstance(response_list.data, dict) or 'results' not in response_list.data else response_list.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], client_invoice_pk)
        
        # Test Retrieve Own
        detail_url_own = self.detail_url(client_invoice_pk)
        response_retrieve_own = self.client.get(detail_url_own)
        self.assertEqual(response_retrieve_own.status_code, status.HTTP_200_OK)
        self.assertEqual(response_retrieve_own.data['id'], client_invoice_pk)
        
        # Test Retrieve Other (404)
        detail_url_other = self.detail_url(other_invoice_pk)
        response_retrieve_other = self.client.get(detail_url_other)
        self.assertEqual(response_retrieve_other.status_code, status.HTTP_404_NOT_FOUND)

    # Add more tests (e.g., validation, filtering) if needed

