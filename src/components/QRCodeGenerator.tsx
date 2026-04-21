import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, Printer, X } from 'lucide-react';
import html2canvas from 'html2canvas';

interface QRCodeGeneratorProps {
  assetTag: string;
  assetName: string;
  onClose: () => void;
}

export default function QRCodeGenerator({ assetTag, assetName, onClose }: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current);
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${assetTag}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !qrRef.current) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${assetTag}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #FFFFFF; }
            .label { margin-top: 20px; text-align: center; }
            .tag { font-size: 24px; font-weight: 800; color: #111827; }
            .name { font-size: 16px; color: #4B5563; }
          </style>
        </head>
        <body>
          ${qrRef.current.innerHTML}
          <div class="label">
            <div class="tag">${assetTag}</div>
            <div class="name">${assetName}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Asset QR Tag</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center">
          <div 
            ref={qrRef}
            className="p-8 rounded-3xl"
            style={{ 
              backgroundColor: '#FFFFFF', 
              border: '2px dashed #E5E7EB' 
            }}
          >
            <QRCode 
              value={assetTag}
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>
          
          <div className="mt-6 text-center">
            <p 
              className="text-2xl font-black tracking-tight"
              style={{ color: '#111827' }}
            >
              {assetTag}
            </p>
            <p 
              className="text-sm font-medium"
              style={{ color: '#6B7280' }}
            >
              {assetName}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full mt-10">
            <button 
              onClick={downloadQR}
              className="flex items-center justify-center space-x-2 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
            <button 
              onClick={printQR}
              className="flex items-center justify-center space-x-2 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all active:scale-95"
            >
              <Printer className="w-5 h-5" />
              <span>Print Label</span>
            </button>
          </div>
          
          <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            Scan this tag with the Faned Fleet mobile app to instantly access asset records
          </p>
        </div>
      </div>
    </div>
  );
}
