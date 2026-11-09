"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { MediaItemInput } from "@/lib/media-sync";

interface MediaUploaderProps {
  category: "VERIFICATION_IMAGE" | "EVALUATION_IMAGE" | "EVALUATION_VIDEO";
  value: MediaItemInput[];
  onChange: (items: MediaItemInput[]) => void;
  recordId?: string;
  disabled?: boolean;
  title?: string;
  description?: string;
  minCount?: number;
  maxCount?: number;
}

export function MediaUploader({
  category,
  value = [],
  onChange,
  recordId = "draft",
  disabled = false,
  title,
  description,
  minCount = 1,
  maxCount = 5,
}: MediaUploaderProps) {
  const isVideo = category === "EVALUATION_VIDEO";
  const defaultTitle = isVideo
    ? "Evaluation Video"
    : category === "VERIFICATION_IMAGE"
    ? "Verification Images"
    : "Evaluation Images";
  const displayTitle = title || defaultTitle;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItemInput | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const allowedFormatsText = isVideo
    ? "MP4, MOV, WEBM (Max 50MB)"
    : "JPG, JPEG, PNG, WEBP (Max 10MB per image)";

  const acceptTypes = isVideo
    ? "video/mp4,video/quicktime,video/webm"
    : "image/jpeg,image/png,image/webp,image/jpg";

  // Upload handler
  const handleUploadFiles = async (files: FileList | null, isReplace = false) => {
    if (!files || files.length === 0) return;

    if (isVideo) {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["mp4", "mov", "webm"].includes(ext || "")) {
        toast.error("Invalid video format. Supported: MP4, MOV, WEBM.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Video file exceeds the 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }

      setUploading(true);
      setUploadProgress(15);
      const progressTimer = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 15 : p));
      }, 400);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);
        formData.append("recordId", recordId);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressTimer);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload video");
        }

        setUploadProgress(100);
        toast.success("Video uploaded successfully!");
        onChange([data.media]);
      } catch (err: any) {
        toast.error(err.message || "Video upload failed");
      } finally {
        clearInterval(progressTimer);
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (replaceInputRef.current) replaceInputRef.current.value = "";
      }
      return;
    }

    // Image upload handling
    const availableSlots = isReplace ? 1 : maxCount - value.length;
    if (availableSlots <= 0) {
      toast.error(`Maximum of ${maxCount} images allowed.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots && !isReplace) {
      toast.warning(`Only ${availableSlots} more image(s) could be selected (max ${maxCount}).`);
    }

    // Validate image files
    for (const file of filesToUpload) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
        toast.error(`"${file.name}" is not a supported format (use JPG, PNG, WEBP).`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 10MB limit.`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(20);
    const uploadedItems: MediaItemInput[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);
        formData.append("recordId", recordId);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload "${file.name}"`);
        }
        uploadedItems.push(data.media);
        setUploadProgress(20 + Math.round(((i + 1) / filesToUpload.length) * 75));
      }

      if (isReplace && replacingIndex !== null) {
        const next = [...value];
        next[replacingIndex] = uploadedItems[0];
        onChange(next);
        toast.success("Image replaced successfully!");
      } else {
        onChange([...value, ...uploadedItems]);
        toast.success(`Uploaded ${uploadedItems.length} image(s)!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setReplacingIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  const handleRemoveItem = async (index: number) => {
    if (disabled) return;
    const itemToRemove = value[index];
    const next = value.filter((_, i) => i !== index);
    onChange(next);

    // Optionally cleanup on server
    if (itemToRemove?.storagePath) {
      fetch("/api/media/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: itemToRemove.storagePath }),
      }).catch(() => {});
    }
    toast.info("Media item removed");
  };

  const triggerReplace = (index: number) => {
    if (disabled) return;
    setReplacingIndex(index);
    replaceInputRef.current?.click();
  };

  return (
    <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 text-left">
      {/* Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            {isVideo ? (
              <FileVideo className="h-4 w-4 text-purple-400" />
            ) : (
              <ImageIcon className="h-4 w-4 text-indigo-400" />
            )}
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {displayTitle} <span className="text-rose-400">*</span>
            </h4>
          </div>
          <p className="text-[11px] text-indigo-200/60 mt-0.5">
            {description || (isVideo ? "Upload at least 1 meeting evaluation video." : `Upload between ${minCount} and ${maxCount} photos.`)}
          </p>
        </div>

        {/* Counter Badge */}
        {!isVideo ? (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                value.length >= minCount
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              }`}
            >
              Uploaded: {value.length}/{maxCount}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                value.length > 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              }`}
            >
              {value.length > 0 ? "1 Video Selected" : "0/1 Uploaded"}
            </span>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={!isVideo}
        disabled={disabled || uploading}
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files, false)}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={acceptTypes}
        multiple={false}
        disabled={disabled || uploading}
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files, true)}
      />

      {/* Uploading Progress Indicator */}
      {uploading && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              Uploading to Cloud Storage...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Video View & Upload Area */}
      {isVideo && (
        <div className="space-y-3">
          {value.length > 0 && value[0] ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-lg">
                <video
                  src={value[0].fileUrl}
                  controls
                  preload="metadata"
                  className="w-full max-h-72 object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{value[0].fileName}</p>
                    <p className="text-[10px] text-indigo-200/60 font-mono">
                      {(value[0].fileSize / (1024 * 1024)).toFixed(1)} MB • Cloud Stored
                    </p>
                  </div>
                </div>

                {!disabled && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => triggerReplace(0)}
                      disabled={uploading}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(0)}
                      disabled={uploading}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 sm:p-8 rounded-xl border-2 border-dashed border-white/15 hover:border-purple-400/50 bg-white/5 hover:bg-purple-500/5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group text-center"
            >
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Click to Upload Evaluation Video
              </p>
              <p className="text-[11px] text-indigo-200/60 font-mono">
                {allowedFormatsText}
              </p>
            </button>
          )}
        </div>
      )}

      {/* Image Grid & Add Button */}
      {!isVideo && (
        <div className="space-y-3">
          {/* Grid of uploaded images */}
          {value.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {value.map((img, idx) => (
                <div
                  key={img.storagePath || idx}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-white/15 bg-black/40 shadow-sm"
                >
                  <img
                    src={img.fileUrl}
                    alt={img.fileName || `Image ${idx + 1}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Image number badge */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                    #{idx + 1}
                  </div>

                  {/* Desktop Actions overlay (>= sm) */}
                  <div className="absolute inset-0 bg-black/60 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-1.5 p-2 backdrop-blur-xs">
                    <button
                      type="button"
                      title="Enlarge Preview"
                      onClick={() => setPreviewItem(img)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer min-h-9 min-w-9 flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!disabled && (
                      <>
                        <button
                          type="button"
                          title="Replace Image"
                          onClick={() => triggerReplace(idx)}
                          disabled={uploading}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer min-h-9 min-w-9 flex items-center justify-center"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Remove Image"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={uploading}
                          className="p-2 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition-colors cursor-pointer min-h-9 min-w-9 flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Mobile Direct Touch Actions Bar (< sm) */}
                  <div className="sm:hidden absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-xs p-1.5 flex items-center justify-around gap-1 border-t border-white/10 z-10">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(img)}
                      className="p-1.5 rounded-md bg-white/20 text-white active:bg-white/30 cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {!disabled && (
                      <>
                        <button
                          type="button"
                          onClick={() => triggerReplace(idx)}
                          disabled={uploading}
                          className="p-1.5 rounded-md bg-white/20 text-white active:bg-white/30 cursor-pointer"
                          title="Replace"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={uploading}
                          className="p-1.5 rounded-md bg-rose-500/80 text-white active:bg-rose-600 cursor-pointer"
                          title="Delete"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Images Button / Dropzone */}
          {value.length < maxCount && !disabled && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-dashed border-white/15 bg-white/5">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-white">
                  Add Images ({value.length}/{maxCount})
                </p>
                <p className="text-[10px] text-indigo-200/60 font-mono mt-0.5">
                  {allowedFormatsText}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>+ Add Images</span>
              </button>
            </div>
          )}

          {/* Min count validation hint */}
          {value.length < minCount && (
            <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Minimum {minCount} image is required to submit this form.
            </p>
          )}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewItem.fileUrl}
              alt={previewItem.fileName}
              className="max-h-[80vh] w-auto mx-auto rounded-xl object-contain"
            />
            <div className="p-3 text-center text-xs text-slate-300 font-mono truncate">
              {previewItem.fileName} ({(previewItem.fileSize / (1024 * 1024)).toFixed(2)} MB)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

