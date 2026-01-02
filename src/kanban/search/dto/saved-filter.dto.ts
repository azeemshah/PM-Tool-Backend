// src/search/dto/saved-filter.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsObject, IsArray } from 'class-validator';

/* ================= Create / Update Saved Filter DTO ================= */
export class SavedFilterDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Filter name shown in UI

  @IsString()
  @IsOptional()
  description?: string; // Optional description

  @IsString()
  @IsNotEmpty()
  projectId: string; // Filter associated with a project

  @IsString()
  @IsNotEmpty()
  userId: string; // Owner of the saved filter

  @IsObject()
  @IsNotEmpty()
  filterCriteria: Record<string, any>; // JSON object storing filter rules (e.g., status, assignee)

  @IsArray()
  @IsOptional()
  columns?: string[]; // Optional: which columns to show in search results
}
