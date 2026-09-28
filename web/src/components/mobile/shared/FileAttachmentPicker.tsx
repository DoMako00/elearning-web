import React, { useRef } from "react";
import { Paperclip, X, FileText, Check } from "lucide-react";

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  file?: File;
}

export interface FileAttachmentPickerProps {
  attachments: AttachedFile[];
  onAddAttachment: (file: AttachedFile) => void;
  onRemoveAttachment: (id: string) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

export const FileAttachmentPicker: React.FC<FileAttachmentPickerProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  maxFiles = 3,
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg",
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (attachments.length + i >= maxFiles) break;
      const file = files[i];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr =
        Number(sizeMb) > 0.1
          ? `${sizeMb} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      onAddAttachment({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: sizeStr,
        file,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || attachments.length >= maxFiles}
      />

      {/* Upload button area */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || attachments.length >= maxFiles}
        className={`w-full py-3 px-4 border border-dashed rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition-all select-none cursor-pointer ${
          attachments.length >= maxFiles
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-emerald-50/40 border-emerald-300/80 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
        }`}
      >
        <Paperclip className="w-4 h-4" />
        <span>
          {attachments.length >= maxFiles
            ? `Maximum ${maxFiles} files attached`
            : "Attach screenshot or document (optional)"}
        </span>
      </button>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{file.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(file.id)}
                  aria-label={`Remove ${file.name}`}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
