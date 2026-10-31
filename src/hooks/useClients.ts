import { useEffect, useState } from 'react';
import { db, type Client } from '../database/db';
import { createId } from '../services/id';

type UseClientsResult = {
  clients: Client[];
  name: string;
  notes: string;
  sex: 'F' | 'M' | '';
  setName: (name: string) => void;
  setNotes: (notes: string) => void;
  setSex: (sex: 'F' | 'M' | '') => void;
  addClient: () => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateSex: (id: string, sex: 'F' | 'M' | '') => Promise<void>;
};

export function useClients(): UseClientsResult {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [sex, setSex] = useState<'F' | 'M' | ''>('');

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
      sex,
      notes: notes.trim() || undefined,
      archived: false,
      createdAt: now,
    });

    setName('');
    setNotes('');
    setSex('');
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

  async function updateSex(id: string, value: 'F' | 'M' | '') {
    await db.clients.update(id, { sex: value });
    await loadClients();
  }

  return {
    clients,
    name,
    notes,
    sex,
    setName,
    setNotes,
    setSex,
    addClient,
    archiveClient,
    deleteClient,
    updateSex,
  };
}
