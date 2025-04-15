/**
 * Utilitaires de formatage pour l'application ECAR
 * Standardise le formatage des dates, nombres, devises et numéros de téléphone
 * selon les exigences du marché tunisien
 */

/**
 * Formate une date au format français (JJ/MM/AAAA)
 * @param dateString - Chaîne de date à formater
 * @param withTime - Inclure l'heure (optionnel)
 * @returns Date formatée ou chaîne vide si invalide
 */
export const formatDate = (dateString?: string | Date, withTime = false): string => {
  if (!dateString) return '';
  
  try {
    // Handle ISO date strings that might have timezone issues
    let dateValue = dateString;
    
    // If we have a string that might be an ISO date with timezone info
    if (typeof dateString === 'string' && dateString.includes('T')) {
      // Extract just the date part for more reliable parsing
      const datePart = dateString.split('T')[0];
      if (datePart && datePart.includes('-')) {
        dateValue = datePart;
      }
    }
    
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Invalid date detected:', dateString);
      return '';
    }
    
    // Format français JJ/MM/AAAA
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    
    // Ajouter l'heure si demandé
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('fr-FR', options);
  } catch (error) {
    console.error('Erreur de formatage de date:', error, 'pour la valeur:', dateString);
    return '';
  }
};

/**
 * Formate un nombre avec séparateur de milliers français (espace)
 * @param value - Valeur à formater
 * @param decimals - Nombre de décimales (défaut: 0)
 * @returns Nombre formaté ou '0' si invalide
 */
export const formatNumber = (value?: number | string, decimals = 0): string => {
  if (value === undefined || value === null) return '0';
  
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) return '0';
    
    // Format français avec espace comme séparateur de milliers
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Erreur de formatage de nombre:', error);
    return '0';
  }
};

/**
 * Formate un montant en devise tunisienne (DT)
 * @param value - Montant à formater
 * @returns Montant formaté avec symbole DT
 */
export const formatCurrency = (value?: number | string): string => {
  if (value === undefined || value === null) return '0,00 DT';
  
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) return '0,00 DT';
    
    // Format tunisien: XXX,XX DT
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' DT';
  } catch (error) {
    console.error('Erreur de formatage de devise:', error);
    return '0,00 DT';
  }
};

/**
 * Formate un numéro de téléphone tunisien au format +216 XX XXX XXX
 * @param phone - Numéro de téléphone à formater
 * @returns Numéro formaté ou chaîne vide si invalide
 */
export const formatPhone = (phone?: string): string => {
  if (!phone) return '';
  
  try {
    // If it already starts with +216, ensure it's well formatted
    if (phone.startsWith('+216')) {
      // Supprimer tous les caractères non numériques
      const cleaned = phone.replace(/\D/g, '');
      
      // For a standard Tunisian number (11 digits including country code)
      if (cleaned.length >= 11) {
        const last8 = cleaned.substring(3);
        return `+216 ${last8.substring(0, 2)} ${last8.substring(2, 5)} ${last8.substring(5, 8)}`;
      }
      
      // If it's not the right length but starts with +216, just return it formatted as best we can
      return phone;
    }
    
    // Supprimer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');
    
    // Vérifier si le numéro a le bon nombre de chiffres
    if (cleaned.length === 8) {
      // If exactly 8 digits, it's a Tunisian number without country code
      return `+216 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
    }
    
    if (cleaned.startsWith('216') && cleaned.length >= 11) {
      const last8 = cleaned.substring(3);
      return `+216 ${last8.substring(0, 2)} ${last8.substring(2, 5)} ${last8.substring(5, 8)}`;
    }
    
    // If nothing matches, return as is but at least add +216 if not present
    return phone.startsWith('+216') ? phone : `+216 ${phone}`;
  } catch (error) {
    console.error('Erreur de formatage de téléphone:', error);
    return phone || '';
  }
};

/**
 * Formate une plaque d'immatriculation tunisienne (123TU1234)
 * @param plate - Plaque à formater
 * @returns Plaque formatée ou texte original si invalide
 */
export const formatLicensePlate = (plate?: string): string => {
  if (!plate) return '';
  
  // Expression régulière pour les plaques tunisiennes (simplifiée)
  const plateRegex = /^(\d{1,3})(TU|RS)(\d{1,4})$/i;
  
  try {
    const cleaned = plate.trim().toUpperCase();
    const match = cleaned.match(plateRegex);
    
    if (!match) return plate;
    
    // Formatter avec les bonnes séparations
    return `${match[1]} ${match[2]} ${match[3]}`;
  } catch (error) {
    console.error('Erreur de formatage de plaque:', error);
    return plate;
  }
}; 