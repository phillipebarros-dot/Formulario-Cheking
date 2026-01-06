import { NextResponse } from 'next/server'

const N8N_WEBHOOK_URL_SEND = process.env.N8N_WEBHOOK_URL_SEND as string

// Rota para enviar os dados do formulário de checking para o n8n
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const response = await fetch(N8N_WEBHOOK_URL_SEND, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro no servidor n8n.' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Falha no envio: ${error.message}` },
      { status: 500 }
    )
  }
}