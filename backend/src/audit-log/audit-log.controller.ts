import { Controller, Get, Param } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('issue/:issueId')
  getByIssue(@Param('issueId') issueId: string) {
    return this.auditLogService.getByIssue(issueId);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.auditLogService.getByProject(projectId);
  }
}
