'use client'

import { useState, useEffect } from 'react'

// Tipagens de dados
interface PiData {
  id: string
  n_pi: string
}

interface PiDetails {
    n_pi: string
    cliente: string
    cnpj: string
    campanha: string
    produto: string
    periodo: string
    veiculo: string
    meio: string
    checking_count: number
    can_submit: boolean
    is_complement: boolean
    message: string
}

interface UploadFormProps {
  pi: PiData
}

// ===================================================================
// COMPONENTE PRINCIPAL DO FORMULÁRIO DE UPLOAD
// ===================================================================
export default function UploadForm({ pi }: UploadFormProps) {
  const [details, setDetails] = useState<PiDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Efeito para buscar os detalhes da PI na nossa API interna
  useEffect(() => {
    async function fetchPiDetails() {
      setIsLoading(true)
      try {
        // A rota da API interna chama o webhook n8n para pegar o status da PI
        const response = await fetch(`/api/pis?n_pi=${pi.n_pi}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Não foi possível obter os detalhes da PI.')
        }

        setDetails(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPiDetails()
  }, [pi.n_pi])

  // Renderização de estados
  if (isLoading) return <div className="text-center p-8">Buscando dados da PI...</div>
  if (error) return <div className="text-center p-8 text-red-600">Erro: {error}</div>
  if (!details) return null // Caso não haja detalhes

  // Se não for possível enviar (bloqueado pelo n8n)
  if (!details.can_submit) {
    return (
      <div className="text-center p-8 bg-red-50 border-l-4 border-red-500">
        <h2 className="text-xl font-bold text-red-800">Envio Bloqueado</h2>
        <p className="text-red-700 mt-2">{details.message}</p>
      </div>
    )
  }

  // Se for possível enviar, renderiza o formulário de submissão
  return <CheckingSubmitForm piDetails={details} />
}

// ===================================================================
// COMPONENTE INTERNO DO FORMULÁRIO DE ENVIO
// ===================================================================
interface CheckingSubmitFormProps {
  piDetails: PiDetails
}

function CheckingSubmitForm({ piDetails }: CheckingSubmitFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [urlFotoPerto, setUrlFotoPerto] = useState('')
  const [urlFotoLonge, setUrlFotoLonge] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string } | null>(null)

  const isOOH = piDetails.meio === 'ME'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validação básica no frontend
    if (files.length === 0 || !nome || !email) {
      setSubmissionStatus({ success: false, message: 'Por favor, preencha nome, email e selecione ao menos um arquivo.' })
      return
    }

    setIsSubmitting(true)
    setSubmissionStatus(null)

    const formData = new FormData()
    // Adiciona todos os dados da PI e do formulário
    Object.entries(piDetails).forEach(([key, value]) => formData.append(key, String(value)))
    formData.append('nome', nome)
    formData.append('email', email)
    formData.append('telefone', telefone)
    formData.append('observacoes', observacoes)
    formData.append('is_complemento', String(piDetails.is_complement))
    if (isOOH) {
        formData.append('url_foto_perto', urlFotoPerto)
        formData.append('url_foto_longe', urlFotoLonge)
    }
    files.forEach(file => formData.append('files', file))

    try {
      const response = await fetch('/api/send', { method: 'POST', body: formData })
      const result = await response.json()
      setSubmissionStatus(result)
      if (!response.ok) throw new Error(result.message)
    } catch (error: any) {
      setSubmissionStatus({ success: false, message: error.message || 'Ocorreu um erro inesperado.' })
    }
    setIsSubmitting(false)
  }

  if (submissionStatus?.success) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Envio Concluído!</h2>
        <p>{submissionStatus.message}</p>
        <button onClick={() => window.location.reload()} className="mt-6 inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90">
          Realizar Novo Checking
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
            <h2 className="text-xl font-bold">Checking para PI: {piDetails.n_pi}</h2>
            <p className="text-sm text-gray-500">{piDetails.cliente}</p>
            {piDetails.is_complement && (
                <p className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md">⚠️ Este envio será um <strong>COMPLEMENTO</strong>.</p>
            )}
        </div>

        <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-medium">Seus Dados</h3>
            <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                <input type="tel" id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
            </div>
        </div>

        {isOOH && (
            <div className="space-y-4 rounded-md border p-4">
                <h3 className="font-medium">Fotos de Mídia Externa (OOH)</h3>
                <div>
                    <label htmlFor="urlFotoPerto" className="block text-sm font-medium">URL da Foto de Perto</label>
                    <input type="url" id="urlFotoPerto" value={urlFotoPerto} onChange={(e) => setUrlFotoPerto(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="https://..." />
                </div>
                <div>
                    <label htmlFor="urlFotoLonge" className="block text-sm font-medium">URL da Foto de Longe</label>
                    <input type="url" id="urlFotoLonge" value={urlFotoLonge} onChange={(e) => setUrlFotoLonge(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="https://..." />
                </div>
            </div>
        )}

        <div>
            <label htmlFor="observacoes" className="block text-sm font-medium">Observações</label>
            <textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
        </div>

        <div>
            <label className="block text-sm font-medium">Arquivos de Comprovação</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                 <input id="file-upload" type="file" multiple onChange={handleFileChange} className="sr-only" />
                 <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">Carregar arquivos</label>
            </div>
        </div>
        
        {files.length > 0 && <div> {files.length} arquivos selecionados </div>}
        {submissionStatus && !submissionStatus.success && <p className="text-sm text-red-600">{submissionStatus.message}</p>}

        <button type="submit" disabled={isSubmitting || files.length === 0} className="w-full inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50">
            {isSubmitting ? 'Enviando...' : 'Enviar Comprovante'}
        </button>
    </form>
  )
}
