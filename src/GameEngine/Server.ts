
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
    last_processed_input: number[] = [];

    // Simulated network connection.
    network = new LagNetwork();

    canvas: HTMLCanvasElement;
    status: HTMLElement;
    updateRate = 0
    updateInterval: number
    renderWorld: Function

    constructor(canvas: HTMLElement, status: HTMLElement, renderWorld: Function) {
        this.renderWorld = renderWorld

        // UI.
        this.canvas = canvas as HTMLCanvasElement;
        this.status = status;
        this.updateInterval = 0
        
        // Default updte rate.
        this.setUpdateRate(20);
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
        const spawn_points = [4, 6, 7];
        entity.x = spawn_points[client.entityId];
    }

    getUpdateRate() {
        return this.updateRate;
    }

    setUpdateRate(hz: number) {
        var self = this

        this.updateRate = hz;

        clearInterval(this.updateInterval);

        this.updateInterval = window.setInterval(() => {
            self.update();
        }, 1000 / this.updateRate);
    }

    update() {
        this.processInputs();
        this.sendWorldState();
        this.renderWorld(this.canvas, this.entities);
    }

    // Check whether this input seems to be valid (e.g. "make sense" according
    // to the physical rules of the World)
    validateInput(input: InputMessage) {
        if (Math.abs(input.press_time) > 1 / 40) {
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
                this.last_processed_input[id] = message.input_sequence_number;
            }

        }

        // Show some info.
        let info = "Last acknowledged input: ";
        for (let i = 0; i < this.clients.length; ++i) {
            info += `Player ${i}: #${this.last_processed_input[i] || 0}   `;
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
                entity.x,
                this.last_processed_input[i]
            ));
        }

        // Broadcast the state to all the clients.
        for (var i = 0; i < clientsCount; i++) {
            const client = this.clients[i];
            client.network.send(client.lag, worldStateArray);
        }
    }
}
