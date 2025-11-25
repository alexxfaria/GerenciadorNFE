import React, { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceFormData } from './types';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import Scanner from './components/Scanner';
import { LayoutDashboard, PlusCircle, AlertTriangle, X, CheckCircle, Info, Download } from 'lucide-react';

const INITIAL_FORM: InvoiceFormData = {
  accessKey: '',
  responsible: '',
  issuer: '',
  totalValue: ''
};

// --- Componentes Internos de UI (Modal e Toast) ---

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
        <div className="p-5 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex gap-3 flex-col sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
            onClick={onConfirm}
          >
            Confirmar
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;

  return (
    <div className={`fixed top-4 left-4 right-4 z-[70] md:left-auto md:w-96 flex items-center p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out translate-y-0 ${colors[type]}`}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
};

// --- App Principal ---

export default function App() {
  // State for persistent data
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('invoice_app_data');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // State for Form
  const [formData, setFormData] = useState<InvoiceFormData>(INITIAL_FORM);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const lastFetchedCnpj = useRef<string>('');
  
  // UI State
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // UI Helpers State
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => {} });

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('invoice_app_data', JSON.stringify(invoices));
  }, [invoices]);

  // Install Prompt Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const showToast = (message: string, type: 'success'|'error'|'info') => {
    setToast({ message, type });
  };

  // Função para buscar dados do CNPJ na ReceitaWS (JSONP)
  const fetchIssuerData = async (cnpj: string) => {
    if (isLoadingData) return;

    setIsLoadingData(true);
    setFormData(prev => ({ ...prev, issuer: '' }));

    try {
      const data: any = await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'jsonp_receitaws_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        (window as any)[callbackName] = (response: any) => {
          delete (window as any)[callbackName];
          if (document.body.contains(script)) {
             document.body.removeChild(script);
          }
          resolve(response);
        };
        
        script.src = `https://www.receitaws.com.br/v1/cnpj/${cnpj}?callback=${callbackName}`;
        
        script.onerror = () => {
          delete (window as any)[callbackName];
          if (document.body.contains(script)) {
             document.body.removeChild(script);
          }
          reject(new Error('Erro de conexão com ReceitaWS'));
        };
        
        document.body.appendChild(script);
      });
      
      if (data.status === "OK" || data.nome) {
        let nomeCompleto = data.nome || data.fantasia;
        if (nomeCompleto && nomeCompleto === nomeCompleto.toUpperCase()) {
            nomeCompleto = nomeCompleto.replace(/\w\S*/g, (w: string) => (w.replace(/^\w/, (c) => c.toUpperCase())));
        }
        const localizacao = data.municipio ? ` - ${data.municipio}/${data.uf}` : '';
        const identificacaoFinal = `${nomeCompleto}${localizacao}`;
        
        setFormData(prev => ({
          ...prev,
          issuer: identificacaoFinal
        }));
      } else {
        setFormData(prev => ({ ...prev, issuer: 'CNPJ não encontrado na ReceitaWS' }));
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, issuer: 'Erro ao consultar empresa' }));
    } finally {
      setIsLoadingData(false);
    }
  };

  // Efeito Inteligente: Monitora a chave de acesso
  useEffect(() => {
    const cleanKey = formData.accessKey.replace(/\D/g, '');
    if (cleanKey.length === 44) {
      const cnpj = cleanKey.substring(6, 20);
      if (cnpj !== lastFetchedCnpj.current) {
          lastFetchedCnpj.current = cnpj;
          fetchIssuerData(cnpj);
      }
    } else if (cleanKey.length < 44) {
        lastFetchedCnpj.current = '';
    }
  }, [formData.accessKey]);

  // Handle Scan Result
  const handleScanSuccess = (decodedText: string) => {
    let key = decodedText;
    let extractedValue = '';

    if (decodedText.includes('http') || decodedText.includes('|')) {
        const matchKey = decodedText.match(/\b\d{44}\b/);
        if (matchKey) {
            key = matchKey[0];
        } else {
            const possibleKey = decodedText.split(/[\?|&|=]/).find(part => /^\d{44}$/.test(part));
            if (possibleKey) key = possibleKey || '';
        }

        try {
          const decodedUrl = decodeURIComponent(decodedText);
          const parts = decodedUrl.split('|');
          if (parts.length > 2) {
             for (const p of parts) {
                if (/^\d+\.\d{2}$/.test(p)) {
                    extractedValue = p;
                    break;
                }
             }
          }
        } catch (e) {
          console.log('Erro ao tentar extrair valor');
        }
    }
    
    setFormData(prev => {
        const isNewKey = prev.accessKey !== key;
        return { 
          ...prev, 
          accessKey: key,
          issuer: isNewKey ? '' : prev.issuer,
          totalValue: extractedValue || prev.totalValue 
        };
    });
    
    setShowScanner(false);
    showToast('Código lido com sucesso!', 'success');
    
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  };

  const handleSave = () => {
    if (!formData.accessKey || !formData.totalValue) {
        showToast('Preencha os campos obrigatórios', 'error');
        return;
    }

    // REGRA DE DUPLICIDADE: Verifica se a chave já existe
    const keyExists = invoices.some(inv => inv.accessKey === formData.accessKey);
    if (keyExists) {
        showToast('Esta nota já foi salva anteriormente!', 'error');
        return;
    }

    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      accessKey: formData.accessKey,
      responsible: formData.responsible,
      issuer: formData.issuer,
      totalValue: parseFloat(formData.totalValue),
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setFormData(INITIAL_FORM);
    lastFetchedCnpj.current = ''; 
    setActiveTab('list');
    showToast('Nota salva com sucesso!', 'success');
  };

  const triggerDelete = (id: string) => {
    setConfirmModal({
        isOpen: true,
        title: 'Excluir Nota',
        message: 'Tem certeza que deseja remover este registro permanentemente?',
        action: () => {
            setInvoices(prev => prev.filter(inv => inv.id !== id));
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            showToast('Nota removida.', 'success');
        }
    });
  };

  const triggerClearAll = () => {
    setConfirmModal({
        isOpen: true,
        title: 'Apagar Tudo',
        message: 'Isso irá limpar todo o histórico de notas salvas. Esta ação não pode ser desfeita.',
        action: () => {
            setInvoices([]);
            setFormData(INITIAL_FORM);
            lastFetchedCnpj.current = '';
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            showToast('Histórico limpo com sucesso.', 'success');
        }
    });
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM);
    lastFetchedCnpj.current = '';
    showToast('Campos reiniciados.', 'info');
  };

  const handleNewInvoice = () => {
    setFormData(INITIAL_FORM);
    lastFetchedCnpj.current = '';
    setActiveTab('form');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-8">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <header className="bg-indigo-700 shadow-lg text-white sticky top-0 z-40 transition-all">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Gerenciador de Notas</h1>
            <p className="text-indigo-200 text-xs md:text-sm mt-1">Scanner de NF-e e NFC-e</p>
          </div>
          
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md animate-pulse"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Instalar App</span>
              <span className="sm:hidden">Instalar</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Tab Navigation (Visible on Mobile) */}
        <div className="flex md:hidden bg-white p-1 rounded-lg shadow-sm mb-4 sticky top-[80px] z-30">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all
              ${activeTab === 'form' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500'}`}
          >
            <PlusCircle size={18} />
            Nova Nota
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all
              ${activeTab === 'list' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500'}`}
          >
            <LayoutDashboard size={18} />
            Lista ({invoices.length})
          </button>
        </div>

        {/* Form View */}
        <div className={`md:block ${activeTab === 'form' ? 'block' : 'hidden'}`}>
          <InvoiceForm 
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onReset={handleResetForm}
            onOpenScanner={() => setShowScanner(true)}
            isLoadingData={isLoadingData}
          />
        </div>

        {/* List View */}
        <div className={`md:block ${activeTab === 'list' ? 'block' : 'hidden'}`}>
          <InvoiceList 
            invoices={invoices} 
            onDelete={triggerDelete}
            onClearAll={triggerClearAll}
            onNewInvoice={handleNewInvoice}
          />
        </div>
      </main>

      {/* Scanner Overlay */}
      {showScanner && (
        <Scanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}