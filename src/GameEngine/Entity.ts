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

    speed = 50; // units/s
    positionBuffer: TimestampedShareableData[] = [];
    entityId: number

    constructor(entityId: number) {
        this.entityId = entityId
    }

    spawned() {

    }

    // Apply user's input to this entity.
    applyInput(input: InputMessage) {
        if (input.commands.indexOf(Command.goRight) >= 0)
            this.x += input.pressedTime * this.speed;

        if (input.commands.indexOf(Command.goLeft) >= 0)
            this.x += input.pressedTime * -this.speed;

        if (input.commands.indexOf(Command.goUp) >= 0)
            this.y += input.pressedTime * -this.speed;

        if (input.commands.indexOf(Command.goDown) >= 0)
            this.y += input.pressedTime * this.speed;
    }
}