import Server from './GameEngine/Server'
import Entity from "./GameEngine/Entity"
import Client from "./GameEngine/Client"
import * as PIXI from 'pixi.js'


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
var initializeWordRendering = (pixiApp: PIXI.Application, entities: { [key: number]: Entity; }) => {

    // prepare the rendering    
    const red = 0x2196F3;
    const blue = 0xF44336;
    const green = 0x4CAF50;
    const colours = [red, blue, green];



    // reset view stage
    var entityGraphics: PIXI.Graphics[] = []
    for (var i = pixiApp.stage.children.length - 1; i >= 0; i--) {
        pixiApp.stage.removeChild(pixiApp.stage.children[i]);
    }

    // for each entity create a graphics and save it in the entityGraphics array
    for (const i in entities) {
        var entity = entities[i]

        var entityGraphic = new PIXI.Graphics();

        // Compute size and position.
        const radius = 20;

        // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
        entityGraphic.lineStyle(0);
        entityGraphic.beginFill(colours[entity.entityId], 1);
        entityGraphic.drawCircle(0, 0, radius);
        entityGraphic.endFill();

        entityGraphics.push(entityGraphic)
        pixiApp.stage.addChild(entityGraphic);
    }

    // update the entity representations using the entityGraphics
    // this is the drawloop 
    pixiApp.ticker.add(function () {
        for (const i in entityGraphics) {
            const entity = entities[i];
            entityGraphics[i].x = entity.x
            entityGraphics[i].y = entity.y
        }
    });
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

// remove all old canvases (important because of parcels hotreload)
document.querySelectorAll('canvas').forEach((aCanvas) => {
    aCanvas.remove()
})


// add new canvases
const serverPixiApp = new PIXI.Application(920, 75, { backgroundColor: 0xf3f3f3, antialias: true });
getHTMLElement("server_view_container").appendChild(serverPixiApp.view)

const player1PixiApp = new PIXI.Application(920, 75, { backgroundColor: 0xf3f3f3, antialias: true });
getHTMLElement("player1_view_container").appendChild(player1PixiApp.view)

const player2PixiApp = new PIXI.Application(920, 75, { backgroundColor: 0xf3f3f3, antialias: true });
getHTMLElement("player2_view_container").appendChild(player2PixiApp.view)


// // Setup a server, the player's client, and another player.
var server = new Server(serverPixiApp, getHTMLElement("server_status"), initializeWordRendering);
var player1 = new Client(player1PixiApp, getHTMLElement("player1_status"), server, initializeWordRendering);
var player2 = new Client(player2PixiApp, getHTMLElement("player2_status"), server, initializeWordRendering);



// Connect the clients to the server.
// simulate delay in connection
setTimeout(() => {
    server.connect(player1);
}, 500);

setTimeout(() => {
    server.connect(player2);
}, 1500);





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