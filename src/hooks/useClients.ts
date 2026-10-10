import { useEffect, useState } from 'react';
import { db, type Client } from '../database/db';
import { createId } from '../services/id';

type UseClientsResult = {
  clients: Client[];
  name: string;
  notes: string;
  setName: (name: string) => void;
  setNotes: (notes: string) => void;
  addClient: () => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
};

export function useClients(): UseClientsResult {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  async function loadClients() {
    const storedClients = await db.clients.orderBy('createdAt').reverse().toArray();
    setClients(storedClients);
  }

  useEffect(() => {
    void loadClients();
  }, []);

  async function addClient() {
    const normalizedName = name.trim();
    if (!normalizedName) return;

    const now = new Date().toISOString();
    await db.clients.add({
      id: createId('client'),
      name: normalizedName,
      notes: notes.trim() || undefined,
      archived: false,
      createdAt: now,
    });

    setName('');
    setNotes('');
    await loadClients();
  }

  async function archiveClient(id: string) {
    const client = await db.clients.get(id);
    if (!client) return;

    await db.clients.update(id, { archived: !client.archived });
    await loadClients();
  }

  async function deleteClient(id: string) {
    const confirmed = window.confirm('Eliminare definitivamente questo cliente?');
    if (!confirmed) return;

    await db.clients.delete(id);
    await loadClients();
  }

  return {
    clients,
    name,
    notes,
    setName,
    setNotes,
    addClient,
    archiveClient,
    deleteClient,
  };
}
