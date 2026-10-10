# Fitness App

PWA React + TypeScript + Vite per la gestione offline-first di schede di allenamento tra personal trainer e clienti.

## Fase corrente

Fase 3: database locale IndexedDB.

Sono predisposti:

- React + TypeScript + Vite.
- Struttura modulare iniziale.
- Supporto PWA con `vite-plugin-pwa`.
- Dexie/IndexedDB predisposto per le fasi successive.
- Prima interfaccia responsive orientata smartphone.
- Tema chiaro, scuro e automatico con salvataggio locale.
- Scelta Personal Trainer / Cliente con salvataggio locale.
- Schermata Impostazioni con cambio modalita.
- Impostazioni sincronizzate con IndexedDB tramite Dexie.
- Libreria iniziale esercizi salvata nel database locale.
- Filtro gruppo muscolare e ricerca nome nella libreria esercizi.
- Creazione clienti essenziali con ID univoco.
- Archiviazione ed eliminazione clienti con conferma.
- Creazione esercizi personalizzati salvati in IndexedDB.
- Creazione schede con cliente associato e giorni configurabili.
- Archivio schede iniziale con duplicazione ed eliminazione.
- Assegnazione esercizi ai giorni con serie, ripetizioni, recupero, note e ordine.
- Area Personal Trainer organizzata in sezioni separate.
- Filtro gruppo muscolare durante l'assegnazione esercizi alla scheda.
- Esportazione scheda in JSON con estensione `.fitscheda`.
- Importazione scheda in modalita Cliente con validazione formato.
- Visualizzazione cliente di scheda, giorni ed esercizi.
- Registrazione allenamento cliente con peso, ripetizioni e serie completate.
- Storico allenamenti cliente con dettaglio serie salvate.
- Storico raggruppato per gruppo muscolare ed esercizio.
- Area Cliente organizzata in sezioni separate.
- Timer recupero con avvio, pausa, ripresa e azzeramento.

## Comandi

```bash
npm install
npm run dev
npm run build
```

## Password area Personal Trainer

L'accesso all'area Personal Trainer richiede una password configurata dal proprietario dell'app.

La password non viene salvata in chiaro: l'app usa un hash SHA-256 configurato tramite variabile:

```bash
VITE_TRAINER_PASSWORD_HASH=hash_sha256_della_password
```

Per lo sviluppo locale crea un file `.env.local` copiando `.env.example` e inserendo l'hash.

## Pubblicazione GitHub Pages

1. Crea un repository GitHub, per esempio `fitness-app`.
2. Carica questo progetto nel repository.
3. Da GitHub apri `Settings > Pages`.
4. In `Build and deployment`, seleziona `GitHub Actions`.
5. Fai push sul branch `main`.
6. Attendi il workflow `Deploy PWA to GitHub Pages`.
7. Apri l'indirizzo pubblicato da GitHub Pages.

La PWA viene generata nella cartella `dist/` e pubblicata come sito statico HTTPS.

## Architettura

Il progetto non usa backend, server applicativi, MySQL o database remoti. I dati saranno salvati localmente nel browser tramite IndexedDB.

## Prossima fase

Prossimo passo: migliorare modifica/riordino schede ed esportazione progressi.
