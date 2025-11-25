import React from 'react';
import { InvoiceFormData } from '../types';
import { Scan, Save, RotateCcw, Loader2 } from 'lucide-react';

interface InvoiceFormProps {
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  onSave: () => void;
  onReset: () => void;
  onOpenScanner: () => void;
  isLoadingData?: boolean;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  formData, 
  setFormData, 
  onSave, 
  onReset,
  onOpenScanner,
  isLoadingData = false
}) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.accessKey && formData.issuer && formData.responsible && formData.totalValue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Nova Leitura</h2>
        <button 
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          title="Limpar formulário para nova leitura"
        >
          <RotateCcw size={14} />
          Reiniciar Campos
        </button>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Access Key Field with Scanner Trigger */}
        <div className="space-y-1">
          <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700">
            Chave de Acesso / Código
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="accessKey"
              name="accessKey"
              value={formData.accessKey}
              onChange={handleChange}
              placeholder="Escaneie ou digite a chave..."
              className="flex-1 block w-full rounded-lg border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              onClick={onOpenScanner}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Scan size={20} className="mr-2" />
              Ler
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {formData.accessKey.length > 0 ? `${formData.accessKey.length} caracteres` : 'Geralmente 44 dígitos para NF-e'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">
              Observação / Responsável
            </label>
            <input
              type="text"
              id="responsible"
              name="responsible"
              value={formData.responsible}
              onChange={handleChange}
              placeholder="Quem recebeu?"
              className="block w-full rounded-lg border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="space-y-1 relative">
            <label htmlFor="issuer" className="block text-sm font-medium text-gray-700 flex justify-between">
              Emissora da Nota
              {isLoadingData && (
                 <span className="text-xs text-indigo-600 flex items-center animate-pulse">
                    <Loader2 size={12} className="mr-1 animate-spin" /> Buscando dados...
                 </span>
              )}
            </label>
            <input
              type="text"
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              placeholder={isLoadingData ? "Buscando..." : "Nome da empresa/loja"}
              readOnly={isLoadingData}
              className={`block w-full rounded-lg border border-gray-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${isLoadingData ? 'bg-gray-50 text-gray-500' : ''}`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="totalValue" className="block text-sm font-medium text-gray-700">
            Valor Total (R$)
          </label>
          <input
            type="number"
            id="totalValue"
            name="totalValue"
            value={formData.totalValue}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="block w-full rounded-lg border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="text-xs text-gray-400">
            Se não preencheu automaticamente, verifique o cupom.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={onSave}
            disabled={!isFormValid || isLoadingData}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors
              ${isFormValid && !isLoadingData
                ? 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500' 
                : 'bg-gray-300 cursor-not-allowed'}`}
          >
            <Save size={20} className="mr-2" />
            Salvar Nota
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
