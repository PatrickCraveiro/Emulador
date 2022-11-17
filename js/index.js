const fs = require("fs");
const { shell } = require("electron");

const powerChange = require("./js/events/power");
const move = require("./js/events/move");

let data = JSON.parse(fs.readFileSync("plataforma/lista_de_jogos.json"), {
  encoding: "utf-8",
});

let img = document.querySelector("img");
let menu = document.querySelector(".selection-container__display__screen");

const init = () => {
  Object.entries(data).forEach(([nameEmulador, value]) => {
    let emulador = data[nameEmulador];

    emulador.roms.forEach((name) => {
      let div = document.createElement("div");
      div.className = "selection-container__display__screen__game";

      div.textContent = name;

      menu.append(div);

      div.onclick = (event) => {
        document.querySelector(".marcado").classList.remove("marcado");
        event.target.classList.add("marcado");
        img.src = `src/imgs/${name}.gif`;
      };

      div.ondblclick = (event) => {
        let room = `${__dirname}/plataforma/roms/${nameEmulador}/${name}/${name}.${emulador.extensao}`;
        shell.openPath(room);
      };
    });

    primeiraRom = menu.firstElementChild;
    primeiraRom.classList.add("marcado");
    img.src = `src/imgs/${primeiraRom.textContent}.gif`;
  });
};

init();
