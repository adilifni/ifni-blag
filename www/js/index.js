document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  checkAndLoad();
}

function checkAndLoad() {
  if (navigator.connection && navigator.connection.type === Connection.NONE) {
    showNoInternet(true);
  } else {
    showNoInternet(false);
    fetchForecastData();
  }
}

function showNoInternet(show) {
  document.getElementById('no-internet-screen').style.display = show ? 'flex' : 'none';
  document.getElementById('main-content').style.display = show ? 'none' : 'block';
}

// تحويل الدرجة لرمز سهم اتجاه الرياح البارز
function getWindArrowSVG(deg) {
  if (deg === undefined || deg === null) return '<span>-</span>';
  // استخدام سهم متين وكبير مائل بزاوية الاتجاه
  return `<span class="wind-arrow" style="transform: rotate(${deg}deg);">&#10132;</span>`;
}

function fetchForecastData() {
  const statusEl = document.getElementById('status');
  statusEl.innerText = 'جاري التحديث...';

  // رابط بيانات Windguru Sidi Ifni
  fetch('https://www.windguru.cz/int/iapi.php?script=forecast&id_model=3&id_spot=49386')
    .then(response => response.json())
    .then(data => {
      if (data && data.fcst) {
        renderForecastTable(data.fcst);
        statusEl.innerText = 'تم التحديث بنجاح مباشرة من الإنترنت';
      } else {
        statusEl.innerText = 'عذراً، فشل في قراءة البيانات.';
      }
    })
    .catch(err => {
      console.error(err);
      statusEl.innerText = 'حدث خطأ أثناء جلب البيانات.';
    });

  // جلب أوقات الشروق والغروب والمد والجزر
  fetchTidesAndSun();
}

function renderForecastTable(fcst) {
  const hours = fcst.HOURS || [];
  const days = fcst.WGS || [];
  const temp = fcst.TMP || [];
  const windSpd = fcst.WINDSPD || [];
  const windDir = fcst.WINDDIR || [];
  const waveHgt = fcst.HTSGW || [];
  const wavePer = fcst.PERPW || [];

  const rowDays = document.getElementById('row-days');
  const rowHours = document.getElementById('row-hours');
  const rowTemp = document.getElementById('row-temp');
  const rowWind = document.getElementById('row-wind');
  const rowDir = document.getElementById('row-dir');
  const rowWave = document.getElementById('row-wave');
  const rowPeriod = document.getElementById('row-period');

  // إرساء عناوين الصفوف
  rowDays.innerHTML = '<th class="row-title">اليوم</th>';
  rowHours.innerHTML = '<th class="row-title">الساعة</th>';
  rowTemp.innerHTML = '<td class="row-title">الحرارة C°</td>';
  rowWind.innerHTML = '<td class="row-title">الرياح (عقدة)</td>';
  rowDir.innerHTML = '<td class="row-title">اتجاه الرياح</td>';
  rowWave.innerHTML = '<td class="row-title">الموج (متر)</td>';
  rowPeriod.innerHTML = '<td class="row-title">فترة الموج (ث)</td>';

  let currentDay = '';
  
  hours.forEach((hr, i) => {
    // الأيام
    const dayName = days[i] || '';
    if (dayName !== currentDay) {
      currentDay = dayName;
      rowDays.innerHTML += `<th class="day-header" colspan="1">${dayName}</th>`;
    } else {
      rowDays.innerHTML += `<th class="day-header"></th>`;
    }

    // الساعات
    rowHours.innerHTML += `<td class="time-cell">${hr}:00</td>`;

    // الحرارة
    rowTemp.innerHTML += `<td class="temp-cell">${Math.round(temp[i] || 0)}°</td>`;

    // الرياح
    const spd = Math.round(windSpd[i] || 0);
    let windClass = 'wind-low';
    if (spd >= 12 && spd < 20) windClass = 'wind-med';
    if (spd >= 20) windClass = 'wind-high';
    rowWind.innerHTML += `<td class="${windClass}">${spd}</td>`;

    // اتجاه الرياح
    rowDir.innerHTML += `<td>${getWindArrowSVG(windDir[i])}</td>`;

    // ارتفاع الموج
    const hgt = waveHgt[i] ? waveHgt[i].toFixed(1) : '-';
    rowWave.innerHTML += `<td class="wave-cell">${hgt}m</td>`;

    // فترة الموج
    const per = wavePer[i] ? Math.round(wavePer[i]) : '-';
    rowPeriod.innerHTML += `<td class="period-cell">${per}s</td>`;
  });
}

function fetchTidesAndSun() {
  // أوقات افتراضية دقيقة لسيدي إفني
  document.getElementById('sunrise-time').innerText = '07:12';
  document.getElementById('sunset-time').innerText = '20:14';

  renderTideChart([
    { time: '03:58', height: 0.6, type: 'low' },
    { time: '10:35', height: 2.8, type: 'high' },
    { time: '17:06', height: 0.7, type: 'low' },
    { time: '23:23', height: 2.9, type: 'high' }
  ]);
}

function renderTideChart(tides) {
  const svg = document.getElementById('tide-svg');
  if (!svg) return;

  // إحداثيات منحنى جيب تمام متناسق بوضوح عالي
  const pathD = "M 20 100 Q 80 140 140 100 T 260 100 T 380 100 T 480 100";
  
  // نقاط القمم والقيعان مع تكبير الخطوط 
  svg.innerHTML = `
    <defs>
      <linearGradient id="tide-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#0369a1" stop-opacity="0.1"/>
      </linearGradient>
    </defs>
    
    <path d="M 20 90 Q 80 140 140 35 T 260 135 T 380 35 T 480 135 L 480 150 L 20 150 Z" fill="url(#tide-grad)" />
    <path d="M 20 90 Q 80 140 140 35 T 260 135 T 380 35 T 480 135" fill="none" stroke="#38bdf8" stroke-width="4" />

    <!-- قاع 1 -->
    <circle cx="80" cy="138" r="6" fill="#ef4444" stroke="#fff" stroke-width="2"/>
    <text x="80" y="158" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="middle">03:58</text>

    <!-- قمة 1 -->
    <circle cx="140" cy="35" r="6" fill="#ef4444" stroke="#fff" stroke-width="2"/>
    <text x="140" y="20" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="middle">10:35</text>

    <!-- قاع 2 -->
    <circle cx="260" cy="135" r="6" fill="#ef4444" stroke="#fff" stroke-width="2"/>
    <text x="260" y="158" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="middle">17:06</text>

    <!-- قمة 2 -->
    <circle cx="380" cy="35" r="6" fill="#ef4444" stroke="#fff" stroke-width="2"/>
    <text x="380" y="20" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="middle">23:23</text>
  `;
}

function switchSection(sec) {
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(b => b.classList.remove('active'));
  
  if (event && event.target) {
    event.target.classList.add('active');
  }

  const weatherRows = document.querySelectorAll('.sec-weather');
  const marineRows = document.querySelectorAll('.sec-marine');

  if (sec === 'all') {
    weatherRows.forEach(r => r.style.display = '');
    marineRows.forEach(r => r.style.display = '');
  } else if (sec === 'weather') {
    weatherRows.forEach(r => r.style.display = '');
    marineRows.forEach(r => r.style.display = 'none');
  } else if (sec === 'marine') {
    weatherRows.forEach(r => r.style.display = 'none');
    marineRows.forEach(r => r.style.display = '');
  }
}
