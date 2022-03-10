console.log("aeiou")
let typer = document.getElementById("typer")
let text = typer.innerText
text = text.replace(/[^a-zA-Z0-9()\-:;.,?!"' ]/g, "")
typer.innerHTML = `<span class = "untyped">${text}</span>`

let validLetters = new RegExp(/[a-zA-Z0-9()\-:;.,?!"' ]/m)

//regular expression including all valid characters you can type in the passage


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


document.addEventListener("keydown", e => {

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
    let untypedText = text.slice(currentPos, text.length)
    //gets three chunks: correct text, incorrect text, untyped text

    let formattedCorrect = `<span class = "correct">${correctText}</span>`
    let formattedIncorrect = `<span class = "incorrect">${incorrectText}</span>`
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`

    typer.innerHTML = formattedCorrect + formattedIncorrect + formattedUntyped
    //formats text according to type and joins it in order
})