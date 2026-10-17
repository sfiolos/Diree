import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readReferti, writeReferti, findReferto } from './storage.ts'
import { extractFromPdf } from './scrape.ts'
import type { RefertiFile, Referto } from '../src/types.ts'

const app = express()
const PORT = Number(process.env.PORT ?? 4000)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

app.use(cors())
app.use(express.json({ limit: '10mb' }))

function now(): string {
  return new Date().toISOString()
}

function stripTimestamps(referto: Referto): Omit<Referto, 'created_at' | 'updated_at'> {
  const { created_at: _created, updated_at: _updated, ...rest } = referto
  return rest
}

app.get('/api/referti', (_req, res) => {
  res.json(readReferti().referti)
})

app.get('/api/referti/:id', (req, res) => {
  const referto = findReferto(req.params.id)
  if (!referto) {
    res.status(404).json({ error: 'Referto non trovato' })
    return
  }
  res.json(referto)
})

app.post('/api/referti', (req, res) => {
  const body = req.body as Partial<Referto>
  const referto: Referto = {
    ...(body as Referto),
    id: randomUUID(),
    created_at: now(),
    updated_at: now(),
  }
  const file = readReferti()
  file.referti.push(referto)
  writeReferti(file)
  res.status(201).json(referto)
})

app.put('/api/referti/:id', (req, res) => {
  const file = readReferti()
  const idx = file.referti.findIndex((r) => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ error: 'Referto non trovato' })
    return
  }
  const updated: Referto = {
    ...file.referti[idx],
    ...stripTimestamps(req.body as Referto),
    updated_at: now(),
  }
  file.referti[idx] = updated
  writeReferti(file)
  res.json(updated)
})

app.delete('/api/referti/:id', (req, res) => {
  const file = readReferti()
  const next = file.referti.filter((r) => r.id !== req.params.id)
  if (next.length === file.referti.length) {
    res.status(404).json({ error: 'Referto non trovato' })
    return
  }
  file.referti = next
  writeReferti(file)
  res.status(204).send()
})

app.post('/api/scrape', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nessun PDF allegato' })
    return
  }
  try {
    const result = await extractFromPdf(req.file.buffer)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Impossibile estrarre il PDF' })
  }
})

app.post('/api/scrape/batch', upload.array('pdfs', 20), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  if (files.length === 0) {
    res.status(400).json({ error: 'Nessun PDF allegato' })
    return
  }

  const file = readReferti()
  const created: Referto[] = []
  const exists = (r: Referto) =>
    [...file.referti, ...created].some(
      (x) => x.data === r.data && x.squadra_di_casa === r.squadra_di_casa && x.squadra_ospite === r.squadra_ospite,
    )

  const results: Array<{ filename: string; status: 'created' | 'duplicate' | 'failed'; referto?: Referto; error?: string }> = []

  for (const f of files) {
    try {
      const scraped = await extractFromPdf(f.buffer)
      const referto: Referto = {
        categoria: scraped.categoria ?? '',
        girone: scraped.girone ?? '',
        stagione: scraped.stagione ?? '',
        squadra_di_casa: scraped.squadra_di_casa ?? '',
        squadra_ospite: scraped.squadra_ospite ?? '',
        data: scraped.data ?? '',
        orario: scraped.orario ?? '',
        localita: scraped.localita ?? '',
        gol_casa: scraped.gol_casa ?? 0,
        gol_ospite: scraped.gol_ospite ?? 0,
        rigori_casa: scraped.rigori_casa ?? null,
        rigori_ospite: scraped.rigori_ospite ?? null,
        penalty_shootout: scraped.penalty_shootout ?? false,
        recupero_1t: scraped.recupero_1t ?? '',
        recupero_2t: scraped.recupero_2t ?? '',
        goals: scraped.goals ?? [],
        sostituzioni: scraped.sostituzioni ?? [],
        sanzioni: scraped.sanzioni ?? [],
        id: randomUUID(),
        created_at: now(),
        updated_at: now(),
      }
      if (exists(referto)) {
        results.push({ filename: f.originalname, status: 'duplicate' })
      } else {
        created.push(referto)
        results.push({ filename: f.originalname, status: 'created', referto })
      }
    } catch {
      results.push({ filename: f.originalname, status: 'failed', error: 'Impossibile estrarre il PDF' })
    }
  }

  if (created.length > 0) {
    file.referti.push(...created)
    writeReferti(file)
  }

  res.json({ results })
})

app.post('/api/backup', upload.single('backup'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nessun file di backup allegato' })
    return
  }
  let parsed: Partial<RefertiFile>
  try {
    parsed = JSON.parse(req.file.buffer.toString('utf8')) as Partial<RefertiFile>
  } catch {
    res.status(400).json({ error: 'Il file di backup non è un JSON valido' })
    return
  }
  if (!Array.isArray(parsed.referti)) {
    res.status(400).json({ error: 'Il file di backup non contiene una lista «referti» valida' })
    return
  }
  const file: RefertiFile = { version: parsed.version ?? '1.0.0', referti: parsed.referti }
  writeReferti(file)
  res.json({ restored: file.referti.length })
})

app.get('/api/backup', (_req, res) => {
  const file = readReferti()
  const date = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Disposition', `attachment; filename="diree-backup-${date}.json"`)
  res.json(file)
})

// Serve the built frontend (dist/) when present, so `npm run build && npm start`
// runs the whole app as a single local process.
const DIST_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(DIST_DIR, 'index.html'))
  })
}

// JSON error responses (multer errors, malformed bodies, …) instead of HTML stack traces.
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(err)
    return
  }
  console.error(err)
  const errStatus = typeof err === 'object' && err !== null && 'statusCode' in err ? Number(err.statusCode) : 0
  const isClientError =
    errStatus === 400 || err instanceof SyntaxError || (err instanceof Error && err.name === 'MulterError')
  res.status(isClientError ? 400 : 500).json({
    error: isClientError ? 'Richiesta non valida' : 'Errore interno del server',
  })
})

app.listen(PORT, () => {
  console.log(`Backend in ascolto su http://localhost:${PORT}`)
  if (existsSync(DIST_DIR)) {
    console.log(`Frontend servito da ${DIST_DIR}`)
  } else {
    console.log('Cartella dist/ assente: esegui «npm run build» per servire anche il frontend.')
  }
})