
document.addEventListener('DOMContentLoaded', () => {

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQsMQALFbHoMJitrkSAroWNhv484sckRU9OQVuCBFT-hJwQ0dkfK8HWbhZsKCdBp9KpQ/exec';


  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });


  const menuBtn = document.querySelector('.menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });


  const barbers = [
    { id: 1, name: 'Jose Luis Musto', specialty: 'Fades & Diseños', img: 'img/barber1.png' },
    { id: 2, name: 'Edinho Alcazar', specialty: 'Cortes Clásicos', img: 'img/barber2.png' },
    { id: 3, name: 'Dylan Smith', specialty: 'Barbas & Estilos', img: 'img/barber3.png' },
    { id: 4, name: 'Roberto Méndez', specialty: 'Cortes Modernos', img: 'img/barber4.png' }
  ];


  let currentStep = 1;
  let selectedBarber = null;
  let clientName = '';
  let clientEmail = '';
  let selectedDate = null;
  let selectedTime = null;
  let bookedSlots = [];

  const stepsEl = document.querySelectorAll('.step-indicator');
  const bookingSteps = document.querySelectorAll('.booking-step');
  const btnNext = document.getElementById('btn-next');
  const btnBack = document.getElementById('btn-back');


  async function fetchBookedSlots(barberId, dateStr) {
    try {
      const url = `${APPS_SCRIPT_URL}?action=getBooked&barberId=${barberId}&date=${dateStr}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.ok ? data.booked : [];
    } catch (err) {
      console.error('Error consultando horarios:', err);
      return [];
    }
  }

  async function postReservation(barberId, dateStr, time, name, email) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ barberId, barberName: selectedBarber.name, date: dateStr, time, name, email }),
      });
      return await res.json();
    } catch (err) {
      console.error('Error guardando reserva:', err);
      return { ok: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  }


  const allTimes = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ];

  function renderTimeSlots() {
    const grid = document.getElementById('time-grid');
    grid.innerHTML = '';
    allTimes.forEach(t => {
      const isBooked = bookedSlots.includes(t);
      const el = document.createElement('div');
      if (isBooked) {
        el.className = 'time-option booked';
        el.innerHTML = `<span class="time-text">${t}</span><span class="booked-tag">Ocupado</span>`;
      } else {
        el.className = 'time-option';
        el.textContent = t;
        el.addEventListener('click', () => selectTime(el, t));
      }
      grid.appendChild(el);
    });
  }

  async function generateTimes() {
    const grid = document.getElementById('time-grid');
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:#888;font-size:.85rem;">
        ⏳ Verificando disponibilidad...
      </div>`;
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
    const barberId = selectedBarber ? selectedBarber.id : null;
    if (dateStr && barberId) {
      bookedSlots = await fetchBookedSlots(barberId, dateStr);
    } else {
      bookedSlots = [];
    }
    renderTimeSlots();
  }


  function generateDates() {
    const grid = document.getElementById('date-grid');
    grid.innerHTML = '';
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let count = 0;
    let d = new Date();
    d.setDate(d.getDate() + 1);
    while (count < 7) {
      if (d.getDay() !== 0) {
        const dateObj = new Date(d);
        const el = document.createElement('div');
        el.className = 'date-option';
        el.dataset.date = dateObj.toISOString().split('T')[0];
        el.innerHTML = `
          <div class="day-name">${days[dateObj.getDay()]}</div>
          <div class="day-num">${dateObj.getDate()}</div>
          <div class="month">${months[dateObj.getMonth()]}</div>
        `;
        el.addEventListener('click', () => selectDate(el, dateObj));
        grid.appendChild(el);
        count++;
      }
      d.setDate(d.getDate() + 1);
    }
  }


  async function selectDate(el, dateObj) {
    document.querySelectorAll('.date-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedDate = dateObj;
    selectedTime = null;
    updateNav();
    await generateTimes();
  }

  function selectTime(el, time) {
    if (bookedSlots.includes(time)) { generateTimes(); return; }
    document.querySelectorAll('.time-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    selectedTime = time;
    updateNav();
  }


  function validateClientForm() {
    const nameVal = document.getElementById('client-name').value.trim();
    const emailVal = document.getElementById('client-email').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    return nameVal.length >= 2 && emailOk;
  }


  document.getElementById('client-name').addEventListener('input', updateNav);
  document.getElementById('client-email').addEventListener('input', updateNav);


  function renderBarberOptions() {
    const container = document.getElementById('barber-options');
    container.innerHTML = '';
    barbers.forEach(b => {
      const el = document.createElement('div');
      el.className = 'barber-option';
      el.innerHTML = `
        <img src="${b.img}" alt="${b.name}">
        <h4>${b.name}</h4>
        <span>${b.specialty}</span>
      `;
      el.addEventListener('click', () => {
        document.querySelectorAll('.barber-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        selectedBarber = b;
        updateNav();
      });
      container.appendChild(el);
    });
  }


  async function goToStep(step) {
    currentStep = step;
    bookingSteps.forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    stepsEl.forEach((s, i) => {
      s.classList.remove('active', 'completed');
      if (i + 1 === step) s.classList.add('active');
      else if (i + 1 < step) s.classList.add('completed');
    });

    btnBack.style.display = step === 1 ? 'none' : 'block';

    if (step === 3) {
      generateDates();
      if (selectedBarber && selectedDate) {
        await generateTimes();
        const dateStr = selectedDate.toISOString().split('T')[0];
        const dateEl = document.querySelector(`.date-option[data-date="${dateStr}"]`);
        if (dateEl) dateEl.classList.add('selected');
      } else {
        document.getElementById('time-grid').innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:#888;font-size:.85rem;">
            Selecciona una fecha para ver disponibilidad
          </div>`;
      }
    }
    if (step === 4) renderConfirmation();

    updateNav();
  }

  function updateNav() {
    let canProceed = false;
    if (currentStep === 1) canProceed = selectedBarber !== null;
    if (currentStep === 2) canProceed = validateClientForm();
    if (currentStep === 3) canProceed = selectedDate !== null && selectedTime !== null;
    if (currentStep === 4) canProceed = true;
    btnNext.disabled = !canProceed;
    btnNext.textContent = currentStep === 4 ? '✓ Confirmar Reserva' : 'Siguiente →';
  }

  function renderConfirmation() {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dateStr = selectedDate
      ? `${days[selectedDate.getDay()]} ${selectedDate.getDate()} de ${months[selectedDate.getMonth()]}`
      : '';


    clientName = document.getElementById('client-name').value.trim();
    clientEmail = document.getElementById('client-email').value.trim();

    document.getElementById('confirm-barber').textContent = selectedBarber?.name ?? '';
    document.getElementById('confirm-date').textContent = dateStr;
    document.getElementById('confirm-time').textContent = selectedTime ?? '';
    document.getElementById('confirm-service').textContent = selectedBarber?.specialty ?? '';
    document.getElementById('confirm-name').textContent = clientName;
    document.getElementById('confirm-email').textContent = clientEmail;
  }


  btnNext.addEventListener('click', async () => {
    if (currentStep < 4) {
      goToStep(currentStep + 1);
      return;
    }

    if (!selectedBarber || !selectedDate || !selectedTime) return;

    btnNext.disabled = true;
    btnNext.textContent = '⏳ Guardando...';

    const dateStr = selectedDate.toISOString().split('T')[0];
    const result = await postReservation(
      selectedBarber.id, dateStr, selectedTime, clientName, clientEmail
    );

    if (result.ok) {
      document.getElementById('success-modal').classList.add('active');
    } else {
      alert(`⚠️ ${result.error || 'Este horario ya no está disponible'}.\nPor favor elige otro horario.`);
      selectedTime = null;
      await goToStep(3);
    }
  });

  btnBack.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });


  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('success-modal').classList.remove('active');
    selectedBarber = null;
    selectedDate = null;
    selectedTime = null;
    clientName = '';
    clientEmail = '';
    bookedSlots = [];
    document.getElementById('client-name').value = '';
    document.getElementById('client-email').value = '';
    goToStep(1);
    renderBarberOptions();
  });


  renderBarberOptions();
  goToStep(1);



  const track = document.getElementById('carousel-track');
  const slides = track.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  let carouselIndex = 0;
  let carouselInterval;

  function goToSlide(i) {
    carouselIndex = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    dots.forEach((d, idx) => d.classList.toggle('active', idx === carouselIndex));
  }

  prevBtn.addEventListener('click', () => { goToSlide(carouselIndex - 1); resetAutoplay(); });
  nextBtn.addEventListener('click', () => { goToSlide(carouselIndex + 1); resetAutoplay(); });
  dots.forEach(d => d.addEventListener('click', () => { goToSlide(+d.dataset.index); resetAutoplay(); }));

  function resetAutoplay() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => goToSlide(carouselIndex + 1), 5000);
  }
  resetAutoplay();


  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToSlide(carouselIndex + 1) : goToSlide(carouselIndex - 1);
      resetAutoplay();
    }
  });


  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .barber-card, .section-header').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });

});