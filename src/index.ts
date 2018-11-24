import Server from './GameEngine/Server'
import Entity from "./GameEngine/Entity"
import Client from "./GameEngine/Client"

const red = '#2196F3';
const blue = '#F44336';
const green = '#4CAF50';

// =============================================================================
//  Helpers.
// =============================================================================

function getHTMLElement(id: string): HTMLElement {
    const el = document.getElementById(id)
    if (el)
        return el
    else {
        console.log('HTMLElement with id ', id, ' was not found')
        return new HTMLHtmlElement()
    }
};


// Render all the entities in the given canvas.
var renderWorld = (canvas: HTMLCanvasElement, entities: { [key: number]: Entity; }) => {
    // Clear the canvas.

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colours = [red, blue, green];

    for (const i in entities) {
        const entity = entities[i];

        // Compute size and position.
        const radius = 20;
        const x = entity.x;
        const y = entity.y;

        // Draw the entity.
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = colours[entity.entityId];
        ctx.fill();
    }
}

// =============================================================================
//  Get everything up and running.
// =============================================================================



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
var server = new Server(getHTMLElement("server_canvas"), getHTMLElement("server_status"), renderWorld);
var player1 = new Client(getHTMLElement("player1_canvas"), getHTMLElement("player1_status"), server, renderWorld);
var player2 = new Client(getHTMLElement("player2_canvas"), getHTMLElement("player2_status"), server, renderWorld);


// // Connect the clients to the server.
server.connect(player1);
server.connect(player2);





// Update simulation parameters from UI.
const updateParameters = () => {
    updatePlayerParameters(player1, "player1");
    updatePlayerParameters(player2, "player2");
    server.setUpdateRate(updateNumberFromUI(server.updateRate, "server_fps"));
    return true;
};


var updatePlayerParameters = (client: Client, prefix: string) => {
    client.lag = updateNumberFromUI(player1.lag, `${prefix}_lag`);

    const cbPrediction = getHTMLElement(`${prefix}_prediction`) as HTMLInputElement;
    const cbReconciliation = getHTMLElement(`${prefix}_reconciliation`) as HTMLInputElement;

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

    client.entityInterpolation = (getHTMLElement(`${prefix}_interpolation`) as HTMLInputElement).checked;
}


var updateNumberFromUI = (oldValue: number, elementId: string) => {
    const input = getHTMLElement(elementId) as HTMLInputElement;
    let newValue = parseInt(input.value);
    if (isNaN(newValue)) {
        newValue = oldValue;
    }
    input.value = newValue.toString();
    return newValue;
}

// Read initial parameters from the UI.
updateParameters();

var inputElements = document.querySelectorAll("input");

inputElements.forEach(function (inputElement) {
    inputElement.onchange = function () {
        updateParameters();
    }
});