// src/search/search.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SavedFilterDto } from './dto/saved-filter.dto';

@Controller('pm-kanban/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /* ================= Create Saved Filter ================= */
  @Post('filter')
  createFilter(@Body() filterDto: SavedFilterDto) {
    return this.searchService.createFilter(filterDto);
  }

  /* ================= Get All Filters for User/Workspace ================= */
  @Get('filters')
  getFilters(@Query('workspaceId') workspaceId: string, @Query('userId') userId: string) {
    return this.searchService.getFilters(workspaceId, userId);
  }

  /* ================= Get Single Filter ================= */
  @Get('filter/:id')
  getFilter(@Param('id') id: string) {
    return this.searchService.getFilter(id);
  }

  /* ================= Update Saved Filter ================= */
  @Put('filter/:id')
  updateFilter(@Param('id') id: string, @Body() filterDto: SavedFilterDto) {
    return this.searchService.updateFilter(id, filterDto);
  }

  /* ================= Delete Saved Filter ================= */
  @Delete('filter/:id')
  deleteFilter(@Param('id') id: string) {
    return this.searchService.deleteFilter(id);
  }
}
