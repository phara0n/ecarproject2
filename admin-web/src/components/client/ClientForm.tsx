import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Client } from './types';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const baseSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" }),
  email: z.string().email({ message: "Format d'email invalide" }),
  first_name: z.string().min(1, { message: "Le prénom est requis" }),
  last_name: z.string().min(1, { message: "Le nom est requis" }),
  phone_number: z.string().nullable().optional(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  password2: z.string().min(6, { message: "Veuillez confirmer le mot de passe" }),
}).refine((data) => data.password === data.password2, {
  message: "Les deux mots de passe ne correspondent pas.",
  path: ["password2"],
});

type CreateClientFormValues = z.infer<typeof createSchema>;
type EditClientFormValues = z.infer<typeof baseSchema>;

type ClientFormValues = CreateClientFormValues & EditClientFormValues;

interface ClientFormProps {
  client: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ClientForm = ({ client, onSuccess, onCancel }: ClientFormProps) => {
  const { authAxios } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isCreate = client.id === 0;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(isCreate ? createSchema : baseSchema),
    defaultValues: {
      username: client.username || '',
      email: client.email || '',
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      phone_number: client.phone_number || client.profile?.phone_number || '',
      password: isCreate ? 'Ecar2025$' : '',
      password2: isCreate ? 'Ecar2025$' : '',
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (isCreate) {
        await authAxios.post('api/v1/register/', {
          json: {
            username: values.username,
            email: values.email,
            first_name: values.first_name,
            last_name: values.last_name,
            phone_number: values.phone_number || null,
            password: values.password,
            password2: values.password2,
          },
        });
      } else {
        await authAxios.put(`api/v1/users/${client.id}/`, {
          json: {
            username: values.username,
            email: values.email,
            first_name: values.first_name,
            last_name: values.last_name,
          },
        });
        const phone = values.phone_number || null;
        if (phone) {
          await authAxios.put(`api/v1/users/${client.id}/profile/`, {
            json: { phone_number: phone },
          });
        }
      }
      onSuccess();
    } catch (e: any) {
      // Gestion avancée des erreurs backend
      let backendErrors = e?.response?.data;
      let foundFieldError = false;
      if (backendErrors && typeof backendErrors === 'object') {
        Object.entries(backendErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && form.setError) {
            foundFieldError = true;
            form.setError(field as keyof ClientFormValues, { type: 'server', message: messages.join(' ') });
          }
        });
      }
      if (!foundFieldError) {
        setError(isCreate ? "Erreur lors de la création du client." : "Erreur lors de la mise à jour du client.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="username" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Nom d'utilisateur</FormLabel>
            <FormControl>
              <input {...field} className="input input-bordered w-full" disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="email" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <input {...field} className="input input-bordered w-full" disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="first_name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Prénom</FormLabel>
            <FormControl>
              <input {...field} className="input input-bordered w-full" disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="last_name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Nom</FormLabel>
            <FormControl>
              <input {...field} className="input input-bordered w-full" disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="phone_number" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Téléphone</FormLabel>
            <FormControl>
              <input {...field} value={field.value ?? ''} className="input input-bordered w-full" disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {isCreate && (
          <>
            <FormField name="password" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <input {...field} type="password" className="input input-bordered w-full" disabled={isSubmitting} autoComplete="new-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="password2" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmation du mot de passe</FormLabel>
                <FormControl>
                  <input {...field} type="password" className="input input-bordered w-full" disabled={isSubmitting} autoComplete="new-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="text-xs text-zinc-500 mt-1">Le mot de passe par défaut est <span className="font-mono bg-zinc-100 px-1 rounded">Ecar2025$</span> (modifiable avant validation).</div>
          </>
        )}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-3 py-1 rounded bg-zinc-200 hover:bg-zinc-300" disabled={isSubmitting}>Annuler</button>
          <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting}>Enregistrer</button>
        </div>
      </form>
    </Form>
  );
}; 