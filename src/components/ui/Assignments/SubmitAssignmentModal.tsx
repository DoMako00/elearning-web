import React, { useState } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Paperclip } from "lucide-react";
import type { StudentAssignmentAttachmentDto } from "../../../features/student/api/studentAssignmentsApi";
import "./SubmitAssignmentModal.css";

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentTitle: string;
  courseName: string;
  onUploadFile: (file: File, idempotencyKey: string) => Promise<StudentAssignmentAttachmentDto>;
  onSubmitSuccess: (responseText: string, attachmentIds: string[]) => Promise<void>;
}

interface FileDraft { file: File; key: string; attachment?: StudentAssignmentAttachmentDto; error?: string; }

export function SubmitAssignmentModal({ isOpen, onClose, assignmentTitle, courseName, onUploadFile, onSubmitSuccess }: SubmitAssignmentModalProps) {
  const [responseText, setResponseText] = useState("");
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!responseText.trim() && files.length === 0) { setErrorMessage("Write a response or attach at least one file."); return; }
    if (!isConfirmed) { setErrorMessage("Please confirm that this is your original work."); return; }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const uploaded: StudentAssignmentAttachmentDto[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const draft = files[index]!;
        if (draft.attachment) { uploaded.push(draft.attachment); continue; }
        setUploadingIndex(index);
        try {
          const attachment = await onUploadFile(draft.file, draft.key);
          uploaded.push(attachment);
          setFiles(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, attachment, error: undefined } : item));
        } catch (error) {
          const message = error instanceof Error ? error.message : "This file could not be uploaded and verified.";
          setFiles(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, error: message } : item));
          throw new Error(`${draft.file.name}: ${message}`);
        }
      }
      await onSubmitSuccess(responseText.trim(), uploaded.map(item => item.id));
      setResponseText("");
      setFiles([]);
      setIsConfirmed(false);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The response could not be submitted.");
    } finally {
      setUploadingIndex(null);
      setIsSubmitting(false);
    }
  };

  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (files.length + selected.length > 5) { setErrorMessage("Attach up to five files."); return; }
    const invalid = selected.find(file => !allowed.has(file.type) || file.size <= 0 || file.size > 25 * 1024 * 1024);
    if (invalid) { setErrorMessage(`${invalid.name} must be a PDF, JPEG, PNG, or WebP file up to 25 MiB.`); return; }
    setErrorMessage(null);
    setFiles(current => [...current, ...selected.map(file => ({ file, key: crypto.randomUUID() }))]);
  };

  return (
    <div className="submit-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="submit-assignment-title">
      <div className="submit-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="submit-modal-header"><div><h2 id="submit-assignment-title" className="submit-modal-title">Submit assignment</h2><p className="submit-modal-subtitle">{assignmentTitle} &bull; {courseName}</p></div><button type="button" className="submit-modal-close" onClick={onClose} aria-label="Close modal" disabled={isSubmitting}><X size={18} /></button></div>
        {errorMessage && <div className="submit-modal-error" role="alert"><AlertCircle size={16} /><span>{errorMessage}</span></div>}
        <form onSubmit={(event) => void handleSubmit(event)} className="submit-modal-form">
          <div className="submit-modal-field"><label htmlFor="assignment-response" className="submit-modal-label">Your response</label><div className="submit-modal-textarea-wrapper"><textarea id="assignment-response" className="submit-modal-textarea" placeholder="Write your assignment response…" value={responseText} onChange={(event) => setResponseText(event.target.value.slice(0, 50000))} rows={9} maxLength={50000} /><span className="submit-modal-char-count">{responseText.length}/50000</span></div></div>
          <div className="submit-modal-field">
            <label className="submit-modal-label" htmlFor="assignment-attachments">Attachments</label>
            <label className="submit-modal-btn-cancel inline-flex w-fit cursor-pointer items-center gap-2"><Paperclip size={15} />Add files<input id="assignment-attachments" className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple disabled={isSubmitting || files.length >= 5} onChange={addFiles} /></label>
            <p className="text-xs text-gray-500">PDF, JPEG, PNG, or WebP · up to 25 MiB each · five files maximum. Files are privately uploaded and verified before submission.</p>
            {files.length > 0 && <ul className="mt-2 space-y-2" aria-label="Selected attachments">{files.map((draft, index) => <li key={draft.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm"><span className="min-w-0 truncate">{draft.file.name} <span className="text-xs text-gray-500">({(draft.file.size / (1024 * 1024)).toFixed(1)} MiB)</span>{draft.error && <span className="block text-xs text-rose-600">{draft.error}</span>}</span><span className="shrink-0 text-xs font-semibold text-emerald-700">{uploadingIndex === index ? <><Loader2 size={13} className="inline animate-spin" /> Uploading</> : draft.attachment?.status === "verified" ? "Verified" : draft.error ? "Retry on submit" : "Ready"}</span></li>)}</ul>}
          </div>
          <label className="submit-modal-checkbox-label"><input type="checkbox" className="submit-modal-checkbox" checked={isConfirmed} onChange={(event) => setIsConfirmed(event.target.checked)} /><span>I confirm that this work is my own and all sources are properly cited.</span></label>
          <div className="submit-modal-actions"><button type="button" className="submit-modal-btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button><button type="submit" className="submit-modal-btn-submit" disabled={isSubmitting || (!responseText.trim() && files.length === 0) || !isConfirmed}>{isSubmitting ? <><Loader2 size={16} className="animate-spin" /> {uploadingIndex === null ? "Submitting…" : "Uploading…"}</> : <><CheckCircle2 size={16} /> Submit response</>}</button></div>
        </form>
      </div>
    </div>
  );
}
