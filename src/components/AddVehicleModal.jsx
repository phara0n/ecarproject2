import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddVehicleModal = ({ isOpen, onClose, onSave }) => {
  const [clients, setClients] = useState([
    { id: 1, first_name: 'John', last_name: 'Doe' },
    { id: 2, first_name: 'Jane', last_name: 'Smith' },
    { id: 3, first_name: 'Mohamed', last_name: 'Ben Ali' },
    { id: 4, first_name: 'Sara', last_name: 'Trabelsi' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState('1'); // Default to first client
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    mileage: '',
    vin: ''
  });
  const [errors, setErrors] = useState({});
  const [skipVin, setSkipVin] = useState(false); // Add state for skipping VIN

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleClientChange = (e) => {
    setSelectedClient(e.target.value);
  };

  const handleSkipVinChange = (e) => {
    setSkipVin(e.target.checked);
    if (e.target.checked) {
      // Clear VIN field and any errors when skipping
      setFormData({ ...formData, vin: '' });
      if (errors.vin) {
        setErrors({ ...errors, vin: null });
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.license_plate) newErrors.license_plate = 'Plaque d\'immatriculation requise';
    if (!formData.brand) newErrors.brand = 'Marque requise';
    if (!formData.model) newErrors.model = 'Modèle requis';
    if (!formData.mileage) newErrors.mileage = 'Kilométrage requis';
    if (!selectedClient) newErrors.client = 'Sélection d\'un client requise';
    
    // VIN validation - only if a value is provided and not skipping VIN
    if (!skipVin && formData.vin && formData.vin.length !== 17) {
      newErrors.vin = 'Le VIN doit contenir exactement 17 caractères';
    }
    
    // License plate format validation (example: 123TU4567)
    const licensePlateRegex = /^\d{3}(TU|RS)\d{4}$/;
    if (formData.license_plate && !licensePlateRegex.test(formData.license_plate)) {
      newErrors.license_plate = 'Format invalide. Exemple: 123TU4567';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSave({
        ...formData,
        client_id: selectedClient,
      });
      
      // Reset form
      setFormData({
        license_plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        mileage: '',
        vin: ''
      });
      setSelectedClient('1');
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
      aria-labelledby="add-vehicle-modal-title"
      aria-describedby="add-vehicle-modal-desc"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      {/* Full-screen container for centering */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title 
              id="add-vehicle-modal-title"
              className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
            >
              Ajouter un Nouveau Véhicule
            </Dialog.Title>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={onClose}
              aria-label="Fermer"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <p id="add-vehicle-modal-desc" className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Entrez les informations du véhicule ci-dessous.
          </p>
          
          <form onSubmit={handleSubmit}>
            {/* Client Selection - Using radio buttons instead of dropdown */}
            <div className="mb-4">
              <label 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Propriétaire<span className="text-error ml-1">*</span>
              </label>
              
              {/* Debug information */}
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900 text-xs rounded">
                <div>Clients disponibles: {clients.length}</div>
                <div>Client sélectionné: {selectedClient}</div>
              </div>
              
              <div className="space-y-2 border rounded-md p-3 bg-white dark:bg-gray-800">
                {clients.map(client => (
                  <div key={client.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`client-${client.id}`}
                      name="client"
                      value={client.id}
                      checked={selectedClient === client.id.toString()}
                      onChange={handleClientChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                      required
                    />
                    <label 
                      htmlFor={`client-${client.id}`}
                      className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {client.first_name} {client.last_name}
                    </label>
                  </div>
                ))}
              </div>
              
              {errors.client && (
                <p id="client-error" className="mt-1 text-sm text-error" role="alert">
                  {errors.client}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Informations du véhicule
              </h3>
              
              {/* License Plate */}
              <div className="mb-3">
                <label 
                  htmlFor="license_plate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Plaque d'immatriculation <span className="text-error ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="license_plate"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.license_plate ? 'border-error dark:border-error' : 'border-gray-300'
                  }`}
                  aria-invalid={errors.license_plate ? "true" : "false"}
                  aria-describedby={errors.license_plate ? "license-plate-error" : "license-plate-format"}
                  required
                />
                <p id="license-plate-format" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Format: 123TU4567
                </p>
                {errors.license_plate && (
                  <p id="license-plate-error" className="mt-1 text-sm text-error" role="alert">
                    {errors.license_plate}
                  </p>
                )}
              </div>
              
              {/* Brand and Model in two columns */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label 
                    htmlFor="brand"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Marque <span className="text-error ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.brand ? 'border-error dark:border-error' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.brand ? "true" : "false"}
                    aria-describedby={errors.brand ? "brand-error" : undefined}
                    required
                  />
                  {errors.brand && (
                    <p id="brand-error" className="mt-1 text-sm text-error" role="alert">
                      {errors.brand}
                    </p>
                  )}
                </div>
                
                <div>
                  <label 
                    htmlFor="model"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Modèle <span className="text-error ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.model ? 'border-error dark:border-error' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.model ? "true" : "false"}
                    aria-describedby={errors.model ? "model-error" : undefined}
                    required
                  />
                  {errors.model && (
                    <p id="model-error" className="mt-1 text-sm text-error" role="alert">
                      {errors.model}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Year and Mileage in two columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label 
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Année
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.year ? 'border-error dark:border-error' : 'border-gray-300'
                    }`}
                    aria-invalid={errors.year ? "true" : "false"}
                    aria-describedby={errors.year ? "year-error" : undefined}
                  />
                  {errors.year && (
                    <p id="year-error" className="mt-1 text-sm text-error" role="alert">
                      {errors.year}
                    </p>
                  )}
                </div>
                
                <div>
                  <label 
                    htmlFor="mileage"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Kilométrage <span className="text-error ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="mileage"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleChange}
                      min="0"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.mileage ? 'border-error dark:border-error' : 'border-gray-300'
                      }`}
                      aria-invalid={errors.mileage ? "true" : "false"}
                      aria-describedby={errors.mileage ? "mileage-error" : "mileage-unit"}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Kilomètres</span>
                    </div>
                  </div>
                  {errors.mileage && (
                    <p id="mileage-error" className="mt-1 text-sm text-error" role="alert">
                      {errors.mileage}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Informations additionnelles <span className="text-gray-500 dark:text-gray-400 text-xs">(optionnel)</span>
              </h3>
              
              {/* VIN Number */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label 
                    htmlFor="vin"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    Numéro de Châssis (VIN)
                    <span className="ml-1 relative group">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 w-48">
                        Le numéro d'identification du véhicule (VIN) est un code unique de 17 caractères.
                      </span>
                    </span>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="skip-vin"
                      checked={skipVin}
                      onChange={handleSkipVinChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="skip-vin" className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                      Sans VIN
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  maxLength="17"
                  disabled={skipVin}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.vin ? 'border-error dark:border-error' : 'border-gray-300'
                  } ${skipVin ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                  aria-invalid={errors.vin ? "true" : "false"}
                  aria-describedby={errors.vin ? "vin-error" : "vin-format"}
                />
                {!skipVin && (
                  <p id="vin-format" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    17 caractères alphanumériques
                  </p>
                )}
                {errors.vin && (
                  <p id="vin-error" className="mt-1 text-sm text-error" role="alert">
                    {errors.vin}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Les champs avec <span className="text-error">*</span> sont obligatoires.
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddVehicleModal; 