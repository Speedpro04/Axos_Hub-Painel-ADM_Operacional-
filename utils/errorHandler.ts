
import toast from 'react-hot-toast';

export class AxosError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'AxosError';
  }
}

export const handleError = async (error: unknown, context: string) => {
  const err = error instanceof AxosError 
    ? error 
    : new AxosError(
        error instanceof Error ? error.message : 'Erro inesperado no sistema',
        'GENERIC_ERROR',
        'medium'
      );

  console.error(`[Axos Hub - ${context}]`, err);

  // Exibe mensagem amigável baseada na gravidade
  const messages = {
    low: 'Pequena inconsistência detectada.',
    medium: 'Ocorreu um problema. Tente novamente.',
    high: 'Erro importante. Recomendamos recarregar o painel.',
    critical: '🚨 Erro crítico. Contate o suporte Axos Hub.'
  };

  toast.error(messages[err.severity]);
  
  // Aqui poderia ser feito o log para n8n se houver URL configurada
};
