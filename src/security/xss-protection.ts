export class XSSProtection {
  static escape(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    
    return input.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  static stripTags(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  static sanitizeHTML(input: string): string {
    const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br'];
    
    let sanitized = input;
    const tagRegex = /<(\/?)([\w]+)[^>]*>/g;
    
    sanitized = sanitized.replace(tagRegex, (match, slash, tag) => {
      if (allowedTags.includes(tag.toLowerCase())) {
        return `<${slash}${tag}>`;
      }
      return '';
    });
    
    return sanitized;
  }

  static preventScriptInjection(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}