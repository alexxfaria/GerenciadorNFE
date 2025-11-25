import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, QrCode, Barcode } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

type ScanMode = 'QR' | 'BARCODE';

const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('QR');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef<boolean>(false);

  useEffect(() => {
    // ID do elemento DOM onde a câmera será renderizada
    const elementId = "reader";
    let isMounted = true;

    const startScanner = async () => {
      // Se já estiver rodando, para antes de reiniciar (importante para troca de modo)
      if (scannerRef.current && isRunningRef.current) {
        try {
            await scannerRef.current.stop();
            isRunningRef.current = false;
        } catch (e) {
            console.warn("Erro ao parar scanner anterior", e);
        }
      }

      try {
        // Define formatos baseados no modo escolhido
        // Separar os formatos melhora MUITO a performance e precisão
        const formatsToSupport = scanMode === 'QR' 
            ? [Html5QrcodeSupportedFormats.QR_CODE]
            : [
                Html5QrcodeSupportedFormats.CODE_128, // Principal para Chave de Acesso
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.ITF,
                Html5QrcodeSupportedFormats.CODE_39
              ];

        // Se a instância não existir ou foi limpa, recria
        if (!scannerRef.current) {
             scannerRef.current = new Html5Qrcode(elementId, false);
        }

        // Configurações da câmera otimizadas por modo
        const config = {
            fps: 10,
            qrbox: scanMode === 'QR' 
                ? { width: 250, height: 250 } // Quadrado para QR
                : { width: 300, height: 150 }, // Retangular para Barras
            aspectRatio: 1.0,
            formatsToSupport: formatsToSupport,
            // experimentalFeatures: {
            //     useBarCodeDetectorIfSupported: true
            // }
        };

        // Inicia a câmera
        await scannerRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                if (isMounted) {
                     // Sucesso
                     if (scannerRef.current && isRunningRef.current) {
                        scannerRef.current.stop().then(() => {
                            isRunningRef.current = false;
                            scannerRef.current?.clear();
                            onScanSuccess(decodedText);
                        }).catch(err => {
                            // Force success even on stop error
                            onScanSuccess(decodedText);
                        });
                     }
                }
            },
            (errorMessage) => {
                // Ignora erros de frame
            }
        );
        
        isRunningRef.current = true;
        setError(null);

      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
        if (isMounted) {
            setError("Não foi possível acessar a câmera. Tente recarregar a página.");
        }
      }
    };

    // Pequeno delay para garantir renderização do DOM
    const timer = setTimeout(() => {
        startScanner();
    }, 300);

    return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scannerRef.current && isRunningRef.current) {
            scannerRef.current.stop()
                .then(() => {
                    isRunningRef.current = false;
                    scannerRef.current?.clear();
                })
                .catch(err => console.error("Falha no cleanup", err));
        }
    };
  }, [scanMode, onScanSuccess]); // Recarrega quando scanMode muda

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header com Botão Fechar */}
        <div className="p-3 bg-gray-100 border-b flex justify-between items-center shrink-0">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Scanner</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Seletor de Modo */}
        <div className="bg-white p-2 flex justify-center gap-2 border-b border-gray-100 shrink-0">
            <button 
                onClick={() => setScanMode('QR')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    scanMode === 'QR' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                <QrCode size={18} />
                QR Code
            </button>
            <button 
                onClick={() => setScanMode('BARCODE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    scanMode === 'BARCODE' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                <Barcode size={18} />
                Cód. Barras
            </button>
        </div>
        
        {/* Área da Câmera */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
            {error ? (
                <div className="text-white text-center p-6 max-w-xs">
                    <p className="mb-2 text-red-400 font-semibold">Erro</p>
                    <p className="text-sm text-gray-300">{error}</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200">
                        Fechar
                    </button>
                </div>
            ) : (
                <div id="reader" className="w-full h-full"></div>
            )}
        </div>
        
        {/* Instruções */}
        <div className="p-4 bg-white text-center shrink-0 border-t border-gray-100">
             <p className="text-sm text-gray-500">
                {scanMode === 'QR' 
                    ? 'Aponte para o QR Code quadrado (NFC-e).' 
                    : 'Aponte para o Código de Barras longo da Chave de Acesso (NF-e).'}
            </p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;