import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLog>,
  ) {}

  create(data: any) {
    return this.auditLogModel.create(data);
  }

  getByIssue(issueId: string) {
    return this.auditLogModel.find({ issueId }).sort({ createdAt: -1 });
  }

  getByProject(projectId: string) {
    return this.auditLogModel.find({ projectId }).sort({ createdAt: -1 });
  }
}
