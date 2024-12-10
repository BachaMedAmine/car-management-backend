import { Controller, Query, Get, Post, Put, Param, Body } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // Fetch all maintenance tasks for a specific car
  @Get(':carId')
  async getTasks(@Param('carId') carId: string, @Query('status') status?: string) {
    return this.maintenanceService.getTasksForCar(carId, status);
  }

  // Calculate upcoming maintenance tasks for a car
  @Get(':carId/predict')
  async calculateTasks(@Param('carId') carId: string) {
    return this.maintenanceService.calculateMaintenance(carId);
  }

  // Add a new maintenance task
  @Post(':carId/task')
  async addTask(@Param('carId') carId: string, @Body() taskDto: { task: string; dueDate: string; status?: string }) {
    const task = {
      carId,
      task: taskDto.task,
      dueDate: new Date(taskDto.dueDate),
      status: taskDto.status || 'Pending',
    };
    return this.maintenanceService.addTask(task);
  }

  // Mark a maintenance task as completed
  @Put('task/:taskId/complete')
  async completeTask(@Param('taskId') taskId: string) {
    return this.maintenanceService.completeTask(taskId);
  }
}