function mostrarView(nomeView) {
  document.querySelectorAll('.view').forEach((secao) => {
    secao.classList.toggle('active', secao.dataset.view === nomeView);
  });
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === nomeView);
  });
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => mostrarView(btn.dataset.view));
});
