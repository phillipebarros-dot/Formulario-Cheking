import { NextResponse } from 'next/server'

// Rota para consultar dados de um CNPJ na API pública BrasilAPI
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cnpj = searchParams.get('cnpj')

  if (!cnpj) {
    return NextResponse.json({ error: 'CNPJ não fornecido' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: `Erro ao buscar CNPJ: ${errorData.message}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    // Retorna apenas os campos que o frontend usava
    return NextResponse.json(
      {
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha na comunicação com a API de CNPJ.' },
      { status: 500 }
    )
  }
}