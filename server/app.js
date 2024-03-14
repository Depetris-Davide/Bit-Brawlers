const express = require("express");
const app = express();
const port = 3000;
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public"));

app.get("/", (req, res) => {
    res.render("classSelectWindow.ejs");
});

app.get("/maximumClients", (req, res) => {
    res.render("maximumClients.ejs");
});

const server = app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
);

const { Server } = require("ws");
const ws_server = new Server({ server });

let players = []
let selectedButtons = []
let connectedClients = 0
const maxClients = 2

ws_server.on("connection", (wsc) => {
    if (connectedClients >= maxClients) {
        // Reject the connection if the maximum number of clients is reached
        console.log("Connection rejected: Maximum clients reached");
        wsc.send(JSON.stringify({ type: "clientNotAllowed" }));
        wsc.close();
        return;
    }
    connectedClients++;

    let id;
    console.log("Connesso");

    // Inform the new client about existing players
    players.forEach((player) => {
        wsc.send(JSON.stringify({
            type: "spawnPlayer",
            id: player.id,
            posX: player.posX,
            posY: player.posY
        }));

        selectedButtons.forEach((selectedButton) => {
            wsc.send(JSON.stringify({ type: "disableButton", id: selectedButton }));
        });
    });

    wsc.on("message", (data) => {
        let message = JSON.parse(data);
        switch (message.type) {
            case "moveSquare":
                message = {
                    type: "moveSquare",
                    id: message.id,
                    posX: message.posX,
                    posY: message.posY,
                };

                console.log("Si sta muovendo: " + message.id)

                ws_server.clients.forEach((client) => {
                    client.send(JSON.stringify(message));
                });

                players.forEach((square) => {
                    if (square.id == message.id) {
                        square.posX = message.posX;
                        square.posY = message.posY;
                    }
                });
                break;
            case "classSelected":
                wsc.send(JSON.stringify({ type: "init", id: message.id }));
                id = message.id

                ws_server.clients.forEach((client) => {

                    let spawnPlayer = {
                        type: "spawnPlayer",
                        id: message.id,
                    };

                    players.push(spawnPlayer)

                    client.send(JSON.stringify(spawnPlayer));
                });

                selectedButtons.push(message.id);

                ws_server.clients.forEach((client) => {
                    let disableButton = { type: "disableButton", id: message.id };
                    client.send(JSON.stringify(disableButton));
                });
                break
        }
    });
    wsc.on("close", (wsc) => {
        connectedClients--;
        //Quando si sconnette qualcuno, elimina il suo quadrato dai client e dal server
        console.log("scollegato");

        players = players.filter((square) => square.id !== id);
        selectedButtons = selectedButtons.filter((button) => button !== id);

        ws_server.clients.forEach((client) => {
            let message = { type: "deleteSquare", id: id };
            client.send(JSON.stringify(message));

            let enableButton = { type: "enableButton", id: id };
            client.send(JSON.stringify(enableButton));
        });
    });
});
