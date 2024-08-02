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

const auth = useAuth()

export default function Viewer() {
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const token = await auth.getToken();
            const response = await axios.get('/api/files/get-all',
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    return (
        <div>
            <h2>Your Uploaded Files</h2>
            <ul>
                {files && files.map((file) => (
                    <li key={file.id}>
                        <p>Filename: {file.filename}</p>
                        <p>S3 Key: {file.s3Key}</p>
                        <p>Size: {file.size} bytes</p>
                        <p>Uploaded at: {new Date(file.createdAt).toLocaleString()}</p>
                    </li>
                ))}
            </ul>
            <input />
        </div>
    )
}

