import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExcelUploaderProps {
  itemId: string;
  onUploadComplete?: () => void;
}

interface SheetData {
  sheetName: string;
  rows: Record<string, any>[];
}

const ExcelUploader = ({ itemId, onUploadComplete }: ExcelUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'deleting' | 'inserting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ sheets: number; rows: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseExcel = async (file: File): Promise<SheetData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          const sheetsData: SheetData[] = [];
          
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 1) {
              const headers = jsonData[0] as string[];
              const rows: Record<string, any>[] = [];
              
              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i] as any[];
                if (row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
                  const rowData: Record<string, any> = {};
                  headers.forEach((header, idx) => {
                    const columnLetter = String.fromCharCode(65 + idx);
                    rowData[`col_${columnLetter}`] = row[idx] !== undefined ? row[idx] : null;
                    if (header) {
                      rowData[header.toString().trim()] = row[idx] !== undefined ? row[idx] : null;
                    }
                  });
                  rows.push(rowData);
                }
              }
              
              sheetsData.push({ sheetName, rows });
            }
          });
          
          resolve(sheetsData);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar extensão
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);
    setStats(null);

    try {
      // 1. Parsear o Excel
      setStatus('parsing');
      setProgress(10);
      const sheetsData = await parseExcel(file);
      
      const totalRows = sheetsData.reduce((acc, sheet) => acc + sheet.rows.length, 0);
      setStats({ sheets: sheetsData.length, rows: totalRows });
      setProgress(30);

      // 2. Deletar dados antigos deste item específico
      setStatus('deleting');
      const { error: deleteError } = await supabase
        .from('dashboard_data')
        .delete()
        .eq('item_id', itemId);

      if (deleteError) throw deleteError;
      setProgress(50);

      // 3. Inserir novos dados
      setStatus('inserting');
      let insertedRows = 0;
      const batchSize = 100;

      for (const sheet of sheetsData) {
        const rows = sheet.rows.map((data, index) => ({
          item_id: itemId,
          sheet_name: sheet.sheetName,
          row_index: index + 1,
          data,
        }));

        // Inserir em batches
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('dashboard_data')
            .insert(batch);

          if (insertError) throw insertError;
          
          insertedRows += batch.length;
          setProgress(50 + Math.floor((insertedRows / totalRows) * 45));
        }
      }

      setProgress(100);
      setStatus('done');
      
      toast({
        title: "Upload concluído!",
        description: `${totalRows} registros importados de ${sheetsData.length} abas.`,
      });

      onUploadComplete?.();
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.message || 'Erro ao processar arquivo');
      setStatus('error');
    } finally {
      setIsUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'parsing':
        return 'Lendo arquivo Excel...';
      case 'deleting':
        return 'Removendo dados anteriores...';
      case 'inserting':
        return 'Inserindo novos dados...';
      case 'done':
        return 'Upload concluído!';
      case 'error':
        return 'Erro no upload';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileSpreadsheet className="h-4 w-4" />
        Upload de Dados (Excel)
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <Button
        variant="outline"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {isUploading ? 'Processando...' : 'Selecionar Arquivo Excel (.xlsx)'}
      </Button>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {getStatusMessage()}
          </p>
        </div>
      )}

      {status === 'done' && stats && (
        <Alert className="border-primary bg-primary/10">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            {stats.rows} registros importados de {stats.sheets} aba(s) com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        ⚠️ Ao fazer upload, os dados anteriores deste dashboard serão substituídos.
      </p>
    </div>
  );
};

export default ExcelUploader;
