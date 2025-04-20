import { useState, useEffect, useRef } from 'react';
import { useClientModal } from './ClientModalContext';
import { ClientForm } from './ClientForm';
import { useAuth } from '@/context/AuthContext';

export const ClientModals = () => {
  const { action, selectedClient, closeModal, refreshClients } = useClientModal();
  const { authAxios } = useAuth();

  // États pour feedback utilisateur (suppression et reset)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ref pour focus automatique
  const mainBtnRef = useRef<HTMLButtonElement>(null);

  // Focus sur le bouton principal à l'ouverture
  useEffect(() => {
    if (mainBtnRef.current) mainBtnRef.current.focus();
  }, [action, selectedClient]);

  // Fermeture modale sur Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeModal]);

  if (!action || !selectedClient) return null;

  // Animation d'apparition/disparition
  const modalClass = "fixed inset-0 bg-black/40 flex items-center justify-center z-50 transition-opacity duration-200";
  const panelClass = "bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 min-w-[340px] max-w-[95vw] animate-fade-in";

  // Détail du client
  if (action === 'view') {
    return (
      <div className={modalClass}>
        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Détail du client</h2>
            <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-800" aria-label="Fermer">✕</button>
          </div>
          <div className="space-y-2">
            <p><span className="font-semibold">Nom :</span> {selectedClient.first_name} {selectedClient.last_name}</p>
            <p><span className="font-semibold">Email :</span> {selectedClient.email}</p>
            <p><span className="font-semibold">Téléphone :</span> {selectedClient.phone_number || selectedClient.profile?.phone_number}</p>
            <p><span className="font-semibold">Actif :</span> {selectedClient.is_active ? 'Oui' : 'Non'}</p>
            <p><span className="font-semibold">Date d'inscription :</span> {selectedClient.date_joined}</p>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire d'édition
  if (action === 'edit') {
    return (
      <div className={modalClass}>
        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Éditer le client</h2>
            <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-800" aria-label="Fermer">✕</button>
          </div>
          <ClientForm client={selectedClient} onSuccess={() => { closeModal(); refreshClients(); }} onCancel={closeModal} />
        </div>
      </div>
    );
  }

  // Confirmation suppression
  if (action === 'delete') {
    const handleDelete = async () => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      try {
        await authAxios.delete(`api/v1/users/${selectedClient.id}/`);
        setSuccess('Client supprimé avec succès.');
        setTimeout(() => {
          setIsSubmitting(false);
          closeModal();
          refreshClients();
        }, 1000);
      } catch {
        setError("Erreur lors de la suppression du client.");
        setIsSubmitting(false);
      }
    };
    return (
      <div className={modalClass}>
        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Supprimer le client</h2>
            <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-800" disabled={isSubmitting} aria-label="Fermer">✕</button>
          </div>
          <p className="mb-4"><span className="font-semibold">Voulez-vous vraiment supprimer {selectedClient.first_name} {selectedClient.last_name} ?</span></p>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={closeModal} className="px-3 py-1 rounded bg-zinc-200 hover:bg-zinc-300" disabled={isSubmitting}>Annuler</button>
            <button ref={mainBtnRef} onClick={handleDelete} className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600" disabled={isSubmitting}>Supprimer</button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation reset password
  if (action === 'reset') {
    const handleReset = async () => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      try {
        await authAxios.post(`api/v1/users/${selectedClient.id}/reset-password/`);
        setSuccess('Lien de réinitialisation envoyé.');
        setTimeout(() => {
          setIsSubmitting(false);
          closeModal();
        }, 1200);
      } catch {
        setError("Erreur lors de la réinitialisation du mot de passe.");
        setIsSubmitting(false);
      }
    };
    return (
      <div className={modalClass}>
        <div className={panelClass}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Réinitialiser le mot de passe</h2>
            <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-800" disabled={isSubmitting} aria-label="Fermer">✕</button>
          </div>
          <p className="mb-4"><span className="font-semibold">Voulez-vous envoyer un lien de réinitialisation à {selectedClient.email} ?</span></p>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={closeModal} className="px-3 py-1 rounded bg-zinc-200 hover:bg-zinc-300" disabled={isSubmitting}>Annuler</button>
            <button ref={mainBtnRef} onClick={handleReset} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting}>Réinitialiser</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 