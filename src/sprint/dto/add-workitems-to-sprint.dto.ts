// dto/add-workitems-to-sprint.dto.ts
import { IsArray, IsMongoId } from 'class-validator';

export class AddWorkItemsToSprintDto {
  @IsArray()
  @IsMongoId({ each: true })
  workItemIds: string[];
}
