document.addEventListener('deviceready', init, false);
if (!window.cordova) document.addEventListener('DOMContentLoaded', init);

function init() {
    checkAndLoad();
    document.addEventListener("offline", showOfflineScreen, false);
    document.addEventListener("online", checkAndLoad, false);
}

function checkAndLoad() {
    if (navigator.onLine === false) {
        showOfflineScreen();
    } else {
        hideOfflineScreen();
        loadForecastData();
    }
}

function showOfflineScreen() {
    document.getElementById('no-internet-screen').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
}

function hideOfflineScreen() {
    document.getElementById('no-internet-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

function loadForecastData() {
    document.getElementById('status').innerText = 'جاري التحديث...';
    
    const lat = 29.38;
    const lon = -10.17;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset&wind_speed_unit=kn&timezone=auto&forecast_days=7`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period&forecast_days=7`;

    Promise.all([
        fetch(weatherUrl).then(r => r.json()),
        fetch(marineUrl).then(r => r.json())
    ])
    .then(([weather, marine]) => {
        if (weather.daily && weather.daily.sunrise) {
            const sunrise = weather.daily.sunrise[0].split('T')[1];
            const sunset = weather.daily.sunset[0].split('T')[1];
            document.getElementById('sunrise-time').innerText = sunrise;
            document.getElementById('sunset-time').innerText = sunset;
        }

        if (weather.hourly && marine.hourly) {
            renderTable(weather.hourly, marine.hourly);
            renderTideChart();
            document.getElementById('status').innerText = 'تم التحديث بنجاح مباشرة من الإنترنت';
        }
    })
    .catch(err => {
        showOfflineScreen();
    });
}

function renderTable(wHourly, mHourly) {
    const daysArr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    const rowDays = document.getElementById('row-days');
    const rowHours = document.getElementById('row-hours');
    const rowTemp = document.getElementById('row-temp');
    const rowWind = document.getElementById('row-wind');
    const rowDir = document.getElementById('row-dir');
    const rowWave = document.getElementById('row-wave');
    const rowPeriod = document.getElementById('row-period');

    rowDays.innerHTML = '<th class="row-title">اليوم</th>';
    rowHours.innerHTML = '<th class="row-title">الساعة</th>';
    rowTemp.innerHTML = '<td class="row-title">الحرارة °C</td>';
    rowWind.innerHTML = '<td class="row-title">الرياح (عقدة)</td>';
    rowDir.innerHTML = '<td class="row-title">اتجاه الرياح</td>';
    rowWave.innerHTML = '<td class="row-title">الموج (متر)</td>';
    rowPeriod.innerHTML = '<td class="row-title">فترة الموج (ث)</td>';

    const now = new Date();
    let startIndex = 0;
    for (let i = 0; i < wHourly.time.length; i++) {
        if (new Date(wHourly.time[i]) >= now) {
            startIndex = i;
            break;
        }
    }

    for (let i = startIndex; i < wHourly.time.length; i += 3) {
        const dateObj = new Date(wHourly.time[i]);
        const dayName = daysArr[dateObj.getDay()];
        const hour = dateObj.getHours() + ':00';

        const temp = Math.round(wHourly.temperature_2m[i]);
        const wind = Math.round(wHourly.wind_speed_10m[i]);
        const dir = wHourly.wind_direction_10m[i];
        const wave = mHourly.wave_height[i] ? mHourly.wave_height[i].toFixed(1) : '-';
        const period = mHourly.wave_period[i] ? Math.round(mHourly.wave_period[i]) : '-';

        rowDays.innerHTML += `<th class="day-header">${dayName}</th>`;
        rowHours.innerHTML += `<th>${hour}</th>`;
        rowTemp.innerHTML += `<td>${temp}°</td>`;
        
        let windClass = wind < 8 ? 'wind-low' : (wind < 15 ? 'wind-med' : 'wind-high');
        rowWind.innerHTML += `<td class="${windClass}">${wind}</td>`;
        rowDir.innerHTML += `<td><span style="display:inline-block; transform:rotate(${dir}deg)">↓</span></td>`;
        
        rowWave.innerHTML += `<td>${wave}m</td>`;
        rowPeriod.innerHTML += `<td>${period}s</td>`;
    }
}

// رسم منحنى المد والجزر بالنقاط والوقت
function renderTideChart() {
    const svg = document.getElementById('tide-svg');
    
    // نقاط منحنى موجة المد لسيدي إفني
    const pathD = "M 0 90 Q 62.5 20, 125 90 T 250 90 T 375 90 T 500 90 L 500 150 L 0 150 Z";
    const lineD = "M 0 90 Q 62.5 20, 125 90 T 250 90 T 375 90 T 500 90";

    const tides = [
        { time: "3:58", x: 62.5, y: 125, type: "low" },
        { time: "10:35", x: 187.5, y: 30, type: "high" },
        { time: "17:06", x: 312.5, y: 125, type: "low" },
        { time: "23:23", x: 437.5, y: 30, type: "high" }
    ];

    let html = `
        <defs>
            <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.7"/>
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0.1"/>
            </linearGradient>
        </defs>
        <path d="${pathD}" fill="url(#tideGrad)"/>
        <path d="${lineD}" fill="none" stroke="#38bdf8" stroke-width="3"/>
    `;

    tides.forEach(t => {
        html += `
            <circle cx="${t.x}" cy="${t.y}" r="6" fill="#ef4444" stroke="#fff" stroke-width="1.5" />
            <text x="${t.x}" y="${t.y > 50 ? t.y - 12 : t.y - 12}" fill="#facc15" font-size="14" font-weight="bold" text-anchor="middle">${t.time}</text>
        `;
    });

    svg.innerHTML = html;
}

function switchSection(type) {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    const wRows = document.querySelectorAll('.sec-weather');
    const mRows = document.querySelectorAll('.sec-marine');

    if (type === 'weather') {
        wRows.forEach(r => r.style.display = '');
        mRows.forEach(r => r.style.display = 'none');
    } else if (type === 'marine') {
        wRows.forEach(r => r.style.display = 'none');
        mRows.forEach(r => r.style.display = '');
    } else {
        wRows.forEach(r => r.style.display = '');
        mRows.forEach(r => r.style.display = '');
    }
}
