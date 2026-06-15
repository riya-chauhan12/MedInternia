import type { AppProps } from "next/app";
import Script from "next/script";
import { CssBaseline } from "@mui/material";
import Navbar from "../components/Navbar";
import { useRouter } from "next/router";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideNavbarRoutes = ['/', '/contact', '/auth/login', '/auth/register'];
  const showNavbar = !hideNavbarRoutes.includes(router.pathname);
  return (
    <>
      <CssBaseline />
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      
      {showNavbar && <Navbar route={router.pathname} />}
      <div style={{ marginTop: showNavbar ? 64 : 0, minHeight: '100vh' }}>
        <Component {...pageProps} />
      </div>
      <style jsx global>{`
        .mouse-droplet {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, #6dd5ed 70%, #2193b0 100%);
          box-shadow: 0 0 8px 2px #6dd5ed88;
          opacity: 0.8;
          pointer-events: none;
          animation: dropletFade 0.4s forwards;
        }
        @keyframes dropletFade {
          0% { opacity: 0.8; transform: scale(1); }
          70% { opacity: 0.4; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
}

export default MyApp;
