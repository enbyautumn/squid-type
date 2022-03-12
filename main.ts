import Peer from 'peerjs';

enum Role {
    Host,
    Client
}

let typer = document.getElementById("typer")
let text = typer.innerText
text = text.replace(/[^a-zA-Z0-9()\-:;.,?!"' ]/g, "")
typer.innerHTML = `<span class = "untyped">${text}</span>`

let validLetters = new RegExp(/[a-zA-Z0-9()\-:;.,?!"' ]/m)

//regular expression including all valid characters you can type in the passage

let inGame = false
let playerNumber: number;
let role: Role;
let connections: Peer.DataConnection[] = []
let conn: Peer.DataConnection;
let connectionDisplay = document.getElementById("playerlist")
const peer = new Peer();
let positions = {};

let currentPos = 0
let incorrectStart = 0
let incorrect = false


function clamp(number, min, max) {//clamps a number between two bounds
    if (number < min) {
        number = min
    }
    else if (number > max) {
        number = max
    }

    return number
}

function updatePositions() {
    if (role == Role.Host) {
        connections.forEach(c => c.send("sendPosition"))
        connections.forEach(c => c.send({
            "type": "updatePosition",
            "player": playerNumber,
            "position": incorrectStart,
        }))
        positions[playerNumber] = incorrectStart
        console.log(playerNumber)
        console.log(positions)
    }
}

peer.on('open', id => {
    console.log('My peer ID is: ' + id);
});

peer.on('connection', conn => {
    console.log("connection made")
    connections.push(conn)

    let li = document.createElement("li");
    let playerNum = connections.length + 1
    li.innerText = `Player ${playerNum}`;
    connectionDisplay.appendChild(li);

    conn.on('data', (data) => {
        console.log(data);
        console.log(conn.peer)
        if (data.type && data.type == "updatePosition") {
            positions[data.player] = data.position;
            console.log(positions)
        }
        connections.filter(c => c.peer != conn.peer).forEach(c => c.send(data))
    });

    conn.on('open', () => {
        conn.send({
            playerNumber: playerNum,
        })
        connections.forEach(c => c.send({
            "addPlayer": playerNum,
        }))
    })
})

let initClientConn = () => {
    conn.on('open', () => {
        console.log("connection opened")
        let li = document.createElement("li");
        li.innerText = `Player ${1}`;
        connectionDisplay.appendChild(li);
        conn.on('data', (data) => {
            if (data.playerNumber) {
                playerNumber = data.playerNumber
            }
            if (data.addPlayer) {
                connectionDisplay.querySelectorAll("li").forEach(li => {
                    li.remove()
                })
                for (let i = 0; i < data.addPlayer; i++) {
                    let li = document.createElement("li");
                    li.innerText = `Player ${i+1} ${i+1 == playerNumber ? "(You)" : ""}`;
                    connectionDisplay.appendChild(li);
                }
            }
            if (data == "sendPosition") {
                conn.send({
                    "type": "updatePosition",
                    "player": playerNumber,
                    "position": incorrectStart,
                })
                positions[playerNumber] = incorrectStart
            }
            if (data.type && data.type == "updatePosition") {
                positions[data.player] = data.position;
            }
            console.log(data);
        });
    })
}

document.getElementById("hostButton").addEventListener("click", () => {
    if (!peer.id) {
        return
    }
    role = Role.Host
    let li = document.createElement("li");
    playerNumber = connections.length + 1
    li.innerText = `Player ${playerNumber} (You)`;
    connectionDisplay.appendChild(li);
    // inGame = true
    document.getElementById("hostButton").classList.add("completely-hidden");
    document.getElementById("join").classList.add("hidden");
    document.getElementById("roomid").classList.add("full-width");
    (document.getElementById("roomid") as HTMLInputElement).value = peer.id;
})

document.getElementById("joinButton").addEventListener("click", () => {
    if (!peer.id) {
        return
    }
    role = Role.Client;
    let id = (document.getElementById("joinid") as HTMLInputElement).value
    if (!id) {
        return
    }
    console.log(id);
    conn = peer.connect(id);
    initClientConn()
    // inGame = true
    document.getElementById("joinButton").classList.add("completely-hidden");
    document.getElementById("host").classList.add("hidden");
    document.getElementById("joinid").classList.add("full-width");
    (document.getElementById("joinid") as HTMLInputElement).disabled = true
})


document.addEventListener("keydown", e => {
    if (conn && e.key == "`") {
        console.log("sending hi")
        conn.send("HI")
    }
    if (e.key == "@") {
        inGame = true;
    }
    if (role == Role.Host && e.key == "!") {
        updatePositions();
    }
    if (role == Role.Client && e.key == "!") {
        console.log(positions)
    }
    if (conn && role == Role.Client) {
        conn.send("hello")
    }
    if (inGame) {
        // incorrectStart is the proper measure for position to send to other players

        if (e.key == "Backspace") { //on backspace, move the cursor back
            currentPos--
            if (currentPos <= incorrectStart) {
                incorrect = false
                //if cursor is behind the incorrect portion, no more incorrect text
            }
        }

        else {
            if (e.key.length == 1 && validLetters.test(e.key)) { 
                //checks that key pressed is a valid character
                if (e.key != text[currentPos] && !incorrect) {
                    //checks beginning of mistake
                    incorrectStart = currentPos
                    incorrect = true
                }

                currentPos++
                //if valid key typed, move cursor regardless of correctness
            }
            
        }

        currentPos = clamp(currentPos, 0, text.length)

        if (!incorrect) {
            incorrectStart = currentPos
        } //saves start of mistake if there is a mistake, does not otherwise


        let correctText = text.slice(0, incorrectStart)
        let incorrectText = text.slice(incorrectStart, currentPos)
        // @ts-ignore
        incorrectText = incorrectText.replaceAll(" ", "░&#8203;")
        let untypedText = text.slice(currentPos, text.length)
        //gets three chunks: correct text, incorrect text, untyped text

        let formattedCorrect = `<span class = "correct">${correctText}</span>`
        let formattedIncorrect = `<span class = "incorrect">${incorrectText}</span>`
        let formattedUntyped = `<span class = "untyped">${untypedText}</span>`

        typer.innerHTML = formattedCorrect + formattedIncorrect + formattedUntyped
        //formats text according to type and joins it in order
    }
})