import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Paperclip, X } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import type { StudentAssignmentAttachmentDto } from "../../../features/student/api/studentAssignmentsApi";

export interface SubmitAssignmentTextSheetProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentTitle: string;
  courseName: string;
  onUploadFile: (file: File, idempotencyKey: string) => Promise<StudentAssignmentAttachmentDto>;
  /** submissionId stays the same across retries of one logical submission. */
  onSubmit: (responseText: string, attachmentIds: string[], submissionId: string) => Promise<void>;
}

interface FileDraft { file: File; key: string; attachment?: StudentAssignmentAttachmentDto; }

export const SubmitAssignmentTextSheet: React.FC<SubmitAssignmentTextSheetProps> = ({ isOpen, onClose, assignmentTitle, courseName, onUploadFile, onSubmit }) => {
  const [responseText, setResponseText] = useState("");
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionKey = useRef(crypto.randomUUID());

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || (!responseText.trim() && files.length === 0) || !confirmed) return;
    setPending(true);
    setError(null);
    try {
      const uploaded: StudentAssignmentAttachmentDto[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const draft = files[index]!;
        const attachment = draft.attachment ?? await onUploadFile(draft.file, draft.key);
        uploaded.push(attachment);
        setFiles(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, attachment } : item));
      }
      await onSubmit(responseText.trim(), uploaded.map(attachment => attachment.id), submissionKey.current);
      submissionKey.current = crypto.randomUUID();
      setResponseText("");
      setFiles([]);
      setConfirmed(false);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your response could not be submitted.");
    } finally {
      setPending(false);
    }
  };

  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (files.length + selected.length > 5 || selected.some(file => !allowed.has(file.type) || file.size <= 0 || file.size > 25 * 1024 * 1024)) {
      setError("Choose up to five PDF, JPEG, PNG, or WebP files (25 MiB maximum each).");
      return;
    }
    setError(null);
    setFiles(current => [...current, ...selected.map(file => ({ file, key: crypto.randomUUID() }))]);
  };

  return <BottomSheet isOpen={isOpen} onClose={() => { if (!pending) onClose(); }} title="Submit Assignment">
    <form onSubmit={(event) => void submit(event)} className="space-y-4 pb-2">
      <div><h4 className="text-sm font-bold text-slate-900 leading-tight">{assignmentTitle}</h4><p className="text-xs text-slate-500 font-medium mt-0.5">{courseName}</p></div>
      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2" role="alert"><AlertCircle className="size-4 shrink-0" /><span>{error}</span></div>}
      <div><label htmlFor="mobile-assignment-response" className="block text-xs font-bold text-slate-700 mb-1">Your response</label><textarea id="mobile-assignment-response" rows={7} maxLength={50000} value={responseText} onChange={(event) => setResponseText(event.target.value.slice(0, 50000))} placeholder="Write your assignment response…" className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" /><span className="block text-right text-[10px] text-slate-400 font-medium">{responseText.length}/50000</span></div>
      <div className="space-y-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><Paperclip className="size-3.5" />Add files<input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple disabled={pending || files.length >= 5} onChange={addFiles} /></label><p className="text-[11px] text-slate-500">Private PDF, JPEG, PNG, or WebP uploads · up to 25 MiB each.</p>{files.map(item => <div key={item.key} className="flex items-center justify-between gap-2 text-xs text-emerald-700"><span className="truncate">{item.attachment ? "Verified · " : "Ready · "}{item.file.name}</span><button type="button" onClick={() => setFiles(current => current.filter(file => file.key !== item.key))} disabled={pending} aria-label={`Remove ${item.file.name}`} className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 disabled:opacity-40"><X className="size-4" aria-hidden="true" /></button></div>)}</div>
      <label className="flex items-start gap-2.5 text-xs text-slate-600 font-medium cursor-pointer select-none"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" /><span className="leading-snug">I confirm that this work is my own and all sources are properly cited.</span></label>
      <div className="pt-2 flex items-center gap-3"><button type="button" onClick={onClose} disabled={pending} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all">Cancel</button><button type="submit" disabled={pending || (!responseText.trim() && files.length === 0) || !confirmed} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 text-white text-xs font-bold transition-all shadow-2xs">{pending ? <><Loader2 className="size-4 animate-spin" /><span>Uploading / submitting…</span></> : <><CheckCircle2 className="size-4" /><span>Submit response</span></>}</button></div>
    </form>
  </BottomSheet>;
};
