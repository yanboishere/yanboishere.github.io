/// <reference types="vite/client" />

interface Window {
  __loadGoogleTranslate: () => Promise<void>;
  __setTranslateLang: (code: string) => void;
}
