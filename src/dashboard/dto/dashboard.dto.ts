import { IsNotEmpty } from 'class-validator';

export class GetProjectDashboardDto {
  @IsNotEmpty()
  projectId: string;
}

export class GetUserDashboardDto {
  @IsNotEmpty()
  userId: string;
}

export class GetSprintStatsDto {
  @IsNotEmpty()
  sprintId: string;
}
