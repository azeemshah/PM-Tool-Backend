// src/audit/audit.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('kanban/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /* ================= Get All Audit Logs ================= */
  @Get()
  getAllLogs(
    @Query('projectId') projectId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.auditService.getAllLogs({
      projectId,
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

  /* ================= Get Logs by Project ================= */
  @Get('project/:projectId')
  getLogsByProject(@Param('projectId') projectId: string) {
    return this.auditService.getLogsByProject(projectId);
  }

  /* ================= Get Logs by Target ================= */
  @Get('target/:targetType/:targetId')
  getLogsByTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.auditService.getLogsByTarget(targetType, targetId);
  }
}
