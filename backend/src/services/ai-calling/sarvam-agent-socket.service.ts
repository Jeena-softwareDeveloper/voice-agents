import { Injectable, Logger } from '@nestjs/common';
import { TestSessionRecord } from '../../integrations/sarvam/sarvam.types';
export { TestSessionRecord };

/**
 * SarvamAgentSocketService — Test Session Storage Only
 *
 * The fake WebSocket gateway has been REMOVED.
 * The Sarvam Conv AI SDK now connects DIRECTLY to the real Sarvam WebSocket
 * via the signed URL returned by the proxy.
 *
 * This service only handles test session persistence.
 */
@Injectable()
export class SarvamAgentSocketService {
  private readonly logger = new Logger(SarvamAgentSocketService.name);
  private testSessions: TestSessionRecord[] = [];

  constructor() {
    this.logger.log('SarvamAgentSocketService initialized (session storage only — no fake WebSocket gateway)');
  }

  /**
   * Save a completed test session
   */
  saveTestSession(session: TestSessionRecord): TestSessionRecord {
    this.testSessions.unshift(session);
    // Keep maximum 100 sessions in memory
    if (this.testSessions.length > 100) {
      this.testSessions = this.testSessions.slice(0, 100);
    }
    this.logger.log(`[Test Session Saved] ID=${session.id}, Service=${session.serviceName}, Duration=${session.durationSeconds}s`);
    return session;
  }

  /**
   * Retrieve test sessions for a tenant, optionally filtered by service
   */
  getTestSessions(tenantId: string, serviceId?: string): TestSessionRecord[] {
    return this.testSessions.filter(
      (s) => s.tenantId === tenantId && (!serviceId || s.serviceId === serviceId),
    );
  }
}
