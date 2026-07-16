import "./globals.css";
import "./console.css";

export const metadata = {
  title: "DigitalCo — A fourteen-week strategy simulation",
  description:
    "Take the CIO seat at an industrial manufacturer whose digital transformation has gone sideways. Fourteen weeks, one continuous strategy, four ways it can land.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Console fonts load at runtime so the build stays offline-safe. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
