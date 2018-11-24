
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
    message: string

    constructor(recvTs: number, payload: string) {
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
    commands: Command[]
    entityId :number
    pressedTime  :number
    inputSequenceNumber :number
    constructor(entityId: number, 
        pressedTime: number, 
        inputSequenceNumber: number,
        commands: Command[]) {
        super()
        this.entityId = entityId
        this.pressedTime = pressedTime
        this.inputSequenceNumber = inputSequenceNumber
        this.commands = commands
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

