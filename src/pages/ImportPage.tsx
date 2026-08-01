import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import { importLeads } from '../lib/api';
import { useLeads } from '../lib/LeadsContext';
import { useToast } from '../lib/toast';
import { PageTransition } from '../components/PageTransition';

const TEMPLATE_HEADER =
  'name,email,phone,company,industry,company_size,source,budget,timeline,engagement_level,decision_maker,pain_points,notes,stage';
const PREVIEW_COLUMNS = ['name', 'email', 'company', 'budget', 'timeline'];

type Stage = 'idle' | 'parsed' | 'importing' | 'done';

export function ImportPage() {
  const { refresh } = useLeads();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; errors: { row: number; error: string }[] } | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    setResult(null);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data);
        setStage('parsed');
      },
      error: (err) => setError(err.message),
    });
  }

  async function handleImport() {
    setStage('importing');
    setError(null);
    try {
      const res = await importLeads(rows);
      setResult(res);
      setStage('done');
      if (res.inserted > 0) {
        refresh();
        toast(`Imported ${res.inserted} lead${res.inserted === 1 ? '' : 's'}`, 'success');
      }
    } catch (err) {
      setError((err as Error).message);
      setStage('parsed');
    }
  }

  function reset() {
    setStage('idle');
    setRows([]);
    setFileName('');
    setError(null);
    setResult(null);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_HEADER + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Upload a CSV with a header row. Each row is scored automatically on import.
          </p>
          <button onClick={downloadTemplate} className="shrink-0 text-sm text-slate-500 underline transition-colors hover:text-slate-700">
            Download template
          </button>
        </div>

        {stage === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-16 text-center transition-colors ${
              isDragging ? 'border-accent bg-accent/5' : 'animate-pulse-border border-accent/30 bg-slate-50'
            }`}
          >
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
              <UploadCloud size={40} className="text-accent" />
            </motion.div>
            <div>
              <p className="font-medium text-slate-700">Drag and drop your CSV here</p>
              <p className="text-sm text-slate-500">or click to browse</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>
        )}

        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {stage === 'parsed' && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <FileSpreadsheet size={16} className="text-accent" />
                <strong>{fileName}</strong> — {rows.length} row{rows.length === 1 ? '' : 's'} parsed
              </div>
              <button onClick={reset} className="text-xs text-slate-500 underline hover:text-slate-700">Choose a different file</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    {PREVIEW_COLUMNS.map((col) => (
                      <th key={col} className="px-3 py-2 font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      {PREVIEW_COLUMNS.map((col) => (
                        <td key={col} className="truncate px-3 py-2 text-slate-600">{String(row[col] ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">…and {rows.length - 10} more rows</div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={reset} className="rounded-md px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              >
                Confirm import — {rows.length} lead{rows.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        )}

        {stage === 'importing' && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-700">Uploading and scoring leads…</p>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-full bg-accent"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}

        {stage === 'done' && result && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Imported {result.inserted} lead{result.inserted === 1 ? '' : 's'}.
              {result.errors.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-red-700">
                  {result.errors.map((e) => (
                    <li key={e.row}>Row {e.row}: {e.error}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={reset} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md">
                Import another file
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
