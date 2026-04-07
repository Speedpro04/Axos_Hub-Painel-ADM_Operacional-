const EVOLUTION_API_URL = 'https://evoapi.axoshub.com'
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = 'axos-evoapi'

async function evolutionRequest(method: string, endpoint: string, body?: any) {
  const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(`Evolution API error: ${response.statusText}`)
  return response.json()
}

export const evolutionApi = {
  // Enviar mensagem
  sendText: async (phone: string, message: string) =>
    evolutionRequest('POST', `/message/sendText/${EVOLUTION_INSTANCE}`, {
      number: phone,
      text: message,
    }),

  // Obter conexões
  getConnection: async () =>
    evolutionRequest('GET', `/instance/connectionState/${EVOLUTION_INSTANCE}`),

  // Iniciar instância
  createInstance: async () =>
    evolutionRequest('POST', '/instance/create', {
      instanceName: EVOLUTION_INSTANCE,
    }),
}
