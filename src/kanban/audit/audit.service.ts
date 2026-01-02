// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';

interface AuditQuery {
  projectId?: string;
  userId?: string;
  action?: string;
  targetType?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLog>,
  ) {}

  /* ================= Get All Logs with Filters ================= */
  async getAllLogs(query: AuditQuery) {
    const filter: any = {};
    if (query.projectId) filter.project = new Types.ObjectId(query.projectId);
    if (query.userId) filter.user = new Types.ObjectId(query.userId);
    if (query.action) filter.action = query.action;
    if (query.targetType) filter.targetType = query.targetType;

    return this.auditModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  /* ================= Get Logs by User ================= */
  async getLogsByUser(userId: string) {
    return this.auditModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /* ================= Get Logs by Project ================= */
  async getLogsByProject(projectId: string) {
    return this.auditModel
      .find({ project: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /* ================= Get Logs by Target ================= */
  async getLogsByTarget(targetType: string, targetId: string) {
    return this.auditModel
      .find({
        targetType,
        targetId: new Types.ObjectId(targetId),
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
