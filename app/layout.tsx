import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeScope — Preview and compare thousands of fonts",
  description:
    "Preview Google Fonts, Fontshare and your locally installed fonts side by side with live custom text, size, spacing and leading controls.",
};

/**
 * Applied before paint so a dark-mode user never sees a white flash.
 */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem("typescope:theme");
  var theme = stored ? JSON.parse(stored) : null;
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
