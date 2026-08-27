import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { 
  QrCode, Printer, Share2, Copy, ExternalLink, X, Check, 
  Download, Sparkles, Smartphone, Utensils, Soup, Store, Flame, Waves,
  Wifi, MapPin, ChefHat, Layers, Edit3, Image as ImageIcon, Eye
} from 'lucide-react';
import { Settings } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface DailyMenuQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  tenantId?: string;
}

export const DailyMenuQRModal: React.FC<DailyMenuQRModalProps> = ({
  isOpen,
  onClose,
  settings,
  tenantId = 'laslomas',
}) => {
  const [copied, setCopied] = useState(false);
  const [displayTemplate, setDisplayTemplate] = useState<'a5_stand' | 'square_sticker' | 'thermal_ticket'>('a5_stand');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [wifiSsid, setWifiSsid] = useState<string>(settings.wifiNetwork || '');
  const [wifiPass, setWifiPass] = useState<string>(settings.wifiPassword || '');
  const [showConfig, setShowConfig] = useState(false);

  if (!isOpen) return null;

  const isParadero = tenantId === 'paradero' || settings.companyName.toLowerCase().includes('paradero');
  const tenantKey = isParadero ? 'paradero' : 'laslomas';

  // URL del menú del día público
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const menuUrl = `${origin}/menu/${tenantKey}`;

  const basePrice = (settings.dailyMenuPrice && settings.dailyMenuPrice > 0) 
    ? settings.dailyMenuPrice 
    : (isParadero ? 18.00 : 16.00);

  const menuTitle = settings.dailyMenuTitle || (isParadero ? 'Almuerzo Marino Ejecutivo' : 'Almuerzo Criollo & Brasas');
  const menuSubtitle = settings.dailyMenuSubtitle || (isParadero ? 'Chilcano o Causa + Plato Marino + Refresco' : 'Sopa o Entrada + Plato de Fondo + Bebida');
  const phone = settings.whatsappOrdersPhone || settings.phone || '51995881303';
  const logoUrl = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `🍽️ *MENÚ DEL DÍA - ${settings.companyName.toUpperCase()}*\n\n` +
      `✨ *${menuTitle}*\n` +
      `📋 ${menuSubtitle}\n` +
      `💰 Almuerzos desde ${formatMoney(basePrice, settings.currency)}\n\n` +
      `📲 Escanea o ingresa aquí para ver las opciones de hoy:\n${menuUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenBrowser = () => {
    window.open(menuUrl, '_blank');
  };

  // Función de impresión con ventana aislada y diseño profesional 100% vector
  const handlePrint = () => {
    const svgEl = document.getElementById('qr-svg-to-print');
    if (!svgEl) return;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      window.print();
      return;
    }

    const brandName = isParadero ? 'PARADERO 104' : 'LAS LOMAS GRILL';
    const brandSlogan = isParadero ? 'Cevichería & Mariscos' : 'Brasas, Parrillas & Sabor Criollo';
    const primaryColor = isParadero ? '#0369a1' : '#b45309';
    const accentBg = isParadero ? '#0f2d4a' : '#26170d';
    const goldAccent = '#f59e0b';

    let contentHtml = '';

    if (displayTemplate === 'a5_stand') {
      contentHtml = `
        <div class="stand-container a5">
          <div class="stand-border-outer">
            <div class="stand-inner">
              
              <!-- Encabezado de Marca -->
              <div class="header-section">
                <div class="top-badge">✦ CARTA DIGITAL & MENÚ DEL DÍA ✦</div>
                <img class="logo-img" src="${logoUrl}" alt="${brandName}" onerror="this.style.display='none'" />
                <h1 class="brand-title">${brandName}</h1>
                <p class="brand-slogan">${brandSlogan}</p>
              </div>

              <!-- Banner de Menú -->
              <div class="menu-banner">
                <h2 class="menu-title">🍽️ ${menuTitle.toUpperCase()}</h2>
                <p class="menu-desc">${menuSubtitle}</p>
                <div class="price-tag">
                  ALMUERZOS DESDE <strong>${formatMoney(basePrice, settings.currency)}</strong>
                </div>
              </div>

              <!-- Código QR Central -->
              <div class="qr-box">
                <div class="corner c-tl"></div>
                <div class="corner c-tr"></div>
                <div class="corner c-bl"></div>
                <div class="corner c-br"></div>
                <img class="qr-image" src="${svgBase64}" alt="QR Menú del Día" />
                <div class="qr-scan-badge">
                  📷 ESCANEA CON LA CÁMARA DE TU CELULAR
                </div>
              </div>

              <!-- 3 Pasos Fáciles -->
              <div class="steps-grid">
                <div class="step-item">
                  <div class="step-icon">1</div>
                  <div class="step-text"><strong>Apunta y Escanea</strong> con tu celular</div>
                </div>
                <div class="step-item">
                  <div class="step-icon">2</div>
                  <div class="step-text"><strong>Elige tus Platos</strong> de hoy en vivo</div>
                </div>
                <div class="step-item">
                  <div class="step-icon">3</div>
                  <div class="step-text"><strong>Pide al Mozo</strong> o por WhatsApp</div>
                </div>
              </div>

              <!-- Footer Informativo -->
              <div class="footer-info">
                ${tableNumber.trim() ? `<div class="table-badge">📍 MESA: <strong>${tableNumber.toUpperCase()}</strong></div>` : ''}
                ${wifiSsid.trim() ? `<div class="wifi-badge">📶 <strong>WiFi:</strong> ${wifiSsid} ${wifiPass ? `· <strong>Clave:</strong> ${wifiPass}` : ''}</div>` : ''}
                <div class="order-phone">📲 Pedidos & Delivery: <strong>${phone}</strong></div>
              </div>

            </div>
          </div>
        </div>
      `;
    } else if (displayTemplate === 'square_sticker') {
      contentHtml = `
        <div class="stand-container square">
          <div class="square-card">
            <div class="sq-header">
              <img class="sq-logo" src="${logoUrl}" alt="${brandName}" onerror="this.style.display='none'" />
              <div>
                <h2 class="sq-brand">${brandName}</h2>
                <p class="sq-menu-label">🍽️ MENÚ DEL DÍA DE HOY</p>
              </div>
            </div>
            
            <div class="sq-qr-wrap">
              <img class="sq-qr" src="${svgBase64}" alt="QR Menú" />
            </div>

            <div class="sq-badge">
              📷 ESCANEA CON TU CÁMARA
            </div>

            <div class="sq-price">
              Almuerzos desde <strong>${formatMoney(basePrice, settings.currency)}</strong>
            </div>

            ${tableNumber.trim() ? `<div class="sq-table">📍 MESA: ${tableNumber.toUpperCase()}</div>` : ''}
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="stand-container thermal">
          <div class="thermal-box">
            <p class="th-center font-bold">================================</p>
            <h2 class="th-title">${brandName}</h2>
            <p class="th-center">${brandSlogan}</p>
            <p class="th-center font-bold">================================</p>
            <p class="th-badge">*** MENÚ DEL DÍA DE HOY ***</p>
            <p class="th-center">${menuTitle}</p>
            <p class="th-center font-bold">Desde ${formatMoney(basePrice, settings.currency)}</p>
            <br />
            <div class="th-qr-center">
              <img src="${svgBase64}" width="160" height="160" />
            </div>
            <br />
            <p class="th-center font-bold">ESCANEA PARA VER LOS PLATOS</p>
            <p class="th-center text-xs">Entrada + Fondo + Bebida</p>
            ${tableNumber.trim() ? `<p class="th-center font-bold">MESA: ${tableNumber.toUpperCase()}</p>` : ''}
            <p class="th-center font-bold">================================</p>
            <p class="th-center text-xs">Atención en Salón y Delivery: ${phone}</p>
          </div>
        </div>
      `;
    }

    const fullDoc = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Cartel de Mesa QR - ${brandName}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: auto;
            margin: 5mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #1c1917;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* ── ESTILO A5 DISPLAY VERTICAL ── */
          .stand-container.a5 {
            width: 140mm;
            max-width: 520px;
            padding: 4px;
            background: #ffffff;
          }
          .stand-border-outer {
            border: 3px solid ${primaryColor};
            border-radius: 24px;
            padding: 4px;
            background: #faf8f5;
          }
          .stand-inner {
            border: 1.5px dashed ${goldAccent};
            border-radius: 18px;
            padding: 20px 18px;
            text-align: center;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .header-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
          }
          .top-badge {
            font-size: 8.5px;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: ${primaryColor};
            background: #fef3c7;
            padding: 3px 12px;
            border-radius: 20px;
            border: 1px solid #fde68a;
          }
          .logo-img {
            width: 48px;
            height: 48px;
            object-fit: contain;
            margin-top: 4px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #111827;
            text-transform: uppercase;
          }
          .brand-slogan {
            font-size: 10px;
            color: #6b7280;
            font-weight: 700;
          }
          .menu-banner {
            background: ${accentBg};
            color: #ffffff;
            width: 100%;
            border-radius: 16px;
            padding: 10px 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .menu-title {
            font-size: 13px;
            font-weight: 900;
            color: #fbbf24;
            letter-spacing: 0.5px;
          }
          .menu-desc {
            font-size: 9.5px;
            color: #e5e7eb;
            margin-top: 2px;
            font-weight: 600;
          }
          .price-tag {
            display: inline-block;
            margin-top: 6px;
            background: #f59e0b;
            color: #111827;
            font-size: 10px;
            font-weight: 900;
            padding: 3px 12px;
            border-radius: 12px;
          }
          .price-tag strong {
            font-size: 12px;
            color: #000000;
          }
          .qr-box {
            position: relative;
            background: #ffffff;
            padding: 14px;
            border-radius: 20px;
            border: 2px solid #e5e7eb;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-image {
            width: 170px;
            height: 170px;
            display: block;
          }
          .corner {
            position: absolute;
            width: 10px;
            height: 10px;
            border-color: ${goldAccent};
            border-style: solid;
          }
          .c-tl { top: 4px; left: 4px; border-width: 2px 0 0 2px; }
          .c-tr { top: 4px; right: 4px; border-width: 2px 2px 0 0; }
          .c-bl { bottom: 4px; left: 4px; border-width: 0 0 2px 2px; }
          .c-br { bottom: 4px; right: 4px; border-width: 0 2px 2px 0; }
          
          .qr-scan-badge {
            margin-top: 8px;
            font-size: 9px;
            font-weight: 900;
            color: #111827;
            background: #f3f4f6;
            padding: 3px 10px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .steps-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            width: 100%;
            border-top: 1px solid #f3f4f6;
            padding-top: 10px;
          }
          .step-item {
            background: #fafaf9;
            border: 1px solid #e7e5e4;
            border-radius: 12px;
            padding: 6px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }
          .step-icon {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${primaryColor};
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .step-text {
            font-size: 8px;
            color: #44403c;
            line-height: 1.2;
          }
          .step-text strong {
            display: block;
            color: #1c1917;
            font-size: 8.5px;
          }
          .footer-info {
            width: 100%;
            border-top: 1px solid #f3f4f6;
            padding-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 3px;
            font-size: 9px;
            color: #57534e;
          }
          .table-badge {
            font-size: 11px;
            font-weight: 900;
            color: ${primaryColor};
            background: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 2px 8px;
            border-radius: 6px;
            display: inline-block;
            margin: 0 auto;
          }
          .wifi-badge {
            font-size: 8.5px;
            color: #4b5563;
          }
          .order-phone {
            font-size: 8.5px;
            font-weight: 700;
            color: #1f2937;
          }

          /* ── ESTILO STICKER CUADRADO ── */
          .stand-container.square {
            width: 105mm;
            height: 105mm;
            padding: 4px;
          }
          .square-card {
            border: 2.5px solid ${primaryColor};
            border-radius: 20px;
            padding: 14px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            height: 100%;
            text-align: center;
          }
          .sq-header {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .sq-logo {
            width: 32px;
            height: 32px;
            object-fit: contain;
          }
          .sq-brand {
            font-size: 14px;
            font-weight: 900;
            color: #111827;
            text-transform: uppercase;
          }
          .sq-menu-label {
            font-size: 9px;
            font-weight: 800;
            color: ${primaryColor};
          }
          .sq-qr-wrap {
            background: #ffffff;
            padding: 8px;
            border-radius: 14px;
            border: 1.5px solid #e5e7eb;
          }
          .sq-qr {
            width: 140px;
            height: 140px;
            display: block;
          }
          .sq-badge {
            font-size: 8.5px;
            font-weight: 900;
            color: #1f2937;
            background: #fef3c7;
            border: 1px solid #fde68a;
            padding: 3px 10px;
            border-radius: 8px;
          }
          .sq-price {
            font-size: 9.5px;
            color: #4b5563;
          }
          .sq-price strong {
            color: #111827;
            font-size: 11px;
          }
          .sq-table {
            font-size: 9px;
            font-weight: 900;
            color: ${primaryColor};
          }

          /* ── ESTILO TICKET TÉRMICO ── */
          .stand-container.thermal {
            width: 72mm;
            padding: 4px;
            font-family: monospace;
          }
          .thermal-box {
            text-align: center;
            font-size: 11px;
            line-height: 1.3;
          }
          .th-title {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
          }
          .th-badge {
            font-size: 12px;
            font-weight: 900;
            margin: 4px 0;
          }
          .th-center {
            text-align: center;
          }
          .th-qr-center {
            display: flex;
            justify-content: center;
          }
          .font-bold { font-weight: bold; }
          .text-xs { font-size: 9px; }
        </style>
      </head>
      <body>
        ${contentHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 350);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(fullDoc);
    printWindow.document.close();
  };

  // Descarga del PNG del QR en alta calidad
  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-svg-to-print');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 1200;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 100, 100, 1000, 1000);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_MenuDelDia_${tenantKey}_HD.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* SVG Oculto de Alta Definición para Exportación e Impresión */}
      <div className="hidden">
        <QRCode
          id="qr-svg-to-print"
          value={menuUrl}
          size={360}
          level="H"
        />
      </div>

      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[96vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden text-stone-900">
        
        {/* ── HEADER MODAL ── */}
        <div className="p-3.5 sm:p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-xs font-black shrink-0 ${
              isParadero ? 'bg-sky-600 text-white' : 'bg-amber-500 text-stone-950'
            }`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-stone-900 leading-tight flex items-center gap-1.5">
                <span>Diseñador de Carteles QR para Mesas</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  HD
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {settings.companyName || (isParadero ? 'Paradero 104' : 'Las Lomas Grill')} · Menú en Vivo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SELECTOR DE PLANTILLAS DE DISEÑO ── */}
        <div className="bg-stone-100/90 p-2 sm:p-2.5 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Segmented Control con las 3 plantillas */}
          <div className="grid grid-cols-3 gap-1 bg-stone-200/80 p-1 rounded-2xl flex-1">
            <button
              type="button"
              onClick={() => setDisplayTemplate('a5_stand')}
              className={`py-1.5 px-2 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                displayTemplate === 'a5_stand'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Cartel A5</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayTemplate('square_sticker')}
              className={`py-1.5 px-2 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                displayTemplate === 'square_sticker'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Sticker</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayTemplate('thermal_ticket')}
              className={`py-1.5 px-2 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                displayTemplate === 'thermal_ticket'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              <span>Ticket 80mm</span>
            </button>
          </div>

          {/* Botón Personalizar */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 text-xs font-black rounded-xl border transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              showConfig 
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs' 
                : 'bg-white text-stone-700 hover:text-stone-900 border-stone-300 hover:bg-stone-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Ocultar Datos' : 'Personalizar'}</span>
          </button>
        </div>

        {/* ── PANEL DE PERSONALIZACIÓN DESPLEGABLE (MESA, WIFI) ── */}
        {showConfig && (
          <div className="bg-amber-50/50 p-3 border-b border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs shrink-0 animate-in fade-in duration-150">
            <div>
              <label className="font-bold text-stone-700 block mb-1">📍 N° de Mesa (Opcional):</label>
              <input
                type="text"
                placeholder="Ej: Mesa 01, Terraza 4..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">📶 Red WiFi del Local:</label>
              <input
                type="text"
                placeholder="Ej: LasLomas_Clientes"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">🔑 Clave WiFi:</label>
              <input
                type="text"
                placeholder="Ej: lomas2026"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* ── ÁREA DE VISTA PREVIA INTERACTIVA DEL CARTEL ── */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-stone-100/50 flex flex-col items-center justify-center">
          
          {displayTemplate === 'a5_stand' && (
            /* 🌟 VISTA PREVIA: CARTEL VERTICAL A5 PORTAMENÚS */
            <div className="w-full max-w-[340px] bg-white rounded-3xl p-1.5 shadow-xl border-4 border-amber-600/80 animate-in zoom-in-95 duration-200">
              <div className="border border-dashed border-amber-400 rounded-2xl p-4 text-center space-y-3 bg-gradient-to-b from-stone-50 via-white to-amber-50/20">
                
                {/* Header */}
                <div className="space-y-1">
                  <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-[8px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                    ✦ CARTA DIGITAL & MENÚ DEL DÍA ✦
                  </span>
                  <div className="flex justify-center my-1">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-11 h-11 object-contain rounded-full bg-white p-0.5 shadow-2xs border border-stone-200" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <h3 className="font-black text-sm text-stone-900 uppercase tracking-tight">
                    {isParadero ? 'PARADERO 104' : 'LAS LOMAS GRILL'}
                  </h3>
                  <p className="text-[9px] text-stone-500 font-bold">
                    {isParadero ? 'Cevichería & Mariscos' : 'Brasas, Parrillas & Sabor Criollo'}
                  </p>
                </div>

                {/* Banner de Menú */}
                <div className={`p-2.5 rounded-2xl text-white shadow-xs ${isParadero ? 'bg-[#0f2d4a]' : 'bg-[#26170d]'}`}>
                  <h4 className="font-black text-xs text-amber-400 leading-tight">
                    🍽️ {menuTitle.toUpperCase()}
                  </h4>
                  <p className="text-[9px] text-stone-300 font-medium mt-0.5">
                    {menuSubtitle}
                  </p>
                  <div className="mt-1.5 inline-block bg-amber-500 text-stone-950 font-black text-[9px] px-2.5 py-0.5 rounded-full">
                    DESDE <strong>{formatMoney(basePrice, settings.currency)}</strong>
                  </div>
                </div>

                {/* Código QR Central */}
                <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-md inline-block relative">
                  <QRCode
                    value={menuUrl}
                    size={160}
                    level="H"
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                  <div className="mt-2 text-[9px] font-black text-stone-800 bg-stone-100 py-0.5 px-2 rounded-md border border-stone-200">
                    📷 ESCANEA CON TU CÁMARA
                  </div>
                </div>

                {/* 3 Pasos */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-[8px] text-stone-600 font-medium">
                  <div className="bg-stone-50 p-1.5 rounded-xl border border-stone-200/80">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-black inline-flex items-center justify-center mb-0.5 text-[8px]">1</span>
                    <p className="font-bold text-stone-900 leading-tight">Apunta con la cámara</p>
                  </div>
                  <div className="bg-stone-50 p-1.5 rounded-xl border border-stone-200/80">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-black inline-flex items-center justify-center mb-0.5 text-[8px]">2</span>
                    <p className="font-bold text-stone-900 leading-tight">Elige tus platos</p>
                  </div>
                  <div className="bg-stone-50 p-1.5 rounded-xl border border-stone-200/80">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-black inline-flex items-center justify-center mb-0.5 text-[8px]">3</span>
                    <p className="font-bold text-stone-900 leading-tight">Pide al mozo</p>
                  </div>
                </div>

                {/* Footer del cartel */}
                <div className="pt-1.5 border-t border-stone-200 text-[8.5px] text-stone-500 space-y-0.5">
                  {tableNumber.trim() && (
                    <span className="inline-block bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-md border border-amber-200 text-[9px]">
                      📍 MESA: {tableNumber.toUpperCase()}
                    </span>
                  )}
                  {wifiSsid.trim() && (
                    <p className="font-medium text-stone-600">
                      📶 WiFi: <strong>{wifiSsid}</strong> {wifiPass && `· Clave: <strong>${wifiPass}</strong>`}
                    </p>
                  )}
                  <p className="font-bold text-stone-800">
                    📲 Pedidos & Delivery WhatsApp: {phone}
                  </p>
                </div>

              </div>
            </div>
          )}

          {displayTemplate === 'square_sticker' && (
            /* 🏷️ VISTA PREVIA: STICKER CUADRADO */
            <div className="w-full max-w-[280px] aspect-square bg-white rounded-3xl p-4 shadow-xl border-4 border-stone-900 flex flex-col items-center justify-between text-center animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-7 h-7 object-contain rounded-full bg-white p-0.5 border border-stone-200" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <h3 className="font-black text-xs text-stone-900 uppercase leading-none">
                    {isParadero ? 'PARADERO 104' : 'LAS LOMAS GRILL'}
                  </h3>
                  <span className="text-[8px] font-black text-amber-600 uppercase">🍽️ MENÚ DEL DÍA DE HOY</span>
                </div>
              </div>

              <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
                <QRCode
                  value={menuUrl}
                  size={135}
                  level="H"
                />
              </div>

              <div className="space-y-0.5">
                <span className="bg-stone-900 text-amber-400 font-black text-[8px] px-2.5 py-0.5 rounded-full inline-block">
                  📷 ESCANEA CON TU CÁMARA
                </span>
                <p className="text-[9px] font-black text-stone-900 font-mono">
                  Almuerzos desde {formatMoney(basePrice, settings.currency)}
                </p>
                {tableNumber.trim() && (
                  <p className="text-[8.5px] font-bold text-amber-700">MESA: {tableNumber.toUpperCase()}</p>
                )}
              </div>
            </div>
          )}

          {displayTemplate === 'thermal_ticket' && (
            /* 🧾 VISTA PREVIA: TICKET TÉRMICO */
            <div className="w-full max-w-[240px] bg-white rounded-2xl p-4 shadow-md border border-stone-300 font-mono text-[10px] space-y-2 text-center animate-in zoom-in-95 duration-200">
              <p className="text-stone-400">=======================</p>
              <h3 className="font-black text-xs uppercase">{isParadero ? 'PARADERO 104' : 'LAS LOMAS GRILL'}</h3>
              <p className="text-[9px] font-bold text-stone-600">*** MENÚ DEL DÍA DE HOY ***</p>
              <p className="text-[9px]">{menuTitle}</p>
              <p className="font-black text-stone-900">Desde {formatMoney(basePrice, settings.currency)}</p>
              
              <div className="flex justify-center py-1">
                <QRCode
                  value={menuUrl}
                  size={120}
                  level="H"
                />
              </div>
              
              <p className="font-bold text-[9px]">ESCANEA PARA VER PLATOS</p>
              <p className="text-[8px] text-stone-500">Entrada + Fondo + Bebida</p>
              {tableNumber.trim() && <p className="font-bold text-[9px]">MESA: {tableNumber.toUpperCase()}</p>}
              <p className="text-stone-400">=======================</p>
            </div>
          )}

        </div>

        {/* ── BARRA DE ENLACE DIRECTO RÁPIDO ── */}
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2 text-xs shrink-0">
          <div className="min-w-0 flex-1 truncate">
            <span className="text-[10px] text-stone-400 font-bold uppercase mr-1">Link:</span>
            <span className="font-mono font-bold text-stone-700 text-[11px] truncate">{menuUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 shrink-0 cursor-pointer ${
              copied ? 'bg-emerald-500 text-white' : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* ── BOTONES DE ACCIÓN PRINCIPALES ── */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenBrowser}
              className="flex-1 sm:flex-none px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
              title="Abrir vista de cliente"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver como Cliente</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              title="Compartir por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 border border-stone-200 cursor-pointer active:scale-95"
              title="Descargar QR en alta resolución"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Descargar PNG</span>
            </button>

            {/* BOTÓN PRINCIPAL DE IMPRESIÓN PROFESIONAL */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-stone-900 hover:bg-black text-amber-400 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              title="Imprimir cartel optimizado para mesa"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>🖨️ Imprimir Cartel</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
