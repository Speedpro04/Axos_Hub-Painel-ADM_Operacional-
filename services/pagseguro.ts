// Servico PagBank (PagSeguro) via Supabase
// Os pagamentos sao geridos na tabela 'pagamentos' do Supabase
// A criacao do QR Code/checkout e feita via webhook/trigger no backend

import { supabase } from './supabase'

export interface PaymentRequest {
  clienteId: string
  valor: number
  descricao: string
}

export interface PaymentResult {
  id: string
  qrCodeText: string
  qrCodeUrl: string
  status: string
  pagBankOrderId: string
  expiresAt: string
}

export async function createPayment({
  clienteId,
  valor,
}: PaymentRequest): Promise<PaymentResult | null> {
  // Insere registro de pagamento pendente
  const { data, error } = await supabase
    .from('pagamentos')
    .insert({
      cliente_id: clienteId,
      valor,
      status: 'pendente',
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar pagamento:', error.message)
    return null
  }

  // Se o registro ja tem QR code (gerado por trigger/webhook do PagBank)
  return {
    id: data.id,
    qrCodeText: data.pagbank_qr_code_text || '',
    qrCodeUrl: data.pagbank_qr_code_image_url || '',
    status: data.status,
    pagBankOrderId: data.pagbank_order_id || '',
    expiresAt: data.pagbank_expires_at || '',
  }
}

// Verifica status de um pagamento
export async function checkPaymentStatus(paymentId: string): Promise<string> {
  const { data, error } = await supabase
    .from('pagamentos')
    .select('status, pagbank_status')
    .eq('id', paymentId)
    .single()

  if (error) return 'unknown'
  return data.pagbank_status || data.status || 'unknown'
}

// Lista pagamentos de um cliente
export async function getCustomerPayments(clienteId: string) {
  const { data, error } = await supabase
    .from('pagamentos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })

  if (error) return []
  return data
}
