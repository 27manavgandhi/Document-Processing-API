import { DocumentService } from '../../../src/services/document.service';

const documentService = new DocumentService();

describe('DocumentService', () => {
  describe('processDocument', () => {
    it('should process a PDF document', async () => {
      const result = await documentService.processDocument(
        'test.pdf',
        10240,
        'application/pdf',
        'https://example.com/test.pdf'
      );

      expect(result).toBeDefined();
      expect(result.documentInfo.fileName).toBe('test.pdf');
      expect(result.documentInfo.fileSize).toBe(10240);
      expect(result.documentInfo.mimeType).toBe('application/pdf');
      expect(result.analysis.pageCount).toBeDefined();
      expect(result.analysis.wordCount).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should process a text document', async () => {
      const result = await documentService.processDocument(
        'test.txt',
        6000,
        'text/plain'
      );

      expect(result.analysis.wordCount).toBeDefined();
      expect(result.analysis.wordCount).toBeGreaterThan(0);
    });

    it('should process an image document', async () => {
      const result = await documentService.processDocument(
        'test.jpg',
        50000,
        'image/jpeg'
      );

      expect(result.analysis.metadata).toBeDefined();
      expect(result.analysis.metadata?.format).toBe('JPG');
    });

    it('should take between min and max delay time', async () => {
      const startTime = Date.now();
      await documentService.processDocument('test.pdf', 1024, 'application/pdf');
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(10000);
      expect(duration).toBeLessThanOrEqual(21000);
    });
  });

  describe('validateFileUrl', () => {
    it('should validate a valid URL', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      const isValid = await documentService.validateFileUrl('https://example.com/file.pdf');

      expect(isValid).toBe(true);
    });

    it('should return false for invalid URL', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });

      const isValid = await documentService.validateFileUrl('https://example.com/notfound.pdf');

      expect(isValid).toBe(false);
    });

    it('should return false when fetch throws error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const isValid = await documentService.validateFileUrl('https://invalid.com/file.pdf');

      expect(isValid).toBe(false);
    });
  });
});