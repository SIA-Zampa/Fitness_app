# Fitness App

PWA React + TypeScript + Vite per la creazione offline-first di schede di allenamento da parte del personal trainer.

## Fase corrente

Fase 3: database locale IndexedDB.

Sono predisposti:

- React + TypeScript + Vite.
- Struttura modulare iniziale.
- Supporto PWA con `vite-plugin-pwa`.
- Dexie/IndexedDB predisposto per le fasi successive.
- Prima interfaccia responsive orientata smartphone.
- Tema chiaro, scuro e automatico con salvataggio locale.
- Accesso diretto all'area Personal Trainer tramite password configurata.
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
- Esportazione scheda cliente in Excel `.xlsx`, con un solo foglio e tutti i giorni.
- Campi per obiettivo, livello, settimane, trainer, sesso, RIR/RPE, focus e note del giorno.
- Sezioni mobilita, allenamento principale e propriocezione glutei (solo per clienti femminili).
- Campi esercizio per tipo movimento, carico, tecnica intensita, progressione e incremento.
- Menu RIR/RPE, ricerca schede per nome o cliente nell'esportazione, libreria ampliata e cataloghi locali per movimenti e tecniche personalizzati.
- Le vecchie schede e sessioni salvate restano nel database locale, ma la modalita Cliente non e piu accessibile.

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
