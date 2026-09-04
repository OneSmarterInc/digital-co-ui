import "./globals.css";
import "./console.css";

export const metadata = {
  title: "FLEXEE · DigitalCo — A fourteen-week IS/IT strategy simulation",
  description:
    "Take the CIO seat at an industrial manufacturer whose digital transformation has already failed once. Fourteen weeks, one continuous strategy, four ways it can land.",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the script below stamps data-theme on this
    // element before React hydrates, so the client tree legitimately differs
    // from the server tree by that one attribute. The flag is scoped to this
    // element only and does not hide mismatches in the tree beneath it.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Console fonts load at runtime so the build stays offline-safe. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Applied before first paint. Reading the stored choice in a client
            effect instead would render the dark default first and repaint,
            which is a white-to-dark flash on every page load for anyone using
            light mode. Wrapped in try/catch because a browser set to block
            site data throws on localStorage rather than returning null. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('flexee_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
