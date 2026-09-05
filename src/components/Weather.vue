<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getAdcode, getWeather, getOtherWeather, getGeoWeather, getRegeo } from "@/api";
import { Error } from "@icon-park/vue-next";

// 高德开发者 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;

// 天气数据
const weatherData = reactive({
  adCode: {
    city: null, // 城市
    adcode: null, // 城市编码
  },
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

// 取出天气平均值
const getTemperature = (min, max) => {
  try {
    // 计算平均值并四舍五入
    const average = (Number(min) + Number(max)) / 2;
    return Math.round(average);
  } catch (error) {
    console.error("计算温度出现错误：", error);
    return "NaN";
  }
};

// WMO 天气代码 -> 中文
const weatherCodeMap = {
  0: "晴",
  1: "大致晴朗",
  2: "多云",
  3: "阴",
  45: "雾",
  48: "雾凇",
  51: "毛毛雨",
  53: "毛毛雨",
  55: "毛毛雨",
  56: "冻毛毛雨",
  57: "冻毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "阵雨",
  81: "阵雨",
  82: "强阵雨",
  85: "阵雪",
  86: "强阵雪",
  95: "雷阵雨",
  96: "雷阵雨伴冰雹",
  99: "强雷暴伴冰雹",
};

// 风向角度 -> 中文方位
const windDirMap = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];

// 风速 km/h -> 风力等级（蒲福风级近似）
const beaufort = (kmh) => {
  const bounds = [2, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  let level = 0;
  for (let i = 0; i < bounds.length; i++) {
    if (kmh >= bounds[i]) level = i + 1;
  }
  return level;
};

// 解析免 Key 备用天气数据（ipwho.is + Open-Meteo）
const parseGeoWeather = (data) => {
  const cur = data.current_weather;
  const idx = Math.round(cur.winddirection / 45) % 8;
  return {
    adCode: { city: data.city },
    weather: {
      weather: weatherCodeMap[cur.weathercode] || "未知",
      temperature: String(Math.round(cur.temperature)),
      winddirection: windDirMap[idx] + "风",
      windpower: String(beaufort(cur.windspeed)),
    },
  };
};

// 免 Key 备用链：教书先生 -> IP 定位 + Open-Meteo
const applyFallback = async () => {
  try {
    console.log("尝试教书先生备用接口");
    const result = await getOtherWeather();
    const data = result.result;
    weatherData.adCode = {
      city: data.city.City || "未知地区",
    };
    weatherData.weather = {
      weather: data.condition.day_weather,
      temperature: getTemperature(data.condition.min_degree, data.condition.max_degree),
      winddirection: data.condition.day_wind_direction,
      windpower: data.condition.day_wind_power,
    };
  } catch (err) {
    console.warn("教书先生天气接口失败，切换 IP 定位天气：", err);
    const geo = await getGeoWeather();
    Object.assign(weatherData, parseGeoWeather(geo));
  }
};

// 浏览器 GPS 定位（优先于 IP 定位，更精确；用户拒绝则返回 null）
const getBrowserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        }),
      () => resolve(null), // 拒绝授权或失败
      { timeout: 6000, maximumAge: 10 * 60 * 1000 },
    );
  });

// 定位城市（手动指定 > 浏览器定位 > 高德 IP）
const locateCity = async (key) => {
  // 1. 手动指定城市（VITE_WEATHER_CITY 填 adcode，如常州市 320400）
  const manual = import.meta.env.VITE_WEATHER_CITY;
  if (manual) {
    return { adcode: manual, city: null };
  }
  // 2. 浏览器定位
  const geo = await getBrowserLocation();
  if (geo) {
    try {
      const regeo = await getRegeo(key, geo.lng, geo.lat);
      const addr = regeo?.regeocode?.addressComponent;
      if (regeo?.infocode === "10000" && addr?.adcode) {
        return {
          adcode: addr.adcode,
          city: addr.district || addr.city || addr.province || null,
        };
      }
    } catch (e) {
      console.warn("逆地理编码失败，改用 IP 定位：", e);
    }
  }
  // 3. 高德 IP 定位（兜底）
  const ip = await getAdcode(key);
  if (ip.infocode !== "10000" || !ip.adcode) {
    throw new Error("高德地区查询失败");
  }
  return { adcode: ip.adcode, city: ip.city || null };
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    if (!mainKey) {
      // 未配置高德 Key：直接走备用链
      await applyFallback();
    } else {
      // 优先使用高德
      try {
        const loc = await locateCity(mainKey);
        const result = await getWeather(mainKey, loc.adcode);
        if (!result?.lives?.[0]) {
          throw new Error("高德天气无数据");
        }
        const lives = result.lives[0];
        weatherData.adCode = {
          city: loc.city || lives.city || lives.province || "未知地区",
          adcode: loc.adcode,
        };
        weatherData.weather = {
          weather: lives.weather,
          temperature: lives.temperature,
          winddirection: lives.winddirection,
          windpower: lives.windpower,
        };
      } catch (err) {
        console.warn("高德接口不可用，切换备用链：", err);
        await applyFallback();
      }
    }
  } catch (error) {
    console.error("天气信息获取失败:" + error);
    onError("天气信息获取失败");
  }
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>
