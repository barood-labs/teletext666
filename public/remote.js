(() => {
  const b = document.body, lang = b.dataset.lang, subs = +b.dataset.subs, c = document.getElementById('counter');
  let buf = '', sub = 0;
  if (b.dataset.page === '666') b.classList.add('haunted');
  const screens = [...document.querySelectorAll('.screen')];
  if (subs > 1) setInterval(() => { screens[sub].classList.add('hidden'); sub = (sub + 1) % subs; screens[sub].classList.remove('hidden'); }, 8000);
  document.addEventListener('keydown', (e) => {
    if (!/^\d$/.test(e.key)) return;
    buf += e.key; c.textContent = 'P' + buf.padEnd(3, '-');
    if (buf.length === 3) { const n = buf; buf = ''; location.href = (lang === 'ar' ? '/ar/' : '/') + n + location.search; }
  });
})();
