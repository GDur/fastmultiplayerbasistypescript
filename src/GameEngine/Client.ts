import Entity from './Entity'
import LagNetwork from './LagNetwork'
import Server from './Server'

import { InputMessage, WorldStateMessage, Command, TimestampedShareableData } from "./helper/helper";
// =============================================================================
//  The Client.
// =============================================================================
export default class Client {
    pixiApp: PIXI.Application;
    statusHTMLElement: HTMLElement;


    // Local representation of the entities.
    entities: { [key: number]: Entity; } = {};

    // Input state.
    keyLeft = false;
    keyRight = false;
    keyUp = false;
    keyDown = false;

    // Simulated network connection.
    network = new LagNetwork();
    server: Server;
    lag = 0;

    // Unique ID of our entity. Assigned by Server on connection.
    entityId = -0;

    // Data needed for reconciliation.
    isClientSidePredictionActive = false;
    isServerReconciliationActive = false;

    inputSequenceNumber = 0;
    pendingInputs: InputMessage[] = [];

    lastTs = 0

    // Entity interpolation toggle.
    entityInterpolation = true;


    updateIntervalId: number;
    initializeWordRendering: Function

    constructor(pixiApp: PIXI.Application, statusElement: HTMLElement, server: Server, initializeWordRendering: Function) {
        this.initializeWordRendering = initializeWordRendering
        this.server = server

        // UI.
        this.pixiApp = pixiApp
        this.statusHTMLElement = statusElement


        // Update rate.
        this.updateIntervalId = 0
        this.setUpdateRate(50)

    }

    setEntityId(id: number) {
        this.entityId = id
    }

    setUpdateRate(hz: number) {
        const self = this

        clearInterval(this.updateIntervalId);

        this.lastTs = +new Date();

        this.updateIntervalId = window.setInterval(() => {
            self.update();
        }, 1000 / hz);
    }

    // Update Client state.
    update() {
        // Listen to the server.
        this.processServerMessages();

        if (this.entityId == null) {
            return;  // Not connected yet.
        }

        // Process inputs.
        this.processInputs();

        // Interpolate other entities.
        if (this.entityInterpolation) {
            this.interpolateEntities();
        }




        // Show some info.
        const info = `Non-acknowledged inputs: ${this.pendingInputs.length}`;
        this.statusHTMLElement.textContent = info;
    }

    // Get inputs and send them to the server.
    // If enabled, do client-side prediction.
    processInputs() {

        // Compute delta time since last update.
        const nowTs = +new Date();
        const lastTs = this.lastTs || nowTs;
        const dtSec = (nowTs - lastTs) / 1000.0;
        this.lastTs = nowTs;

        // Gather players input data
        var commands: Command[] = []
        var pressedTime = dtSec;
        var entityId = this.entityId;


        if (this.keyRight) {
            commands.push(Command.goRight)
        } else if (this.keyLeft) {
            commands.push(Command.goLeft)
        }

        if (this.keyUp) {
            commands.push(Command.goUp)
        } else if (this.keyDown) {
            commands.push(Command.goDown)
        }

        if (commands.length == 0) {
            // Nothing interesting happened.
            return;
        }
        var inputSequenceNumber = this.inputSequenceNumber++;

        // Send the input to the server.
        let input = new InputMessage(
            entityId, pressedTime,
            inputSequenceNumber, commands
        )


        this.server.network.send(this.lag, input);

        // Do client-side prediction.
        if (this.isClientSidePredictionActive) {
            this.entities[this.entityId].applyInput(input);
        }

        // Save this input for later reconciliation.
        this.pendingInputs.push(input);
    }

    // Process all messages from the server, i.e. world updates.
    // If enabled, do server reconciliation.
    processServerMessages() {
        while (true) {
            const messages = this.network.receive() as WorldStateMessage[];
            if (!messages) {
                break;
            }

            // World state is a list of entity states.
            for (const state of messages) {

                // If this is the first time we see this entity, create a local representation.
                if (!this.entities[state.entityId]) {
                    var entity = new Entity(state.entityId);
                    // entity.entityId = state.entityId;
                    this.entities[state.entityId] = entity;
                    // // Render the World.
                    this.initializeWordRendering(this.pixiApp, this.entities)
                }

                var entity = this.entities[state.entityId];

                // is the entity itself?
                if (state.entityId == this.entityId) {

                    // Received the authoritative position of this client's entity.
                    entity.shareableData = state.shareableData;

                    if (this.isServerReconciliationActive) {
                        // Server Reconciliation. 
                        // Re-apply all the inputs not yet processed by
                        // the server.
                        let j = 0;
                        while (j < this.pendingInputs.length) {
                            const input = this.pendingInputs[j];
                            if (input.inputSequenceNumber <= state.lastProcessedInput) {
                                // Already processed. Its effect is already 
                                // taken into account into the world update
                                // we just got, so we can drop it.
                                this.pendingInputs.splice(j, 1);
                            } else {
                                // Not processed by the server yet. Re-apply it.
                                entity.applyInput(input);
                                j++;
                            }
                        }
                    } else {
                        // Reconciliation is disabled, so drop all the saved inputs.
                        this.pendingInputs = [];
                    }
                } else {

                    // Received the position of an entity other than this client's.
                    if (!this.entityInterpolation) {

                        // Entity interpolation is disabled - just accept the server's position.
                        entity.shareableData = state.shareableData;
                    } else {

                        // Add it to the position buffer.
                        const timestamp = +new Date();
                        entity.positionBuffer.push(new TimestampedShareableData(
                            timestamp, state.shareableData
                        ));
                    }
                }
            }
        }
    }

    interpolateEntities() {
        // Compute render timestamp.
        const now = +new Date();
        const renderTimestamp = now - (1000.0 / this.server.getUpdateRate());

        for (const i in this.entities) {
            const entity = this.entities[i];

            // No point in interpolating this client's entity.
            if (entity.entityId == this.entityId) {
                continue;
            }

            // Find the two authoritative positions surrounding the rendering timestamp.
            const buffer = entity.positionBuffer;

            // Drop older positions.
            while (buffer.length >= 2 && buffer[1].timestamp <= renderTimestamp) {
                buffer.shift();
            }

            // Interpolate between the two surrounding authoritative positions.
            if (buffer.length >= 2
                && buffer[0].timestamp <= renderTimestamp
                && renderTimestamp <= buffer[1].timestamp) {

                entity.x = this.interpolate(
                    buffer[0].shareableData.x,
                    buffer[1].shareableData.x,
                    buffer[0].timestamp,
                    buffer[1].timestamp,
                    renderTimestamp);

                entity.y = this.interpolate(
                    buffer[0].shareableData.y,
                    buffer[1].shareableData.y,
                    buffer[0].timestamp,
                    buffer[1].timestamp,
                    renderTimestamp);
            }
        }
    }

    private interpolate(p0: number, p1: number, t0: number, t1: number, renderTimestamp: number): number {
        const deltaMovement = (p1 - p0);
        return p0 + deltaMovement * (renderTimestamp - t0) / (t1 - t0);
    }
}
