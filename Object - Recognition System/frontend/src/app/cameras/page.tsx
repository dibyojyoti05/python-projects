"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  fetchCameras,
  createCamera,
  updateCamera,
  deleteCamera,
  toggleCameraAi,
  startStream,
  stopStream,
  getStreamUrl
} from "@/lib/api";

interface Camera {
  id: number;
  name: string;
  location: string;
  rtsp_url: string;
  ai_enabled: boolean;
  is_active: boolean;
  is_connected: boolean;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCamera, setEditCamera] = useState<Camera | null>(null);
  const [previewCamera, setPreviewCamera] = useState<Camera | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCameras = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCameras();
      setCameras(data);
    } catch (e) {
      console.error(e);
      showToast("Failed to load cameras", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCamera({
        name,
        location,
        rtsp_url: rtspUrl,
        ai_enabled: aiEnabled
      });
      showToast(`Camera "${name}" created successfully!`);
      setName("");
      setLocation("");
      setRtspUrl("");
      setIsAddOpen(false);
      await loadCameras();
    } catch (err: any) {
      showToast(err.message || "Failed to add camera", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCamera) return;
    setSubmitting(true);
    try {
      await updateCamera(editCamera.id, {
        name: editCamera.name,
        location: editCamera.location,
        rtsp_url: editCamera.rtsp_url,
        ai_enabled: editCamera.ai_enabled
      });
      showToast(`Camera "${editCamera.name}" updated!`);
      setEditCamera(null);
      await loadCameras();
    } catch (err: any) {
      showToast(err.message || "Failed to update camera", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (camera: Camera) => {
    if (!window.confirm(`Are you sure you want to delete camera "${camera.name}"?`)) return;
    try {
      await deleteCamera(camera.id);
      showToast(`Camera "${camera.name}" deleted`);
      await loadCameras();
    } catch (err: any) {
      showToast(err.message || "Failed to delete camera", "error");
    }
  };

  const handleToggleAi = async (cam: Camera) => {
    try {
      await toggleCameraAi(cam.id);
      showToast(`AI Tracking ${!cam.ai_enabled ? "Enabled" : "Disabled"} on ${cam.name}`);
      await loadCameras();
    } catch (err) {
      showToast("Failed to toggle AI", "error");
    }
  };

  const handleStartStream = async (cam: Camera) => {
    try {
      await startStream(cam.id);
      showToast(`Live stream started for ${cam.name}`);
    } catch (err) {
      showToast("Failed to start stream", "error");
    }
  };

  const handleStopStream = async (cam: Camera) => {
    try {
      await stopStream(cam.id);
      showToast(`Stream stopped for ${cam.name}`);
    } catch (err) {
      showToast("Failed to stop stream", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-300 border-rose-500/40"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Camera Fleet Management</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure RTSP streams, manage edge nodes, and toggle neural detection
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadCameras}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs transition-colors shadow-md shadow-emerald-500/20"
          >
            + Register Camera
          </button>
        </div>
      </div>

      {/* Cameras Grid */}
      {loading && cameras.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">Loading registered camera fleet...</div>
      ) : cameras.length === 0 ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">No cameras registered yet</h3>
          <p className="text-xs text-neutral-400 mt-1">Add your first RTSP stream or local webcam to get started.</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-600"
          >
            Add Camera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 font-bold font-mono text-xs">
                      #{cam.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{cam.name}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">{cam.location || "Unassigned"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        cam.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {cam.is_active ? "ACTIVE" : "OFFLINE"}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        cam.ai_enabled
                          ? "bg-teal-500/10 text-teal-300 border-teal-500/20"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {cam.ai_enabled ? "AI ON" : "AI OFF"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-2.5 rounded-lg bg-black/50 border border-neutral-800/80 font-mono text-xs text-neutral-400 truncate">
                  <span className="text-neutral-500 select-none">RTSP: </span>
                  {cam.rtsp_url}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewCamera(cam)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Watch Stream</span>
                  </button>
                  <button
                    onClick={() => handleToggleAi(cam)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
                  >
                    Toggle AI
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleStartStream(cam)}
                    title="Initialize Stream"
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => handleStopStream(cam)}
                    title="Stop Stream"
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700"
                  >
                    Stop
                  </button>
                  <button
                    onClick={() => setEditCamera(cam)}
                    title="Edit Camera"
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(cam)}
                    title="Delete Camera"
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Camera Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Register New Camera</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Camera Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. West Perimeter Fence"
                  className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Physical Location / Zone</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sector 4 - Guard Post B"
                  className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  RTSP Stream URL (or 0 for local webcam/simulator)
                </label>
                <input
                  type="text"
                  required
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://192.168.1.100:554/live or 0"
                  className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="aiEnabled"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 bg-black h-4 w-4"
                />
                <label htmlFor="aiEnabled" className="text-xs font-medium text-neutral-300">
                  Enable AI Object Recognition & Tracking
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Save Camera"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Camera Modal */}
      {editCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Edit Camera #{editCamera.id}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Camera Name</label>
                <input
                  type="text"
                  required
                  value={editCamera.name}
                  onChange={(e) => setEditCamera({ ...editCamera, name: e.target.value })}
                  className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Physical Location</label>
                <input
                  type="text"
                  required
                  value={editCamera.location}
                  onChange={(e) => setEditCamera({ ...editCamera, location: e.target.value })}
                  className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">RTSP Stream URL</label>
                <input
                  type="text"
                  required
                  value={editCamera.rtsp_url}
                  onChange={(e) => setEditCamera({ ...editCamera, rtsp_url: e.target.value })}
                  className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="editAiEnabled"
                  checked={editCamera.ai_enabled}
                  onChange={(e) => setEditCamera({ ...editCamera, ai_enabled: e.target.checked })}
                  className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 bg-black h-4 w-4"
                />
                <label htmlFor="editAiEnabled" className="text-xs font-medium text-neutral-300">
                  AI Object Detection Enabled
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditCamera(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Watch Stream Modal */}
      {previewCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-white text-base">
                  Live Stream: {previewCamera.name} (CAM #{previewCamera.id})
                </h3>
              </div>
              <button
                onClick={() => setPreviewCamera(null)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="my-4 aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getStreamUrl(previewCamera.id)}
                alt="Camera Live Stream"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-400">
              <span>Location: {previewCamera.location}</span>
              <button
                onClick={() => setPreviewCamera(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-semibold"
              >
                Close Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
