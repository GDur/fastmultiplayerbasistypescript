import Server from './GameEngine/Server'
import Entity from "./GameEngine/Entity"
import Client from "./GameEngine/Client"

// =============================================================================
//  Helpers.
// =============================================================================

// Render all the entities in the given canvas.
var renderWorld = (canvas: HTMLCanvasElement, entities: { [key: number]: Entity; }) => {
    // Clear the canvas.

    canvas.width = canvas.width;

    const colours = ["blue", "red", "yellow"];

    for (const i in entities) {
        const entity = entities[i];

        // Compute size and position.
        const radius = canvas.height * 0.9 / 2;
        const x = (entity.x / 10.0) * canvas.width;

        // Draw the entity.
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.beginPath();
        ctx.arc(x, canvas.height / 2, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = colours[entity.entityId];
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = `dark${colours[entity.entityId]}`;
        ctx.stroke();
    }
}

function element(id: string): HTMLElement {
    const el = document.getElementById(id)
    if (el)
        return el
    else {
        console.log('HTMLElement with id ', id, ' was not found')
        return new HTMLHtmlElement()
    }
};


// =============================================================================
//  Get everything up and running.
// =============================================================================

// World update rate of the Server.
const serverFps = 4;


// Update simulation parameters from UI.
const updateParameters = () => {
    updatePlayerParameters(player1, "player1");
    updatePlayerParameters(player2, "player2");
    server.setUpdateRate(updateNumberFromUI(server.updateRate, "server_fps"));
    return true;
};


var updatePlayerParameters = (client: Client, prefix: string) => {
    client.lag = updateNumberFromUI(player1.lag, `${prefix}_lag`);

    const cb_prediction = element(`${prefix}_prediction`) as HTMLInputElement;
    const cb_reconciliation = element(`${prefix}_reconciliation`) as HTMLInputElement;

    // Client Side Prediction disabled => disable Server Reconciliation.
    if (client.client_side_prediction && !cb_prediction.checked) {
        cb_reconciliation.checked = false;
    }

    // Server Reconciliation enabled => enable Client Side Prediction.
    if (!client.server_reconciliation && cb_reconciliation.checked) {
        cb_prediction.checked = true;
    }


    client.client_side_prediction = cb_prediction.checked;
    client.server_reconciliation = cb_reconciliation.checked;

    client.entity_interpolation = (element(`${prefix}_interpolation`) as HTMLInputElement).checked;
}


var updateNumberFromUI = (old_value: number, element_id: string) => {
    const input = element(element_id) as HTMLInputElement;
    let new_value = parseInt(input.value);
    if (isNaN(new_value)) {
        new_value = old_value;
    }
    input.value = new_value.toString();
    return new_value;
}


// When the player presses the arrow keys, set the corresponding flag in the client.
const keyHandler = (e: KeyboardEvent) => {
    e = e || window.event;
    if (e.key == 'ArrowRight') {
        e.preventDefault()
        player1.key_right = (e.type == "keydown");
    } else if (e.key == 'ArrowLeft') {
        e.preventDefault()
        player1.key_left = (e.type == "keydown");
    } else if (e.key == 'd') {
        e.preventDefault()
        player2.key_right = (e.type == "keydown");
    } else if (e.key == 'a') {
        e.preventDefault()
        player2.key_left = (e.type == "keydown");
    } else {
    }
    console.log(e)
};
document.body.onkeydown = keyHandler;
document.body.onkeyup = keyHandler;


// // Setup a server, the player's client, and another player.
var server = new Server(element("server_canvas"), element("server_status"), renderWorld);
var player1 = new Client(element("player1_canvas"), element("player1_status"), server, renderWorld);
var player2 = new Client(element("player2_canvas"), element("player2_status"), server, renderWorld);


// // Connect the clients to the server.
server.connect(player1);
server.connect(player2);


// Read initial parameters from the UI.
updateParameters();

var inputElements = document.querySelectorAll("input");

inputElements.forEach(function (inputElement) {
    inputElement.onchange = function () {
        updateParameters();
    }
});