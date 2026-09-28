import React, { useState, useRef } from "react";
import { 
  X, 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import "./SubmitAssignmentModal.css";

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentTitle: string;
  courseName: string;
  maxFileSizeMb?: number;
  acceptedFormats?: string[];
  onSubmitSuccess: (data: { fileName: string; fileSize: string; note: string }) => void;
}

export function SubmitAssignmentModal({
  isOpen,
  onClose,
  assignmentTitle,
  courseName,
  maxFileSizeMb = 20,
  acceptedFormats = ["PDF", "DOCX", "PPTX"],
  onSubmitSuccess,
}: SubmitAssignmentModalProps) {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeFormatted: string;
    rawSize: number;
    type: string;
  } | null>({
    name: "Upper_Limb_Clinical_Case.pdf",
    sizeFormatted: "1.8 MB",
    rawSize: 1.8 * 1024 * 1024,
    type: "application/pdf",
  });

  const [note, setNote] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

    const sizeFormatted = sizeInMb < 1 
      ? `${(file.size / 1024).toFixed(1)} KB` 
      : `${sizeInMb.toFixed(1)} MB`;

    setSelectedFile({
      name: file.name,
      sizeFormatted,
      rawSize: file.size,
      type: file.type || "application/octet-stream",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
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
    <div className="submit-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="submit-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="submit-modal-header">
          <div>
            <h2 className="submit-modal-title">Submit assignment</h2>
            <p className="submit-modal-subtitle">
              {assignmentTitle} &bull; {courseName}
            </p>
          </div>
          <button 
            type="button" 
            className="submit-modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="submit-modal-error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="submit-modal-form">
          {/* File Upload Zone */}
          <input
            ref={fileInputRef}
            type="file"
            className="submit-modal-file-input"
            onChange={handleFileChange}
            accept=".pdf,.docx,.pptx"
            id="assignment-file-upload"
          />

          {!selectedFile ? (
            <div
              className={`submit-modal-dropzone ${isDragging ? "is-dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="submit-modal-dropzone-icon">
                <UploadCloud size={28} />
              </div>
              <p className="submit-modal-dropzone-title">
                Drag and drop your file here
              </p>
              <p className="submit-modal-dropzone-action">
                or <span>click to browse</span>
              </p>
              <p className="submit-modal-dropzone-formats">
                {acceptedFormats.join(", ")} up to {maxFileSizeMb}MB
              </p>
            </div>
          ) : (
            <div className="submit-modal-file-card">
              <div className="submit-modal-file-art">
                <FileText size={20} />
              </div>
              <div className="submit-modal-file-info">
                <span className="submit-modal-file-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <span className="submit-modal-file-size">{selectedFile.sizeFormatted}</span>
              </div>
              <span className="submit-modal-file-badge">
                <CheckCircle2 size={12} /> Ready to submit
              </span>
              <button
                type="button"
                className="submit-modal-file-delete"
                onClick={handleRemoveFile}
                aria-label="Remove attached file"
                title="Remove file"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* Submission Note */}
          <div className="submit-modal-field">
            <label htmlFor="submission-note" className="submit-modal-label">
              Submission note (optional)
            </label>
            <div className="submit-modal-textarea-wrapper">
              <textarea
                id="submission-note"
                className="submit-modal-textarea"
                placeholder="Add a note for your instructor..."
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={3}
              />
              <span className="submit-modal-char-count">{note.length}/500</span>
            </div>
          </div>

          {/* Honor Code Checkbox */}
          <label className="submit-modal-checkbox-label">
            <input
              type="checkbox"
              className="submit-modal-checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
            />
            <span>I confirm that this work is my own and all sources are properly cited.</span>
          </label>

          {/* Action Buttons */}
          <div className="submit-modal-actions">
            <button
              type="button"
              className="submit-modal-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-modal-btn-submit"
              disabled={isSubmitting || !selectedFile || !isConfirmed}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Submit assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
