import { Toaster } from 'react-hot-toast';
export default function LoginLayout({ children }) {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {children}
    </>
  );
}
