const express = require("express");
const app = express();
const port = 3000;
const path = require("path");

function generaColoreRandomico() {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);

    var colore = "#" + toHex(r) + toHex(g) + toHex(b);

    return colore;
}

function toHex(numero) {
    var hex = numero.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public"));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.render("classSelectWindow.ejs");
});

const server = app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
);

const { Server } = require("ws");
const ws_server = new Server({ server });

let listaSquare = [];

ws_server.on("connection", (wsc) => {
    let id = Date.now();
    let messageConnection = { type: "init", id: id };
    let squareColor1 = generaColoreRandomico();
    let squareColor2 = generaColoreRandomico();
    wsc.send(JSON.stringify(messageConnection));

    listaSquare.forEach((square) => {
        let message = square;
        if (square.id != id) {
            wsc.send(JSON.stringify(message));
        }
    });

    ws_server.clients.forEach((client) => {
        let message = {
            type: "spawnSquare",
            posX: 50,
            posY: 50,
            color: `${squareColor1}`,
            borderColor: `${squareColor2}`,
            id: id,
        };
        listaSquare.push(message);
        client.send(JSON.stringify(message));
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

                ws_server.clients.forEach((client) => {
                    client.send(JSON.stringify(message));
                });

                listaSquare.forEach((square) => {
                    if (square.id == message.id) {
                        square.posX = message.posX;
                        square.posY = message.posY;
                    }
                });
                break;
        }
    });
    wsc.on("close", (wsc) => {
        console.log("scollegato");
        for (let i = 0; i < listaSquare.length; i++) {
            if (listaSquare[i].id == id) {
                listaSquare.splice(i, 1);
            }
        }
        ws_server.clients.forEach((client) => {
            let message = { type: "deleteSquare", id: id };
            client.send(JSON.stringify(message));
        });
    });
});
