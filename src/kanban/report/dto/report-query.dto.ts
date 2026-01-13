// src/reports/dto/report-query.dto.ts
import { IsOptional, IsString, IsEnum, IsDateString, IsArray } from 'class-validator';

export enum ReportGroupBy {
  PROJECT = 'project',
  USER = 'user',
  STATUS = 'status',
  TYPE = 'type',
  PRIORITY = 'priority',
  ASSIGNEE = 'assignee',
}

export enum ReportMetric {
  COUNT = 'count',
  CYCLE_TIME = 'cycleTime',
  LEAD_TIME = 'leadTime',
  THROUGHPUT = 'throughput',
  ESTIMATION = 'estimation',
  TIME_SPENT = 'timeSpent',
}

export class ReportQueryDto {
  /* ================= Filters ================= */
  @IsOptional()
  @IsArray()
  userIds?: string[];

  @IsOptional()
  @IsArray()
  statusIds?: string[];

  @IsOptional()
  @IsArray()
  workItemTypes?: string[];

  /* ================= Date Range ================= */
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  /* ================= Reporting Options ================= */
  @IsOptional()
  @IsEnum(ReportMetric)
  metric?: ReportMetric;

  @IsOptional()
  @IsEnum(ReportGroupBy)
  groupBy?: ReportGroupBy;

  /* ================= Pagination ================= */
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
