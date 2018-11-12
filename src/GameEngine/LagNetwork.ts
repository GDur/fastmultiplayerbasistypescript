

import { Message, Payload } from "./helper/helper";


// =============================================================================
//  A message queue with simulated network lag.
// =============================================================================
export default class LagNetwork {
    messages: Message[] = [];

    // "Send" a message. Store each message with the timestamp when it should be
    // received, to simulate lag.
    send(lag_ms: number, payload: Payload) {
        this.messages.push(new Message(+new Date() + lag_ms, payload));
    }

    // Returns a "received" message, or undefined if there are no messages available
    // yet.
    receive(): Payload | null {
        const now = +new Date();
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            if (message.recv_ts <= now) {
                this.messages.splice(i, 1);
                return message.payload;
            }
        }
        return null
    }
}