import { useEffect, useState } from "react";
import axios from 'axios';
import { SignedIn, SignedOut, SignInButton, useAuth, UserButton, useSignIn, useSignUp } from "@clerk/clerk-react";


interface File {
    id: string;
    filename: string;
    s3Key: string;
    s3Url: string;
    mimetype: string;
    size: number;
    createdAt: string;
}



export default function Viewer() {
    const { getToken } = useAuth();
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        console.log("fetchFiles function called");
        try {
            const token = await getToken();
            console.log("token", token);
            const response = await axios.get('/api/files/get-all', {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            console.log("API response:", response.data);
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
            setError('Failed to fetch files. Please try again.');
        }
    };

    return (
        <div>
            <h2>Your Uploaded Files</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {files.length === 0 ? (
                <p>No files found. Upload some files to see them here.</p>
            ) : (
                <ul>
                    {files.map((file) => (
                        <li key={file.id}>
                            <p>Filename: {file.filename}</p>
                            <p>S3 Key: {file.s3Key}</p>
                            <p>Size: {file.size} bytes</p>
                            <p>Uploaded at: {new Date(file.createdAt).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}