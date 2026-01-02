import { Exclude } from 'class-transformer';

export class WorkspaceResponseDto {
  _id: string;

  name: string;

  description: string;

  createdBy: any;

  members: string[];

  projects: string[];

  status: string;

  avatar: string | null;

  logo: string | null;

  settings: Record<string, any>;

  createdAt: Date;

  updatedAt: Date;
}
