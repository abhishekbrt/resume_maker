export function getCookieValue(cookieHeader: string, name: string): string {
  if (!cookieHeader) {
    return '';
  }

  const entries = cookieHeader.split(';');
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }

  return '';
}
