// src/kanban/workflow/workflow.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workflow } from './schemas/workflow.schema';
import { WorkflowState } from './schemas/workflow-state.schema';
import { WorkflowTransition } from './schemas/workflow-transition.schema';
import { WorkflowActivity } from './schemas/workflow-activity.schema';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { CreateTransitionDto } from './dto/create-transition.dto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private readonly workflowModel: Model<Workflow>,
    @InjectModel(WorkflowState.name) private readonly stateModel: Model<WorkflowState>,
    @InjectModel(WorkflowTransition.name) private readonly transitionModel: Model<WorkflowTransition>,
    @InjectModel(WorkflowActivity.name) private readonly activityModel: Model<WorkflowActivity>,
  ) {}

  // -------------------- Workflow CRUD --------------------

  async create(createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
    const workflow = new this.workflowModel(createWorkflowDto);
    return workflow.save();
  }

  async findAll(): Promise<Workflow[]> {
    return this.workflowModel.find().exec();
  }

  async findById(id: string): Promise<Workflow> {
    const workflow = await this.workflowModel.findById(id).exec();
    if (!workflow) throw new NotFoundException(`Workflow with ID ${id} not found`);
    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto): Promise<Workflow> {
    const updated = await this.workflowModel.findByIdAndUpdate(id, updateWorkflowDto, { new: true }).exec();
    if (!updated) throw new NotFoundException(`Workflow with ID ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.workflowModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Workflow with ID ${id} not found`);
  }

  // -------------------- Workflow States --------------------

  async createState(workflowId: string, createStateDto: CreateStateDto): Promise<WorkflowState> {
    const workflow = await this.findById(workflowId);
    const state = new this.stateModel({ ...createStateDto, workflow: workflow._id });
    await state.save();
    workflow.states.push(state._id);
    await workflow.save();
    return state;
  }

  async getStates(workflowId: string): Promise<WorkflowState[]> {
    return this.stateModel.find({ workflow: workflowId }).exec();
  }

  async removeState(workflowId: string, stateId: string): Promise<void> {
    const workflow = await this.findById(workflowId);
    const state = await this.stateModel.findByIdAndDelete(stateId).exec();
    if (!state) throw new NotFoundException(`State with ID ${stateId} not found`);
    workflow.states = workflow.states.filter(id => id.toString() !== stateId);
    await workflow.save();
  }

  // -------------------- Workflow Transitions --------------------

  async createTransition(workflowId: string, createTransitionDto: CreateTransitionDto): Promise<WorkflowTransition> {
    const workflow = await this.findById(workflowId);
    const transition = new this.transitionModel({ ...createTransitionDto, workflow: workflow._id });
    await transition.save();
    workflow.transitions.push(transition._id);
    await workflow.save();
    return transition;
  }

  async getTransitions(workflowId: string): Promise<WorkflowTransition[]> {
    return this.transitionModel.find({ workflow: workflowId }).exec();
  }

  async removeTransition(workflowId: string, transitionId: string): Promise<void> {
    const workflow = await this.findById(workflowId);
    const transition = await this.transitionModel.findByIdAndDelete(transitionId).exec();
    if (!transition) throw new NotFoundException(`Transition with ID ${transitionId} not found`);
    workflow.transitions = workflow.transitions.filter(id => id.toString() !== transitionId);
    await workflow.save();
  }
}

