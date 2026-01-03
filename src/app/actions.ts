// @/app/actions.ts
"use server"; // Transformado em um módulo de servidor seguro

// ATENÇÃO: Estas funções agora rodam no SERVIDOR.
// O navegador do cliente não tem mais acesso direto ao webhook.

// Função para sanitizar input, agora no servidor.
function sanitizeInput(input: unknown, maxLength = 500): string {
    if (!input) return '';
    const str = String(input);
    return str.substring(0, maxLength);
}

// Função para validar CNPJ, agora no servidor.
function isValidCNPJ(cnpj: string): boolean {
    const sanitized = cnpj.replace(/[^\d]/g, '');
    return /^\d{14}$/.test(sanitized);
}

// A URL agora é lida de uma variável de ambiente no servidor, não fica exposta no cliente.
const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.grupoom.com.br/webhook/submit';

export interface PIData {
    success: boolean;
    cliente?: string;
    campanha?: string;
    produto?: string;
    periodo?: string;
    veiculo?: string;
    meio?: string;
    error?: string;
}

export interface PIInfo {
    n_pi: string;
}

export interface PIsResponse {
    success: boolean;
    pis?: PIInfo[];
    error?: string;
}

export async function fetchPIsByCNPJ(cnpj: string): Promise<PIsResponse> {
    const rawCnpj = sanitizeInput(cnpj, 18);
    if (!isValidCNPJ(rawCnpj)) {
        return { success: false, error: "Formato de CNPJ inválido. Use 14 números." };
    }
    const sanitizedCNPJ = rawCnpj.replace(/[^\d]/g, '');

    try {
        const payload = {
            action: 'buscar_pis_por_cnpj',
            cnpj: sanitizedCNPJ,
        };

        // Esta chamada fetch agora acontece de servidor para servidor.
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // O AbortSignal não é mais necessário da mesma forma no servidor, mas mantemos um timeout razoável.
            signal: AbortSignal.timeout(15000), 
        });

        if (!response.ok) {
            console.error("Erro na comunicação servidor-servidor com n8n (fetchPIsByCNPJ):", { status: response.status, statusText: response.statusText });
            return { success: false, error: 'Erro de comunicação com o sistema de PIs. Tente novamente mais tarde.' };
        }
        
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Erro na Server Action fetchPIsByCNPJ:", error);
        if (error instanceof Error && error.name === 'AbortError') {
             return { success: false, error: 'A busca pelos dados demorou muito e foi cancelada.' };
        }
        return { success: false, error: 'Ocorreu um erro interno ao buscar as PIs.' };
    }
}


export async function fetchPIData(pi: string): Promise<PIData> {
    const sanitizedPI = String(pi).trim();
    if (!sanitizedPI) {
        return { success: false, error: "Número da PI não pode ser vazio." };
    }

    try {
        const payload = {
            action: 'buscar_pi',
            n_pi: sanitizedPI,
        };

        // Esta chamada fetch agora acontece de servidor para servidor.
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            console.error("Erro na comunicação servidor-servidor com n8n (fetchPIData):", { status: response.status, statusText: response.statusText });
            return { success: false, error: 'Erro de comunicação com o sistema de dados da PI.' };
        }
        
        const data = await response.json();

        if (data.success) {
            let meioFinal = data.meio || '';
            const palavrasChaveME = [
                'outdoor', 'mub', 'busdoor', 'taxidoor', 'painel', 'placa', 
                'frontlight', 'backlight', 'empena', 'topo', 'lateral', 
                'fachada', 'billboard', 'testeira', 'totem', 'abrigo', 
                'relogio', 'mobiliario urbano'
            ];
            const veiculoLower = (data.veiculo || '').toLowerCase();
            const isMidiaExterna = palavrasChaveME.some(termo => veiculoLower.includes(termo));
            
            if (isMidiaExterna && !meioFinal) {
                meioFinal = 'ME';
            }
            data.meio = meioFinal;
        }

        return data;

    } catch (error) {
        console.error("Erro na Server Action fetchPIData:", error);
        if (error instanceof Error && error.name === 'AbortError') {
             return { success: false, error: 'A busca pelos dados demorou muito e foi cancelada.' };
        }
        return { success: false, error: 'Ocorreu um erro interno ao buscar os dados da PI.' };
    }
}
