'use client'

import { useState } from 'react'
import UploadForm from './upload-form'

// Tipagem da PI que vem da API
interface PiData {
  id: string
  n_pi: string
  // ... quaisquer outros campos que a API de PIs retorne
}

export default function CnpjForm() {
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [pis, setPis] = useState<PiData[]>([])
  const [selectedPi, setSelectedPi] = useState<PiData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCnpjChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCnpj = e.target.value
    setCnpj(newCnpj)
    setError('')
    setPis([])
    setSelectedPi(null)
    setRazaoSocial('')

    if (newCnpj.length === 14) {
      setIsLoading(true)
      try {
        // 1. Busca dados do CNPJ na API interna (que chama a BrasilAPI)
        const cnpjRes = await fetch(`/api/cnpj?cnpj=${newCnpj}`)
        if (!cnpjRes.ok) throw new Error('CNPJ inválido ou não encontrado')
        const cnpjData = await cnpjRes.json()
        setRazaoSocial(cnpjData.razao_social || cnpjData.nome_fantasia || 'Empresa não identificada')

        // 2. Busca as PIs no n8n através da API interna
        const pisRes = await fetch(`/api/pis?cnpj=${newCnpj}`)
        if (!pisRes.ok) throw new Error('Nenhuma PI encontrada para este CNPJ')
        const pisData = await pisRes.json()
        if (pisData.length === 0) throw new Error('Nenhuma PI disponível para este CNPJ')
        
        setPis(pisData)

      } catch (err: any) {
        setError(err.message)
        setRazaoSocial('')
        setPis([])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePiSelection = (piId: string) => {
    const pi = pis.find((p) => p.id === piId)
    if (pi) {
      setSelectedPi(pi)
    }
  }

  // Se uma PI foi selecionada, mostra o formulário de upload
  if (selectedPi) {
    return <UploadForm pi={selectedPi} />
  }

  return (
    <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center">Consulta de PI</h1>
      <div className="space-y-2">
        <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ do Veículo</label>
        <input
          type="text"
          id="cnpj"
          value={cnpj}
          onChange={handleCnpjChange}
          maxLength={14}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="Digite os 14 dígitos do CNPJ"
        />
        {razaoSocial && <p className="text-sm text-gray-600 mt-2"><strong>Razão Social:</strong> {razaoSocial}</p>}
      </div>

      {isLoading && <p className="text-center">Buscando...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {pis.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Selecione a PI</h2>
          <ul className="space-y-2">
            {pis.map((pi) => (
              <li key={pi.id}>
                <button
                  onClick={() => handlePiSelection(pi.id)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border"
                >
                  {pi.n_pi}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
