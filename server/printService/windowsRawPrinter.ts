import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface SystemPrinterInfo {
  name: string;
  driverName?: string;
  portName?: string;
  isDefault?: boolean;
}

const RAW_PRINT_CSHARP = `
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
        Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "Ticket ESC/POS";
        di.pDataType = "RAW";
        bool bSuccess = false;

        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    int dwWritten = 0;
                    bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        Marshal.FreeCoTaskMem(pUnmanagedBytes);
        return bSuccess;
    }
}
`;

/**
 * Obtiene la lista de impresoras instaladas en el sistema operativo Windows
 */
export async function listWindowsPrinters(): Promise<SystemPrinterInfo[]> {
  if (process.platform !== 'win32') {
    return [];
  }

  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -Command "Get-Printer | Select-Object Name, DriverName, PortName | ConvertTo-Json"`;
    exec(cmd, { timeout: 4000 }, (error, stdout) => {
      if (error || !stdout.trim()) {
        return resolve([]);
      }
      try {
        const parsed = JSON.parse(stdout);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const result: SystemPrinterInfo[] = list
          .filter((p: any) => p && p.Name)
          .map((p: any) => ({
            name: p.Name,
            driverName: p.DriverName,
            portName: p.PortName,
          }));
        resolve(result);
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * Envía datos binarios RAW (ESC/POS) a una impresora USB / Windows Spooler
 */
export async function printRawBytesToWindowsPrinter(
  printerName: string,
  buffer: Buffer
): Promise<{ success: boolean; message: string; bytesWritten?: number; error?: string }> {
  if (!printerName || !printerName.trim()) {
    return {
      success: false,
      message: 'Nombre de impresora USB de Windows no especificado',
      error: 'PRINTER_NAME_REQUIRED',
    };
  }

  if (process.platform !== 'win32') {
    return {
      success: false,
      message: 'Impresión USB Spooler directa solo disponible en entorno Windows',
      error: 'PLATFORM_NOT_SUPPORTED',
    };
  }

  const cleanName = printerName.trim();
  const tempFilePath = path.join(os.tmpdir(), `escpos_print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.bin`);
  const psScriptPath = path.join(os.tmpdir(), `escpos_script_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.ps1`);

  try {
    await fs.promises.writeFile(tempFilePath, buffer);

    const base64Code = Buffer.from(RAW_PRINT_CSHARP, 'utf-8').toString('base64');
    const psScriptContent = `
$cs = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Code}'));
Add-Type -TypeDefinition $cs;
$bytes = [System.IO.File]::ReadAllBytes('${tempFilePath.replace(/\\/g, '\\\\')}');
$res = [RawPrinterHelper]::SendBytesToPrinter('${cleanName.replace(/'/g, "''")}', $bytes);
if ($res) { Write-Host "PRINT_SUCCESS" } else { Write-Host "PRINT_FAILED" }
`;
    await fs.promises.writeFile(psScriptPath, psScriptContent, 'utf-8');

    return new Promise((resolve) => {
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, { timeout: 6000 }, (error, stdout, stderr) => {
        // Limpieza de archivos temporales
        fs.unlink(tempFilePath, () => {});
        fs.unlink(psScriptPath, () => {});

        const output = (stdout || '').trim();
        if (!error && output.includes('PRINT_SUCCESS')) {
          resolve({
            success: true,
            bytesWritten: buffer.length,
            message: `Ticket impreso en la ticketera USB "${cleanName}" (${buffer.length} bytes)`,
          });
        } else {
          resolve({
            success: false,
            message: `No se pudo enviar datos a la impresora USB "${cleanName}". Verifique que esté conectada y encendida.`,
            error: stderr || output || error?.message || 'RAW_PRINT_FAILED',
          });
        }
      });
    });
  } catch (err: any) {
    try { fs.unlinkSync(tempFilePath); } catch {}
    try { fs.unlinkSync(psScriptPath); } catch {}
    return {
      success: false,
      message: `Error al procesar archivo de impresión: ${err.message}`,
      error: 'FS_ERROR',
    };
  }
}
