/**
 * State Monitor
 * 
 * Tracks device state changes and emits events for notifications
 */

import { EventEmitter } from 'events';

// Miele API Status codes
const MieleStatus = {
  OFF: 1,
  ON: 2,
  PROGRAMMED: 3,
  PROGRAMMED_WAITING_TO_START: 4,
  RUNNING: 5,
  PAUSE: 6,
  END_PROGRAMMED: 7,
  FAILURE: 8,
  PROGRAMME_INTERRUPTED: 9,
  IDLE: 10,
  RINSE_HOLD: 11,
  SERVICE: 12,
  SUPERFREEZING: 13,
  SUPERCOOLING: 14,
  SUPERHEATING: 15,
  NOT_CONNECTED: 255,
};

export class StateMonitor extends EventEmitter {
  constructor() {
    super();
    this.previousStates = new Map();
    this.notifiedCycles = new Set(); // Track cycles we've already notified about
  }
  
  /**
   * Update device state and check for changes
   * @param {string} deviceId - Device identifier
   * @param {object} currentState - Current device state
   */
  update(deviceId, currentState) {
    const previousState = this.previousStates.get(deviceId);
    
    // Log current state for debugging
    const statusName = this.getStatusName(currentState.status);
    console.log(`📊 ${currentState.name}: ${statusName} | Door: ${currentState.signalDoor ? 'Open' : 'Closed'} | Error: ${currentState.signalFailure ? 'Yes' : 'No'}`);
    
    // First time seeing this device
    if (!previousState) {
      this.previousStates.set(deviceId, { ...currentState });
      return;
    }
    
    // Check for wash cycle completion
    // Status changes from RUNNING (5) or RINSE_HOLD (11) to END_PROGRAMMED (7)
    const wasRunning = previousState.status === MieleStatus.RUNNING || 
                       previousState.status === MieleStatus.RINSE_HOLD ||
                       previousState.status === MieleStatus.PAUSE;
    const isComplete = currentState.status === MieleStatus.END_PROGRAMMED;
    
    // Create a unique key for this cycle based on program and approximate start time
    const cycleKey = `${deviceId}-${currentState.program}-${Math.floor(Date.now() / 60000)}`; // Round to minute
    
    if (wasRunning && isComplete && !this.notifiedCycles.has(cycleKey)) {
      this.notifiedCycles.add(cycleKey);
      // Clean up old cycle keys (keep last 10)
      if (this.notifiedCycles.size > 10) {
        const iterator = this.notifiedCycles.values();
        this.notifiedCycles.delete(iterator.next().value);
      }
      this.emit('cycleComplete', currentState);
    }
    
    // Check for door state changes
    if (previousState.signalDoor !== currentState.signalDoor) {
      if (currentState.signalDoor === true) {
        this.emit('doorOpened', currentState);
      } else if (currentState.signalDoor === false && previousState.signalDoor === true) {
        this.emit('doorClosed', currentState);
      }
    }
    
    // Check for error/failure state changes
    if (previousState.signalFailure !== currentState.signalFailure) {
      if (currentState.signalFailure === true) {
        this.emit('error', currentState);
      } else if (currentState.signalFailure === false && previousState.signalFailure === true) {
        this.emit('errorCleared', currentState);
      }
    }
    
    // Also emit error if status becomes FAILURE (8)
    if (previousState.status !== MieleStatus.FAILURE && currentState.status === MieleStatus.FAILURE) {
      if (!currentState.signalFailure) { // Avoid duplicate notification
        this.emit('error', currentState);
      }
    }
    
    // Update stored state
    this.previousStates.set(deviceId, { ...currentState });
  }
  
  /**
   * Get human-readable status name
   */
  getStatusName(statusCode) {
    const names = {
      [MieleStatus.OFF]: 'Off',
      [MieleStatus.ON]: 'On',
      [MieleStatus.PROGRAMMED]: 'Programmed',
      [MieleStatus.PROGRAMMED_WAITING_TO_START]: 'Waiting to Start',
      [MieleStatus.RUNNING]: 'Running',
      [MieleStatus.PAUSE]: 'Paused',
      [MieleStatus.END_PROGRAMMED]: 'Program Ended',
      [MieleStatus.FAILURE]: 'Failure',
      [MieleStatus.PROGRAMME_INTERRUPTED]: 'Interrupted',
      [MieleStatus.IDLE]: 'Idle',
      [MieleStatus.RINSE_HOLD]: 'Rinse Hold',
      [MieleStatus.SERVICE]: 'Service',
      [MieleStatus.NOT_CONNECTED]: 'Not Connected',
    };
    return names[statusCode] || `Unknown (${statusCode})`;
  }
  
  /**
   * Get current state for a device
   */
  getState(deviceId) {
    return this.previousStates.get(deviceId);
  }
  
  /**
   * Clear all stored states
   */
  clear() {
    this.previousStates.clear();
    this.notifiedCycles.clear();
  }
}
