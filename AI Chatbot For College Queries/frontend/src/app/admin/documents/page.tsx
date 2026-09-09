"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, File, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./documents.module.css";

interface DocumentItem {
  id: number;
  title: string;
  url: string;
  created_at: string;
  category?: string;
  status: string;
}

export default function DocumentsPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // In a real app, you might want to poll or use websockets to update status
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.split(".")[0]);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (category) formData.append("category", category);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setFile(null);
        setTitle("");
        setCategory("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-card ${styles.uploadSection}`}>
        <h3 className="text-xl font-bold mb-4">Upload New Document</h3>
        
        {!file ? (
          <div className={styles.dropzone} onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={48} className={styles.dropzoneIcon} />
            <div>
              <p className="font-semibold text-lg">Click or drag file to this area to upload</p>
              <p className="text-secondary text-sm">Supports PDF, DOCX, TXT</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
            />
          </div>
        ) : (
          <form onSubmit={handleUpload} className={styles.uploadForm}>
            <div className="flex items-center gap-4 mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <File size={24} className="text-accent-primary" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                type="button" 
                onClick={() => setFile(null)}
                className="text-error text-sm font-medium"
              >
                Cancel
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Document Title</label>
              <input 
                type="text" 
                className="input-field" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Category</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., Syllabus, Policy, FAQ"
                value={category} 
                onChange={e => setCategory(e.target.value)} 
              />
            </div>
            
            <button type="submit" className="btn-primary mt-2" disabled={isUploading}>
              {isUploading ? <span className="spinner"></span> : <UploadCloud size={20} />}
              {isUploading ? "Uploading & Processing..." : "Upload Document"}
            </button>
          </form>
        )}
      </div>

      <div className="glass-card">
        <h3 className="text-xl font-bold mb-4">Document Library</h3>
        <div className={styles.fileList}>
          {documents.map(doc => (
            <div key={doc.id} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <File size={24} className={styles.fileIcon} />
                <div className={styles.fileDetails}>
                  <a href={doc.url} target="_blank" rel="noreferrer" className={styles.fileName}>
                    {doc.title}
                  </a>
                  <div className={styles.fileStatus}>
                    Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                    {doc.category && ` • ${doc.category}`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`${styles.statusBadge} ${styles[`status-${doc.status}`]}`}>
                  {doc.status === "INDEXED" && <CheckCircle size={12} className="inline mr-1" />}
                  {doc.status === "PROCESSING" && <Clock size={12} className="inline mr-1 animate-pulse" />}
                  {doc.status === "FAILED" && <AlertTriangle size={12} className="inline mr-1" />}
                  {doc.status}
                </span>
                
                <button 
                  onClick={() => handleDelete(doc.id)} 
                  className={styles.deleteBtn}
                  title="Delete Document"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-8 text-secondary">
              No documents uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
