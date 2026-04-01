import crypto from 'crypto';
import { config } from '../config';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'change-in-production';

export class WebhookSignature {
  static generate(payload: Record<string, unknown>): { signature: string; timestamp: number } {
    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${timestamp}.${JSON.stringify(payload)}`;
    
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(data)
      .digest('hex');

    return {
      signature: `sha256=${signature}`,
      timestamp,
    };
  }

  static verify(payload: string, signature: string, timestamp: number): boolean {
    const maxAge = 300;
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime - timestamp > maxAge) {
      return false;
    }

    const data = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(data)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }
}