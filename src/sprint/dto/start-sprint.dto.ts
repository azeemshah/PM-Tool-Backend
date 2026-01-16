import { IsDateString } from 'class-validator';

export class StartSprintDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
