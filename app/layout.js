import  { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/header";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"]});

export const metadata = {
  title: "TuniFia",
  description: "Finance platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.className} antialiased`}
        >
          {/* header can be added here */}
          <Header />
          <main className="min-h-screen">{children}</main>
          {/* footer can be added here */}
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-sm text-gray-500">
              <p>made with love by aziz kchaou</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
