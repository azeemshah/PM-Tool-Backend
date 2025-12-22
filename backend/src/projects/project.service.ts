import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  create(data: any) {
    return this.projectModel.create(data);
  }

  findAll() {
    return this.projectModel.find();
  }

  async findOne(id: string) {
    const project = await this.projectModel.findById(id);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  update(id: string, data: any) {
    return this.projectModel.findByIdAndUpdate(id, data, { new: true });
  }

  remove(id: string) {
    return this.projectModel.findByIdAndDelete(id);
  }
}
