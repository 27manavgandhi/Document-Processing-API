import { JobStatus } from '@prisma/client';
import { ConflictError } from './errors.util';

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  QUEUED: [JobStatus.PROCESSING, JobStatus.CANCELLED],
  SCHEDULED: [JobStatus.QUEUED, JobStatus.CANCELLED],
  PROCESSING: [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export class JobStateMachine {
  static canTransition(from: JobStatus, to: JobStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static validateTransition(from: JobStatus, to: JobStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ConflictError(
        `Invalid state transition from ${from} to ${to}. Allowed: ${VALID_TRANSITIONS[from].join(', ')}`
      );
    }
  }

  static getAllowedNextStates(current: JobStatus): JobStatus[] {
    return VALID_TRANSITIONS[current] || [];
  }

  static isTerminalState(status: JobStatus): boolean {
    return [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED].includes(status);
  }
}