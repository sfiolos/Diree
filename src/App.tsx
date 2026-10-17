import { useCallback, useEffect, useState } from 'react'
import type { Referto } from './types.ts'
import { listReferti } from './api.ts'
import Navbar, { type NavTab } from './components/Navbar.tsx'
import List from './components/List.tsx'
import PdfImport from './components/PdfImport.tsx'

function App() {
  const [tab, setTab] = useState<NavTab>('add')
  const [referti, setReferti] = useState<Referto[]>([])

  const load = useCallback(async () => {
    try {
      setReferti(await listReferti())
    } catch {
      setReferti([])
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return (
    <div className="app">
      <Navbar tab={tab} onChange={setTab} />
      <div className="container-fluid px-3 px-md-4 pt-4 pb-5">
        {tab === 'add' ? (
          <PdfImport onImported={load} />
        ) : (
          <List referti={referti} onChanged={load} />
        )}
      </div>
    </div>
  )
}

export default App