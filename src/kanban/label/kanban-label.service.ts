import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KanbanLabel, KanbanLabelDocument } from '../board/schemas/kanban-label.schema';

@Injectable()
export class KanbanLabelService {
  constructor(
    @InjectModel(KanbanLabel.name) private labelModel: Model<KanbanLabelDocument>,
  ) {}

  async create(createLabelDto: { board: string; name: string; color?: string }): Promise<KanbanLabel> {
    const { board, name, color } = createLabelDto;

    // Check for duplicate name in the board
    const existing = await this.labelModel.findOne({ 
      board: new Types.ObjectId(board), 
      name: { $regex: new RegExp(`^${name}$`, 'i') } // Case insensitive check
    });
    
    if (existing) {
      throw new BadRequestException(`Label '${name}' already exists on this board`);
    }

    const newLabel = new this.labelModel({
      board: new Types.ObjectId(board),
      name,
      color: color || '#3b82f6',
    });

    return newLabel.save();
  }

  async findAllByBoard(boardId: string): Promise<KanbanLabel[]> {
    if (!Types.ObjectId.isValid(boardId)) {
        return [];
    }
    return this.labelModel.find({ board: new Types.ObjectId(boardId) }).sort({ name: 1 }).exec();
  }

  async update(id: string, updateLabelDto: { name?: string; color?: string }): Promise<KanbanLabel> {
    const label = await this.labelModel.findByIdAndUpdate(
      id,
      { $set: updateLabelDto },
      { new: true },
    ).exec();

    if (!label) {
      throw new NotFoundException(`Label with ID ${id} not found`);
    }

    return label;
  }

  async remove(id: string): Promise<void> {
    const result = await this.labelModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Label with ID ${id} not found`);
    }
  }
}
