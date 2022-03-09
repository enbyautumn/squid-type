(() => {
  // main.ts
  console.log("aeiou");
  var typer = document.getElementById("typer");
  var text = typer.innerText;
  console.log(text);
  var currentPos = 0;
  document.addEventListener("keydown", (e) => {
    currentPos++;
    let typedText = text.slice(0, currentPos);
    let untypedText = text.slice(currentPos, text.length);
    let formattedTyped = `<span class = "typed">${typedText}</span>`;
    let formattedUntyped = `<span class = "untyped">${untypedText}</span>`;
    typer.innerHTML = formattedTyped + formattedUntyped;
  });
})();
