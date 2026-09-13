import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arsitektur Suara — Diagram sistem lewat suara",
  description: "Ucapkan keputusan arsitektur Anda. Sistem hanya menggambarkannya.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener("error",function(e){if(e&&e.message&&e.message.indexOf("ResizeObserver")!==-1){e.stopImmediatePropagation();e.preventDefault();}},true);`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
