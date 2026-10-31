import { Button } from '../../components/Button/Button';
import { useClients } from '../../hooks/useClients';

export function ClientManager() {
  const clients = useClients();

  return (
    <section className="manager-panel" aria-label="Gestione clienti">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">IndexedDB</p>
          <h2>Gestione clienti</h2>
        </div>
        <span>{clients.clients.length} clienti</span>
      </div>

      <div className="form-grid">
        <label>
          <span>Nome visualizzato</span>
          <input
            value={clients.name}
            onChange={(event) => clients.setName(event.target.value)}
            placeholder="Es. Marco"
          />
        </label>

        <label>
          <span>Note</span>
          <input
            value={clients.notes}
            onChange={(event) => clients.setNotes(event.target.value)}
            placeholder="Obiettivo, preferenze, limitazioni"
          />
        </label>
      </div>
      <label className="full-field">
        <span>Sesso per la scheda</span>
        <select value={clients.sex} onChange={(event) => clients.setSex(event.target.value as 'F' | 'M' | '')}>
          <option value="">Non indicato</option>
          <option value="F">Femminile</option>
          <option value="M">Maschile</option>
        </select>
      </label>

      <Button onClick={() => void clients.addClient()}>Aggiungi cliente</Button>

      <div className="entity-list">
        {clients.clients.length === 0 ? (
          <p className="empty-copy">Nessun cliente salvato.</p>
        ) : (
          clients.clients.map((client) => (
            <article key={client.id} className="entity-row">
              <div>
                <strong>{client.name}</strong>
                <p>{client.notes || 'Nessuna nota'}</p>
                <small>ID: {client.id}</small>
                <label>
                  <span>Sesso</span>
                  <select value={client.sex ?? ''} onChange={(event) => void clients.updateSex(client.id, event.target.value as 'F' | 'M' | '')}>
                    <option value="">Non indicato</option>
                    <option value="F">Femminile</option>
                    <option value="M">Maschile</option>
                  </select>
                </label>
              </div>
              <div className="row-actions">
                <Button variant="ghost" onClick={() => void clients.archiveClient(client.id)}>
                  {client.archived ? 'Riattiva' : 'Archivia'}
                </Button>
                <Button variant="ghost" onClick={() => void clients.deleteClient(client.id)}>
                  Elimina
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
