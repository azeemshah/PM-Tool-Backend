// src/kanban/linking/work-item-link.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkItemLink, WorkItemLinkDocument, LinkType } from './schemas/work-item-link.schema';
import { CreateLinkDto } from './dto/create-link.dto';

@Injectable()
export class WorkItemLinkService {
  constructor(
    @InjectModel(WorkItemLink.name) private readonly workItemLinkModel: Model<WorkItemLinkDocument>,
  ) {}

  // -------------------- Create Work Item Link --------------------
  async createLink(dto: CreateLinkDto): Promise<WorkItemLink> {
    const link = new this.workItemLinkModel({
      sourceWorkItem: new Types.ObjectId(dto.sourceWorkItemId),
      targetWorkItem: new Types.ObjectId(dto.targetWorkItemId),
      type: dto.type,
      description: dto.description,
    });
    return link.save();
  }

  // -------------------- Get All Work Item Links --------------------
  async getAllLinks(): Promise<WorkItemLink[]> {
    return this.workItemLinkModel
      .find()
      .populate('sourceWorkItem')
      .populate('targetWorkItem')
      .exec();
  }

  // -------------------- Get Work Item Link by ID --------------------
  async getLinkById(id: string): Promise<WorkItemLink> {
    const link = await this.workItemLinkModel
      .findById(id)
      .populate('sourceWorkItem')
      .populate('targetWorkItem')
      .exec();
    if (!link) throw new NotFoundException(`Work Item Link with ID ${id} not found`);
    return link;
  }

  // -------------------- Delete Work Item Link --------------------
  async deleteLink(id: string): Promise<{ message: string }> {
    const result = await this.workItemLinkModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Work Item Link with ID ${id} not found`);
    return { message: 'Work Item Link deleted successfully' };
  }
}
