
import { useState, useCallback } from 'react';
import * as tus from 'tus-js-client';

interface UploadState {
    progress: number;
    isUploading: boolean;
    isComplete: boolean;
    error: Error | null;
    url: string | null;
}

interface UseResumableUploadOptions {
    bucketName: string;
    endpoint?: string; // Defaults to standard Supabase endpoint if not provided
    onSuccess?: (url: string) => void;
    onError?: (error: Error) => void;
}

export function useResumableUpload({ bucketName, endpoint, onSuccess, onError }: UseResumableUploadOptions) {
    const [uploadState, setUploadState] = useState<UploadState>({
        progress: 0,
        isUploading: false,
        isComplete: false,
        error: null,
        url: null,
    });

    const uploadFile = useCallback((file: File, options?: { fileName?: string }) => {
        setUploadState(prev => ({ ...prev, isUploading: true, error: null, progress: 0 }));

        // TODO: Get these from env or config context
        const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
        const itemsUrl = endpoint || `https://${projectId}.supabase.co/storage/v1/upload/resumable`;

        // Authorization
        // For public buckets, Anon key is often enough. For private, need bearer token (JWT).
        // We should probably pass a token here if authenticated.
        const token = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const upload = new tus.Upload(file, {
            endpoint: itemsUrl,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
                authorization: `Bearer ${token}`,
                'x-upsert': 'true', // Optional: overwrite existing
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true, // Important for allowing re-uploads of same file
            metadata: {
                bucketName: bucketName,
                objectName: options?.fileName || file.name,
                contentType: file.type,
                cacheControl: '3600',
            },
            onError: function (error) {
                console.error('Upload failed:', error);
                setUploadState(prev => ({ ...prev, isUploading: false, error }));
                if (onError) onError(error);
            },
            onProgress: function (bytesUploaded, bytesTotal) {
                const percentage = (bytesUploaded / bytesTotal) * 100;
                setUploadState(prev => ({ ...prev, progress: percentage }));
            },
            onSuccess: function () {
                console.log('Upload finished:', upload.url);
                // Construct public URL or use returned URL
                // TUS return URL might be the upload session URL, NOT the download URL.
                // Supabase download URL pattern:
                const downloadUrl = `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${options?.fileName || file.name}`;

                setUploadState(prev => ({
                    ...prev,
                    isUploading: false,
                    isComplete: true,
                    url: downloadUrl,
                }));

                if (onSuccess) onSuccess(downloadUrl);
            },
        });

        // Check if there are any previous uploads to continue.
        upload.findPreviousUploads().then(function (previousUploads) {
            // Found previous uploads so we select the first one. 
            if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0]);
            }
            // Start the upload
            upload.start();
        });

        return upload; // Return instance to allow pause/abort
    }, [bucketName, endpoint, onSuccess, onError]);

    return {
        ...uploadState,
        uploadFile,
    };
}
