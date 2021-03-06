
import Entity from './Entity'
import LagNetwork from './LagNetwork'
import Client from './Client'

import { InputMessage, WorldStateMessage } from "./helper/helper";

// =============================================================================
//  The Server.
// =============================================================================

export default class Server {

    // Connected clients and their entities.
    clients: Client[] = [];
    entities: Entity[] = [];

    // Last processed input for each client.
    lastProcessedInput: number[] = [];

    // Simulated network connection.
    network = new LagNetwork();

    updateRate = 0
    maxPressedTimeForValidation = 1 / 10

    pixiApp: PIXI.Application;
    status: HTMLElement;
    updateIntervalId: number
    initializeWordRendering: Function

    constructor(pixiApp: PIXI.Application, status: HTMLElement, initializeWordRendering: Function) {
        this.initializeWordRendering = initializeWordRendering

        // UI.
        this.pixiApp = pixiApp
        this.status = status
        this.updateIntervalId = 0

        // Default updte rate.
        this.setUpdateRate(20)

    }

    connect(client: Client) {

        // Give the Client enough data to identify itself.
        client.setEntityId(this.clients.length);
        this.clients.push(client);

        // Create a new Entity for this Client.
        const entity = new Entity(client.entityId);
        this.entities.push(entity);

        // entity.entityId = client.entityId;

        // Set the initial state of the Entity (e.g. spawn point)
        const spawnPointsX = [
            920 / 3 * 1,
            920 / 3 * 2
        ];
        const spawnPointY = 75 / 2;
        entity.x = spawnPointsX[client.entityId];
        entity.y = spawnPointY;
        this.initializeWordRendering(this.pixiApp, this.entities)
    }

    getUpdateRate() {
        return this.updateRate;
    }
    setMaxPressedTimeForValidation(maxPressedTimeForValidation: number) {
        // 1 / 10
        this.maxPressedTimeForValidation = maxPressedTimeForValidation;
    }
    setUpdateRate(hz: number) {
        var self = this

        this.updateRate = hz;

        clearInterval(this.updateIntervalId);

        this.updateIntervalId = window.setInterval(() => {
            self.update();
        }, 1000 / this.updateRate);
    }

    update() {
        this.processInputs();
        this.sendWorldState();
    }

    // Check whether this input seems to be valid (e.g. "make sense" according
    // to the physical rules of the World)
    validateInput(input: InputMessage) {
        if (Math.abs(input.pressedTime * 1000) > this.maxPressedTimeForValidation) {
            console.log('The maximum accepted pressed key time was', input.pressedTime * 1000, 'ms, and therefore was discarded by the server. Try to increase the "maximum accepted press time in the server view."');
            return false;
        }
        return true;
    }

    processInputs() {
        // Process all pending messages from clients.
        while (true) {

            const message = this.network.receive() as InputMessage;
            if (!message) {
                break;
            }

            // Update the state of the entity, based on its input.
            // We just ignore inputs that don't look valid;
            // this is what prevents clients from cheating.
            if (this.validateInput(message)) {
                const id = message.entityId;
                this.entities[id].applyInput(message);

                // remember last input sequence number for client because?
                this.lastProcessedInput[id] = message.inputSequenceNumber;
            }

        }

        // Show some info.
        let info = "Last acknowledged input: ";
        for (let i = 0; i < this.clients.length; ++i) {
            info += `Player ${i}: #${this.lastProcessedInput[i] || 0}   `;
        }
        this.status.textContent = info;
    }

    // Send the world state to all the connected clients.
    sendWorldState() {
        // Gather the state of the world.
        // In a real app, state could be filtered to avoid leaking data
        // (e.g. position of invisible enemies).

        const worldStateArray: WorldStateMessage[] = [];
        const clientsCount = this.clients.length;
        for (var i = 0; i < clientsCount; i++) {
            const entity = this.entities[i];
            worldStateArray.push(new WorldStateMessage(
                entity.entityId,
                entity.shareableData,
                this.lastProcessedInput[i]
            ));
        }

        // Broadcast the state to all the clients.
        for (var i = 0; i < clientsCount; i++) {
            const client = this.clients[i];
            client.network.send(client.lag, worldStateArray);
        }
    }
}
