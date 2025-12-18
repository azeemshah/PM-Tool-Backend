import { ConfigService } from '@nestjs/config';

const cfg = new ConfigService();

const uploadPaths = {
  avatars: 'avatars',
};

const getBaseUploadPath = (): string | undefined => {
  return cfg.get('STORAGE_PATH');
}

export const getUploadPath = (folder?: string): string | undefined => {

  if(folder) {
    return `${getBaseUploadPath()}/${uploadPaths[folder]}`;
  }

  return getBaseUploadPath();
}