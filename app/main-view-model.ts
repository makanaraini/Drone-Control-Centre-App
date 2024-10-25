import { Observable } from '@nativescript/core';
import { DroneService } from './services/drone-service';

export class MainViewModel extends Observable {
  private droneService: DroneService;

  constructor() {
    super();
    this.droneService = new DroneService();
    
    // Bind the service's properties to the view
    this.bind();
  }

  private bind() {
    this.droneService.on(Observable.propertyChangeEvent, (propertyChangeData) => {
      this.notifyPropertyChange(propertyChangeData.propertyName, 
        propertyChangeData.value);
    });
  }

  get telemetry() {
    return this.droneService.telemetry;
  }

  get droneState() {
    return this.droneService.droneState;
  }

  async onTakeoff() {
    await this.droneService.takeoff();
  }

  async onLand() {
    await this.droneService.land();
  }

  async onHover() {
    await this.droneService.hover();
  }
}
