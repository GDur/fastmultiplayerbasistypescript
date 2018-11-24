

import { MessageContainer, Message } from "./helper/helper";


// =============================================================================
//  A message queue with simulated network lag.
// =============================================================================
export default class LagNetwork {
    messages: MessageContainer[] = [];

    // "Send" a message. Store each message with the timestamp when it should be
    // received, to simulate lag.
    send(lagMs: number, payload: Message) {
        this.messages.push(new MessageContainer(+new Date() + lagMs, JSON.stringify(payload)));
    }

    // Returns a "received" message, or undefined if there are no messages available
    // yet.
    receive(): Message | null {
        const now = +new Date();
        for (let i = 0; i < this.messages.length; i++) {
            const messageContainer = this.messages[i];
            if (messageContainer.recvTs <= now) {
                this.messages.splice(i, 1);
                return JSON.parse(messageContainer.message);
            }
        }
        return null
    }
}