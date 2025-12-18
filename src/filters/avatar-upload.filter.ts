export const avatarAllowedTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export function avatarFilter(
  req: any,
  file: Express.Multer.File,
  callback: Function,
) {
  if (!avatarAllowedTypes.includes(file.mimetype)) {
    (req as any).fileValidationError = 'Avatar file must be a valid file type.';
    callback(null, false);
  } else {
    callback(null, true);
  }
}
