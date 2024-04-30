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

let clientConnections = []

ws_server.on("connection", (wsc) => {

    query = "INSERT INTO Player (ID_Brawler) VALUES (?)";
    values = [null];

    executeQuery(query, values, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }

        clientConnections.push({client: wsc, ID: result.insertId})
        console.log(clientConnections)
    });

    /*query = "SELECT ID FROM Player WHERE ID = ? AND Available = 1";

    executeQuery(query, values, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }

        let response = { type: "availableResponse", available: true }

        if (result[0].AvailableNumber == 0) {
            response.available = false;
        }

        ws_server.client.send(JSON.stringify(response));
    });

    */wsc.on("message", (data) => {
        let message = JSON.parse(data);
        let query, values
        switch (message.type) {
            case "brawlerAvailable":

                query = "SELECT COUNT(*) AS AvailableNumber FROM Brawler WHERE ID = ? AND Available = 1";
                values = [message.ID_Server];

                executeQuery(query, values, function (err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    let response = { type: "availableResponse", available: true }

                    if (result[0].AvailableNumber == 0) {
                        response.available = false;
                    }
                    console.log("mando messaggio")
                    wsc.send(JSON.stringify(response));
                });
                break
            case "brawlerSelected":
                query = "UPDATE Player SET ID_Brawler = ? WHERE ID = ?";
                values = [message.ID_Server, clientID];

                executeQuery(query, values, function (err, elenco, campi) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });

                query = "UPDATE Brawler SET Available = 0 WHERE ID = ?";
                values = [message.ID_Server];

                executeQuery(query, values, function (err, elenco, campi) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
                break
            case "spawnPlayer":
                console.log("prova")
                ws_server.clients.forEach((client) => {
                    let newPlayer = {
                        //selectedClass: selectedClass,
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
        let clientID = clientConnections[wsc].ID
        const selectBrawlerQuery = "SELECT ID_Brawler FROM Player WHERE ID = ?";
        console.log(clientID)
        const selectBrawlerValues = [clientID];

        executeQuery(selectBrawlerQuery, selectBrawlerValues, function (err, result) {
            if (err) {
                console.error('Errore durante il recupero del brawler associato al giocatore:', err);
                return;
            }
            console.log(result[0])
            if (result[0] && result[0].ID_Brawler != undefined) {
                const brawlerID = result[0].ID_Brawler;

                const updateBrawlerQuery = "UPDATE Brawler SET Available = 1 WHERE ID = ?";
                const updateBrawlerValues = [brawlerID];

                executeQuery(updateBrawlerQuery, updateBrawlerValues, function (err, result) {
                    if (err) {
                        console.error('Errore available brawler', err);
                        return;
                    }
                });
            }
        });

        delete clientConnections[wsc];

        const deleteQuery = "DELETE FROM Player WHERE ID = ?";
        let values = [clientConnections[wsc]];

        executeQuery(deleteQuery, values, function (err, result) {
            if (err) {
                console.error('Errore eliminazione giocatore', err);
                return;
            }
        });
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
