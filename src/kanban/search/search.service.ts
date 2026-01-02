// src/search/search.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavedFilter } from './schemas/saved-filter.schema';
import { SavedFilterDto } from './dto/saved-filter.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(SavedFilter.name)
    private readonly savedFilterModel: Model<SavedFilter>,
  ) {}

  /* ================= Create Saved Filter ================= */
  async createFilter(filterDto: SavedFilterDto) {
    const filter = new this.savedFilterModel({
      ...filterDto,
      project: new Types.ObjectId(filterDto.projectId),
      user: new Types.ObjectId(filterDto.userId),
    });
    return filter.save();
  }

  /* ================= Get All Filters for User/Project ================= */
  async getFilters(projectId: string, userId: string) {
    return this.savedFilterModel
      .find({
        project: new Types.ObjectId(projectId),
        user: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /* ================= Get Single Filter ================= */
  async getFilter(id: string) {
    const filter = await this.savedFilterModel.findById(id).exec();
    if (!filter) throw new NotFoundException('Filter not found');
    return filter;
  }

  /* ================= Update Saved Filter ================= */
  async updateFilter(id: string, filterDto: SavedFilterDto) {
    const filter = await this.savedFilterModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: filterDto.name,
          description: filterDto.description,
          filterCriteria: filterDto.filterCriteria,
          columns: filterDto.columns || [],
        },
      },
      { new: true },
    );
    if (!filter) throw new NotFoundException('Filter not found');
    return filter;
  }

  /* ================= Delete Saved Filter ================= */
  async deleteFilter(id: string) {
    const filter = await this.savedFilterModel.findByIdAndDelete(id);
    if (!filter) throw new NotFoundException('Filter not found');
    return { deleted: true };
  }
}
