import type { Metadata } from "next";
import { Geist, Geist_Mono ,Kanit } from "next/font/google";

import "tabulator-tables/dist/css/tabulator.min.css";
import "./globals.css";

import Navbar from "./src/components/navbar";

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-kanit",
});

export const metadata: Metadata = {
    title: "สุ่มรายชื่อผู้โชคดี Forest Co-op",
    description: "แอปสำหรับสุ่มรายชื่อผู้โชคดีจากสมาชิกสหกรณ์ป่าไม้ จำกัด",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="th">
            <body
                className={` ${kanit.variable} antialiased`}
            >
                <div className="min-h-screen">
                    <Navbar />
                    <main className="mx-auto max-w-8xl p-8">{children}</main>
                </div>
            </body>
        </html>
    );
}
