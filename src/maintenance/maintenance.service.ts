import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance } from './schemas/maintenance.schema';
import { CarsService } from '../cars/cars.service';
import { spawn } from 'child_process';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name) private maintenanceModel: Model<Maintenance>,
    private carsService: CarsService,
  ) {}

  // Calculate maintenance tasks for a specific car
  async calculateMaintenance(carId: string): Promise<any> {
    const car = await this.carsService.getCarById(carId);

    if (!car) {
        throw new Error('Car not found');
    }

    const maintenanceTasks = [];

    // Fetch recently completed tasks
    const recentTasks = await this.getRecentTasks(carId);

    if (car.mileage === 0) {
        return [
            {
                carId: carId,
                task: 'No maintenance required',
                dueDate: null,
                status: 'Not Applicable',
                lastMileage: null,
                nextMileage: null,
            },
        ];
    }

    // Add predefined tasks
    if (car.mileage > 10000 && !recentTasks.includes('Oil Change')) {
        maintenanceTasks.push({
            carId: carId,
            task: 'Oil Change',
            dueDate: new Date(),
            status: 'Pending',
        });
    }

    if (car.mileage > 50000 && !recentTasks.includes('Brake Change')) {
        maintenanceTasks.push({
            carId: carId,
            task: 'Brake Change',
            dueDate: new Date(),
            status: 'Pending',
        });
    }

    if (car.mileage > 50000 && !recentTasks.includes('Tire Replacement')) {
        maintenanceTasks.push({
            carId: carId,
            task: 'Tire Replacement',
            dueDate: new Date(),
            status: 'Pending',
        });
    }

    // AI predictions
    const aiPrediction = await this.predictUsingAI([
        car.mileage,
        car.year,
        1.0, 2.0, 3.0,
    ]);

    const tasksMap = ['Oil Change', 'Belt Change', 'Brake Change', 'Tire Replacement'];
    aiPrediction.forEach((pred, index) => {
        const task = tasksMap[index];
        if (Number(pred) === 1 && !recentTasks.includes(task)) {
            maintenanceTasks.push({
                carId: carId,
                task: task,
                dueDate: new Date(),
                status: 'Pending',
            });
        }
    });

    // Normalize the tasks
    const normalizedTasks = maintenanceTasks.map((task) => ({
        ...task,
        lastMileage: task.lastMileage !== null ? task.lastMileage.toString() : "Unknown",
        nextMileage: task.nextMileage !== null ? task.nextMileage.toString() : "Unknown",
    }));
    return normalizedTasks;
}

  // Call the Python script for AI-based predictions
  async predictUsingAI(features: number[]): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const process = spawn('python3', ['predict.py', ...features.map(String)]);

      process.stdout.on('data', (data) => {
        try {
          // Parse the JSON response from the Python script
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

  // Add a new maintenance task (e.g., from user input)
  async addTask(task: Partial<Maintenance>): Promise<Maintenance> {
    const newTask = new this.maintenanceModel(task);
    return newTask.save();
  }

  // Fetch tasks for a specific car
  async getTasksForCar(carId: string, status?: string): Promise<Maintenance[]> {
    const query = { carId };
    if (status) {
      query['status'] = status;
    }
    return this.maintenanceModel.find(query).exec();
  }

  // Mark a task as completed
  async completeTask(taskId: string): Promise<Maintenance> {
    return this.maintenanceModel.findByIdAndUpdate(
      taskId,
      { status: 'Completed' },
      { new: true },
    );
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

  // Fetch the last mileage for a specific task
  async getLastServiceMileage(carId: string, taskType: string): Promise<number> {
    const lastTask = await this.maintenanceModel
      .findOne({ carId, task: taskType, status: 'Completed' })
      .sort({ dueDate: -1 })
      .exec();

    return lastTask ? lastTask['mileage'] : 0; // Default to 0 if no record
  }

  // Calculate the next mileage for a specific task
  calculateNextServiceMileage(lastMileage: number, taskType: string): number {
    const intervals = {
      'Oil Change': 10000,
      'Brake Change': 50000,
      'Tire Replacement': 50000,
    };

    return lastMileage + (intervals[taskType] || 0); // Default to 0 if task is unknown
  }
}