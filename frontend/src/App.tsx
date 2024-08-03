import { SignedIn, SignedOut, SignInButton, useAuth, UserButton, useSignIn, useSignUp } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { Clerk } from '@clerk/clerk-js'
import Viewer from "./components/view-uploads";

const clerk = new Clerk('pk_test_bWFueS1jb25kb3ItNjEuY2xlcmsuYWNjb3VudHMuZGV2JA');
await clerk.load();

export default function App() {

  const [file, setFile] = useState<File | null>(null)

  const auth = useAuth()



  const { isLoaded: isSignInLoaded, signIn: signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp: signUp } = useSignUp();

  useEffect(() => {
    const createUser = async () => {
      if (isSignInLoaded || isSignUpLoaded) {
        try {
          const token = await auth.getToken();
          const userEmail = clerk.user?.primaryEmailAddress?.emailAddress;

          if (!userEmail) {
            console.error("User email not available");
            return;
          }

          await axios.post("http://localhost:3009/api/users",
            { email: userEmail },
            {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            }
          );
          console.log("User created or updated in the database");
        } catch (error) {
          console.error("Error creating/updating user:", error);
        }
      }
    };

    if (isSignInLoaded && isSignUpLoaded) {
      createUser();
    }
  }, [isSignInLoaded, isSignUpLoaded, auth]);

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
          "Authorization": `Bearer ${await auth.getToken()}`
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                  </div>
                  <input id="file-upload" type='file' onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected file: {file.name}
                </div>
              )}
              <button type='submit' className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                Upload
              </button>
              <div className="flex space-x-4">
                <button
                  className="flex-1 px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                  onClick={() => {
                    axios.get('http://localhost:3009/api/files/')
                      .then(response => console.log(response.data))
                      .catch(error => console.error('Error:', error));
                  }}
                >
                  Hello World Test
                </button>
                <button
                  className="flex-1 px-4 py-2 text-white bg-purple-500 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  onClick={() => {
                    axios.get('http://localhost:3009/api/files/test')
                      .then(response => console.log(response.data))
                      .catch(error => console.error('Error:', error));
                  }}>
                  Test With Object
                </button>
              </div>
            </form>
          </div>
          <Viewer />
        </div>
        <UserButton />
      </SignedIn>
    </header>
  )
}