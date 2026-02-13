
import { useState } from 'react';
import { analyzeSymptoms, summarizeMedicalNotes } from '../geminiService';
import { useAxosStore } from '../store';
import { handleError } from '../utils/errorHandler';
import toast from 'react-hot-toast';

export const useAIAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { syncToN8N } = useAxosStore();

  const runSymptomAnalysis = async (symptoms: string, patientId: string) => {
    if (!symptoms) return null;
    setIsProcessing(true);
    
    try {
      const result = await analyzeSymptoms(symptoms);
      
      // Log de auditoria via n8n
      syncToN8N('/ai-log', {
        patientId,
        type: 'symptom_analysis',
        input: symptoms,
        output: result.reasoning,
        isUrgent: result.isUrgent
      }).catch(console.warn);

      if (result.isUrgent) {
        toast.error('🚨 ALERTA DE URGÊNCIA: Caso crítico detectado pela IA.', {
          duration: 6000,
          position: 'top-center',
          style: { borderRadius: '16px', fontWeight: '600' }
        });
      } else {
        toast.success('Análise de triagem IA concluída.');
      }

      return result;
    } catch (error) {
      handleError(error, 'useAIAnalysis.runSymptomAnalysis');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const runMedicalSummary = async (notes: string, patientId: string) => {
    if (!notes) return null;
    setIsProcessing(true);

    try {
      const summary = await summarizeMedicalNotes(notes);
      
      syncToN8N('/ai-log', {
        patientId,
        type: 'medical_summary',
        input: notes.substring(0, 100) + '...',
        output: summary
      }).catch(console.warn);

      toast.success('Resumo clínico gerado com sucesso.');
      return summary;
    } catch (error) {
      handleError(error, 'useAIAnalysis.runMedicalSummary');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    runSymptomAnalysis,
    runMedicalSummary,
    isProcessing
  };
};
