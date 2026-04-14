import "./globals.css";

export const metadata = {
  title: "Hotel Dining",
  description: "Order your room dining with a simple scan",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="min-h-screen bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
}
