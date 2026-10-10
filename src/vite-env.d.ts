/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRAINER_PASSWORD_HASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
