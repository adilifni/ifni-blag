document.addEventListener('deviceready', init, false);
if (!window.cordova) document.addEventListener('DOMContentLoaded', init);

function init() {
    setTimeout(() => {
        const sp = document.getElementById("splash-screen");
        if(sp) {
            sp.style.opacity = "0";
            setTimeout(() => { sp.style.display = "none"; }, 500);
        }
    }, 2500);

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

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&forecast_days=7`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period&forecast_days=7`;

    Promise.all([
        fetch(weatherUrl).then(r => r.json()),
        fetch(marineUrl).then(r => r.json())
    ])
    .then(([weather, marine]) => {
        if (weather.hourly && marine.hourly) {
            renderTable(weather.hourly, marine.hourly);
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
    const rowTide = document.getElementById('row-tide');

    rowDays.innerHTML = '<th class="row-title">اليوم</th>';
    rowHours.innerHTML = '<th class="row-title">الساعة</th>';
    rowTemp.innerHTML = '<td class="row-title">الحرارة °C</td>';
    rowWind.innerHTML = '<td class="row-title">الرياح (عقدة)</td>';
    rowDir.innerHTML = '<td class="row-title">اتجاه الرياح</td>';
    rowWave.innerHTML = '<td class="row-title">الموج (متر)</td>';
    rowPeriod.innerHTML = '<td class="row-title">فترة الموج (ث)</td>';
    rowTide.innerHTML = '<td class="row-title">المد والجزر</td>';

    // التوقيت الحالي للجهاز
    const now = new Date();

    // البحث عن أول عنصر زمني يطابق أو يلي الساعة الحالية
    let startIndex = 0;
    for (let i = 0; i < wHourly.time.length; i++) {
        const itemDate = new Date(wHourly.time[i]);
        if (itemDate >= now) {
            startIndex = i;
            break;
        }
    }

    // البدء من الساعة الحالية والتمرير لـ 7 أيام قادمة
    for (let i = startIndex; i < wHourly.time.length; i += 3) {
        const dateObj = new Date(wHourly.time[i]);
        const dayName = daysArr[dateObj.getDay()];
        const hour = dateObj.getHours() + ':00';

        const temp = Math.round(wHourly.temperature_2m[i]);
        const wind = Math.round(wHourly.wind_speed_10m[i]);
        const dir = wHourly.wind_direction_10m[i];
        const wave = mHourly.wave_height[i] ? mHourly.wave_height[i].toFixed(1) : '-';
        const period = mHourly.wave_period[i] ? Math.round(mHourly.wave_period[i]) : '-';
        
        const tideState = (i % 12 < 6) ? '<span class="tide-high">مد ↑</span>' : '<span class="tide-low">جزر ↓</span>';

        rowDays.innerHTML += `<th class="day-header">${dayName}</th>`;
        rowHours.innerHTML += `<th>${hour}</th>`;
        rowTemp.innerHTML += `<td>${temp}°</td>`;
        
        let windClass = wind < 8 ? 'wind-low' : (wind < 15 ? 'wind-med' : 'wind-high');
        rowWind.innerHTML += `<td class="${windClass}">${wind}</td>`;
        rowDir.innerHTML += `<td><span style="display:inline-block; transform:rotate(${dir}deg)">↓</span></td>`;
        
        rowWave.innerHTML += `<td>${wave}m</td>`;
        rowPeriod.innerHTML += `<td>${period}s</td>`;
        rowTide.innerHTML += `<td>${tideState}</td>`;
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
