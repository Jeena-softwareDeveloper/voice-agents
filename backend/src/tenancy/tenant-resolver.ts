import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantIdHeader = req.headers['x-tenant-id'] as string;
    const user = (req as any).user;

    const tenantId = tenantIdHeader || user?.tenantId;

    if (tenantId) {
      TenantContext.run(
        {
          tenantId,
          userId: user?.id || 'system',
          role: user?.role || 'ANONYMOUS',
        },
        () => next(),
      );
    } else {
      next();
    }
  }
}
