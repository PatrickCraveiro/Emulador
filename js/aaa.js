const fs = require("fs");

let data = JSON.parse(fs.readFileSync("plataforma/lista_de_jogos.json"), {
  encoding: "utf-8",
});

let img = document.querySelector("img");
let menu = document.querySelector(".selection-container__display__screen");
let power = document.querySelector("input");
let baixo = document.querySelector(
  ".selection-container__nav-btn__directional__bottom"
);
let cima = document.querySelector(
  ".selection-container__nav-btn__directional__top"
);

console.log(data);

Object.entries(data).forEach(([key, value]) => {
  let a = data[key];

  a.roms.forEach((el) => {
    let div = document.createElement("div");
    div.className = "selection-container__display__screen__game";

    div.textContent = el;

    menu.append(div);

    div.onclick = (event) => {
      document.querySelector(".marcado").classList.remove("marcado");
      event.target.classList.add("marcado");
      img.src = `src/imgs/${event.target.textContent}.gif`;
    };
  });

  primeiraRom = menu.firstElementChild;
  primeiraRom.classList.add("marcado");
  img.src = `src/imgs/${primeiraRom.textContent}.gif`;
});

power.onchange = () => {
  let nameRom = img.src.split("/").pop();
  img.src = img.src.replace(nameRom, "Turn off.gif");

  setTimeout(() => {
    img.remove();
  }, 1500);
};

const move = (dir) => {
  let marcado = document.querySelector(".marcado");

  let direcao =
    marcado[dir === "cima" ? "previousElementSibling" : "nextElementSibling"];

  console.log(direcao);
  if (!direcao) return;

  marcado.classList.remove("marcado");

  direcao.scrollIntoView({ block: "center" });

  direcao.classList.add("marcado");
  img.src = `src/imgs/${direcao.textContent}.gif`;
};

cima.onclick = () => {
  move("cima");
};
baixo.onclick = () => {
  move("baixo");
};
