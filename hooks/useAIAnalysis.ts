import { useState } from 'react'
import { analyzeSymptoms, summarizeMedicalNotes } from '../geminiService'
import { handleError } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export const useAIAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false)

  const runSymptomAnalysis = async (symptoms: string, _patientId: string) => {
    if (!symptoms) return null
    setIsProcessing(true)

    try {
      const result = await analyzeSymptoms(symptoms)

      if (result.isUrgent) {
        toast.error('🚨 ALERTA DE URGÊNCIA: Caso crítico detectado pela IA.', {
          duration: 6000,
          position: 'top-center',
          style: { borderRadius: '16px', fontWeight: '600' }
        })
      } else {
        toast.success('Análise de triagem IA concluída.')
      }

      return result
    } catch (error) {
      handleError(error, 'useAIAnalysis.runSymptomAnalysis')
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const runMedicalSummary = async (notes: string, _patientId: string) => {
    if (!notes) return null
    setIsProcessing(true)

    try {
      const summary = await summarizeMedicalNotes(notes)
      toast.success('Resumo clínico gerado com sucesso.')
      return summary
    } catch (error) {
      handleError(error, 'useAIAnalysis.runMedicalSummary')
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    runSymptomAnalysis,
    runMedicalSummary,
    isProcessing
  }
}
