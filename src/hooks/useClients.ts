import { useEffect, useState } from 'react';
import { db, type Client } from '../database/db';
import { createId } from '../services/id';

export type ClientProfile = Pick<Client, 'name' | 'level' | 'criticalities' | 'notes' | 'goals' | 'sleepHours' | 'pathologies' | 'lifestyle' | 'trainingDays' | 'sex' | 'birthDate' | 'age' | 'weightKg' | 'measurementsByMonth'>;

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadClients() {
    const storedClients = await db.clients.orderBy('createdAt').reverse().toArray();
    setClients(storedClients);
    setLoading(false);
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
      id = createId('client');
      await db.clients.add({
        ...profile,
        id,
        name,
        archived: false,
        createdAt: new Date().toISOString(),
      });
    }
    await loadClients();
    return id;
  }

  async function archiveClient(id: string) {
    await db.clients.where('id').equals(id).modify((client) => {
      client.archived = !client.archived;
    });
    await loadClients();
  }

  async function deleteClient(id: string) {
    const confirmed = window.confirm('Eliminare definitivamente questo cliente?');
    if (!confirmed) return false;

    await db.clients.delete(id);
    await loadClients();
    return true;
  }

  return { clients, loading, saveClient, archiveClient, deleteClient, reloadClients: loadClients };
}
