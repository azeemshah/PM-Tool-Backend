import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateCommentDto {
    @IsString()
    @IsOptional()
    readonly content?: string;

    @IsArray()
    @IsOptional()
    readonly attachments?: { fileName: string; fileUrl: string; fileType?: string }[];
}
