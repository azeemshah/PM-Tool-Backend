import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tag, TagDocument } from './schemas/tag.schema';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
  ) {}

  /**
   * Create a new tag for a workspace
   * Ensures uniqueness per workspace (case-insensitive)
   */
  async create(
    createTagDto: CreateTagDto,
    userId: string,
  ): Promise<Tag> {
    const { name, workspaceId } = createTagDto;

    // Validate workspaceId
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new BadRequestException('Invalid workspace ID');
    }

    // Check for existing tag with same name (case-insensitive)
    const existingTag = await this.tagModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      name: name.toLowerCase().trim(),
    });

    if (existingTag) {
      throw new BadRequestException(
        `Tag '${name}' already exists in this workspace`,
      );
    }

    // Create new tag
    const newTag = new this.tagModel({
      name: name.toLowerCase().trim(),
      workspaceId: new Types.ObjectId(workspaceId),
      createdBy: new Types.ObjectId(userId),
    });

    return newTag.save();
  }

  /**
   * Get all tags for a workspace
   */
  async findAllByWorkspace(workspaceId: string): Promise<Tag[]> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      return [];
    }

    return this.tagModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Get a single tag by ID
   */
  async findById(id: string): Promise<Tag> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag ID');
    }

    const tag = await this.tagModel.findById(new Types.ObjectId(id)).exec() as TagDocument | null;

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return tag as Tag;
  }

  /**
   * Get tags by IDs array
   */
  async findByIds(tagIds: string[]): Promise<Tag[]> {
    const validIds = tagIds.filter((id) => Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      return [];
    }

    return this.tagModel
      .find({ _id: { $in: validIds.map((id) => new Types.ObjectId(id)) } })
      .exec();
  }

  /**
   * Update a tag
   */
  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag ID');
    }

    const tag = await this.tagModel.findById(new Types.ObjectId(id)).exec() as TagDocument | null;

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    // If name is being updated, check for duplicates
    if (updateTagDto.name?.trim().length) {
      const normalizedName = updateTagDto.name.toLowerCase().trim();
      
      const existingTag = await this.tagModel.findOne({
        workspaceId: tag.workspaceId,
        name: normalizedName,
        _id: { $ne: new Types.ObjectId(id) }, // Exclude current tag
      });

      if (existingTag) {
        throw new BadRequestException(
          `Tag '${updateTagDto.name}' already exists in this workspace`,
        );
      }

      tag.name = normalizedName;
    }

    tag.updatedAt = new Date();
    return tag.save();
  }

  /**
   * Delete a tag
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag ID');
    }

    const result = await this.tagModel.findByIdAndDelete(new Types.ObjectId(id)).exec() as TagDocument | null;

    if (!result) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
  }

  /**
   * Search tags by name pattern (for auto-suggest)
   * Returns tags matching the search pattern in a workspace
   */
  async searchTags(workspaceId: string, searchTerm: string = '', limit: number = 10): Promise<Tag[]> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      return [];
    }

    if (!searchTerm?.trim().length) {
      return this.tagModel
        .find({ workspaceId: new Types.ObjectId(workspaceId) })
        .limit(limit)
        .sort({ name: 1 })
        .exec();
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();

    return this.tagModel
      .find({
        workspaceId: new Types.ObjectId(workspaceId),
        name: { $regex: normalizedTerm, $options: 'i' },
      })
      .limit(limit)
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Check if tag exists in workspace
   */
  async tagExists(workspaceId: string, tagName: string = ''): Promise<boolean> {
    if (!Types.ObjectId.isValid(workspaceId) || !tagName?.trim().length) {
      return false;
    }

    const tag = await this.tagModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      name: tagName.toLowerCase().trim(),
    }) as TagDocument | null;

    return !!tag;
  }

  /**
   * Get tag count for a workspace
   */
  async getTagCountByWorkspace(workspaceId: string): Promise<number> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      return 0;
    }

    return this.tagModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
    });
  }

  /**
   * Get multiple tags by name pattern for a workspace
   */
  async findOrCreateTags(
    workspaceId: string,
    tagNames: string[],
    userId: string,
  ): Promise<Tag[]> {
    const createdTags: Tag[] = [];

    for (const tagName of tagNames) {
      const normalizedName = tagName.toLowerCase().trim();

      let tag = await this.tagModel.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        name: normalizedName,
      }) as TagDocument | null;

      if (!tag) {
        tag = await this.create(
          {
            name: normalizedName,
            workspaceId,
          },
          userId,
        );
      }

      createdTags.push(tag);
    }

    return createdTags;
  }
}
