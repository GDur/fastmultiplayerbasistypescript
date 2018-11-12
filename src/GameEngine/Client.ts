import Entity from './Entity'
import LagNetwork from './LagNetwork'
import Server from './Server'

import { InputContainer , WorldState } from "./helper/helper";
// =============================================================================
//  The Client.
// =============================================================================
export default class Client {
    canvas: HTMLCanvasElement;
    status: HTMLElement;


    // Local representation of the entities.
    entities: { [key: number]: Entity; } = {};

    // Input state.
    key_left = false;
    key_right = false;

    // Simulated network connection.
    network = new LagNetwork();
    server: Server;
    lag = 0;

    // Unique ID of our entity. Assigned by Server on connection.
    entityId = -0;

    // Data needed for reconciliation.
    client_side_prediction = false;
    server_reconciliation = false;
    input_sequence_number = 0;
    pending_inputs: InputContainer[] = [];

    last_ts = 0

    // Entity interpolation toggle.
    entity_interpolation = true;


    update_interval: number;

    renderWorld:Function

    constructor(canvas: HTMLElement, status: HTMLElement, server: Server, renderWorld:Function) {
        this.renderWorld  = renderWorld
        this.server = server

        // UI.
        this.canvas = canvas as HTMLCanvasElement;
        this.status = status;

        // Update rate.
        this.update_interval = -1;


        this.setUpdateRate(50);
    }

    setEntityId(id: number) {
        this.entityId = id
    }

    setUpdateRate(hz: number) {

        if (this.update_interval)
            clearInterval(this.update_interval);

        this.last_ts = +new Date();
        this.update_interval = window.setInterval(
            ((self => () => {
                self.update();
            }))(this),
            1000 / hz);
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
        if (this.entity_interpolation) {
            this.interpolateEntities();
        }

        // Render the World.
        this.renderWorld(this.canvas, this.entities);

        // Show some info.
        const info = `Non-acknowledged inputs: ${this.pending_inputs.length}`;
        this.status.textContent = info;
    }

    // Get inputs and send them to the server.
    // If enabled, do client-side prediction.
    processInputs() {
        // Compute delta time since last update.
        const now_ts = +new Date();
        const last_ts = this.last_ts || now_ts;
        const dt_sec = (now_ts - last_ts) / 1000.0;
        this.last_ts = now_ts;

        // Package player's input.
        let input = new InputContainer(-1, -1, -1)


        if (this.key_right) {
            input.press_time = dt_sec;
        } else if (this.key_left) {
            input.press_time = -dt_sec;
        } else {
            // Nothing interesting happened.
            return;
        }

        // Send the input to the server.
        input.input_sequence_number = this.input_sequence_number++;
        input.entityId = this.entityId;

        this.server.network.send(this.lag, input);

        // Do client-side prediction.
        if (this.client_side_prediction) {
            this.entities[this.entityId].applyInput(input);
        }

        // Save this input for later reconciliation.
        this.pending_inputs.push(input);
    }

    // Process all messages from the server, i.e. world updates.
    // If enabled, do server reconciliation.
    processServerMessages() {
        while (true) {
            const message = this.network.receive() as WorldState[];
            if (!message) {
                break;
            }

            // World state is a list of entity states.
            for (const state of message) {
                // If this is the first time we see this entity, create a local representation.
                if (!this.entities[state.entityId]) {
                    var entity = new Entity(state.entityId);
                    // entity.entityId = state.entityId;
                    this.entities[state.entityId] = entity;
                }

                var entity = this.entities[state.entityId];

                if (state.entityId == this.entityId) {
                    // Received the authoritative position of this client's entity.
                    entity.x = state.position;

                    if (this.server_reconciliation) {
                        // Server Reconciliation. Re-apply all the inputs not yet processed by
                        // the server.
                        let j = 0;
                        while (j < this.pending_inputs.length) {
                            const input = this.pending_inputs[j];
                            if (input.input_sequence_number <= state.last_processed_input) {
                                // Already processed. Its effect is already taken into account into the world update
                                // we just got, so we can drop it.
                                this.pending_inputs.splice(j, 1);
                            } else {
                                // Not processed by the server yet. Re-apply it.
                                entity.applyInput(input);
                                j++;
                            }
                        }
                    } else {
                        // Reconciliation is disabled, so drop all the saved inputs.
                        this.pending_inputs = [];
                    }
                } else {
                    // Received the position of an entity other than this client's.

                    if (!this.entity_interpolation) {
                        // Entity interpolation is disabled - just accept the server's position.
                        entity.x = state.position;
                    } else {
                        // Add it to the position buffer.
                        const timestamp = +new Date();
                        entity.position_buffer.push([timestamp, state.position]);
                    }
                }
            }
        }
    }

    interpolateEntities() {
        // Compute render timestamp.
        const now = +new Date();
        const render_timestamp = now - (1000.0 / this.server.getUpdateRate());

        for (const i in this.entities) {
            const entity = this.entities[i];

            // No point in interpolating this client's entity.
            if (entity.entityId == this.entityId) {
                continue;
            }

            // Find the two authoritative positions surrounding the rendering timestamp.
            const buffer = entity.position_buffer;

            // Drop older positions.
            while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
                buffer.shift();
            }

            // Interpolate between the two surrounding authoritative positions.
            if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
                const x0 = buffer[0][1];
                const x1 = buffer[1][1];
                const t0 = buffer[0][0];
                const t1 = buffer[1][0];

                entity.x = x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
            }
        }
    }
}
