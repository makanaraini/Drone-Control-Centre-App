export interface TelemetryData {
  altitude: number;
  battery: number;
  solarInput: number;
  timestamp: number;
}

export interface DroneState {
  isConnected: boolean;
  isFlying: boolean;
  isHovering: boolean;
}
