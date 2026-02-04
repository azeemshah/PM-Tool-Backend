import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tagIds: string[];
}
