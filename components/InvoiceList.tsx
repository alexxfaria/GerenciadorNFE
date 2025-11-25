import React from 'react';
import { Invoice } from '../types';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Trash2, Clock, DollarSign, Plus } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNewInvoice: () => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onDelete, onClearAll, onNewInvoice }) => {
  
  const handleExport = () => {
    if (invoices.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(invoices.map(inv => ({
      "Data Criação": new Date(inv.createdAt).toLocaleString('pt-BR'),
      "Chave de Acesso": inv.accessKey,
      "Responsável": inv.responsible,
      "Emissora": inv.issuer,
      "Valor Total": inv.totalValue
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notas");
    
    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `notas_export_${dateStr}.xlsx`);
  };

  const totalSum = invoices.reduce((acc, curr) => acc + curr.totalValue, 0);

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center animate-in fade-in duration-300">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
          <FileSpreadsheet size={24} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Nenhuma nota salva</h3>
        <p className="mt-1 text-sm text-gray-500">A lista está limpa no momento.</p>
        <button
            onClick={onNewInvoice}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
            <Plus size={18} className="mr-2" />
            Começar Nova Nota
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Notas Salvas ({invoices.length})</h2>
          <p className="text-indigo-600 font-semibold mt-1">
             Total Acumulado: {totalSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={onNewInvoice}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus size={16} className="mr-2" />
            Nova
          </button>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Exportar
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onClearAll();
            }}
            title="Apagar todas as notas"
            className="flex-none inline-flex items-center justify-center px-3 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 size={16} className="mr-2" />
            <span>Apagar Tudo</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chave
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-mono text-gray-900 truncate max-w-[120px] sm:max-w-[200px]" title={invoice.accessKey}>
                      {invoice.accessKey}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock size={10} className="mr-1" />
                      {new Date(invoice.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{invoice.issuer}</div>
                    <div className="text-sm text-gray-500">{invoice.responsible}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 flex items-center">
                      <DollarSign size={12} className="mr-1 text-gray-400" />
                      {invoice.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete(invoice.id);
                      }}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir nota"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;