'use me';
'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Download, ExternalLink, HardDrive, RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface BlobFile {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

export default function Home() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
    const savedNotes = localStorage.getItem('andrh_notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/upload');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setFiles(data);
      } else {
        if (data.error && data.error.includes('BLOB_READ_WRITE_TOKEN')) {
          setErrorMsg('Vercel Blob token не настроен. Следуйте инструкции ниже!');
        } else {
          setErrorMsg(data.error || 'Ошибка при загрузке списка файлов.');
        }
      }
    } catch (err: any) {
      setErrorMsg('Не удалось подключиться к серверу.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      const newBlob = await response.json();

      if (!response.ok) {
        throw new Error(newBlob.error || 'Не удалось загрузить файл');
      }

      fetchFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка загрузки файла.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Вы уверены, что хотите удалить файл?')) return;
    try {
      const response = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setFiles(files.filter((f) => f.url !== url));
      } else {
        const data = await response.json();
        alert(data.error || 'Не удалось удалить файл.');
      }
    } catch (err) {
      alert('Ошибка при удалении файла.');
    }
  };

  const saveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem('andrh_notes', val);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-indigo-400" />
            AndrH Storage
          </h1>
          <p className="text-slate-400 mt-1">Хранение ваших файлов и текстовых записей в облаке</p>
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Warning Notification if Token is Missing */}
      {errorMsg && (
        <div className="p-4 bg-amber-950/60 border border-amber-500/30 rounded-xl text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold">{errorMsg}</span>
            <p className="mt-1 text-amber-300/80">
              Если это первый запуск на Vercel, включите **Vercel Blob** в разделе Storage панели управления Vercel.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone & Quick Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) {
              handleUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition ${
            dragActive
              ? 'border-indigo-500 bg-indigo-950/20'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleUpload(e.target.files[0]);
              }
            }}
          />
          <div className="w-14 h-14 bg-indigo-600/10 rounded-full flex items-center justify-center mb-4 text-indigo-400">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">Перетащите файл сюда</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">или выберите файл на вашем компьютере</p>
          <button
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {uploading ? 'Загрузка...' : 'Выбрать файл'}
          </button>
        </div>

        {/* Local Notes Box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-slate-200 font-semibold">
            <FileText className="w-5 h-5 text-indigo-400" />
            Быстрые заметки (Локальное сохранение)
          </div>
          <textarea
            value={notes}
            onChange={(e) => saveNotes(e.target.value)}
            placeholder="Вставьте сюда любой текст, ссылки или заметки... Они сохраняются автоматически."
            className="w-full flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none text-sm min-h-[140px]"
          />
          <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> Автосохранение в браузере
          </span>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Сохранённые файлы ({files.length})
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Загрузка файлов...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 border border-slate-800/80 rounded-2xl bg-slate-900/20 text-slate-500">
            Нет сохранённых файлов
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {files.map((file) => (
              <div
                key={file.url}
                className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl transition gap-4 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 bg-slate-800/80 rounded-lg text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium text-slate-200 truncate">{file.pathname}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{formatSize(file.size)}</span>
                      <span>•</span>
                      <span>{new Date(file.uploadedAt).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                    title="Открыть"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={file.downloadUrl}
                    download
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                    title="Скачать"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.url)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
