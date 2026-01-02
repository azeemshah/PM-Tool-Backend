// src/kanban/estimation/estimation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Estimation, EstimationDocument } from './schemas/estimation.schema';
import { EstimationDto } from './dto/estimation.dto';

@Injectable()
export class EstimationService {
  constructor(
    @InjectModel(Estimation.name) private readonly estimationModel: Model<EstimationDocument>,
  ) {}

  // -------------------- Create Estimation --------------------
  async createEstimation(dto: EstimationDto): Promise<Estimation> {
    const estimation = new this.estimationModel({
      workItem: new Types.ObjectId(dto.workItemId),
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
    });
    return estimation.save();
  }

  // -------------------- Get All Estimations --------------------
  async getAllEstimations(): Promise<Estimation[]> {
    return this.estimationModel.find().populate('workItem').exec();
  }

  // -------------------- Get Estimation by ID --------------------
  async getEstimationById(id: string): Promise<Estimation> {
    const estimation = await this.estimationModel.findById(id).populate('workItem').exec();
    if (!estimation) throw new NotFoundException(`Estimation with ID ${id} not found`);
    return estimation;
  }

  // -------------------- Update Estimation --------------------
  async updateEstimation(id: string, dto: EstimationDto): Promise<Estimation> {
    const estimation = await this.estimationModel
      .findByIdAndUpdate(
        id,
        {
          workItem: new Types.ObjectId(dto.workItemId),
          estimatedHours: dto.estimatedHours,
          actualHours: dto.actualHours,
        },
        { new: true },
      )
      .populate('workItem')
      .exec();

    if (!estimation) throw new NotFoundException(`Estimation with ID ${id} not found`);
    return estimation;
  }

  // -------------------- Delete Estimation --------------------
  async deleteEstimation(id: string): Promise<{ message: string }> {
    const result = await this.estimationModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Estimation with ID ${id} not found`);
    return { message: 'Estimation deleted successfully' };
  }
}
