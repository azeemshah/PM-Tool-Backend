import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';

@Controller('kanban/tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /* ================= Create Tag ================= */
  @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesGuard)
  @Post()
  async createTag(
    @Body() createTagDto: CreateTagDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.tagService.create(createTagDto, userId);
  }

  /* ================= Get Tags by IDs ================= */
  @Post('batch/find')
  async getTagsByIds(@Body() { tagIds }: { tagIds: string[] }) {
    return this.tagService.findByIds(tagIds);
  }

  /* ================= Search Tags (Auto-suggest) ================= */
  @Get('search/:workspaceId')
  async searchTags(
    @Param('workspaceId') workspaceId: string,
    @Query('q') searchTerm?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.tagService.searchTags(workspaceId, searchTerm || '', limitNum);
  }

  /* ================= Check Tag Existence ================= */
  @Get('check/:workspaceId/:tagName')
  async checkTagExists(
    @Param('workspaceId') workspaceId: string,
    @Param('tagName') tagName: string,
  ) {
    const exists = await this.tagService.tagExists(workspaceId, tagName);
    return { exists, tagName };
  }

  /* ================= Get All Tags by Workspace ================= */
  @Get('workspace/:workspaceId')
  async getAllTagsByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.tagService.findAllByWorkspace(workspaceId);
  }

  /* ================= Get Tag by ID ================= */
  @Get(':id')
  async getTagById(@Param('id') id: string) {
    return this.tagService.findById(id);
  }

  /* ================= Update Tag ================= */
  @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesGuard)
  @Put(':id')
  async updateTag(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagService.update(id, updateTagDto);
  }

  /* ================= Delete Tag ================= */
  @Roles('Owner', 'Admin', 'Member')
  @UseGuards(WorkspaceRolesGuard)
  @Delete(':id')
  async deleteTag(@Param('id') id: string) {
    await this.tagService.remove(id);
    return { message: 'Tag deleted successfully' };
  }
}
