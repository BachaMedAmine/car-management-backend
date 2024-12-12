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
      return maintenanceTasks; // Return immediately for 0 km
    }

    // Oil change logic: Calculate the next milestone
    const oilChangeInterval = 10000; // Every 10,000 km
    const nextOilChange = Math.ceil(car.mileage / oilChangeInterval) * oilChangeInterval;

    console.log('Current Mileage:', car.mileage);
    console.log('Next Oil Change Mileage:', nextOilChange);

    if (!recentTasks.includes('Oil Change') && car.mileage < nextOilChange && !excludedTasks.includes('Oil Change')) {
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

    return maintenanceTasks;
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
    const updatedTask = await this.maintenanceModel.findByIdAndUpdate(
      taskId,
      { status: 'Completed' },
      { new: true },
    );
    console.log('Updated Task:', updatedTask); // Log the updated task
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
}