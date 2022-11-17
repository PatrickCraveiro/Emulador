module.exports = function (checked) {
  let nameRom = img.src.split("/").pop();

  if (checked == false) {
    img.src = img.src.replace(nameRom, "Turn off.gif");
  } else {
    img.classList.remove("desligado");
    let marcado = document.querySelector(".marcado");
    img.src = `src/imgs/${marcado.textContent}.gif`;
  }

  setTimeout(() => {
    if (checked == false) {
      img.classList.add("desligado");
    } else {
      img.classList.remove("desligado");
      let marcado = document.querySelector(".marcado");
      img.src = `src/imgs/${marcado.textContent}.gif`;
    }
  }, 1500);
};
