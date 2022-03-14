import Peer from 'peerjs';
let clamp = (number: number, min: number, max: number) => number < min ? min : number > max ? max : number

let typer = document.getElementById("typer")
let text = typer.innerText
text = text.replace(/[^a-zA-Z0-9()\-:;.,?!"' ]/g, "")
typer.innerHTML = `<span class = "untyped">${text}</span>`

//regular expression including all valid characters you can type in the passage
let validLetters = new RegExp(/[a-zA-Z0-9()\-:;.,?!"' ]/m)

let currentPos = 0
let incorrectStart = 0
let incorrect = false

let playerlistDisplay = document.getElementById("playerlist") as HTMLUListElement
let statusDisplay = document.getElementById("status") as HTMLParagraphElement
let startButton = document.getElementById("start") as HTMLButtonElement

enum Role {
    Host,
    Client
}

class Player {
    id: number
    conn: Peer.DataConnection
    constructor(id: number, conn: Peer.DataConnection) {
        this.id = id
        this.conn = conn
    }
}
enum MessageType {
    updatePosition,
    addPlayer, 
    sendPosition,
    startGame,
}

let self: Player = new Player(0, null)
let peer = new Peer();
let conn: Peer.DataConnection;
let role: Role;
let playerList: Player[] = [];
let statuses = {};
statuses[0] = {
    "position": 0,
    "eliminated": false,
}
let started = false
let eliminated = false

function handleMessage(data: any) {
    console.log(data.type as MessageType, data)
    if (role == Role.Client) {
        switch (data.type as MessageType) {
            case MessageType.updatePosition:
                statuses = data.statuses;
                updatePlayerlist();
                break;
            case MessageType.addPlayer:
                self.id = data.playerNumber;
                statuses[data.playerNumber] = {
                    "position": 0,
                    "eliminated": false,
                }
                break;
            case MessageType.sendPosition:
                statuses[data.player].position = data.position;
                break;
            case MessageType.startGame:
                started = true;
                break;
        }
    } else if (role == Role.Host) {
        switch (data.type as MessageType) {
            case MessageType.sendPosition:
                statuses[data.player].position = data.position;
                playerList.filter(p => p.conn != null).forEach(p => p.conn.send(data))
                break;
        }
    }
}

function updatePlayerlist() {
    if (role == Role.Host) {
        playerList.filter(p => p.conn != null).forEach(p => p.conn.send({"type": MessageType.updatePosition, "statuses": statuses}))
    }
    
    document.querySelectorAll(".player").forEach(e => e.remove())
    for (let id in statuses) {
        let status = statuses[id]
        let li = document.createElement("li")
        li.classList.add("player")
        li.innerText = `Player ${id} ${id == self.id.toString() ? "(You)" : ""}`
        playerlistDisplay.appendChild(li)
    }
}

document.getElementById("hostButton").addEventListener("click", () => {
    if (!peer.id) return;
    role = Role.Host

    playerList.push(self)

    peer.on('connection', conn => {
        console.log("connection made")
        conn.on('open', () => {
            conn.send({
                "type": MessageType.addPlayer,
                "playerNumber": playerList.length
            })
            statuses[playerList.length] = {
                position: 0,
                eliminated: false
            }
            playerList.push(new Player(playerList.length, conn))
            startButton.classList.remove("completely-hidden")
            updatePlayerlist()
        })

        conn.on('data', handleMessage)
    })
    
    document.getElementById("hostButton").classList.add("completely-hidden");
    document.getElementById("join").classList.add("hidden");
    document.getElementById("roomid").classList.add("full-width");
    (document.getElementById("roomid") as HTMLInputElement).value = peer.id;
})

document.getElementById("joinButton").addEventListener("click", async () => {
    if (!peer.id) return;
    let id = (document.getElementById("joinid") as HTMLInputElement).value
    if (!id) return;

    (document.getElementById("joinid") as HTMLInputElement).disabled = true;
    (document.getElementById("joinButton") as HTMLButtonElement).disabled = true;
    
    let connectPromise = new Promise((resolve, reject) => {
        conn = peer.connect(id)
        conn.on("open", () => {
            resolve("connected")
        })
        conn.on("error", (err) => {
            reject(err)
        })
        setTimeout(() => {
            reject("timeout")
        }, 3000)
    })
    await connectPromise.then(r => {
        console.log(r);

        role = Role.Client

        conn.on('data', handleMessage)

        document.getElementById("joinButton").classList.add("completely-hidden");
        document.getElementById("host").classList.add("hidden");
        document.getElementById("joinid").classList.add("full-width");    

    }).catch(e => {
        console.log(e);

        (document.getElementById("joinid") as HTMLInputElement).disabled = false;
        (document.getElementById("joinButton") as HTMLButtonElement).disabled = false;    
    })
})

startButton.addEventListener("click", e => {
    started = true
    startButton.disabled = true
    playerList.filter(p => p.conn != null).forEach(p => p.conn.send({"type": MessageType.startGame}))
})

document.addEventListener("keydown", e => {
    // incorrectStart is the proper measure for position to send to other players

    if (!started) return;
    if (statuses[self.id] && statuses[self.id].eliminated) return;

    if (text[incorrectStart] == " " && !incorrect && role == Role.Client && conn) {
        conn.send({
            "type": MessageType.sendPosition,
            "player": self.id,
            "position": incorrectStart
        })
    }

    if (text[incorrectStart] == " " && !incorrect && role == Role.Host) {
        statuses[0].position = incorrectStart;
        playerList.filter(p => p.conn != null).forEach(p => p.conn.send({
            "type": MessageType.sendPosition,
            "player": self.id,
            "position": incorrectStart
        }))
    }

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
})