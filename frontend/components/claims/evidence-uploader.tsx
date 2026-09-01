'use client';

import * as React from 'react';
import { UploadSimple, FileText, Trash, CheckCircle, WarningCircle, Image as ImageIcon, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EvidenceType } from '@/types';

export interface UploadedEvidenceItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  evidenceType: EvidenceType;
}

interface EvidenceUploaderProps {
  evidenceList: UploadedEvidenceItem[];
  onChange: (list: UploadedEvidenceItem[]) => void;
  suggestedEvidence?: string[];
  disabled?: boolean;
}

export function EvidenceUploader({
  evidenceList,
  onChange,
  suggestedEvidence = [],
  disabled = false,
}: EvidenceUploaderProps) {
  const [selectedType, setSelectedType] = React.useState<EvidenceType>('RECEIPT');
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadedEvidenceItem[] = [];

    Array.from(files).forEach((file) => {
      // Basic size validation (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 15MB size limit.`);
        return;
      }

      // Read file as data URL for local draft representation
      const reader = new FileReader();
      reader.onload = () => {
        const item: UploadedEvidenceItem = {
          id: `evidence-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileUrl: (reader.result as string) || `https://storage.cbae.internal/evidence/${file.name}`,
          evidenceType: selectedType,
        };
        onChange([...evidenceList, item]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (id: string) => {
    onChange(evidenceList.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Suggested Evidence Pills */}
      {suggestedEvidence.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkle className="h-3.5 w-3.5 text-primary" /> Suggested Evidence for this Benefit
          </p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {suggestedEvidence.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[11px] font-medium bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 text-foreground"
              >
                &bull; {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">Attach Evidence Document</label>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-muted-foreground">Document Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EvidenceType)}
              disabled={disabled}
              className="h-8 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-2 text-xs font-medium"
            >
              <option value="RECEIPT">Purchase Receipt</option>
              <option value="DAMAGE_PHOTO">Photo of Damage / Item</option>
              <option value="MERCHANT_RETURN_DENIAL">Merchant Return Denial</option>
              <option value="FLIGHT_DELAY_STATEMENT">Flight Delay Statement</option>
              <option value="BOARDING_PASS">Boarding Pass / Ticket</option>
              <option value="POLICE_REPORT">Police Report (Theft)</option>
              <option value="OTHER">Other Documentation</option>
            </select>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UploadSimple className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                <span className="text-primary hover:underline">Click to upload</span> or drag and drop files
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PNG, JPG, PDF, or DOC up to 15MB each
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attached Files List */}
      {evidenceList.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-foreground">Attached Files ({evidenceList.length})</p>
          <div className="space-y-2">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate max-w-[80%]">
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-primary shrink-0">
                    {item.mimeType.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">{item.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.evidenceType} &bull; {formatFileSize(item.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="success" className="text-[10px] py-0.5">
                    <CheckCircle className="h-3 w-3 mr-1" /> Attached
                  </Badge>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove file"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
