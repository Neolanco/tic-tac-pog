let activeGame = false;
let hasTurn = false;
let gameFields = [];
let ownPoints = 0;
let opponentPoints = 0;
let ownSymbol = "circle";
let opponentSymbol = "cross";
let gameState = "clear"
let peer;
let connection;

startGame();
initPeerJS();

async function initPeerJS() {
    peer = await setupPeer();
    console.log(peer.id);
    displayConnectionStatus();
}

function startGame() {
    activeGame = true;
    hasTurn = true;
    clearGame();
    setStatus("game");
    gameState = "clear"
}

function restart() {
    startGame();
    sendMessage("restart")
}

function endGame() {
    activeGame = false
}

function clearGame() {
    for(let cnt = 0; cnt < 9; cnt++) {
        setField(cnt, "clear")
    }
}

function setField(field, symbol) {
    let currentField = document.getElementById(field);

    if (symbol == "cross") {
        currentField.classList.add("bi", "bi-x-lg");
        currentField.classList.remove("bi-circle");
    }
    if (symbol == "circle") {
        currentField.classList.add("bi", "bi-circle");
        currentField.classList.remove("bi-x-lg");
    }
    if (symbol == "clear") {
        currentField.classList.remove("bi", "bi-x-lg", "bi-circle");
    }

    gameFields[field] = symbol;

    if (symbol == "clear") {return}

    gameState = checkWinner()

    if (gameState != "clear") {
        setStatus(gameState + " won");
        endGame();
        return;
    }
    if (checkDraw() == true) {
        gameState = "draw";
        setStatus("draw");
        endGame();
        return;
    }

}

function fieldClickedHandler(field) {
    if (!hasTurn || !activeGame || gameFields[field] != "clear") return;

    setField(field, ownSymbol);
    sendMessage("set-field", field)
    setHasTurn(false)
    sendMessage("has-turn", true);
}

function connectClickedHandler() {
    let id = document.getElementById("connect-id").value
    connectedHost(id)
}

function setStatus(text) {
    let statusElement = document.getElementById("status");
    statusElement.textContent = text + " " + ownPoints + "-" + opponentPoints;
}


function setHasTurn(value) {
    hasTurn = value

    if (gameState != "clear") {
        return;
    }

    if (hasTurn == false) {
        setStatus("gegner is dran");
    }else{
        setStatus("mach ma eier");
    }
}

function setConnectInput(value) {
    let inputElement = document.getElementById("connect-id");
    let bntElement = document.getElementById("btn-connect");

    if (value == true){
        inputElement.removeAttribute("disabled");
        bntElement.removeAttribute("disabled");
    }
    else{
        inputElement.setAttribute("disabled", null);  
        bntElement.setAttribute("disabled", null);
    }


}


function checkWinner() {
    if (gameFields[0] == gameFields[1] && gameFields[0] == gameFields[2] && gameFields[0] != "clear") {return gameFields[0];}
    if (gameFields[3] == gameFields[4] && gameFields[3] == gameFields[5] && gameFields[3] != "clear") {return gameFields[3];}
    if (gameFields[6] == gameFields[7] && gameFields[6] == gameFields[8] && gameFields[6] != "clear") {return gameFields[6];}
    if (gameFields[0] == gameFields[3] && gameFields[0] == gameFields[6] && gameFields[0] != "clear") {return gameFields[0];}
    if (gameFields[1] == gameFields[4] && gameFields[1] == gameFields[7] && gameFields[1] != "clear") {return gameFields[1];}
    if (gameFields[2] == gameFields[5] && gameFields[2] == gameFields[8] && gameFields[2] != "clear") {return gameFields[2];}
    if (gameFields[0] == gameFields[4] && gameFields[0] == gameFields[8] && gameFields[0] != "clear") {return gameFields[0];}
    if (gameFields[2] == gameFields[4] && gameFields[2] == gameFields[6] && gameFields[2] != "clear") {return gameFields[2];}
    return "clear"
}

function checkDraw() {
    let counter = 0;
    for (let i = 0; i < 9; i++) {
        if (gameFields[i] != "clear") {
            counter++;
        }
    }

    if (counter == 9) {
        return true;
    }
    return false;
}


async function setupPeer() {
    let peer = new Peer();

    peer.on("connection", connectedClient);

    // wait for connection
    await new Promise(resolve => peer.on("open", resolve));

    return peer;
}

async function setupConnection(con) {
    console.log(con)
    con.on("error", console.error);
    con.on("data", dataRecived);
    con.on("close", endGame);

    await new Promise(resolve => con.on("open", resolve));
}

async function connectedClient(con) {
    await setupConnection(con);
    connection = con;
    displayConnectionStatus();

    opponentSymbol = "circle";
    ownSymbol = "cross";

    ownPoints = 0;
    opponentPoints = 0;

    startGame;
    randomizeTurn();
}

async function connectedHost(id) {
    if (!peer || !peer.id) { return; }
    
    connection = peer.connect(id);
    await setupConnection(connection);
    displayConnectionStatus();

    ownSymbol = "circle";
    opponentSymbol = "cross";

    ownPoints = 0;
    opponentPoints = 0;

    startGame();
}

function randomizeTurn() {
    if (Math.random() < 0.5) {
        setHasTurn(true);
        sendMessage("has-turn", false);
    }
    else {
        setHasTurn(false);
        sendMessage("has-turn", true);
    }
}

function dataRecived(data) {
    console.log(data)

    let object = JSON.parse(data)

    if (object.action == "has-turn") {
        setHasTurn(object.value)
    }
    else if (object.action == "set-field") {
        setField(object.value, opponentSymbol)
    }
    else if (object.action == "restart") {
        startGame();
    }
}

function sendMessage(action, value) {
    let object = {
        action: action,
        value: value,
    };

    let objectString = JSON.stringify(object);
    connection.send(objectString);
}

function displayConnectionStatus() {
    if (peer && peer.id) {
        let idElement = document.getElementById("peer-id")
        idElement.textContent = peer.id;
    }

    if(connection && connection.open) {
        setConnectInput(false)
    }
    else{
        setConnectInput(true)
        setStatus("kein gegenGamer")
    }
}



// temp test start
function oClicked() {
    ownSymbol = "circle"

}
function xClicked() {
    ownSymbol = "cross"
}

function forceField (id) {
    sendMessage("set-field", id)
    setField(id, ownSymbol)
}

function myTurn () {
    sendMessage("has-turn", false)
    hasTurn = true
}

function yourTurn () {
    sendMessage("has-turn", true)
    hasTurn = false
}

// temp test end