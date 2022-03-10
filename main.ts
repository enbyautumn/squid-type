console.log("aeiou")
let typer = document.getElementById("typer")
let text = typer.innerText
let validLetters = new RegExp(/[a-zA-Z0-9()\-:;.,?!"']/m)


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


document.addEventListener("keydown", e => {
    if (e.key == "Backspace") {
        currentPos--
    }
    else {
        if (e.key.length == 1 && validLetters.test(e.key)) {
            console.log(e.key)
            if (e.key != text[currentPos]) {
                incorrect = true
                incorrectStart = currentPos
            }
            currentPos++;
        }
        
    }
    currentPos = clamp(currentPos, 0, text.length)

    let typedText = text.slice(0, currentPos)
    let untypedText = text.slice(currentPos, text.length)

    let formattedTyped = `<span class = "correct">${typedText}</span>`
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`

    typer.innerHTML = formattedTyped + formattedUntyped;
    
})