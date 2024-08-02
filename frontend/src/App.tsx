import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useState } from "react";
import axios from "axios";

export default function App() {

  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:3009/api/files/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("file uploaded", response.data);
    } catch (error) {
      console.log("it aint working", error)
    }
  };


  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <div>
          <form onSubmit={handleSubmit}>
            <input type='file' onChange={handleFileChange} />
            <button type='submit'>
              Upload
            </button>
            <button onClick={() => {
              axios.get('http://localhost:3009/api/files/')
                .then(response => console.log(response.data))
                .catch(error => console.error('Error:', error));
            }}>
              hello world Test
            </button>
            <button onClick={() => {
              axios.get('http://localhost:3009/api/files/test')
                .then(response => console.log(response.data))
                .catch(error => console.error('Error:', error));
            }}>
              Test object test
            </button>
          </form>
        </div>
        <UserButton />
      </SignedIn>
    </header>
  )
}