import type { Incident, City } from './incidents';

export type SensorType = 'air' | 'water' | 'storm' | 'temp' | 'noise';
export type SensorStatus = 'normal' | 'warning' | 'danger'; // норма, попередження, небезпека

export interface Sensor {
  id: string;
  type: SensorType;
  name: string;
  lat: number;
  lng: number;
  value: string;
  numericValue: number;
  unit: string;
  status: SensorStatus;
  lastUpdated: string;
  aiComment: string;
}

export interface WeatherForecastItem {
  time: string;
  temp: number;
  icon: string; // emoji
  condition: string;
}

export interface WeatherData {
  condition: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  precipitation: string;
  icon: string;
  forecast: WeatherForecastItem[];
}

export type DangerZoneType = 'air' | 'water' | 'storm' | 'icing' | 'noise' | 'heat';
export type DangerZoneLevel = 'safe' | 'warning' | 'high' | 'danger';

export interface DangerZone {
  id: string;
  type: DangerZoneType;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  level: DangerZoneLevel;
  color: string;
  reasons: string;
  aiRecommendation: string;
  consequences: string;
}

export interface AIRiskReport {
  id: string;
  type: DangerZoneType;
  title: string;
  level: 'warning' | 'high' | 'danger';
  reasons: string;
  consequences: string;
  recommendation: string;
}

export interface CityStats {
  activeSensors: string;
  dangerZonesCount: number;
  newIncidentsCount: number;
  avgAirQuality: string;
  waterIssuesCount: number;
  highestRiskDistricts: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDistanceDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dlat = lat1 - lat2;
  const dlng = lng1 - lng2;
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

function oscillate(base: number, range: number, period: number, tick: number): number {
  return base + Math.sin(tick / period) * range;
}

// ── Base Weather Templates ───────────────────────────────────────────────────
const WEATHER_TEMPLATES: Record<string, WeatherData> = {
  vinnytsia: {
    condition: 'Сильний дощ / Злива',
    temp: 15,
    humidity: 92,
    windSpeed: 22,
    precipitation: '18 мм (злива)',
    icon: '🌧️',
    forecast: [
      { time: 'Зараз', temp: 15, icon: '🌧️', condition: 'Злива' },
      { time: '+1 год', temp: 14, icon: '🌧️', condition: 'Злива' },
      { time: '+2 год', temp: 14, icon: '🌦️', condition: 'Слабкий дощ' },
      { time: '+3 год', temp: 15, icon: '☁️', condition: 'Хмарно' },
      { time: '+4 год', temp: 16, icon: '🌤️', condition: 'Мінлива хмарність' },
    ],
  },
  zhytomyr: {
    condition: 'Мороз / Снігопад',
    temp: -3,
    humidity: 95,
    windSpeed: 18,
    precipitation: '3.5 мм (мокрий сніг)',
    icon: '❄️',
    forecast: [
      { time: 'Зараз', temp: -3, icon: '❄️', condition: 'Мокрий сніг' },
      { time: '+1 год', temp: -4, icon: '❄️', condition: 'Снігопад' },
      { time: '+2 год', temp: -4, icon: '❄️', condition: 'Снігопад' },
      { time: '+3 год', temp: -5, icon: '☁️', condition: 'Хмарно' },
      { time: '+4 год', temp: -5, icon: '☁️', condition: 'Хмарно' },
    ],
  },
  khmelnytskyi: {
    condition: 'Штормовий вітер',
    temp: 12,
    humidity: 80,
    windSpeed: 48,
    precipitation: '1.2 мм (слабкий дощ)',
    icon: '💨',
    forecast: [
      { time: 'Зараз', temp: 12, icon: '💨', condition: 'Шторм' },
      { time: '+1 год', temp: 11, icon: '💨', condition: 'Шторм' },
      { time: '+2 год', temp: 11, icon: '🌧️', condition: 'Дощ та вітер' },
      { time: '+3 год', temp: 12, icon: '💨', condition: 'Вітряно' },
      { time: '+4 год', temp: 12, icon: '☁️', condition: 'Хмарно' },
    ],
  },
  kyiv: {
    condition: 'Екстремальна спека',
    temp: 34,
    humidity: 32,
    windSpeed: 3,
    precipitation: 'Не очікується',
    icon: '☀️',
    forecast: [
      { time: 'Зараз', temp: 34, icon: '☀️', condition: 'Спека' },
      { time: '+1 год', temp: 35, icon: '☀️', condition: 'Спека' },
      { time: '+2 год', temp: 34, icon: '☀️', condition: 'Ясно' },
      { time: '+3 год', temp: 32, icon: '☀️', condition: 'Ясно' },
      { time: '+4 год', temp: 29, icon: '🌙', condition: 'Ясно' },
    ],
  },
};

// ── Base Sensors Layout with Oscillations and Spatial Offsets ────────────────
const getBaseSensors = (cityId: string, city: City, tick: number): Sensor[] => {
  if (cityId === 'vinnytsia') {
    const aqi = Math.round(oscillate(42, 3, 2, tick));
    const ph = Number(oscillate(6.4, 0.15, 3, tick).toFixed(2));
    const stormFill = Math.round(oscillate(87, 2, 4, tick));
    const temp = Number(oscillate(15, 0.4, 6, tick).toFixed(1));
    const humidity = Math.round(oscillate(92, 1, 5, tick));
    const noise = Number(oscillate(58, 2.5, 2, tick).toFixed(1));

    return [
      {
        id: 'v-sensor-air',
        type: 'air',
        name: 'Пост еко-моніторингу (Центральний парк)',
        lat: 49.23015 + 0.0012, // Offset from incident v5
        lng: 28.44638 + 0.0015,
        value: `${aqi} AQI`,
        numericValue: aqi,
        unit: 'AQI',
        status: 'normal',
        lastUpdated: 'Щойно оновлено',
        aiComment: 'Якість повітря хороша. Показники дрібнодисперсного пилу в межах норми для паркової зони.',
      },
      {
        id: 'v-sensor-water',
        type: 'water',
        name: 'Моніторинг води (Пд. Буг, Кемпінг)',
        lat: 49.22103 + 0.0015, // Offset from incident v3
        lng: 28.45184 + 0.0018,
        value: `${ph} pH`,
        numericValue: ph,
        unit: 'pH',
        status: 'warning',
        lastUpdated: '1 хв тому',
        aiComment: 'Рівень кислотності води трохи підвищений. Фіксуються органічні сполуки та хімічний запах.',
      },
      {
        id: 'v-sensor-storm',
        type: 'storm',
        name: 'Дренажний пост №3 (Соборна)',
        lat: 49.23372 + 0.0011, // Offset from incident v1
        lng: 28.46812 + 0.0014,
        value: `${stormFill}%`,
        numericValue: stormFill,
        unit: '% заповнення',
        status: 'danger',
        lastUpdated: 'Щойно оновлено',
        aiComment: 'Критичне заповнення зливової системи! Високий ризик локального підтоплення.',
      },
      {
        id: 'v-sensor-temp',
        type: 'temp',
        name: 'Метеостанція №1 (Порика)',
        lat: 49.24186 + 0.0008, // Offset from incident v8
        lng: 28.45521 + 0.0012,
        value: `${temp}°C / ${humidity}%`,
        numericValue: temp,
        unit: '°C',
        status: 'normal',
        lastUpdated: '2 хв тому',
        aiComment: 'Висока вологість через сильні опади, температура стабільна.',
      },
      {
        id: 'v-sensor-noise',
        type: 'noise',
        name: 'Шумомір (Грушевського)',
        lat: 49.23891 + 0.0009, // Offset from incident v4
        lng: 28.47726 + 0.0018,
        value: `${noise} дБ`,
        numericValue: noise,
        unit: 'дБ',
        status: 'normal',
        lastUpdated: '3 хв тому',
        aiComment: 'Рівень шуму в нормі для денного автотрафіку в центрі.',
      },
    ];
  }

  if (cityId === 'zhytomyr') {
    const aqi = Math.round(oscillate(38, 2, 2, tick));
    const ph = Number(oscillate(7.2, 0.08, 4, tick).toFixed(2));
    const stormFill = Math.round(oscillate(15, 1, 3, tick));
    const temp = Number(oscillate(-3, 0.2, 5, tick).toFixed(1));
    const humidity = Math.round(oscillate(95, 1, 4, tick));
    const noise = Number(oscillate(68.5, 3.1, 2, tick).toFixed(1));

    return [
      {
        id: 'zh-sensor-air',
        type: 'air',
        name: 'Датчик повітря (Промислова)',
        lat: 50.28104 + 0.0014, // Offset from incident zh9
        lng: 28.64327 + 0.0017,
        value: `${aqi} AQI`,
        numericValue: aqi,
        unit: 'AQI',
        status: 'normal',
        lastUpdated: 'Щойно оновлено',
        aiComment: 'Чисте повітря, смог від промзони розсіюється вітром та снігопадом.',
      },
      {
        id: 'zh-sensor-water',
        type: 'water',
        name: 'Гідропост (р. Тетерів)',
        lat: 50.27015 + 0.0013, // Offset from incident zh5
        lng: 28.65891 + 0.0016,
        value: `${ph} pH`,
        numericValue: ph,
        unit: 'pH',
        status: 'normal',
        lastUpdated: '2 хв тому',
        aiComment: 'Вода стабільна, вміст шкідливих хімічних сполук у межах норми.',
      },
      {
        id: 'zh-sensor-storm',
        type: 'storm',
        name: 'Дренажний колектор (Бердичівська)',
        lat: 50.25781 + 0.0010, // Offset from incident zh1
        lng: 28.66124 + 0.0015,
        value: `${stormFill}%`,
        numericValue: stormFill,
        unit: '% заповнення',
        status: 'normal',
        lastUpdated: '3 хв тому',
        aiComment: 'Каналізаційні стоки вільні, фіксується незначне замерзання на решітках.',
      },
      {
        id: 'zh-sensor-temp',
        type: 'temp',
        name: 'Метеостанція №2 (Київська)',
        lat: 50.24698 + 0.0009, // Offset from incident zh2
        lng: 28.65403 + 0.0012,
        value: `${temp}°C / ${humidity}%`,
        numericValue: temp,
        unit: '°C',
        status: 'warning',
        lastUpdated: '1 хв тому',
        aiComment: 'Мінусова температура та висока вологість створюють ожеледь.',
      },
      {
        id: 'zh-sensor-noise',
        type: 'noise',
        name: 'Шумомір (Проспект Миру)',
        lat: 50.24512 + 0.0008, // Offset from incident zh4
        lng: 28.68134 + 0.0016,
        value: `${noise} дБ`,
        numericValue: noise,
        unit: 'дБ',
        status: 'warning',
        lastUpdated: '4 хв тому',
        aiComment: 'Рівень шуму підвищений через повільний рух транспорту та затори.',
      },
    ];
  }

  if (cityId === 'khmelnytskyi') {
    const aqi = Math.round(oscillate(55, 4, 3, tick));
    const ph = Number(oscillate(6.8, 0.12, 4, tick).toFixed(2));
    const stormFill = Math.round(oscillate(35, 2, 5, tick));
    const temp = Number(oscillate(12, 0.5, 7, tick).toFixed(1));
    const humidity = Math.round(oscillate(80, 2, 6, tick));
    const noise = Number(oscillate(78, 3.5, 2, tick).toFixed(1));

    return [
      {
        id: 'kh-sensor-air',
        type: 'air',
        name: 'Пост еко-моніторингу (Сквер Перемоги)',
        lat: 49.43012 + 0.0012, // Offset from incident kh3
        lng: 27.00415 + 0.0015,
        value: `${aqi} AQI`,
        numericValue: aqi,
        unit: 'AQI',
        status: 'normal',
        lastUpdated: 'Щойно оновлено',
        aiComment: 'Якість повітря задовільна, вітер швидко розносить вихлопні гази.',
      },
      {
        id: 'kh-sensor-water',
        type: 'water',
        name: 'Датчик р. Плоска (Парковий міст)',
        lat: 49.43587 + 0.0014, // Offset from incident kh8
        lng: 26.98782 + 0.0017,
        value: `${ph} pH`,
        numericValue: ph,
        unit: 'pH',
        status: 'normal',
        lastUpdated: '2 хв тому',
        aiComment: 'Склад води в межах екологічної норми.',
      },
      {
        id: 'kh-sensor-storm',
        type: 'storm',
        name: 'Зливовий пост (вул. Кам\'янецька)',
        lat: 49.41562 + 0.0010, // Offset from incident kh7
        lng: 27.00634 + 0.0013,
        value: `${stormFill}%`,
        numericValue: stormFill,
        unit: '% заповнення',
        status: 'normal',
        lastUpdated: '1 хв тому',
        aiComment: 'Канали вільно пропускають дощову воду.',
      },
      {
        id: 'kh-sensor-temp',
        type: 'temp',
        name: 'Метеостанція №3 (Проскурівська)',
        lat: 49.42497 + 0.0009, // Offset from incident kh1
        lng: 26.99873 + 0.0011,
        value: `${temp}°C / ${humidity}%`,
        numericValue: temp,
        unit: '°C',
        status: 'normal',
        lastUpdated: '3 хв тому',
        aiComment: 'Температура помірна, очікується штормове попередження щодо вітру.',
      },
      {
        id: 'kh-sensor-noise',
        type: 'noise',
        name: 'Шумомір (вул. Соборна)',
        lat: 49.42035 + 0.0008, // Offset from incident kh11
        lng: 26.98657 + 0.0014,
        value: `${noise} дБ`,
        numericValue: noise,
        unit: 'дБ',
        status: 'warning',
        lastUpdated: '2 хв тому',
        aiComment: 'Підвищений рівень шуму від штормового вітру та дорожньої розв\'язки.',
      },
    ];
  }

  // Kyiv Default
  const aqi = Math.round(oscillate(155, 6, 2, tick));
  const ph = Number(oscillate(5.8, 0.22, 3, tick).toFixed(2));
  const stormFill = Math.round(oscillate(10, 1.2, 5, tick));
  const temp = Number(oscillate(34, 0.6, 8, tick).toFixed(1));
  const humidity = Math.round(oscillate(32, 1.5, 6, tick));
  const noise = Number(oscillate(82, 3, 2, tick).toFixed(1));

  return [
    {
      id: 'k-sensor-air',
      type: 'air',
      name: 'Пост еко-моніторингу (вул. Саксаганського)',
      lat: 50.43792 + 0.0011, // Offset from incident k6
      lng: 30.51287 + 0.0015,
      value: `${aqi} AQI`,
      numericValue: aqi,
      unit: 'AQI',
      status: 'danger',
      lastUpdated: 'Щойно оновлено',
      aiComment: 'Нездоровий рівень забруднення! Високий смог через спеку та відсутність вітру.',
    },
    {
      id: 'k-sensor-water',
      type: 'water',
      name: 'Моніторинг Дніпра (Рибальський міст)',
      lat: 50.47123 + 0.0015, // Offset from incident k11
      lng: 30.53421 + 0.0018,
      value: `${ph} pH`,
      numericValue: ph,
      unit: 'pH',
      status: 'warning',
      lastUpdated: '1 хв тому',
      aiComment: 'Кислотність води підвищена, фіксується розлив хімічних речовин.',
    },
    {
      id: 'k-sensor-storm',
      type: 'storm',
      name: 'Колектор Либідь (Голосіївська)',
      lat: 50.39876 + 0.0010, // Offset from incident k8
      lng: 30.51982 + 0.0014,
      value: `${stormFill}%`,
      numericValue: stormFill,
      unit: '% заповнення',
      status: 'normal',
      lastUpdated: '3 хв тому',
      aiComment: 'Зливовий канал повністю вільний.',
    },
    {
      id: 'k-sensor-temp',
      type: 'temp',
      name: 'Метеостанція №4 (вул. Хрещатик)',
      lat: 50.44802 + 0.0009, // Offset from incident k4
      lng: 30.52389 + 0.0012,
      value: `${temp}°C / ${humidity}%`,
      numericValue: temp,
      unit: '°C',
      status: 'warning',
      lastUpdated: 'Щойно оновлено',
      aiComment: 'Аномальна спека. Збільшений ризик перегріву обладнання та теплових ударів.',
    },
    {
      id: 'k-sensor-noise',
      type: 'noise',
      name: 'Шумомір (просп. Перемоги)',
      lat: 50.45689 + 0.0011, // Offset from incident k10
      lng: 30.44521 + 0.0013,
      value: `${noise} дБ`,
      numericValue: noise,
      unit: 'дБ',
      status: 'danger',
      lastUpdated: '2 хв тому',
      aiComment: 'Критичний рівень шуму через високий потік транспорту.',
    },
  ];
};

// ── Base Danger Zones Layout with mild offsets ───────────────────────────────
const getBaseZones = (cityId: string, city: City): DangerZone[] => {
  if (cityId === 'vinnytsia') {
    return [
      {
        id: 'v-zone-storm',
        type: 'storm',
        name: 'Зона ризику підтоплення (вул. Соборна)',
        lat: 49.23372,
        lng: 28.46812,
        radius: 350,
        level: 'warning',
        color: '#F59E0B',
        reasons: 'Злива та високий рівень зливових вод.',
        consequences: 'Підтоплення проїжджої частини, блокування руху транспорту.',
        aiRecommendation: 'Комунальним службам очистити зливові решітки в районі Соборної.',
      },
      {
        id: 'v-zone-water',
        type: 'water',
        name: 'Зона якості води (Пд. Буг, Кемпінг)',
        lat: 49.22103,
        lng: 28.45184,
        radius: 300,
        level: 'warning',
        color: '#F59E0B',
        reasons: 'Зниження pH води річки Південний Буг.',
        consequences: 'Небезпека для річкової флори, ризик інтоксикації рибних ресурсів.',
        aiRecommendation: 'Провести екологічний забір води, встановити бонові загородження.',
      },
      {
        id: 'v-zone-air',
        type: 'air',
        name: 'Контроль повітря (Центральний парк)',
        lat: 49.23015,
        lng: 28.44638,
        radius: 400,
        level: 'safe',
        color: '#10B981',
        reasons: 'Якість повітря в межах санітарних норм.',
        consequences: 'Загрози для здоров\'я відсутні.',
        aiRecommendation: 'Регулярне профілактичне вимірювання показників.',
      },
    ];
  }

  if (cityId === 'zhytomyr') {
    return [
      {
        id: 'zh-zone-icing',
        type: 'icing',
        name: 'Ділянка ожеледиці (Бердичівська)',
        lat: 50.25781,
        lng: 28.66124,
        radius: 450,
        level: 'warning',
        color: '#F59E0B',
        reasons: 'Температура нижче нуля та витік каналізації створюють ожеледь.',
        consequences: 'Слизьке покриття на Бердичівській, ризик аварій та травм пішоходів.',
        aiRecommendation: 'Превентивно посипати вулицю реагентами та ліквідувати витік води.',
      },
      {
        id: 'zh-zone-water',
        type: 'water',
        name: 'Еко-зона річки Тетерів (Каштановий міст)',
        lat: 50.27015,
        lng: 28.65891,
        radius: 350,
        level: 'warning',
        color: '#F59E0B',
        reasons: 'Забруднення річки скидами стічних вод.',
        consequences: 'Порушення біоценозу річки, заборона використання води.',
        aiRecommendation: 'Направити мобільну еко-лабораторію для вимірювання концентрації шкідливих сполук.',
      },
    ];
  }

  if (cityId === 'khmelnytskyi') {
    return [
      {
        id: 'kh-zone-noise',
        type: 'noise',
        name: 'Акустична зона (вул. Соборна)',
        lat: 49.42035,
        lng: 26.98657,
        radius: 300,
        level: 'warning',
        color: '#F59E0B',
        reasons: 'Підвищений гул вітру на транспортному перехресті.',
        consequences: 'Акустичне навантаження на житловий квартал.',
        aiRecommendation: 'Здійснити висадку шумопоглинаючих дерев вздовж доріг.',
      },
      {
        id: 'kh-zone-water',
        type: 'water',
        name: 'Забруднення Плоскенької (Парковий міст)',
        lat: 49.43587,
        lng: 26.98782,
        radius: 250,
        level: 'warning',
        color: '#F59E0B',
        reasons: 'Скид невідомих стоків у струмок Плоскенька.',
        consequences: 'Забруднення паркової водойми, розповсюдження запаху.',
        aiRecommendation: 'Встановити тимчасову огороджу та локалізувати нелегальну трубу.',
      },
    ];
  }

  // Kyiv Default
  return [
    {
      id: 'k-zone-air',
      type: 'air',
      name: 'Смуга смогу (вул. Саксаганського)',
      lat: 50.43792,
      lng: 30.51287,
      radius: 600,
      level: 'high',
      color: '#F97316',
      reasons: 'Рівень AQI 155 на Саксаганського через інтенсивний трафік та відсутність вітру.',
      consequences: 'Труднощі дихання для осіб похилого віку та дітей.',
      aiRecommendation: 'Обмежити рух приватного транспорту, запустити дощові машини для осадження пилу.',
    },
    {
      id: 'k-zone-heat',
      type: 'heat',
      name: 'Тепловий острів (вул. Хрещатик)',
      lat: 50.44802,
      lng: 30.52389,
      radius: 500,
      level: 'warning',
      color: '#F59E0B',
      reasons: 'Температура +34°C, висока теплоємність асфальту та бетону.',
      consequences: 'Тепловий стрес для пішоходів, ризик пожеж.',
      aiRecommendation: 'Організувати арки водяного туману вздовж Хрещатика.',
    },
    {
      id: 'k-zone-water',
      type: 'water',
      name: 'Забруднення Дніпра (Рибальський міст)',
      lat: 50.47123,
      lng: 30.53421,
      radius: 400,
      level: 'warning',
      color: '#F59E0B',
      reasons: 'Витік нафтопродуктів поблизу мосту.',
      consequences: 'Забруднення акваторії, ризик поширення плівки за течією.',
      aiRecommendation: 'Негайно розгорнути бонові загородження та обробити сорбентами.',
    },
  ];
};

export const ZONE_LEVEL_COLORS: Record<DangerZoneLevel, string> = {
  safe: '#10B981',
  warning: '#F59E0B',
  high: '#F97316',
  danger: '#EF4444',
};

export const ZONE_LEVEL_LABELS: Record<DangerZoneLevel, string> = {
  safe: 'Безпечно',
  warning: 'Потенційний ризик',
  high: 'Підвищений ризик',
  danger: 'Небезпечна зона',
};

// ── MAIN ENGINE WITH LIVE TICK SIMULATION ─────────────────────────────────────
export function getSmartCityData(
  cityId: string,
  city: City,
  incidents: Incident[],
  tick: number = 0
): {
  sensors: Sensor[];
  dangerZones: DangerZone[];
  weather: WeatherData;
  aiRisks: AIRiskReport[];
  stats: CityStats;
} {
  // 1. Get weather
  const weather = WEATHER_TEMPLATES[cityId] || WEATHER_TEMPLATES.vinnytsia;

  // 2. Get sensors with dynamic live ticking
  const sensors = getBaseSensors(cityId, city, tick);

  // 3. Get danger zones
  const dangerZones = getBaseZones(cityId, city);

  const activeIncidents = incidents.filter(
    (inc) => inc.status !== 'resolved'
  );

  // 4. Update Danger Zones dynamically
  dangerZones.forEach((zone) => {
    // Find nearby unresolved citizen reports
    const nearbyReports = activeIncidents.filter((inc) => {
      const dist = getDistanceDegrees(zone.lat, zone.lng, inc.lat, inc.lng);
      if (dist > 0.009) return false;

      if (zone.type === 'air' && inc.category === 'ecology') return true;
      if (zone.type === 'water' && inc.category === 'ecology') return true;
      if (zone.type === 'storm' && (inc.category === 'critical' || inc.category === 'utility')) return true;
      if (zone.type === 'icing' && (inc.category === 'transport' || inc.category === 'critical')) return true;
      if (zone.type === 'noise' && (inc.category === 'ecology' || inc.category === 'infrastructure')) return true;
      if (zone.type === 'heat' && (inc.category === 'utility' || inc.category === 'critical')) return true;

      return false;
    });

    const reportCount = nearbyReports.length;

    // Find nearest matching sensor
    const matchingSensor = sensors.find((s) => {
      if (zone.type === 'storm' && s.type === 'storm') return true;
      if (zone.type === 'air' && s.type === 'air') return true;
      if (zone.type === 'water' && s.type === 'water') return true;
      if (zone.type === 'noise' && s.type === 'noise') return true;
      if (zone.type === 'icing' && s.type === 'temp') return true;
      if (zone.type === 'heat' && s.type === 'temp') return true;
      return false;
    });

    // Escalation logic
    if (zone.type === 'storm') {
      const fillPercentage = matchingSensor ? matchingSensor.numericValue : 50;
      const isRaining = weather.condition.toLowerCase().includes('дощ') || weather.condition.toLowerCase().includes('злива');

      if (fillPercentage >= 80 && isRaining && reportCount >= 2) {
        zone.level = 'danger';
        zone.reasons = `Високий ризик підтоплення. Прогнозується сильний дощ, рівень заповнення зливової системи становить ${fillPercentage}%, а мешканці вже залишили ${reportCount} повідомлення(я) про накопичення води в цій зоні.`;
        zone.aiRecommendation = 'Негайно перевірити зливову систему та очистити зливоприймачі на вулиці протягом наступних 2 годин. Задіяти резервні помпи.';
        zone.consequences = 'Можливе значне затоплення доріг, блокування руху транспорту та затоплення підвалів.';
      } else if (fillPercentage >= 70 || isRaining || reportCount >= 1) {
        zone.level = 'high';
        zone.reasons = `Підвищений ризик підтоплення через зливу та рівень заповнення дренажів ${fillPercentage}%. Отримано ${reportCount} скарг(и) від мешканців про калюжі.`;
        zone.aiRecommendation = 'Комунальним службам провести огляд решіток зливової каналізації та тримати чергові бригади напоготові.';
        zone.consequences = 'Локальні калюжі, незначне ускладнення руху пішоходів та транспорту.';
      } else {
        zone.level = 'warning';
      }
    }

    if (zone.type === 'water') {
      const phVal = matchingSensor ? matchingSensor.numericValue : 7.0;
      
      if (reportCount >= 2) {
        zone.level = 'danger';
        zone.reasons = `Забруднення води підтверджено: датчик фіксує відхилення pH (${phVal}), а мешканці надіслали ${reportCount} скарг про хімічний запах чи сміття.`;
        zone.aiRecommendation = 'Встановити тимчасову заборону на забір води та купання. Спрямувати еко-патруль для пошуку витоку хімікатів.';
        zone.consequences = 'Загроза отруєння риби, поширення токсинів нижче за течією.';
      } else if (phVal < 6.0 || phVal > 8.5 || reportCount >= 1) {
        zone.level = 'high';
        zone.reasons = `Виявлено ознаки забруднення води. Показник pH становить ${phVal}, зафіксовано ${reportCount} скарг(и) від мешканців.`;
        zone.aiRecommendation = 'Посилити частоту забору проб, провести обстеження прибережної смуги.';
        zone.consequences = 'Погіршення біологічного стану водойми.';
      } else {
        zone.level = 'warning';
      }
    }

    if (zone.type === 'air') {
      const aqi = matchingSensor ? matchingSensor.numericValue : 50;
      const isHotAndDry = weather.temp >= 30 && weather.windSpeed <= 5;

      if (aqi >= 150 && isHotAndDry && reportCount >= 2) {
        zone.level = 'danger';
        zone.reasons = `Критичне забруднення повітря (AQI: ${aqi}) на фоні спеки (+${weather.temp}°C) та відсутності вітру. Мешканці повідомляють про смог та важкість дихання (${reportCount} звернень).`;
        zone.aiRecommendation = 'Рекомендувати жителям не виходити на вулицю без потреби, закрити вікна. Запустити спецтехніку для поливу вулиць з метою осадження пилу.';
        zone.consequences = 'Різке збільшення скарг від людей з астмою та серцево-судинними захворюваннями.';
      } else if (aqi >= 100 || isHotAndDry || reportCount >= 1) {
        zone.level = 'high';
        zone.reasons = `Несприятлива якість повітря. Рівень AQI становить ${aqi}, слабкий вітер сприяє накопиченню автомобільних викидів. Надійшло ${reportCount} скарг(и).`;
        zone.aiRecommendation = 'Комунальним службам обмежити в\'їзд транзитного вантажного транспорту до центру, проводити вологе прибирання доріг.';
        zone.consequences = 'Поява легкого смогу, дискомфорт для чутливих груп населення.';
      } else {
        zone.level = 'safe';
      }
    }

    if (zone.type === 'icing') {
      const isBelowZero = weather.temp <= 0;
      const isHumid = weather.humidity >= 90;

      if (isBelowZero && isHumid && reportCount >= 2) {
        zone.level = 'danger';
        zone.reasons = `Ожеледиця на дорогах. Температура повітря ${weather.temp}°C, вологість ${weather.humidity}%. Надійшло ${reportCount} скарг(и) від мешканців про аварії та ковзанку.`;
        zone.aiRecommendation = 'Негайно випустити піскорозкидувальну техніку на магістральні маршрути та круті підйоми. Посипати тротуари реагентами.';
        zone.consequences = 'Різке зростання кількості ДТП, утворення заторів, травмування пішоходів.';
      } else if (isBelowZero || (weather.temp <= 2 && isHumid) || reportCount >= 1) {
        zone.level = 'high';
        zone.reasons = `Висока ймовірність ожеледиці на дорогах через мороз та вологість ${weather.humidity}%. Зафіксовано ${reportCount} повідомлень від водіїв.`;
        zone.aiRecommendation = 'Черговим бригадам автодору провести профілактичну обробку мостів та небезпечних ділянок сумішами.';
        zone.consequences = 'Зниження зчеплення коліс з дорогою, збільшення гальмівного шляху.';
      } else {
        zone.level = 'warning';
      }
    }

    if (zone.type === 'noise') {
      const noiseDb = matchingSensor ? matchingSensor.numericValue : 60;
      if (noiseDb >= 80 && reportCount >= 2) {
        zone.level = 'danger';
        zone.reasons = `Надмірний рівень шуму (${noiseDb} дБ). Зафіксовано численні скарги мешканців (${reportCount}) на гучні роботи у заборонений час.`;
        zone.aiRecommendation = 'Направити муніципальну варту для перевірки дотримання тиші та зупинки джерел шуму.';
        zone.consequences = 'Порушення сну та відпочинку громадян, скарги на галас.';
      } else if (noiseDb >= 70 || reportCount >= 1) {
        zone.level = 'high';
        zone.reasons = `Підвищений рівень шуму в зоні (${noiseDb} дБ). Наявні скарги мешканців (${reportCount}).`;
        zone.aiRecommendation = 'Провести перевірку дозволів на гучні роботи в районі.';
        zone.consequences = 'Тимчасовий дискомфорт мешканців.';
      } else {
        zone.level = 'warning';
      }
    }

    if (zone.type === 'heat') {
      const isHot = weather.temp >= 32;
      if (isHot && reportCount >= 2) {
        zone.level = 'high';
        zone.reasons = `Небезпека теплового удару. Температура повітря +${weather.temp}°C. Мешканці повідомляють про погане самопочуття (${reportCount} звернень).`;
        zone.aiRecommendation = 'Обмежити проведення масових заходів просто неба. Організувати роздачу води.';
        zone.consequences = 'Підвищений ризик серцевих нападів, теплових ударів.';
      } else if (isHot) {
        zone.level = 'warning';
        zone.reasons = `Висока температура повітря (+${weather.temp}°C).`;
        zone.aiRecommendation = 'Уникати перебування під прямим сонцем, пити більше води.';
        zone.consequences = 'Втомлюваність, навантаження на електромережі.';
      } else {
        zone.level = 'safe';
      }
    }

    zone.color = ZONE_LEVEL_COLORS[zone.level];
  });

  // 5. Generate AI Risk Analysis Reports
  const aiRisks: AIRiskReport[] = [];
  dangerZones.forEach((zone) => {
    if (zone.level !== 'safe') {
      aiRisks.push({
        id: `ai-risk-${zone.id}`,
        type: zone.type,
        title: `${zone.level === 'danger' ? 'Критична небезпека' : zone.level === 'high' ? 'Високий ризик' : 'Потенційний ризик'}: ${zone.name.split(' (')[0]}`,
        level: zone.level === 'danger' ? 'danger' : zone.level === 'high' ? 'high' : 'warning',
        reasons: zone.reasons,
        consequences: zone.consequences,
        recommendation: zone.aiRecommendation,
      });
    }
  });

  // 6. Calculate Stats
  const activeSensors = `${sensors.length} / ${sensors.length}`;
  const dangerZonesCount = dangerZones.filter((z) => z.level === 'danger' || z.level === 'high').length;
  const newIncidentsCount = activeIncidents.length;

  const airSensor = sensors.find((s) => s.type === 'air');
  const avgAirQuality = airSensor ? airSensor.value : '45 AQI';

  const waterIssues = activeIncidents.filter((inc) => inc.category === 'ecology' && inc.title.toLowerCase().includes('вод')).length;
  const waterIssuesCount = waterIssues + (sensors.find((s) => s.type === 'water')?.status === 'danger' ? 1 : 0);

  const highestRiskDistricts =
    dangerZonesCount > 0
      ? dangerZones
          .filter((z) => z.level === 'danger' || z.level === 'high')
          .map((z) => z.name.replace('Зона ризику ', '').replace('Ділянка ', '').split(' (')[0])
          .slice(0, 2)
          .join(', ')
      : 'Немає';

  const stats: CityStats = {
    activeSensors,
    dangerZonesCount,
    newIncidentsCount,
    avgAirQuality,
    waterIssuesCount,
    highestRiskDistricts,
  };

  return {
    sensors,
    dangerZones,
    weather,
    aiRisks,
    stats,
  };
}
