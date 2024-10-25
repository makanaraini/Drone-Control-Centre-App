import { Observable } from '@nativescript/core';
import { TelemetryData, DroneState } from '../models/telemetry';

export class DroneService extends Observable {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 3000;
  private _telemetry: TelemetryData;
  private _droneState: DroneState;

  constructor() {
    super();
    this._telemetry = {
      altitude: 0,
      battery: 100,
      solarInput: 0,
      timestamp: Date.now()
    };
    this._droneState = {
      isConnected: false,
      isFlying: false,
      isHovering: false
    };
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    try {
      // Use secure WebSocket when possible
      const protocol = global.isIOS ? 'wss://' : 'ws://';
      const host = '192.168.1.1'; // Default drone IP - should be configurable
      const port = '8080'; // Default port - should be configurable
      
      this.ws = new WebSocket(`${protocol}${host}:${port}`);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this._droneState.isConnected = true;
        this.notifyPropertyChange('droneState', this._droneState);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._telemetry = { ...data, timestamp: Date.now() };
          this.notifyPropertyChange('telemetry', this._telemetry);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this._droneState.isConnected = false;
        this.notifyPropertyChange('droneState', this._droneState);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this._droneState.isConnected = false;
        this.notifyPropertyChange('droneState', this._droneState);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
        this.reconnectAttempts++;
        this.initializeWebSocket();
      }, this.RECONNECT_INTERVAL);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private async sendCommand(command: string, payload: any = {}): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    try {
      const message = JSON.stringify({
        command,
        timestamp: Date.now(),
        ...payload
      });
      
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error(`Error sending ${command} command:`, error);
      return false;
    }
  }

  get telemetry(): TelemetryData {
    return this._telemetry;
  }

  get droneState(): DroneState {
    return this._droneState;
  }

  async takeoff(): Promise<void> {
    if (await this.sendCommand('takeoff')) {
      this._droneState.isFlying = true;
      this.notifyPropertyChange('droneState', this._droneState);
    }
  }

  async land(): Promise<void> {
    if (await this.sendCommand('land')) {
      this._droneState.isFlying = false;
      this._droneState.isHovering = false;
      this.notifyPropertyChange('droneState', this._droneState);
    }
  }

  async hover(): Promise<void> {
    if (await this.sendCommand('hover')) {
      this._droneState.isHovering = !this._droneState.isHovering;
      this.notifyPropertyChange('droneState', this._droneState);
    }
  }
}
