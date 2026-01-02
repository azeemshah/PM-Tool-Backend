// src/kanban/estimation/estimation.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { EstimationService } from './estimation.service';
import { EstimationDto } from './dto/estimation.dto';

@Controller('kanban/estimations')
export class EstimationController {
  constructor(private readonly estimationService: EstimationService) {}

  // -------------------- Create Estimation --------------------
  @Post()
  async createEstimation(@Body() dto: EstimationDto) {
    return this.estimationService.createEstimation(dto);
  }

  // -------------------- Get All Estimations --------------------
  @Get()
  async getAllEstimations() {
    return this.estimationService.getAllEstimations();
  }

  // -------------------- Get Estimation by ID --------------------
  @Get(':id')
  async getEstimationById(@Param('id') id: string) {
    return this.estimationService.getEstimationById(id);
  }

  // -------------------- Update Estimation --------------------
  @Put(':id')
  async updateEstimation(@Param('id') id: string, @Body() dto: EstimationDto) {
    return this.estimationService.updateEstimation(id, dto);
  }

  // -------------------- Delete Estimation --------------------
  @Delete(':id')
  async deleteEstimation(@Param('id') id: string) {
    return this.estimationService.deleteEstimation(id);
  }
}
