import { PDFParse } from 'pdf-parse'

export interface ScrapedReferto {
  categoria?: string
  girone?: string
  stagione?: string
  squadra_di_casa?: string
  squadra_ospite?: string
  data?: string
  orario?: string
  localita?: string
  gol_casa?: number
  gol_ospite?: number
  rigori_casa?: number | null
  rigori_ospite?: number | null
  penalty_shootout?: boolean
  recupero_1t?: string
  recupero_2t?: string
  goals?: ScrapedGoal[]
  sostituzioni?: ScrapedSostituzione[]
  sanzioni?: ScrapedSanzione[]
}

export interface ScrapedGoal {
  nome_squadra: string
  squadra_casa: boolean
  tempo: string
  minuto: string
  rigore: boolean
}

export interface ScrapedSostituzione {
  nome_squadra: string
  squadra_casa: boolean
  tempo: string
  minuto: string
  esce_numero: string
  entra_numero: string
  esce_nome: string
  entra_nome: string
}

export interface ScrapedSanzione {
  ammonizione: boolean
  nome_: string
  numero: string
  motivo_macro: string
  motivo_micro: string
  nome_squadra: string
  squadra_casa: boolean
  tempo: string
  minuto: string
  tipo_soggetto: string
}

export async function extractFromPdf(buffer: Buffer): Promise<ScrapedReferto> {
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  return parseText(result.text)
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function sectionName(line: string): string | null {
  const t = line.trim()
  if (t.startsWith('DURATA DELLA GARA')) return 'durata'
  if (t === 'RISULTATO E RETI SEGNATE') return 'risultato'
  if (t === 'TIRI DI RIGORE') return 'rigori'
  if (t === 'SOSTITUZIONI') return 'sostituzioni'
  if (t === 'AMMONIZIONE CALCIATORI') return 'amm_gioc'
  if (t === 'AMMONIZIONE DIRIGENTI') return 'amm_dir'
  if (t === 'ESPULSIONE CALCIATORI') return 'esp_gioc'
  if (t === 'ESPULSIONE DIRIGENTI') return 'esp_dir'
  return null
}

function section(lines: string[], name: string): string[] {
  const start = lines.findIndex((l) => sectionName(l) === name)
  if (start < 0) return []
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (sectionName(lines[i]) !== null) {
      end = i
      break
    }
  }
  return lines.slice(start + 1, end)
}

function normalizeMinute(raw: string): string {
  const m = raw.match(/(\d+)(?:\s*\+\s*(\d+))?/)
  if (!m) return raw.trim()
  return m[3] ? `${m[1]}+${m[3]}` : m[1]
}

function normalizeTempo(raw: string): string {
  const m = raw.match(/^(\d+)\s*Tempo\s+(Regolamentare|Supplementare)/i)
  if (m) return m[2].toLowerCase().startsWith('regolamentare') ? `${m[1]}T` : `TS${m[1]}`
  return raw.trim()
}

// Convert extracted text (typically uppercase from the PDF) to sentence case,
// keeping the first letter of the whole text and of each pipe-separated phrase.
function sentenceCase(text: string): string {
  return text
    .toLowerCase()
    .split('|')
    .map((part) => part.trim())
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' | ')
}

function normalizeDate(ddmmYY: string): string {
  const parts = ddmmYY.split('/')
  if (parts.length !== 3) return ddmmYY
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

function seasonFromDate(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})/)
  if (!m) return ''
  const year = Number(m[1])
  const month = Number(m[2])
  const start = month >= 8 ? year : year - 1
  return `${start}/${start + 1}`
}

// ---------------------------------------------------------------------------
// Section parsers
// ---------------------------------------------------------------------------

function parseHeader(
  lines: string[],
): {
  categoria: string
  girone: string
  squadra_di_casa: string
  squadra_ospite: string
  data: string
  orario: string
  localita: string
} {
  const out: ReturnType<typeof parseHeader> = {
    categoria: '',
    girone: '',
    squadra_di_casa: '',
    squadra_ospite: '',
    data: '',
    orario: '',
    localita: '',
  }

  const camp = lines.find((l) => l.startsWith('CAMPIONATO '))
  if (camp) {
    const cm = camp.match(/^CAMPIONATO\s+(.+?)\s+GIRONE\s+(\S+)\s*$/i)
    if (cm) {
      out.categoria = sentenceCase(cm[1].trim())
      out.girone = sentenceCase(cm[2].trim())
    } else {
      out.categoria = sentenceCase(camp.replace(/^CAMPIONATO\s+/i, '').trim())
    }
  }

  const gara = lines.find((l) => l.startsWith('GARA '))
  if (gara) {
    const after = gara.replace(/^GARA\s+/i, '')
    const dataIdx = after.indexOf(' DATA ')
    const dataMatch = after.match(/\sDATA\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+ORARIO\s+(\d{1,2}:\d{2})/)
    if (dataIdx >= 0) {
      const teamsPart = after.slice(0, dataIdx)
      const parts = teamsPart.split(' - ')
      out.squadra_di_casa = sentenceCase(parts[0]?.trim() ?? '')
      out.squadra_ospite = sentenceCase(parts[1]?.trim() ?? '')
    }
    if (dataMatch) {
      out.data = normalizeDate(dataMatch[1])
      out.orario = dataMatch[2]
    }
  }

  const impianto = lines.find((l) => l.startsWith('IMPIANTO '))
  if (impianto) {
    const lm = impianto.match(/LOCALITA\s+(.+?)\s*$/i)
    if (lm) out.localita = sentenceCase(lm[1].trim())
  }

  return out
}

function extractGoals(line: string, team: string, isHome: boolean): ScrapedGoal[] {
  const out: ScrapedGoal[] = []
  const re = /\[([^\]]+)\]\s*([0-9]+)(?:\s*\+\s*([0-9]+))?\s*'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    const after = line.slice(re.lastIndex)
    const rigore = /^\s*\((R|rig\.)\)/i.test(after)
    out.push({
      nome_squadra: sentenceCase(team),
      squadra_casa: isHome,
      tempo: m[1],
      minuto: m[3] ? `${m[2]}+${m[3]}` : m[2],
      rigore,
    })
  }
  return out
}

function parseResults(lines: string[], homeName: string, awayName: string): ScrapedReferto {
  const sl = section(lines, 'risultato')
  const hasDtr = sl.some((l) => /\(d\.t\.r\.\)/i.test(l))

  const nameIdx = (name: string) =>
    sl.findIndex((l) => l === name || l.startsWith(`${name} `))

  const hi = nameIdx(homeName)
  const ai = nameIdx(awayName)

  const goals: ScrapedGoal[] = []

  const parseTeam = (idx: number, isHome: boolean): number => {
    const nameLine = sl[idx] ?? ''
    const trailing = nameLine.match(/(\d+)\s*$/)
    let gol = 0
    if (trailing) {
      gol = Number(trailing[1])
    } else {
      const prev = sl[idx - 1]?.trim() ?? ''
      if (/^\d+$/.test(prev)) gol = Number(prev)
    }
    const end = isHome ? ai : sl.length
    for (let j = idx + 1; j < end; j++) {
      if (sl[j].includes('[')) goals.push(...extractGoals(sl[j], nameLine.replace(/\s*\d+\s*$/, '').trim(), isHome))
    }
    return gol
  }

  return {
    gol_casa: hi >= 0 ? parseTeam(hi, true) : 0,
    gol_ospite: ai >= 0 ? parseTeam(ai, false) : 0,
    penalty_shootout: hasDtr,
    goals,
  }
}

function parseTiriDiRigore(lines: string[], homeName: string, awayName: string): Pick<ScrapedReferto, 'rigori_casa' | 'rigori_ospite'> {
  const sl = section(lines, 'rigori')
  const count = (name: string): number => {
    const l = sl.find((x) => x === name || x.startsWith(`${name} `))
    return l ? (l.match(/S/g) ?? []).length : 0
  }
  return { rigori_casa: count(homeName), rigori_ospite: count(awayName) }
}

function parseDurata(lines: string[]): Pick<ScrapedReferto, 'recupero_1t' | 'recupero_2t'> {
  const sl = section(lines, 'durata')
  let half = ''
  let recupero_1t = ''
  let recupero_2t = ''
  for (const l of sl) {
    const hm = l.match(/^(\d)\s*Tempo\s+Regolamentare/i)
    if (hm) half = hm[1]
    if (/Recupero Indicato|Tempo Aggiuntivo/i.test(l)) {
      const mm = l.match(/(\d+)\s*'/)
      if (mm && half) {
        const v = `${mm[1]}'`
        if (half === '1') recupero_1t = v
        else if (half === '2') recupero_2t = v
      }
    }
  }
  return { recupero_1t, recupero_2t }
}

function parseSostituzioni(lines: string[], homeName: string): ScrapedSostituzione[] {
  const sl = section(lines, 'sostituzioni')
  const out: ScrapedSostituzione[] = []
  let team = ''
  for (const l of sl) {
    if (/^(TEMPO|MINUTO|ESCE|ENTRA)/.test(l)) continue
    const m = l.match(/^(.*?)\s+(\d+(?:\s*\+\s*(\d+))?)'\s+(.+)$/)
    if (m) {
      const parts = m[4].trim().match(/^(\d+)\s*-\s*(.*?)\s+(\d+)\s*-\s*(.*)$/)
      if (parts) {
        out.push({
          nome_squadra: sentenceCase(team),
          squadra_casa: team === homeName,
          tempo: normalizeTempo(m[1]),
          minuto: normalizeMinute(m[2] + (m[3] ? `+${m[3]}` : '')),
          esce_numero: parts[1],
          esce_nome: sentenceCase(parts[2].trim()),
          entra_numero: parts[3],
          entra_nome: sentenceCase(parts[4].trim()),
        })
      }
      continue
    }
    if (l.trim()) team = sentenceCase(l.trim())
  }
  return out
}

function parseSanzioni(sl: string[], homeName: string, ammonizione: boolean): ScrapedSanzione[] {
  const out: ScrapedSanzione[] = []
  let team = ''
  let pending: ScrapedSanzione | null = null
  for (const l of sl) {
    if (/^(TEMPO|MINUTO|NOME)/.test(l)) continue
    if (l.startsWith('[')) {
      const bm = l.match(/\[([^\]]+)\]\s*(.*)$/)
      if (pending) {
        if (!pending.motivo_macro) pending.motivo_macro = sentenceCase((bm?.[1] ?? '').trim())
        const desc = sentenceCase((bm?.[2] ?? '').trim())
        if (desc) pending.motivo_micro += (pending.motivo_micro ? ' | ' : '') + desc
      }
      continue
    }
    const m = l.match(/^(.*?)\s+(\d+(?:\s*\+\s*(\d+))?)'\s+(.+)$/)
    if (m) {
      if (pending) out.push(pending)
      const subject = m[4].trim()
      const sp = subject.match(/^(\d+)\s*-\s*(.+)$/)
      let numero = ''
      let nome: string
      let tipo = 'giocatore'
      if (sp) {
        numero = sp[1]
        nome = sentenceCase(sp[2].trim())
      } else {
        const rp = subject.match(/^(.*?)\s*-\s*(.+)$/)
        nome = sentenceCase(rp ? rp[2].trim() : subject)
        tipo = 'dirigente'
      }
      pending = {
        ammonizione,
        nome_: nome,
        numero,
        motivo_macro: '',
        motivo_micro: '',
        nome_squadra: team,
        squadra_casa: team === homeName,
        tempo: normalizeTempo(m[1]),
        minuto: normalizeMinute(m[2] + (m[3] ? `+${m[3]}` : '')),
        tipo_soggetto: tipo,
      }
      continue
    }
    if (l.trim()) team = sentenceCase(l.trim())
  }
  if (pending) out.push(pending)
  return out
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseText(text: string): ScrapedReferto {
  const lines = text
    .split(/\r?\n|\f/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const header = parseHeader(lines)
  const results = parseResults(lines, header.squadra_di_casa, header.squadra_ospite)
  const durata = parseDurata(lines)

  let rigori: Pick<ScrapedReferto, 'rigori_casa' | 'rigori_ospite'> = {
    rigori_casa: null,
    rigori_ospite: null,
  }
  if (results.penalty_shootout) {
    rigori = parseTiriDiRigore(lines, header.squadra_di_casa, header.squadra_ospite)
  }

  const sostituzioni = parseSostituzioni(lines, header.squadra_di_casa)
  const sanzioni = [
    ...parseSanzioni(section(lines, 'amm_gioc'), header.squadra_di_casa, true),
    ...parseSanzioni(section(lines, 'amm_dir'), header.squadra_di_casa, true),
    ...parseSanzioni(section(lines, 'esp_gioc'), header.squadra_di_casa, false),
    ...parseSanzioni(section(lines, 'esp_dir'), header.squadra_di_casa, false),
  ]

  return {
    ...header,
    stagione: seasonFromDate(header.data),
    ...results,
    ...durata,
    ...rigori,
    sostituzioni,
    sanzioni,
  }
}