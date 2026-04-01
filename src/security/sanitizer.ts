export class Sanitizer {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 255);
  }

  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.toString();
    } catch {
      throw new Error('Invalid URL');
    }
  }

  static sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized as T;
  }

  static removeNullBytes(input: string): string {
    return input.replace(/\0/g, '');
  }

  static limitLength(input: string, maxLength: number): string {
    return input.substring(0, maxLength);
  }
}