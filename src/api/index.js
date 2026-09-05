// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息（按出口 IP，运营商 IP 归属地可能不准）
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 高德逆地理编码：坐标 -> 城市 adcode（用于浏览器定位后的精确城市）
export const getRegeo = async (key, lng, lat) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/geocode/regeo?key=${key}&location=${lng},${lat}`,
  );
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

// 获取教书先生天气 API
// https://api.oioweb.cn/doc/weather/GetWeather
export const getOtherWeather = async () => {
  const res = await fetch("https://api.oioweb.cn/api/weather/GetWeather");
  const data = await res.json();
  // 接口返回结构异常时视为失败，交由备用链路处理
  if (!data?.result?.condition) {
    throw new Error("备用天气接口返回异常");
  }
  return data;
};

// 免 Key 备用：IP 定位 + Open-Meteo 天气（均支持 CORS，无需注册）
export const getGeoWeather = async () => {
  // 1. IP 定位
  const geoRes = await fetch("https://ipwho.is/");
  const geo = await geoRes.json();
  if (!geo || geo.success !== true || !geo.latitude || !geo.longitude) {
    throw new Error("IP 定位失败");
  }
  // 2. 获取天气
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`,
  );
  const data = await res.json();
  if (!data?.current_weather) {
    throw new Error("天气服务无数据");
  }
  return {
    city: geo.city || geo.country || "未知地区",
    current_weather: data.current_weather,
  };
};
