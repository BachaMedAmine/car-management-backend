import { Controller, Query,Patch, Get, Post, Put, Param, Body } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // Fetch all maintenance tasks for a specific car
  @Get(':carId')
  async getTasks(@Param('carId') carId: string, @Query('status') status?: string) {
      try {
          const tasks = await this.maintenanceService.getTasksForCar(carId, status);
          
          // Debugging: Log tasks returned from service
          console.log("Tasks returned to controller:", tasks);
  
          return tasks;
      } catch (error) {
          console.error("Error fetching tasks:", error.message);
          throw new Error("Could not fetch tasks. Please try again later.");
      }
  }

  // Calculate upcoming maintenance tasks for a car
  @Get(':carId/predict')
  async calculateTasks(
    @Param('carId') carId: string,
    @Query('excludedTasks') excludedTasks: string[] = [], // Optional query parameter
  ) {
    return this.maintenanceService.calculateMaintenance(carId, excludedTasks);
  }

  // Add a new maintenance task
  @Post(':carId/task')
async addTask(
  @Param('carId') carId: string,
  @Body() taskDto: { task: string; dueDate: string; status?: string },
) {
  return this.maintenanceService.addTask(carId, taskDto);
}

  // Mark a maintenance task as completed
  @Put('task/:taskId/complete')
  async completeTask(@Param('taskId') taskId: string) {
    console.log(`Completing task with ID: ${taskId}`);
    return this.maintenanceService.completeTask(taskId);
  }

  @Patch(':id')
  async updateTask(
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Body('carId') carId: string,
    @Body('newMileage') newMileage?: number,
  ) {
    return this.maintenanceService.updateTask(taskId, updateTaskDto, carId, newMileage);
  }

 
}