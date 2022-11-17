module.exports = function move(dir) {
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

document.onkeydown = (event) => {
  if (["ArrowDown", "ArrowRight"].includes(event.code)) {
    move("baixo");
  } else if (["ArrowUp", "ArrowLeft"].includes(event.code)) move("cima");
};
