import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteEnvironment from "../components/SiteEnvironment";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SHAPESHIFT LABS",
  description: "everything is a source of inspiration",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SiteEnvironment />
        {children}
      </body>
    </html>
  );
}
