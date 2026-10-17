# Diree

Diario personale per arbitri di calcio: tieni traccia dei referti delle partite dirette, con statistiche e importazione automatica da PDF.

Tutto resta **in locale**: i dati vivono in un file JSON sul tuo computer, nessun account, nessun server, nessuna dipendenza da servizi esterni. Cloni, avvii, usi.

---

## Funzionalità

- **Referto per partita**: inserimento a mano di tutto il necessario — categoria, risultato, gol, sostituzioni, sanzioni
- **Importazione PDF**: carica uno o più referti PDF generati da Sinfonia4you e la app pre-compila i campi; tu revisioni e confermi (i duplicati vengono riconosciuti)
- **Elenco e dettaglio**: lista filtrabile per categoria, squadra e intervallo di date, con vista dettaglio e modifica
- **Statistiche**: gol, cartellini e motivi di sanzione, calcolati sulle partite selezionate
- **Esporta CSV**: esporta la lista visualizzata (rispetta i filtri attivi) per fogli di calcolo
- **Backup JSON**: scarica un backup completo di tutti i dati e ripristinalo quando vuoi

---

## Requisiti

- [Node.js](https://nodejs.org/) 20 o superiore (include `npm`)

Verifica con:

```bash
node -v   # deve restituire v20.x o superiore
```

---

## Installazione e avvio

```bash
git clone https://github.com/sfiolos/Diree.git
cd Diree
npm install
npm run dev
```

Poi apri **http://localhost:5173** nel browser.

`npm run dev` avvia due processi con un solo comando: il backend Node (porta 4000) e il frontend Vite (porta 5173, con proxy sulle API).

### Modalità produzione (opzionale)

Per far girare tutto con un solo processo e una sola porta:

```bash
npm run build
npm start
```

L'app è disponibile su **http://localhost:4000**.

---

## I tuoi dati

- I referti vengono salvati in **`data/referti.json`**, accanto al progetto.
- La cartella `data/` è nel `.gitignore`: i tuoi dati **non finiranno mai nel repository**.
- Al primo avvio il file viene creato automaticamente — non serve configurare nulla.
- **Backup**: dal tab «Le mie partite», premi «Backup JSON» per scaricare una copia completa. «Ripristina backup» ricarica quel file (sovrascrive i dati attuali, con conferma).
- Per spostarti su un altro computer, copia `data/referti.json` — è l'unico file che conta. Puoi anche copiarlo a mano invece di usare l'esportazione.

> ⚠️ Non essendoci cloud, il backup è la tua unica rete di sicurezza. Scarica periodicamente il JSON.

---

## Struttura del progetto

```
Diree/
├── src/                 Frontend React + TypeScript (Vite)
│   ├── components/      Form, lista, dettaglio, statistiche, import PDF
│   └── lib/             Statistiche, esportazione CSV
├── server/
│   ├── server.ts        Backend Express: API referti, scrape, backup
│   ├── storage.ts       Lettura/scrittura di data/referti.json
│   └── scrape.ts        Estrazione dei campi dai PDF (pdf-parse)
└── data/referti.json    I tuoi dati (creato al primo avvio, non nel repo)
```

### API

| Endpoint | Descrizione |
|---|---|
| `GET /api/referti` | Lista completa |
| `GET /api/referti/:id` | Un singolo referto |
| `POST /api/referti` | Crea |
| `PUT /api/referti/:id` | Modifica |
| `DELETE /api/referti/:id` | Elimina |
| `POST /api/scrape` | Estrae i campi da un PDF (non salva nulla) |
| `POST /api/scrape/batch` | Estrazione multipla con rilevamento duplicati |
| `GET /api/backup` | Scarica il backup JSON completo |
| `POST /api/backup` | Ripristina un backup JSON |

---

## Sviluppo

```bash
npm run lint    # controlli ESLint
npm run build   # type-check + build di produzione
```

Stack: React 19 · TypeScript · Vite · Express · pdf-parse · Bootstrap 5. Storage: un singolo file JSON, nessun database.

---

## Licenza

[MIT](LICENSE)
