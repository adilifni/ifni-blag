document.addEventListener('deviceready', init, false);
if (!window.cordova) document.addEventListener('DOMContentLoaded', init);

function init() {
    loadForecastData();
}

function loadForecastData() {
    const lat = 29.38;
    const lon = -10.17;

    // جلب مصفوفة التوقعات الساعية (7 أيام قادمة)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&forecast_days=3`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period&forecast_days=3`;

    Promise.all([
        fetch(weatherUrl).then(r => r.json()),
        fetch(marineUrl).then(r => r.json())
    ])
    .then(([weather, marine]) => {
        renderTable(weather.hourly, marine.hourly);
        document.getElementById('status').innerText = 'تم التحديث بنجاح';
    })
    .catch(err => {
        document.getElementById('status').innerText = 'حدث خطأ في تحميل التوقعات';
    });
}

function renderTable(wHourly, mHourly) {
    const rowHours = document.getElementById('row-hours');
    const rowTemp = document.getElementById('row-temp');
    const rowWind = document.getElementById('row-wind');
    const rowDir = document.getElementById('row-dir');
    const rowWave = document.getElementById('row-wave');
    const rowPeriod = document.getElementById('row-period');

    // عرض أول 24 خطوة زمنية (كل 3 ساعات لتفادي الاكتظاظ)
    for (let i = 0; i < 24; i += 3) {
        const time = new Date(wHourly.time[i]).getHours() + ':00';
        const temp = Math.round(wHourly.temperature_2m[i]);
        const wind = Math.round(wHourly.wind_speed_10m[i]);
        const dir = wHourly.wind_direction_10m[i];
        const wave = mHourly.wave_height[i] ? mHourly.wave_height[i].toFixed(1) : '-';
        const period = mHourly.wave_period[i] ? Math.round(mHourly.wave_period[i]) : '-';

        rowHours.innerHTML += `<th>${time}</th>`;
        rowTemp.innerHTML += `<td>${temp}°</td>`;
        
        // تلوين الرياح حسب الشدة
        let windClass = wind < 8 ? 'wind-low' : (wind < 15 ? 'wind-med' : 'wind-high');
        rowWind.innerHTML += `<td class="${windClass}">${wind}</td>`;
        
        // تحويل درجات اتجاه الرياح لسهم
        rowDir.innerHTML += `<td><span class="arrow" style="transform: rotate(${dir}deg)">↓</span></td>`;
        
        rowWave.innerHTML += `<td>${wave}m</td>`;
        rowPeriod.innerHTML += `<td>${period}s</td>`;
    }
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
