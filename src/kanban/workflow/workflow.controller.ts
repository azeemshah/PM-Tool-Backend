// src/kanban/workflow/workflow.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Workflow } from './schemas/workflow.schema';
import { WorkflowState } from './schemas/workflow-state.schema';
import { WorkflowTransition } from './schemas/workflow-transition.schema';
import { WorkflowActivity } from './schemas/workflow-activity.schema';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { CreateTransitionDto } from './dto/create-transition.dto';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // -------------------- Workflow CRUD --------------------

  @Post()
  async create(@Body() createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
    return this.workflowService.create(createWorkflowDto);
  }

  @Get()
  async findAll(): Promise<Workflow[]> {
    return this.workflowService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Workflow> {
    return this.workflowService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateWorkflowDto: UpdateWorkflowDto): Promise<Workflow> {
    return this.workflowService.update(id, updateWorkflowDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.workflowService.remove(id);
  }

  // -------------------- Workflow States --------------------

  @Post(':workflowId/states')
  async createState(
    @Param('workflowId') workflowId: string,
    @Body() createStateDto: CreateStateDto,
  ): Promise<WorkflowState> {
    return this.workflowService.createState(workflowId, createStateDto);
  }

  @Get(':workflowId/states')
  async getStates(@Param('workflowId') workflowId: string): Promise<WorkflowState[]> {
    return this.workflowService.getStates(workflowId);
  }

  @Delete(':workflowId/states/:stateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeState(@Param('workflowId') workflowId: string, @Param('stateId') stateId: string): Promise<void> {
    return this.workflowService.removeState(workflowId, stateId);
  }

  // -------------------- Workflow Transitions --------------------

  @Post(':workflowId/transitions')
  async createTransition(
    @Param('workflowId') workflowId: string,
    @Body() createTransitionDto: CreateTransitionDto,
  ): Promise<WorkflowTransition> {
    return this.workflowService.createTransition(workflowId, createTransitionDto);
  }

  @Get(':workflowId/transitions')
  async getTransitions(@Param('workflowId') workflowId: string): Promise<WorkflowTransition[]> {
    return this.workflowService.getTransitions(workflowId);
  }

  @Delete(':workflowId/transitions/:transitionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTransition(@Param('workflowId') workflowId: string, @Param('transitionId') transitionId: string): Promise<void> {
    return this.workflowService.removeTransition(workflowId, transitionId);
  }
}
