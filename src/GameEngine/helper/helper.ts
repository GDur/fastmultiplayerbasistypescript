
export class Payload {
}

export class InputContainer extends Payload {
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

export class Message {
    recv_ts: number
    payload: Payload

    constructor(recv_ts: number, payload: Payload) {
        this.recv_ts = recv_ts
        this.payload = payload
    }
}

export class WorldState extends Payload {
    entityId: number
    position: number
    last_processed_input: number
    constructor(entityId: number, position: number, last_processed_input: number) {
        super()
        this.entityId = entityId
        this.position = position
        this.last_processed_input = last_processed_input
    }
}

