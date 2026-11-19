/* ===== JavaScript ===== */
(() => {
  /* ---------- 1) ย่อ/ขยายเวทีให้เต็มจอ ---------- */
  const stage = document.getElementById('stage');
  function fit() {
    const w = innerWidth, h = innerHeight, r = w / h;
    let s = Math.max(w / 1920, h / 1080);                 // เต็มจอ (desktop 16:9, 16:10, 3:2)
    if (r < 1.2 || r > 2.1) s = Math.min(w / 1920, h / 1080); // จอแคบ/กว้างมาก: โชว์ทั้งภาพ
    stage.style.setProperty('--s', s);
  }
  addEventListener('resize', fit); fit();

  /* ---------- 2) ตั้งค่าเซนเซอร์ (ค่าสุ่ม 2 หลัก เพื่อให้ตำแหน่งตรงเค้าโครงเดิม) ---------- */
  const INTERVAL_MS = 2500;                 // สุ่มค่าใหม่ทุกกี่ มิลลิวินาที
  const SENSORS = {
    temp:  { min: 20, max: 40, step: 2 },   // °C
    humid: { min: 40, max: 90, step: 3 },   // %
    water: { min: 10, max: 30, step: 2 },   // cm
  };
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  for (const [key, s] of Object.entries(SENSORS)) {
    s.on = true;
    s.value = rnd(s.min, s.max);
    s.digits = document.querySelectorAll('#s-' + key + ' .num');
    s.group = document.getElementById('s-' + key);
    s.btn = document.getElementById('t-' + key);
  }
  function render(s) {
    const t = String(s.value).padStart(2, '0');
    s.digits[0].textContent = t[0];
    s.digits[1].textContent = t[1];
  }
  function tick() {
    for (const s of Object.values(SENSORS)) {
      if (!s.on) continue;                                // ปิดอยู่ = ค่าหยุดนิ่ง
      s.value = clamp(s.value + rnd(-s.step, s.step), s.min, s.max);
      render(s);
    }
  }
  Object.values(SENSORS).forEach(render);
  setInterval(tick, INTERVAL_MS);

  /* ---------- 3) ปุ่ม toggle: คลิก / ลาก / คีย์บอร์ด ---------- */
  // ใส่โค้ดส่งคำสั่งไปอุปกรณ์จริง (เช่น ESP32) ได้ที่นี่
  function onToggle(key, on) {
    // fetch(`/api/${key}?state=${on ? 1 : 0}`);
    console.log(key, on ? 'ON' : 'OFF');
  }
  function setState(key, on) {
    const s = SENSORS[key];
    s.on = on;
    s.btn.setAttribute('aria-checked', on);
    s.btn.style.setProperty('--p', on ? 1 : 0);
    s.group.classList.toggle('off', !on);
    if (on) { s.value = rnd(s.min, s.max); render(s); }   // เปิดแล้วสุ่มค่าใหม่ทันที
    onToggle(key, on);
  }

  let lastDragEnd = 0;
  for (const [key, s] of Object.entries(SENSORS)) {
    const btn = s.btn;
    let drag = null;
    btn.addEventListener('click', () => {
      if (performance.now() - lastDragEnd < 60) return;   // เพิ่งลากเสร็จ ไม่นับเป็นคลิก
      setState(key, !s.on);
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); setState(key, true); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setState(key, false); }
    });
    btn.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, p0: s.on ? 1 : 0, p: s.on ? 1 : 0, moved: false };
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      if (!drag.moved) return;
      btn.classList.add('drag');
      const scale = btn.getBoundingClientRect().width / 144;
      drag.p = clamp(drag.p0 + dx / (72 * scale), 0, 1);
      btn.style.setProperty('--p', drag.p);
    });
    const end = () => {
      if (drag && drag.moved) { lastDragEnd = performance.now(); setState(key, drag.p > 0.5); }
      btn.classList.remove('drag');
      drag = null;
    };
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
  }
})();
