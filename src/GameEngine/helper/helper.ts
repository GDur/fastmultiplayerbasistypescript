
export class TimestampedShareableData {
    timestamp: number
    shareableData: any
    constructor(ts: number, p: any) {
        this.timestamp = ts;
        this.shareableData = p
    }
}

export class Message {
}

export class MessageContainer {
    recvTs: number
    message: Message

    constructor(recvTs: number, payload: Message) {
        this.recvTs = recvTs
        this.message = payload
    }
}
export enum Command {
    goUp,
    goDown,
    goLeft,
    goRight,
}
export class InputMessage extends Message {
    command: Command
    entityId :number
    pressedTime  :number
    inputSequenceNumber :number
    constructor(entityId: number, 
        pressedTime: number, 
        inputSequenceNumber: number,
        command: Command) {
        super()
        this.entityId = entityId
        this.pressedTime = pressedTime
        this.inputSequenceNumber = inputSequenceNumber
        this.command = command
    }
}

export class WorldStateMessage extends Message {
    entityId: number
    shareableData: any
    lastProcessedInput: number
    constructor(entityId: number, shareableData: any, lastProcessedInput: number) {
        super()
        this.entityId = entityId
        this.shareableData = shareableData
        this.lastProcessedInput = lastProcessedInput
    }
}

