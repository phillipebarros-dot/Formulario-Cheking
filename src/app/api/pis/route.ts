import { NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL as string

// Rota para buscar as PIs no n8n a partir de um CNPJ
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cnpj = searchParams.get('cnpj')

  if (!cnpj) {
    return NextResponse.json({ error: 'CNPJ não fornecido' }, { status: 400 })
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buscar_pis_cnpj', cnpj }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erro no webhook n8n')
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: `Falha na comunicação com o n8n: ${error.message}` },
      { status: 500 }
    )
  }
}