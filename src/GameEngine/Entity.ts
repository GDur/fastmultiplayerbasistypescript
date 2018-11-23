import { InputMessage, TimestampedShareableData, Command } from "./helper/helper";

// =============================================================================
//  An Entity in the world.
// =============================================================================
export default class Entity {
    
    shareableData = {
        x: 0,
        y: 0
    }

    get x(): number {
        return this.shareableData.x;
    }

    get y(): number {
        return this.shareableData.y;
    }

    set x(x: number) {
        this.shareableData.x = x
    }

    set y(y: number) {
        this.shareableData.y = y
    }

    speed = 22; // units/s
    positionBuffer: TimestampedShareableData[] = [];
    entityId: number

    constructor(entityId: number) {
        this.entityId = entityId
    }

    // Apply user's input to this entity.
    applyInput(input: InputMessage) {
        if (input.command == Command.goRight)
            this.x += input.pressedTime * this.speed;

        if (input.command == Command.goLeft)
            this.x += input.pressedTime * -this.speed;

        if (input.command == Command.goUp)
            this.y += input.pressedTime * -this.speed;

        if (input.command == Command.goDown)
            this.y += input.pressedTime * this.speed;
    }
}