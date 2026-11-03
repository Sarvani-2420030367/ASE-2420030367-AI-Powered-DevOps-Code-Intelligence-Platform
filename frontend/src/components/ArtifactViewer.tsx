import React, { useState } from 'react';
import { Copy, Check, Download, FileCode } from 'lucide-react';

interface ArtifactViewerProps {
  filename: string;
  content: string;
  language?: string;
  onDownload?: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  filename,
  content,
  language = 'yaml',
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono font-semibold text-white">{filename}</span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      <div className="p-4 overflow-auto max-h-[500px] code-font text-xs text-slate-200 leading-relaxed bg-slate-950">
        <pre className="font-mono">{content}</pre>
      </div>
    </div>
  );
};
