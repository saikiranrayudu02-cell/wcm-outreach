"use client";

import React, { useState } from "react";
import { Image as ImageIcon, FileVideo, Eye, X, Download, Play } from "lucide-react";

export interface DisplayMediaItem {
  id?: string;
  mediaType?: string;
  fileName: string;
  storagePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt?: any;
}

interface MediaViewerProps {
  media?: DisplayMediaItem[];
  title?: string;
  kind?: "IMAGES" | "VIDEO" | "ALL";
}

export function MediaViewer({ media = [], title, kind = "ALL" }: MediaViewerProps) {
  const [selectedImage, setSelectedImage] = useState<DisplayMediaItem | null>(null);

  const images = media.filter(
    (m) => m.mediaType === "IMAGE" || (!m.mediaType && (m.mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].some((ext) => m.fileName.toLowerCase().endsWith(ext))))
  );

  const videos = media.filter(
    (m) => m.mediaType === "VIDEO" || (!m.mediaType && (m.mimeType.startsWith("video/") || ["mp4", "mov", "webm"].some((ext) => m.fileName.toLowerCase().endsWith(ext))))
  );

  const showImages = kind === "ALL" || kind === "IMAGES";
  const showVideos = kind === "ALL" || kind === "VIDEO";

  const totalVisible = (showImages ? images.length : 0) + (showVideos ? videos.length : 0);

  if (totalVisible === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/5 text-center text-xs text-indigo-200/50">
        No media uploaded for this record.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {title && (
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          {title}
        </h4>
      )}

      {/* Images Section */}
      {showImages && images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Photos ({images.length})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {images.map((img, idx) => (
              <div
                key={img.storagePath || idx}
                onClick={() => setSelectedImage(img)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-white/15 bg-black/40 cursor-pointer shadow-sm hover:border-indigo-400 transition-all"
              >
                <img
                  src={img.fileUrl}
                  alt={img.fileName || `Photo ${idx + 1}`}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-lg bg-black/60 text-white">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white">
                  # {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {showVideos && videos.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileVideo className="h-3.5 w-3.5" />
            Video Recording ({videos.length})
          </span>

          <div className="space-y-3">
            {videos.map((vid, idx) => (
              <div
                key={vid.storagePath || idx}
                className="rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-lg space-y-2 p-2"
              >
                <video
                  src={vid.fileUrl}
                  controls
                  preload="metadata"
                  className="w-full max-h-72 object-contain rounded-lg bg-black"
                />
                <div className="flex items-center justify-between px-2 pb-1 text-xs text-slate-300">
                  <span className="font-semibold truncate max-w-xs">{vid.fileName}</span>
                  <span className="text-[10px] text-indigo-200/60 font-mono">
                    {(vid.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <a
                href={selectedImage.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-full bg-black/70 hover:bg-black text-white cursor-pointer transition-colors"
                title="Open original"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full bg-black/70 hover:bg-black text-white cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={selectedImage.fileUrl}
              alt={selectedImage.fileName}
              className="max-h-[80vh] w-auto mx-auto rounded-xl object-contain"
            />
            <div className="p-3 text-center text-xs text-slate-300 font-mono truncate">
              {selectedImage.fileName} ({(selectedImage.fileSize / (1024 * 1024)).toFixed(2)} MB)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

