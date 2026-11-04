import { useEffect, useState } from 'react';
import { db, type Client } from '../database/db';
import { createId } from '../services/id';

export type ClientProfile = Pick<Client, 'name' | 'level' | 'criticalities' | 'notes' | 'sex' | 'birthDate' | 'age' | 'weightKg' | 'measurementsByMonth'>;

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);

  async function loadClients() {
    const storedClients = await db.clients.orderBy('createdAt').reverse().toArray();
    setClients(storedClients);
  }

  useEffect(() => {
    void loadClients();
  }, []);

  async function saveClient(profile: ClientProfile, id?: string) {
    const name = profile.name.trim();
    if (!name) throw new Error('Inserisci il nome del cliente.');

    if (id) {
      const updated = await db.clients.update(id, { ...profile, name });
      if (!updated) throw new Error('Cliente non trovato.');
    } else {
      await db.clients.add({
        ...profile,
        id: createId('client'),
        name,
        archived: false,
        createdAt: new Date().toISOString(),
      });
    }
    await loadClients();
  }

  async function archiveClient(id: string) {
    await db.clients.where('id').equals(id).modify((client) => {
      client.archived = !client.archived;
    });
    await loadClients();
  }

  async function deleteClient(id: string) {
    const confirmed = window.confirm('Eliminare definitivamente questo cliente?');
    if (!confirmed) return;

    await db.clients.delete(id);
    await loadClients();
  }

  return { clients, saveClient, archiveClient, deleteClient };
}
