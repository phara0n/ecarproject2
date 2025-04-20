// Définition globale du type Vehicle pour tout le projet
export type Vehicle = {
  id: number | string;
  license_plate?: string;
  registration_number?: string;
  brand?: string;
  make?: string;
  model?: string;
  year?: number;
  owner_name?: string;
  owner_username?: string;
  owner_id?: number;
  last_mileage?: number;
  initial_mileage?: number;
  average_daily_km?: number;
  // Champs fallback/compatibilité
  immatriculation?: string;
  marque?: string;
  modele?: string;
  annee?: number;
  kilometrage?: string | number;
  mileage?: number;
  km_quotidien_moyen?: number;
  avg_daily_km?: number;
}; 