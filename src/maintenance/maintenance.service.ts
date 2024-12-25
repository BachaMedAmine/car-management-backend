import { Injectable , NotFoundException,BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance } from './schemas/maintenance.schema';
import { CarsService } from '../cars/cars.service';
import { spawn } from 'child_process';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Types } from 'mongoose';
import { v4 as isValidUUID } from 'uuid';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name) private maintenanceModel: Model<Maintenance>,
    private carsService: CarsService,
  ) {}

  // Calculate maintenance tasks for a specific car
  async calculateMaintenance(carId: string, excludedTasks: string[] = []): Promise<any> {
    const car = await this.carsService.getCarById(carId);

    if (!car) {
      throw new Error('Car not found');
    }

    console.log('--- Maintenance Calculation Start ---');
    console.log('Car Data:', car);

    const maintenanceTasks = [];
    const recentTasks = await this.getRecentTasks(carId);

    console.log('Recent Tasks:', recentTasks);
    console.log('Excluded Tasks:', excludedTasks);

    // Handle edge case for 0 km
    if (car.mileage === 0) {
      console.log('Car has 0 km. Scheduling first oil change based on time.');
      if (!excludedTasks.includes('First Oil Change')) {
        maintenanceTasks.push({
          carId: carId,
          task: 'First Oil Change',
          dueDate: this.calculateDueDate(180), // Due in 180 days
          status: 'Pending',
        });
      }
      console.log('Generated Maintenance Tasks for 0 km:', maintenanceTasks);
      console.log('--- Maintenance Calculation End ---');
      return this.saveTasks(maintenanceTasks); // Save and return tasks
    }

    // Oil change logic: Calculate the next milestone
    const oilChangeInterval = 10000; // Every 10,000 km
    const nextOilChange = Math.ceil(car.mileage / oilChangeInterval) * oilChangeInterval;

    console.log('Current Mileage:', car.mileage);
    console.log('Next Oil Change Mileage:', nextOilChange);

    if (!recentTasks.includes('Oil Change') && !excludedTasks.includes('Oil Change')) {
      maintenanceTasks.push({
        carId: carId,
        task: 'Oil Change',
        dueDate: null, // Mileage-based recommendation
        nextMileage: nextOilChange, // Next milestone for oil change
        status: 'Pending',
      });
      console.log('Oil Change Task Added:', {
        carId: carId,
        task: 'Oil Change',
        nextMileage: nextOilChange,
        status: 'Pending',
      });
    } else {
      console.log('Oil Change Task Already Completed or Excluded.');
    }

    // Timing chain replacement logic
    const timingChainIntervalMileage = 120000; // Replace every 120,000 km
    const timingChainIntervalDays = 365; // Replace every 1 year

    const lastTimingChainReplacementDate = new Date(car.lastTimingChainReplacementDate || 0);
    const nextTimingChainMileage = Math.ceil(car.mileage / timingChainIntervalMileage) * timingChainIntervalMileage;
    const nextTimingChainDate = new Date(lastTimingChainReplacementDate);
    nextTimingChainDate.setDate(nextTimingChainDate.getDate() + timingChainIntervalDays);

    const currentDate = new Date();

    console.log('Next Timing Chain Replacement Mileage:', nextTimingChainMileage);
    console.log('Next Timing Chain Replacement Date:', nextTimingChainDate);

    if (
      (!recentTasks.includes('Timing Chain Replacement') &&
        !excludedTasks.includes('Timing Chain Replacement')) &&
      (car.mileage >= nextTimingChainMileage || currentDate >= nextTimingChainDate)
    ) {
      maintenanceTasks.push({
        carId: carId,
        task: 'Timing Chain Replacement',
        dueDate: nextTimingChainDate, // Due date based on time
        nextMileage: nextTimingChainMileage, // Next milestone for mileage
        status: 'Pending',
      });
      console.log('Timing Chain Replacement Task Added:', {
        carId: carId,
        task: 'Timing Chain Replacement',
        dueDate: nextTimingChainDate,
        nextMileage: nextTimingChainMileage,
        status: 'Pending',
      });
    } else {
      console.log('Timing Chain Replacement Not Due Yet');
    }

    // Predefined tasks for other maintenance
    if (car.mileage > 50000 && !recentTasks.includes('Brake Change') && !excludedTasks.includes('Brake Change')) {
      maintenanceTasks.push({
        carId: carId,
        task: 'Brake Change',
        dueDate: this.calculateDueDate(60), // Example: 60 days from now
        status: 'Pending',
      });
      console.log('Brake Change Task Added');
    }

    if (car.mileage > 50000 && !recentTasks.includes('Tire Replacement') && !excludedTasks.includes('Tire Replacement')) {
      maintenanceTasks.push({
        carId: carId,
        task: 'Tire Replacement',
        dueDate: this.calculateDueDate(90), // Example: 90 days from now
        status: 'Pending',
      });
      console.log('Tire Replacement Task Added');
    }

    console.log('Generated Maintenance Tasks:', maintenanceTasks);
    console.log('--- Maintenance Calculation End ---');

    return this.saveTasks(maintenanceTasks); // Save and return tasks
  }

  // Helper function to save tasks to the database
  private async saveTasks(tasks: any[]): Promise<any[]> {
    const savedTasks = [];
    for (const task of tasks) {
        try {
            // Find the existing task
            const existingTask = await this.maintenanceModel.findOne({
                carId: task.carId,
                task: task.task,
                status: 'Pending',
            });

            if (existingTask) {
                // Update the existing task with new data
                existingTask.dueDate = task.dueDate || existingTask.dueDate;
                existingTask.nextMileage = task.nextMileage || existingTask.nextMileage;
                await existingTask.save();
                savedTasks.push(existingTask);
                console.log(`Updated Task: ${task.task} for car ${task.carId}`);
            } else {
                // Save new task if no duplicate found
                const newTask = new this.maintenanceModel(task);
                const savedTask = await newTask.save();
                savedTasks.push(savedTask);
                console.log(`Created New Task: ${task.task} for car ${task.carId}`);
            }
        } catch (error) {
            console.error(`Error saving task "${task.task}":`, error.message);
        }
    }
    return savedTasks;
}

  // Helper: Calculate a future due date
  private calculateDueDate(daysFromNow: number): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    return dueDate;
  }

  // Call the Python script for AI-based predictions (if applicable)
  async predictUsingAI(features: number[]): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const process = spawn('./venv/bin/python3', ['predict.py', ...features.map(String)]);

      process.stdout.on('data', (data) => {
        try {
          const predictions = JSON.parse(data.toString().trim());
          resolve(predictions);
        } catch (error) {
          reject(`Failed to parse prediction response: ${error.message}`);
        }
      });

      process.stderr.on('data', (data) => {
        reject(data.toString());
      });
    });
  }

  // Add a new maintenance task
  async addTask(carId: string, taskDto: { task: string; dueDate: string; status?: string }) {
    const car = await this.carsService.getCarById(carId);
    if (!car) throw new NotFoundException('Car not found');
  
    // Define the base task
    const task = {
      carId,
      task: taskDto.task,
      dueDate: new Date(taskDto.dueDate),
      status: taskDto.status || 'Pending',
      nextMileage: null, // Default value
    };
  
    // Logic to auto-calculate `nextMileage` for specific tasks
    switch (task.task) {
      case 'Oil Change':
        task.nextMileage = car.mileage + 10000;
        break;
      case 'Timing Chain Replacement':
        task.nextMileage = car.mileage + 120000;
        break;
      case 'Brake Change':
        task.nextMileage = car.mileage + 30000;
        break;
      case 'Tire Replacement':
        task.nextMileage = car.mileage + 50000;
        break;
      default:
        task.nextMileage = null;
    }
  
    // Save the task
    const newTask = new this.maintenanceModel(task);
    return newTask.save();
  }

  // Fetch tasks for a specific car
  
  async getTasksForCar(carId: string, status?: string): Promise<any[]> {
    const query: any = { carId };

    // Add status to the query if provided and valid
    if (status && status !== 'undefined') {
        query['status'] = status;
    }

    // Fetch tasks and ensure `_id` is converted to a string
    const tasks = await this.maintenanceModel.find(query).lean();
    return tasks.map(task => {
        const id = task._id?.toString(); // Convert `_id` to a string
        return {
            ...task,
            _id: Types.ObjectId.isValid(id) || isValidUUID(id) ? id : task._id, // Validate as ObjectId or UUID
        };
    });
}

  // Mark a task as completed
  async completeTask(taskId: string): Promise<Maintenance> {
    // Convert taskId to ObjectId
    if (!Types.ObjectId.isValid(taskId)) {
        throw new Error(`Invalid ObjectId: ${taskId}`);
    }

    const updatedTask = await this.maintenanceModel.findByIdAndUpdate(
        new Types.ObjectId(taskId), // Ensure this is passed as an ObjectId
        { status: 'Completed' },
        { new: true }
    );

    if (!updatedTask) {
        throw new Error(`Task not found for ID: ${taskId}`);
    }

    return updatedTask;
}


  // Fetch tasks completed within the last 6 months
  async getRecentTasks(carId: string): Promise<string[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTasks = await this.maintenanceModel
      .find({
        carId: carId,
        status: 'Completed',
        dueDate: { $gte: sixMonthsAgo },
      })
      .select('task')
      .exec();

    return recentTasks.map((task) => task.task);
  }

  async updateTask(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    carId: string,
    newMileage?: number,
): Promise<any> {
    // Check if taskId is a valid ObjectId or UUID
    const isObjectId = Types.ObjectId.isValid(taskId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taskId);

    const queryId = isObjectId ? new Types.ObjectId(taskId) : isUUID ? taskId : null;

    if (!queryId) {
        throw new BadRequestException(`Invalid taskId: ${taskId}`);
    }

    console.log(`Task ID: ${taskId}, Querying with ID: ${queryId}`);

    // Find the task
    const task = await this.maintenanceModel.findOne({ _id: queryId });

    if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    // Validate the car
    const car = await this.carsService.getCarById(carId);
    if (!car) {
        throw new NotFoundException(`Car with ID ${carId} not found`);
    }

    // Handle mileage updates
    if (newMileage) {
        if (newMileage < car.mileage) {
            throw new BadRequestException(
                `New mileage (${newMileage}) cannot be less than the current mileage (${car.mileage}).`,
            );
        }

        car.mileage = newMileage;
        await car.save();

        // Update task's nextMileage based on task type
        task.nextMileage = this.calculateNextMileage(task.task, newMileage);
    }

    // Update task details
    if (updateTaskDto.status) {
        task.status = updateTaskDto.status;
    }
    if (updateTaskDto.comments) {
        task.comments = updateTaskDto.comments;
    }

    // Set dueDate if task is marked as completed and nextMileage is not defined
    if (updateTaskDto.status === 'Completed' && !task.nextMileage) {
        task.dueDate = this.calculateDueDate(90); // 90 days from today
    }

    // Save updated task
    const updatedTask = await this.maintenanceModel.findByIdAndUpdate(
        queryId,
        task,
        { new: true },
    );

    // Debugging: Log the updated task
    console.log(`Updated Task: ${JSON.stringify(updatedTask)}`);

    return updatedTask;
}
// Helper to calculate next mileage
private calculateNextMileage(taskType: string, currentMileage: number): number {
    switch (taskType) {
        case 'Oil Change':
            return currentMileage + 10000;
        case 'Timing Chain Replacement':
            return currentMileage + 120000;
        case 'Brake Change':
            return currentMileage + 30000;
        case 'Tire Replacement':
            return currentMileage + 50000;
        default:
            return currentMileage + 5000; // Generic interval
    }
 }


}