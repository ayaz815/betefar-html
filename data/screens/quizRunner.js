const body = document.getElementById("body");
const container = document.getElementById("container");
const navLeft = document.getElementById("nav-left");
const navRight = document.getElementById("nav-right");

let questions = [];
let index = 0;
let audio = new Audio();

fetch("../content/content.json")
  .then((res) => res.json())
  .then((data) => {
    questions = data.questions;
    render();
  });

function render() {
  const q = questions[index];
  container.style.opacity = 0;

  setTimeout(() => {
    container.innerHTML = "";
    body.style.backgroundImage = q.image ? `url('${q.image}')` : "none";

    playAudio(q.audio);

    if (q.type === "single") renderSingle(q);
    if (q.type === "bit") renderBit(q);
    if (q.type === "multiple") renderMultiple(q);

    container.style.opacity = 1;
  }, 500);
}

function renderSingle(q) {
  container.innerHTML = `<div>${q.question}</div>`;
}

function renderBit(q) {
  container.innerHTML = `
    <div class="text-xl opacity-70 mb-2">Clue</div>
    <div>${q.question}</div>
  `;
}

function renderMultiple(q) {
  container.innerHTML = `
    <div class="mb-4">${q.question}</div>
    <div class="grid gap-2 text-xl">
      ${q.options
        .map(
          (opt) =>
            `<button class="bg-white/10 px-4 py-2 rounded">${opt}</button>`
        )
        .join("")}
    </div>
  `;
}

function playAudio(src) {
  if (!src) return;
  audio.pause();
  audio = new Audio(src);
  audio.play().catch(() => {});
}

navLeft.onclick = () => {
  if (index > 0) {
    index--;
    render();
  }
};

navRight.onclick = () => {
  if (index < questions.length - 1) {
    index++;
    render();
  }
};
