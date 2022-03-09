console.log("aeiou")
let typer = document.getElementById("typer")
let text = typer.innerText

function generateSpan(name, start, end) {

}

console.log(text)


let currentPos = 0
/*
let untypedStart = 0
let untypedEnd = 0
let correctStart = 0
let correctEnd = 0
let incorrectStart = 0
let incorrectEnd = 0
*/


document.addEventListener("keydown", e => {
    currentPos++
    let typedText = text.slice(0, currentPos)
    let untypedText = text.slice(currentPos, text.length)

    let formattedTyped = `<span class = "typed">${typedText}</span>`
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`

    typer.innerHTML = formattedTyped + formattedUntyped;
    
})