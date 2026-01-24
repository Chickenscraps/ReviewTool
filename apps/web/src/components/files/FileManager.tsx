
'use client';

import React, { useState, useEffect } from 'react';
import { useResumableUpload } from '@/hooks/useResumableUpload';
// Icons would serve this well: import { Folder, File, Upload, ChevronRight, ChevronDown } from 'lucide-react';
// Assuming Lucide is installed from deps list earlier.

interface FileNode {
    id: string;
    name: string;
    isFolder: boolean;
    children?: FileNode[];
    // parentId, etc.
}

export default function FileManager({ projectId, bucketName }: { projectId: string, bucketName: string }) {
    const [files, setFiles] = useState<FileNode[]>([]);
    const { progress, isUploading, isComplete, url, error, uploadFile } = useResumableUpload({
        bucketName: bucketName,
        onSuccess: (url) => {
            // Trigger sync with backend to create FileNode record
            syncFileToBackend(url);
        }
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            uploadFile(e.target.files[0]);
        }
    };

    const syncFileToBackend = async (fileUrl: string) => {
        try {
            // We'd probably want to send the file name and size too
            const response = await fetch(`/api/projects/${projectId}/files`, {
                method: 'POST',
                body: JSON.stringify({ url: fileUrl }),
            });
            if (response.ok) {
                alert("File uploaded and synced!");
                // Refresh file list
            }
        } catch (e) {
            console.error("Sync failed", e);
        }
    };

    return (
        <div className="p-4 border rounded shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Project Files</h2>
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    <input type="file" className="hidden" onChange={handleFileSelect} />
                    Upload File
                </label>
            </div>

            {isUploading && (
                <div className="mb-4">
                    <div className="text-sm mb-1">Uploading: {Math.round(progress)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {error && <div className="text-red-500 text-sm mb-4">Upload failed: {error.message}</div>}

            <div className="border rounded h-64 overflow-y-auto p-2">
                {/* Placeholder Tree View */}
                {files.length === 0 ? (
                    <div className="text-gray-400 text-center mt-10">No files found. Upload one to get started.</div>
                ) : (
                    <div>File Tree goes here...</div>
                )}
            </div>
        </div>
    );
}
