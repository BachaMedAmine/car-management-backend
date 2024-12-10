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
    const recentTasks = await this.getRecentTasks(carId);

    console.log('Car Mileage:', car.mileage);
    console.log('Recent Tasks:', recentTasks);

    // Low mileage task
    if (car.mileage <= 10000 && !recentTasks.includes('Battery Check')) {
      maintenanceTasks.push({
        carId: carId,
        task: 'Battery Check',
        dueDate: new Date(),
        status: 'Pending',
      });
    }

    // Predefined tasks
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
    const aiPrediction = await this.predictUsingAI([car.mileage, car.year, 1.0, 2.0, 3.0]);

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

    console.log('Generated Maintenance Tasks:', maintenanceTasks);

    return maintenanceTasks;
  }

  // Call the Python script for AI-based predictions
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
    return this.maintenanceModel.findByIdAndUpdate(taskId, { status: 'Completed' }, { new: true });
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
}