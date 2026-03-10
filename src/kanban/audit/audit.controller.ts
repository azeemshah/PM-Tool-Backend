// src/audit/audit.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('pm-kanban/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /* ================= Get All Audit Logs ================= */
  @Get()
  getAllLogs(
    @Query('workspaceId') workspaceId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.auditService.getAllLogs({
      workspaceId,
      userId,
      action,
      targetType,
    });
  }

  /* ================= Get Logs by User ================= */
  @Get('user/:userId')
  getLogsByUser(@Param('userId') userId: string) {
    return this.auditService.getLogsByUser(userId);
  }

  /* ================= Get Logs by Workspace ================= */
  @Get('workspace/:workspaceId')
  getLogsByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.auditService.getLogsByWorkspace(workspaceId);
  }

  /* ================= Get Logs by Target ================= */
  @Get('target/:targetType/:targetId')
  getLogsByTarget(@Param('targetType') targetType: string, @Param('targetId') targetId: string) {
    return this.auditService.getLogsByTarget(targetType, targetId);
  }
}
