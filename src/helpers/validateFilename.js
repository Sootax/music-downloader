// Filters the song filename for invalid characters.
export default function validateFilename(originalTitle) {
  return originalTitle.replace(/[/\\?%*:|"<>]/g, ' ');
}
