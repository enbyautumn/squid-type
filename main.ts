console.log("aeiou")
let typer = document.getElementById("typer")
let text = typer.innerText
//let validLetters = new RegExp("[a-zA-Z0-9()\-:;.,?!\"']")
// let validLetters = RegExp("[a-zA-Z0-9]")
let validLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890,.".split('')

console.log(text)


let currentPos = 0
let incorrectStart = 0
let incorrect = false;


function clamp(number, min, max) {
    if (number < min) {
        number = min
    }
    else if (number > max) {
        number = max
    }

    return number
}

function filter(c) {
    let validLetters = RegExp("/[a-zA-Z0-9()\-:;.,?!\"']/")
    if (validLetters.test(c)) {
        console.log("based")
    }
}

document.addEventListener("keydown", e => {
    console.log(e.key)
    console.log(validLetters.test(e.key))
    if (e.key == "Backspace") {
        currentPos--
    }
    else {
        
        if (e.key == text[currentPos]) {
            currentPos++
        }
        
    }
        currentPos = clamp(currentPos, 0, text.length)

    let typedText = text.slice(0, currentPos)
    let untypedText = text.slice(currentPos, text.length)

    let formattedTyped = `<span class = "correct">${typedText}</span>`
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`

    typer.innerHTML = formattedTyped + formattedUntyped;
    
})