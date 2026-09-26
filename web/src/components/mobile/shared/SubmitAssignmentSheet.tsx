import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { BottomSheet } from "./BottomSheet";

export interface SubmitAssignmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentTitle: string;
  courseName: string;
  maxFileSizeMb?: number;
  acceptedFormats?: string[];
  onSubmitSuccess: (data: { fileName: string; fileSize: string; note: string }) => void;
}

export const SubmitAssignmentSheet: React.FC<SubmitAssignmentSheetProps> = ({
  isOpen,
  onClose,
  assignmentTitle,
  courseName,
  maxFileSizeMb = 20,
  acceptedFormats = ["PDF", "DOCX", "PPTX"],
  onSubmitSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeFormatted: string;
    rawSize: number;
    type: string;
  } | null>(null);

  const [note, setNote] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > maxFileSizeMb) {
      setErrorMessage(`File size exceeds maximum allowed limit (${maxFileSizeMb}MB).`);
      return;
    }

    const sizeFormatted =
      sizeInMb < 1
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${sizeInMb.toFixed(1)} MB`;

    setSelectedFile({
      name: file.name,
      sizeFormatted,
      rawSize: file.size,
      type: file.type || "application/octet-stream",
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please upload a file before submitting.");
      return;
    }
    if (!isConfirmed) {
      setErrorMessage("Please confirm that this is your original work.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitSuccess({
        fileName: selectedFile.name,
        fileSize: selectedFile.sizeFormatted,
        note,
      });
      onClose();
    }, 800);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Submit Assignment">
      <form onSubmit={handleSubmit} className="space-y-4 pb-2">
        {/* Course & Title Subheading */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 leading-tight">
            {assignmentTitle}
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{courseName}</p>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,.pptx"
          id="mobile-assignment-file-upload"
        />

        {/* File Picker Zone */}
        {isSubmitting ? (
          <div className="w-full rounded-3xl p-6 text-center bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-bold text-slate-700">Submitting your assignment...</p>
            <p className="text-[11px] text-slate-400">Encrypting & uploading {selectedFile?.name}</p>
          </div>
        ) : !selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-3xl p-6 text-center bg-slate-50/60 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <div className="size-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="size-6 stroke-2" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Tap to choose a file
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {acceptedFormats.join(", ")} up to {maxFileSizeMb}MB
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileText className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {selectedFile.sizeFormatted}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label="Remove attached file"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}

        {/* Submission Note Input */}
        <div>
          <label
            htmlFor="mobile-sub-note"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            Submission note (optional)
          </label>
          <div className="relative">
            <textarea
              id="mobile-sub-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder="Add a note for your instructor..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-medium">
              {note.length}/500
            </span>
          </div>
        </div>

        {/* Honor Code Checkbox */}
        <label className="flex items-start gap-2.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-0.5 size-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <span className="leading-snug">
            I confirm that this work is my own and all sources are properly cited.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedFile || !isConfirmed}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Submit assignment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
