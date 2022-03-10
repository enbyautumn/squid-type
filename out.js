(() => {
  // main.ts
  console.log("aeiou");
  var typer = document.getElementById("typer");
  var text = typer.innerText;
  var validLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890,.".split("");
  console.log(text);
  var currentPos = 0;
  function clamp(number, min, max) {
    if (number < min) {
      number = min;
    } else if (number > max) {
      number = max;
    }
    return number;
  }
  document.addEventListener("keydown", (e) => {
    console.log(e.key);
    console.log(validLetters.test(e.key));
    if (e.key == "Backspace") {
      currentPos--;
    } else {
      if (e.key == text[currentPos]) {
        currentPos++;
      }
    }
    currentPos = clamp(currentPos, 0, text.length);
    let typedText = text.slice(0, currentPos);
    let untypedText = text.slice(currentPos, text.length);
    let formattedTyped = `<span class = "correct">${typedText}</span>`;
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`;
    typer.innerHTML = formattedTyped + formattedUntyped;
  });
})();
