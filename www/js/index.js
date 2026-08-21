
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    fetchWeatherData();
}

// في حال الاختبار عبر المتصفح
if (!window.cordova) {
    document.addEventListener('DOMContentLoaded', fetchWeatherData);
}

function fetchWeatherData() {
    const statusEl = document.getElementById('status-text');
    statusEl.innerText = 'جاري الاتصال بالسيرفر...';

    // إحداثيات سيدي إفني
    const lat = 29.38;
    const lon = -10.17;
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&wind_speed_unit=kn`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period`;

    Promise.all([
        fetch(weatherUrl).then(res => res.json()),
        fetch(marineUrl).then(res => res.json())
    ])
    .then(([weatherData, marineData]) => {
        if (weatherData.current) {
            document.getElementById('temp').innerText = `${weatherData.current.temperature_2m} °C`;
            document.getElementById('wind-speed').innerText = `${weatherData.current.wind_speed_10m} عقدة`;
        }
        if (marineData.current) {
            document.getElementById('wave-height').innerText = `${marineData.current.wave_height} م`;
            document.getElementById('wave-period').innerText = `${marineData.current.wave_period} ثانية`;
        }
        statusEl.innerText = 'تم تحديث البيانات بنجاح';
    })
    .catch(err => {
        console.error(err);
        statusEl.innerText = 'تعذر جلب البيانات. تأكد من الاتصال بالإنترنت.';
    });
}
