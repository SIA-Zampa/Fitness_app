import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { db, type CatalogOption } from '../../database/db';
import { intensityTechniques, movementTypes } from '../../models/workoutOptions';
import { createId } from '../../services/id';

export function CatalogOptionsManager() {
  const [items, setItems] = useState<CatalogOption[]>([]);
  const [kind, setKind] = useState<'movement' | 'technique'>('movement');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [listVersion, setListVersion] = useState(0);

  async function reload() {
    setItems(await db.catalogOptions.orderBy('name').toArray());
  }

  useEffect(() => { void reload(); }, []);

  async function add() {
    const normalized = name.trim();
    const defaults = kind === 'movement' ? movementTypes : intensityTechniques;
    if (!normalized) { setStatus('Inserisci un nome.'); return; }
    if ([...defaults, ...items.filter((item) => item.kind === kind).map((item) => item.name)]
      .some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
      setStatus('Questa voce esiste gia.');
      return;
    }
    await db.catalogOptions.add({ id: createId('option'), kind, name: normalized });
    setName('');
    setStatus('Voce salvata.');
    await reload();
    setListVersion((version) => version + 1);
  }

  async function remove(item: { id?: string; name: string }) {
    if (!window.confirm(`Eliminare "${item.name}" dai menu? Le schede gia compilate resteranno invariate.`)) return;
    if (item.id) {
      await db.catalogOptions.delete(item.id);
    } else {
      await db.catalogOptions.add({ id: createId('option'), kind, name: item.name, hidden: true });
    }
    await reload();
  }

  async function restore(id: string) {
    await db.catalogOptions.delete(id);
    await reload();
  }

  const defaults = kind === 'movement' ? movementTypes : intensityTechniques;
  const hidden = items.filter((item) => item.kind === kind && item.hidden);
  const visibleDefaults = defaults.filter((name) => !hidden.some((item) => item.name === name));
  const custom = items.filter((item) => item.kind === kind && !item.hidden);

  return <div className="catalog-manager">
    <h3>Movimenti e tecniche personalizzati</h3>
    <div className="form-grid">
      <label><span>Categoria</span><select value={kind} onChange={(event) => setKind(event.target.value as 'movement' | 'technique')}><option value="movement">Tipo di movimento</option><option value="technique">Tecnica di intensita</option></select></label>
      <label><span>Nuova voce</span><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void add(); }} /></label>
    </div>
    <Button onClick={() => void add()}>Aggiungi voce</Button>
    {status && <p className="form-status">{status}</p>}
    <details key={`${listVersion}-${kind}`} className="exercise-group">
      <summary><strong>Gestisci voci</strong></summary>
      <div className="entity-list catalog-options-list">
        {visibleDefaults.map((name) => <div className="entity-row" key={name}><span>{name}</span><Button variant="ghost" onClick={() => void remove({ name })}>Elimina</Button></div>)}
        {custom.map((item) => <div className="entity-row" key={item.id}><span>{item.name}</span><Button variant="ghost" onClick={() => void remove(item)}>Elimina</Button></div>)}
        {hidden.length > 0 && <h4>Voci nascoste</h4>}
        {hidden.map((item) => <div className="entity-row" key={item.id}><span>{item.name}</span><Button variant="ghost" onClick={() => void restore(item.id)}>Ripristina</Button></div>)}
      </div>
    </details>
  </div>;
}
