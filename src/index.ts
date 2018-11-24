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

    // red, blue, green
    const colours = ['#2196F3', '#F44336', '#4CAF50'];

    for (const i in entities) {
        const entity = entities[i];

        // Compute size and position.
        const radius = 20;
        const x = entity.x;
        const y = entity.y;

        // Draw the entity.
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = colours[entity.entityId];
        ctx.fill();
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



// Update simulation parameters from UI.
const updateParameters = () => {
    updatePlayerParameters(player1, "player1");
    updatePlayerParameters(player2, "player2");
    server.setUpdateRate(updateNumberFromUI(server.updateRate, "server_fps"));
    return true;
};


var updatePlayerParameters = (client: Client, prefix: string) => {
    client.lag = updateNumberFromUI(player1.lag, `${prefix}_lag`);

    const cbPrediction = element(`${prefix}_prediction`) as HTMLInputElement;
    const cbReconciliation = element(`${prefix}_reconciliation`) as HTMLInputElement;

    // Client Side Prediction disabled => disable Server Reconciliation.
    if (client.isClientSidePredictionActive && !cbPrediction.checked) {
        cbReconciliation.checked = false;
    }

    // Server Reconciliation enabled => enable Client Side Prediction.
    if (!client.isServerReconciliationActive && cbReconciliation.checked) {
        cbPrediction.checked = true;
    }


    client.isClientSidePredictionActive = cbPrediction.checked;
    client.isServerReconciliationActive = cbReconciliation.checked;

    client.entityInterpolation = (element(`${prefix}_interpolation`) as HTMLInputElement).checked;
}


var updateNumberFromUI = (oldValue: number, elementId: string) => {
    const input = element(elementId) as HTMLInputElement;
    let newValue = parseInt(input.value);
    if (isNaN(newValue)) {
        newValue = oldValue;
    }
    input.value = newValue.toString();
    return newValue;
}


// When the player presses the arrow keys, set the corresponding flag in the client.
const keyHandler = (e: KeyboardEvent) => {
    e = e || window.event;

    if (e.key == 'd') {
        e.preventDefault()
        player1.keyRight = (e.type == "keydown");
    } else if (e.key == 'a') {
        e.preventDefault()
        player1.keyLeft = (e.type == "keydown");
    }
    if (e.key == 'w') {
        e.preventDefault()
        player1.keyUp = (e.type == "keydown");
    } else if (e.key == 's') {
        e.preventDefault()
        player1.keyDown = (e.type == "keydown");
    }

    if (e.key == 'ArrowRight') {
        e.preventDefault()
        player2.keyRight = (e.type == "keydown");
    } else if (e.key == 'ArrowLeft') {
        e.preventDefault()
        player2.keyLeft = (e.type == "keydown");
    }
    if (e.key == 'ArrowUp') {
        e.preventDefault()
        player2.keyUp = (e.type == "keydown");
    } else if (e.key == 'ArrowDown') {
        e.preventDefault()
        player2.keyDown = (e.type == "keydown");
    }



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