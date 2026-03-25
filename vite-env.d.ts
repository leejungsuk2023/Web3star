/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY_TARGET?: 'web' | 'app';
}

declare module 'figma:asset/*' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

