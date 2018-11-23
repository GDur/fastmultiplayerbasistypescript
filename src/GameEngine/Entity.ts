import { InputMessage, TimestampedPosition } from "./helper/helper";

// =============================================================================
//  An Entity in the world.
// =============================================================================
export default class Entity {
    x = 0;
    speed = 2; // units/s
    positionBuffer: TimestampedPosition[] = [];
    entityId: number

    constructor(entityId: number) {
        this.entityId = entityId
    }

    // Apply user's input to this entity.
    applyInput(input: InputMessage) {
        this.x += input.press_time * this.speed;
    }
}