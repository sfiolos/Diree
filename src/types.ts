export interface Goal {
  nome_squadra: string
  squadra_casa: boolean
  tempo: string
  minuto: string
  rigore: boolean
}

export interface Sostituzione {
  nome_squadra: string
  squadra_casa: boolean
  tempo: string
  minuto: string
  esce_numero: string
  entra_numero: string
  esce_nome: string
  entra_nome: string
}

export interface Sanzione {
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

export interface Referto {
  id: string
  categoria: string
  girone: string
  stagione: string
  squadra_di_casa: string
  squadra_ospite: string
  data: string
  orario: string
  localita: string
  gol_casa: number
  gol_ospite: number
  rigori_casa: number | null
  rigori_ospite: number | null
  penalty_shootout: boolean
  recupero_1t: string
  recupero_2t: string
  created_at: string
  updated_at: string
  goals: Goal[]
  sostituzioni: Sostituzione[]
  sanzioni: Sanzione[]
}

export interface RefertiFile {
  version: string
  referti: Referto[]
}