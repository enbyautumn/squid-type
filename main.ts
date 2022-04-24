import Peer from 'peerjs';
//multiplayer functionality done using peerJS: https://peerjs.com/

let clamp = (number: number, min: number, max: number) => number < min ? min : number > max ? max : number

let typer = document.getElementById("typer");
let light = document.getElementById("trafficlight");
let text;

//regular expression including all valid characters you can type in the passage
let validLetters = new RegExp(/[ -~]/m);

function getWords() {
    let req = new XMLHttpRequest();
    req.open("GET", "https://gist.githubusercontent.com/deekayen/4148741/raw/98d35708fa344717d8eee15d11987de6c8e26d7d/1-1000.txt", false); //credit for word pool goes to deekayen on GitHub @ https://github.com/deekayen
    req.send();
    return req.response.split("\n");
}

let possWords = getWords();
let wordCount = 20;

let randWord = () => possWords[Math.floor(Math.random() * possWords.length)];

console.log(possWords);

let currentPos = 0;
let incorrectStart = 0;
let incorrect = false;

let startButton = document.getElementById("start") as HTMLButtonElement;
let hostButton = document.getElementById("hostButton") as HTMLButtonElement;
let joinButton = document.getElementById("joinButton") as HTMLButtonElement;

const joinTimeout = 5000;

const yellowDuration = 3000; //delay in ms between yellow and red light
const redDuration = 3000; //delay in ms between red and green light
const minLightInterval = 2000;
const maxLightInterval = 8000;
let stop = false;

let timeouts = [];

let peer = new Peer(`st-${randWord()}-${randWord()}-${randWord()}`);
let conn: Peer.DataConnection;
let host = false;
let connected = false;
let started = false;

let opponentPos = 0;

let selfBar: HTMLDivElement;
let opponentBar: HTMLDivElement;

let curTime = Date.now();

function resetGUI() {
    startButton.disabled = true;
    startButton.classList.add("completely-hidden");
    joinButton.disabled = false;
    hostButton.disabled = false;
    (document.getElementById("joinid") as HTMLFormElement).disabled = false;
    document.getElementById("host").classList.remove("hidden");
}

function generateText(count, words) {
    let l = words.length;
    let selectedWords = [];

    let i = 0;
    while (i < count) {
        let curWord = words[Math.floor(Math.random() * l)];
        if (selectedWords.indexOf(curWord) == -1) {
            if (Math.random() < 0.5) {
                curWord = curWord.charAt(0).toUpperCase() + curWord.slice(1);
            }
            selectedWords.push(curWord);
            i++;
        }
    }
    //selects "count" number of words from the word pool, randomly capitalizes some, and appends them to the list to be returned

    return selectedWords.join(" ")
}

function updateBar(bar, progress) {
    bar.style.setProperty("--progress", `${progress * 100}%`);
    bar.innerText = `${Math.round(progress * 100)}%`;
    //updates progress bar passed with progress passed
}

function createBar(progress) {
    //Progress should be a decimal from 0-1, where 1 = 100%

    let bars = document.getElementById("bars");
    let progContainer = document.createElement("div");
    progContainer.classList.add("progresscontainer");

    let progBar = document.createElement("div");
    progBar.classList.add("progressbar");

    updateBar(progBar, progress)
    console.log(`progress bar: ${progBar.style.width}`)
    progContainer.appendChild(progBar);

    bars.appendChild(progContainer);
    return progBar;

    //creates a new progress bar with progress passed as parameter, returns it
}


function stopLight() {
    light.style.setProperty("--color", "yellow");

    timeouts.push(
        setTimeout(() => {
            light.style.setProperty("--color", "red")
            stop = true;
        }, yellowDuration),

        setTimeout(() => {
            light.style.setProperty("--color", "green")
            stop = false;
        }, yellowDuration + redDuration)
    );

    //procedure for initiating traffic light stop: turn it yellow, then red after a certain amount of time, then green
}

function trafficLoop() {
    stopLight();
    conn.send("t");
    let delay = minLightInterval + yellowDuration + redDuration + Math.random() * (maxLightInterval - minLightInterval);
    timeouts.push(
        setTimeout(trafficLoop, delay)
    );
    console.log(`set next light with delay ${delay} ms, id ${timeouts[timeouts.length - 1]}`);
    //starts a loop for stopping the traffic light at random intervals
}

function start() {
    setTimeout(() => {
        light.innerText = "3";
        light.style.setProperty("--color", "red");
    }, 0);

    setTimeout(() => {
        light.innerText = "2";
        light.style.setProperty("--color", "yellow");
    }, 1000);

    setTimeout(() => {
        light.innerText = "1";
    }, 2000);

    setTimeout(() => {
        light.innerText = "GO!";
        light.style.setProperty("--color", "green");
        started = true;
        if (host) {
            setTimeout(trafficLoop, minLightInterval + Math.random() * maxLightInterval);
        }
    }, 3000);

    setTimeout(() => {
        light.innerText = "";
    }, 3500);

    //displays countdown and turns light green, also starts traffic light
}

function endGame(status, elim = false) {
    started = false;
    light.style.setProperty("--color", "red");
    //ends the game and sets the light to red, preventing players from typing any further inputs

    for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
        console.log(`clearing timeout with id ${timeouts[i]}`);
    }
    //stops all ongoing timeouts, preventing any further events from happening

    if (status == "win") {

        if (elim) {
            opponentBar.style.setProperty("--barcolor", "red");
            opponentBar.style.setProperty("overflow", "visible");
        }
        //if player wins by elimination of opponent, set opponent bar to red

        selfBar.style.setProperty("--barcolor", "gold");
        selfBar.style.setProperty("--progress", "100%");
        selfBar.innerHTML = "You&nbsp;win!";
        //change bar color to full gold, display win message
    }

    else if (status == "lose") {
        if (elim) {
            selfBar.style.setProperty("--barcolor", "red");
            selfBar.style.setProperty("overflow", "visible");
            selfBar.innerHTML = "Red&nbsp;light!";
        }
        //if player lost by elimination, set own bar to red and display elimination message

        else {
            selfBar.style.setProperty("overflow", "visible");
            selfBar.innerHTML = "Too&nbsp;slow...";
        }
        //otherwise (losing by being slower than opponent), display relevant message

        opponentBar.style.setProperty("--barcolor", "gold");
        opponentBar.style.setProperty("--progress", "100%");
        //regardless of losing method, change opponent bar to victorious bar
    }

    else {
        console.log("invalid parameter passed to endGame");
    }
}

hostButton.addEventListener("click", () => {
    console.log(peer.id);
    host = true;
    text = generateText(wordCount, possWords);
    typer.innerHTML = `<span class = "untyped">${text}</span>`;
    //generates random words, displays them on the page to be typed

    (document.getElementById("roomid") as HTMLFormElement).value = peer.id;

    hostButton.disabled = true;
    
    document.getElementById("join").classList.add("hidden")

    peer.on('connection', function(connection) {


        conn = connection;

        if (connected == true) {
            
            conn.close();
            return;
        }

        connected = true;

        console.log("connected");

        opponentBar = createBar(0);
        

        startButton.disabled = false;
        startButton.classList.remove("completely-hidden");

        conn.on('open', function() {
            conn.send("x|" + text);
        })
         //on opponent connection, create a new progress bar and display start button, send words to be typed

        conn.on('data', function(data){
            switch (data[0]) {
                //update opponent position with any data received
                case "p":
                    opponentPos = parseInt(data.split("|")[1]);
                    break;

                //if opponent wins, you lose, and vice-versa
                case "w":
                    endGame("lose");
                    break;
                

                case "l":
                    endGame("win", true);
                    break;
            }

            updateBar(opponentBar, opponentPos/text.length);
            //updates opponent progress bar w/ new position

            console.log(opponentPos);

            console.log(data);

        });
    });
})

joinButton.addEventListener("click", () => {
    console.log(peer.id);
    host = false;

    let roomid = (document.getElementById("joinid") as HTMLFormElement).value;

    if (roomid.length == 0) {
        alert("Please enter a room ID");
        return;
    }
    conn = peer.connect(roomid);
    
    startButton.disabled = false;
    joinButton.disabled = true;
    hostButton.disabled = true;
    (document.getElementById("joinid") as HTMLFormElement).disabled = true;
    document.getElementById("host").classList.add("hidden");

    peer.on("error", function(err) {
        conn.close();
        alert("Connection failed");
        console.log(err.type);
        resetGUI();
    })


    conn.on('open', function() {

        console.log("connected");

        opponentBar = createBar(0);
        //on connecting to host lobby, generate new progress bar for opponent

        conn.on('data', function(data){
            switch (data[0]) {
                case "s":  //game started via host's start button
                    start();
                    break;

                case "p": //position of opponent sent
                    opponentPos = parseInt(data.split("|")[1]);
                    break;
                
                
                //if opponent wins, you lose, and vice-versa
                case "w": //opponent sends win message
                    endGame("lose");
                    break;
                

                case "l": //opponent sends lose message (only happens when eliminated via red light)
                    endGame("win", true);
                    break;
                

                case "t"://host sends signal to trigger traffic light
                
                    console.log(`traffic light triggered w/ delay ${Date.now() - curTime}`);
                    curTime = Date.now();
                    stopLight();
                    break;
                

                case "x": //on receiving text to be typed from host, display it on the page
                    text = data.split("|")[1];
                    typer.innerHTML = `<span class = "untyped">${text}</span>`;
                    break;
            }
            
            

            console.log(opponentPos);

            updateBar(opponentBar, opponentPos/text.length);

            console.log(`not host received data: ${data}`);
    
        })

    });
})

startButton.addEventListener("click", () => {
    if (!connected) {
        return;
    }
    start();
    startButton.disabled = true;
    startButton.classList.add("completely-hidden");

    conn.send("s");
    //on start button click, start the game for self and send message to opponent to start as well
})


selfBar = createBar(0);

document.addEventListener("keydown", e => {

    if (!started) {
        return;
    }

    //you lose if you type in a key during a red light
    if (stop && (e.key == "Backspace" || (e.key.length == 1 && validLetters.test(e.key)))) {
        conn.send("l");
        endGame("lose", true);
        console.log("player eliminated");
        return;
    }
    // incorrectStart is the proper measure for position to send to other players

    if (e.key == "Backspace") { //on backspace, move the cursor back
        currentPos--;
        if (currentPos <= incorrectStart) {
            incorrect = false;
            //if cursor is behind the incorrect portion, no more incorrect text
        }
    }


    if (e.key.length == 1 && validLetters.test(e.key)) { 
        //checks that key pressed is a valid character
        if (e.key != text[currentPos] && !incorrect) {
            //checks beginning of mistake
            incorrectStart = currentPos;
            incorrect = true;
        }

        currentPos++
        //if valid key typed, move cursor regardless of correctness
    }
        
    

    currentPos = clamp(currentPos, 0, text.length);

    if (!incorrect) {
        incorrectStart = currentPos;
    } //saves start of mistake if there is a mistake, does not otherwise

    let correctText = text.slice(0, incorrectStart);
    let incorrectText = text.slice(incorrectStart, currentPos);
    // @ts-ignore
    incorrectText = incorrectText.replaceAll(" ", "░&#8203;");
    // @ts-ignore
    correctText = correctText.replaceAll(" ", "░&#8203;");
    let untypedText = text.slice(currentPos, text.length);
    //gets three chunks: correct text, incorrect text, untyped text

    let formattedCorrect = `<span class = "correct">${correctText}</span>`;
    let formattedIncorrect = `<span class = "incorrect">${incorrectText}</span>`;
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`;

    typer.innerHTML = formattedCorrect + formattedIncorrect + formattedUntyped;
    //formats text according to type and joins it in order

    if (selfBar) {
        updateBar(selfBar, incorrectStart/text.length);
    }

    conn.send(`p|${incorrectStart}`);

    //player who types the entire length of the text first wins
    if (incorrectStart == text.length) {
        conn.send("w");
        endGame("win");
    }
})