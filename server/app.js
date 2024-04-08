const express = require("express");
const app = express();
const port = 3000;
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public"));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.render("classSelectWindow.ejs");
});

app.get("/battleground", (req, res) => {
    res.render("battleground.ejs");
});

const server = app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
);

const { Server } = require("ws");
const ws_server = new Server({ server });

let listaSquare = [];

ws_server.on("connection", (wsc) => {

    wsc.on("message", (data) => {
        let message = JSON.parse(data);
        switch (message.type) {
            case "classSelected":
                let messageConnection = {type: "init"}
                wsc.send(JSON.stringify(messageConnection));
                break
            case "spawnPlayer":
                ws_server.clients.forEach((client) => {
                    let newMessage = {
                        type: "spawnPlayer",
                        posX: 100,
                        posY: 100
                    }
                    listaSquare.push(newMessage);
                    client.send(JSON.stringify(newMessage));
                });
                break
            /*case "moveSquare":
                message = {
                    type: "moveSquare",
                    id: message.id,
                    posX: message.posX,
                    posY: message.posY,
                }

                ws_server.clients.forEach((client) => {
                    client.send(JSON.stringify(message));
                })

                listaSquare.forEach((square) => {
                    if (square.id == message.id) {
                        square.posX = message.posX;
                        square.posY = message.posY;
                    }
                })
                break*/
        }
    });
    wsc.on("close", (wsc) => {
        console.log("scollegato");
            /*for (let i = 0; i < listaSquare.length; i++) {
            if (listaSquare[i].id == id) {
                listaSquare.splice(i, 1);
            }
        }
        ws_server.clients.forEach((client) => {
            let message = { type: "deleteSquare", id: id };
            client.send(JSON.stringify(message));
        });*/
    });
});
