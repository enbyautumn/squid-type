(() => {
  // main.ts
  console.log("aeiou");
  var typer = document.getElementById("typer");
  var text = typer.innerText;
  text = text.replace(/[^a-zA-Z0-9()\-:;.,?!"' ]/g, "");
  typer.innerHTML = `<span class = "untyped">${text}</span>`;
  var validLetters = new RegExp(/[a-zA-Z0-9()\-:;.,?!"' ]/m);
  var currentPos = 0;
  var incorrectStart = 0;
  var incorrect = false;
  function clamp(number, min, max) {
    if (number < min) {
      number = min;
    } else if (number > max) {
      number = max;
    }
    return number;
  }
  document.addEventListener("keydown", (e) => {
    if (e.key == "Backspace") {
      currentPos--;
      if (currentPos <= incorrectStart) {
        incorrect = false;
      }
    } else {
      if (e.key.length == 1 && validLetters.test(e.key)) {
        if (e.key != text[currentPos] && !incorrect) {
          incorrectStart = currentPos;
          incorrect = true;
        }
        currentPos++;
      }
    }
    currentPos = clamp(currentPos, 0, text.length);
    if (!incorrect) {
      incorrectStart = currentPos;
    }
    let correctText = text.slice(0, incorrectStart);
    let incorrectText = text.slice(incorrectStart, currentPos);
    let untypedText = text.slice(currentPos, text.length);
    let formattedCorrect = `<span class = "correct">${correctText}</span>`;
    let formattedIncorrect = `<span class = "incorrect">${incorrectText}</span>`;
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`;
    typer.innerHTML = formattedCorrect + formattedIncorrect + formattedUntyped;
  });
})();
