
export class TimestampedPosition {
    timestamp: number
    position: number
    constructor(ts: number, p: number) {
        this.timestamp = ts;
        this.position = p
    }
}
export class Message {
}

export class MessageContainer {
    recv_ts: number
    message: Message

    constructor(recv_ts: number, payload: Message) {
        this.recv_ts = recv_ts
        this.message = payload
    }
}

export class InputMessage extends Message {
    entityId = -1
    press_time = -1
    input_sequence_number = -1
    constructor(entityId: number, press_time: number, input_sequence_number: number) {
        super()
        this.entityId = entityId
        this.press_time = press_time
        this.input_sequence_number = input_sequence_number
    }
}

export class WorldStateMessage extends Message {
    entityId: number
    positionX: number
    last_processed_input: number
    constructor(entityId: number, position: number, last_processed_input: number) {
        super()
        this.entityId = entityId
        this.positionX = position
        this.last_processed_input = last_processed_input
    }
}

