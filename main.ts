import Peer from 'peerjs';
let clamp = (number: number, min: number, max: number) => number < min ? min : number > max ? max : number

let typer = document.getElementById("typer")
let light = document.getElementById("trafficlight")
let text = typer.innerText
text = text.replace(/[^a-zA-Z0-9()\-:;.,?!"' ]/g, "")
typer.innerHTML = `<span class = "untyped">${text}</span>`

//regular expression including all valid characters you can type in the passage
let validLetters = new RegExp(/[a-zA-Z0-9()\-:;.,?!"' ]/m)

function getWords() {
    let req = new XMLHttpRequest();
    req.open("GET", "https://cors.evaexists.workers.dev/?url=https://xkcd.com/simplewriter/words.js", false);
    req.send();
    req.response[0] = "m///o"
    return req.response.match(/(?<=["|])(.*?)(?=["|])/gm).map(s => s.replaceAll(/[^a-zA-Z0-9()\-:;.,?!"' ]/gm, ""))
}

console.log(getWords());

let currentPos = 0
let incorrectStart = 0
let incorrect = false

let playerlistDisplay = document.getElementById("playerlist") as HTMLUListElement
let statusDisplay = document.getElementById("status") as HTMLParagraphElement
let startButton = document.getElementById("start") as HTMLButtonElement

let hostButtom = document.getElementById("hostButton") as HTMLButtonElement
let joinButton = document.getElementById("joinButton") as HTMLButtonElement

const yellowDuration = 3000; //delay in ms between yellow and red light
const redDuration = 4000; //delay in ms between red and green light


let peer = new Peer();
let conn: Peer.DataConnection;
let host = false;
let connected = false;

let opponentPos = 0;

let selfBar;
let opponentBar;

let started = false
let eliminated = false

function createBar(progress) {
    //Progress should be a decimal from 0-1, where 1 = 100%
    if (progress < 0 || progress >= 1) {
        console.log("invalid progress passed to createBar")
        return null;  
    }

    let bars = document.getElementById("bars")
    let progContainer = document.createElement("div");
    progContainer.classList.add("progresscontainer");

    let progBar = document.createElement("div");
    progBar.classList.add("progressbar");

    progBar.style.setProperty("--progress", `${progress * 100}%`);
    console.log(`progress bar: ${progBar.style.width}`)
    progContainer.appendChild(progBar);

    bars.appendChild(progContainer);
    return progBar
}

function updateBar(bar, progress) {
    bar.style.setProperty("--progress", `${progress * 100}%`);
}

function stopLight() {
    light.style.setProperty("--color", "yellow");
    setTimeout(() => {
        light.style.setProperty("--color", "red")
        setTimeout(() => {
            light.style.setProperty("--color", "green")
        }, redDuration);
    }, yellowDuration);
}

hostButtom.addEventListener("click", () => {
    console.log(peer.id)
    host = true;
    
    (document.getElementById("roomid") as HTMLFormElement).value = peer.id;

    hostButtom.disabled = true;
    
    document.getElementById("join").classList.add("hidden")

    peer.on('connection', function(connection) {

        conn = connection;

        connected = true;

        console.log("connected")

        opponentBar = createBar(0)


        startButton.disabled = false;
        startButton.classList.remove("completely-hidden")

        conn.on('data', function(data){

            if(data[0] == "p") {
                opponentPos = parseInt(data.split("|")[1])
            }

            updateBar(opponentBar, opponentPos/text.length)

            console.log(opponentPos)

            console.log(data);

        });
    });
})

joinButton.addEventListener("click", () => {
    console.log(peer.id)
    host = false;

    let roomid = (document.getElementById("joinid") as HTMLFormElement).value;

    if (roomid.length == 0) {
        alert("Please enter a room ID")
        return;
    }
    
    startButton.disabled = false;
    joinButton.disabled = true;
    hostButtom.disabled = true;
    (document.getElementById("joinid") as HTMLFormElement).disabled = true;
    document.getElementById("host").classList.add("hidden")

    conn = peer.connect(roomid);

    conn.on('open', function(){

        console.log("connected");

        opponentBar = createBar(0)


        conn.on('data', function(data){

            if (data[0] == "s") {
                started = true;
            }

            if(data[0] == "p") {
                opponentPos = parseInt(data.split("|")[1])
            }

            console.log(opponentPos)

            updateBar(opponentBar, opponentPos/text.length)

            console.log(data);
    
        })

    });
})

startButton.addEventListener("click", () => {
    if (!connected) {
        return;
    }
    started = true;
    startButton.disabled = true;
    startButton.classList.add("completely-hidden")

    conn.send("s");
})


selfBar = createBar(0)

document.addEventListener("keydown", e => {

    if (!started) {
        return;
    }

    // incorrectStart is the proper measure for position to send to other players

    if (e.key == "Backspace") { //on backspace, move the cursor back
        currentPos--
        if (currentPos <= incorrectStart) {
            incorrect = false
            //if cursor is behind the incorrect portion, no more incorrect text
        }
    }

    //DEBUG KEY, REMOVE WHEN DONE
    if (e.key == ";") {
        stopLight();
    }

    else {
        if (e.key.length == 1 && validLetters.test(e.key)) { 
            if (light.style.getPropertyValue("--color") == "red") {
                eliminated = true;
                console.log("player eliminated")
                //TODO
            }
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
    // @ts-ignore
    correctText = correctText.replaceAll(" ", "░&#8203;")
    let untypedText = text.slice(currentPos, text.length)
    //gets three chunks: correct text, incorrect text, untyped text

    let formattedCorrect = `<span class = "correct">${correctText}</span>`
    let formattedIncorrect = `<span class = "incorrect">${incorrectText}</span>`
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`

    typer.innerHTML = formattedCorrect + formattedIncorrect + formattedUntyped
    //formats text according to type and joins it in order

    conn.send(`p|${incorrectStart}`);

    if (selfBar) {
        updateBar(selfBar, incorrectStart/text.length)
    }
})