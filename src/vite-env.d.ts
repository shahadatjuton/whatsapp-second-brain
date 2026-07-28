/// <reference types="vite/client" />
/// <reference types="chrome" />

// Tailwind is injected into a shadow root as a raw string via Vite's `?inline` import.
declare module '*.css?inline' {
  const content: string;
  export default content;
}
