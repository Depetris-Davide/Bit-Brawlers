const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
let mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bit_brawlers"
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public"));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.render("classSelectWindow.ejs");
});

app.get("/battleground", (req, res) => {
    res.render("battleground.ejs");
});

const server = app.listen(port);

const { Server } = require("ws");
const ws_server = new Server({ server });

let selectedClass

ws_server.on("connection", (wsc) => {



    wsc.on("message", (data) => {
        let message = JSON.parse(data);
        switch (message.type) {
            case "classSelected":
                selectedClass = message.name

                query = "UPDATE class SET Selected = ? WHERE Name = ?";
                executeQuery(query, [true, message.name], function (err, elenco, campi) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
                let messageConnection = { type: "changeLocation" }
                wsc.send(JSON.stringify(messageConnection));
                break
            case "spawnPlayer":
                ws_server.clients.forEach((client) => {
                    let newPlayer = {
                        selectedClass: selectedClass,
                        position: { x: 0, y: 0 },
                        velocity: { x: 0, y: 0 }
                    };

                    let message = {
                        type: "spawnPlayer",
                        player: newPlayer
                    };
                    ws_server.clients.forEach((client) => {
                        client.send(JSON.stringify(message));
                    })
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

function executeQuery(query, values, callback) {
    con.query(query, values, function (err, result, fields) {
        if (err) {
            callback(err, null, null);
        } else {
            callback(null, result, fields);
        }
    });
}
