

import { MessageContainer, Message } from "./helper/helper";


// =============================================================================
//  A message queue with simulated network lag.
// =============================================================================
export default class LagNetwork {
    messages: MessageContainer[] = [];

    // "Send" a message. Store each message with the timestamp when it should be
    // received, to simulate lag.
    send(lagMs: number, payload: Message) {
        this.messages.push(new MessageContainer(+new Date() + lagMs, payload));
    }

    // Returns a "received" message, or undefined if there are no messages available
    // yet.
    receive(): Message | null {
        const now = +new Date();
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            if (message.recvTs <= now) {
                this.messages.splice(i, 1);
                return message.message;
            }
        }
        return null
    }
}