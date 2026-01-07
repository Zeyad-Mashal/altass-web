// Meta Pixel (Facebook Pixel) type declarations
declare global {
  interface Window {
    fbq: (
      action: 'init' | 'track' | 'trackCustom',
      eventName: string,
      params?: Record<string, any>
    ) => void;
    _fbq?: typeof window.fbq;
  }
  
  const fbq: Window['fbq'];
}

export {};

