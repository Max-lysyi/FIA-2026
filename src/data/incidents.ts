export type IncidentCategory = 'ecology' | 'critical' | 'transport' | 'utility' | 'infrastructure';
export type IncidentStatus = 'new' | 'processing' | 'resolved';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  priority: IncidentPriority;
  location: string;
  lat: number;
  lng: number;
  complaintsCount: number;
  timeAgo: string;
  department: string;
  beforePhoto?: string;
  afterPhoto?: string;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  region: string;
}

export const CITIES: City[] = [
  { id: 'vinnytsia', name: 'Вінниця', lat: 49.2328, lng: 28.4682, zoom: 13, region: 'Вінницька обл.' },
  { id: 'zhytomyr', name: 'Житомир', lat: 50.2547, lng: 28.6587, zoom: 13, region: 'Житомирська обл.' },
  { id: 'khmelnytskyi', name: 'Хмельницький', lat: 49.4220, lng: 26.9963, zoom: 13, region: 'Хмельницька обл.' },
  { id: 'kyiv', name: 'Київ', lat: 50.4501, lng: 30.5234, zoom: 12, region: 'м. Київ' },
];

export const CATEGORY_CONFIG = {
  ecology: {
    label: 'ЕКОЛОГІЯ',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    markerColor: '#10B981',
  },
  critical: {
    label: 'КРИТИЧНО',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    markerColor: '#EF4444',
  },
  transport: {
    label: 'ТРАНСПОРТ',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    markerColor: '#F59E0B',
  },
  utility: {
    label: 'ЖКГ',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    markerColor: '#3B82F6',
  },
  infrastructure: {
    label: 'БЛАГОУСТРІЙ',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    markerColor: '#A855F7',
  },
} as const;

// ─── ВІННИЦЯ ───────────────────────────────────────────────────────────
const VINNYTSIA_INCIDENTS: Incident[] = [
  {
    id: 'v1', title: 'Зламане дерево перекрило дорогу', description: 'Велике дерево впало та перекрило проїжджу частину', category: 'critical', status: 'processing', priority: 'critical', location: 'вул. Соборна', lat: 49.2337, lng: 28.4682, complaintsCount: 12, timeAgo: '5 хв тому', department: 'КП Зеленгосп', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  },
  {
    id: 'v2', title: 'ЖКГ аварія — прорив труби', description: 'Прорив водопровідної труби, вода затопила підвал', category: 'utility', status: 'processing', priority: 'critical', location: 'вул. Хмельницьке шосе', lat: 49.2298, lng: 28.4720, complaintsCount: 8, timeAgo: '15 хв тому', department: 'Вінницяводоканал',
  },
  {
    id: 'v3', title: 'Забруднення водойми, запах хімії', description: 'Смердить хімією біля Південного Бугу', category: 'ecology', status: 'processing', priority: 'high', location: 'Пд. Буг', lat: 49.2328, lng: 28.4665, complaintsCount: 3, timeAgo: '2 хв тому', department: 'Екологічна служба',
  },
  {
    id: 'v4', title: 'Не працює світлофор', description: 'Вийшов з ладу світлофор на перехресті', category: 'transport', status: 'new', priority: 'high', location: 'вул. Грушевського', lat: 49.2358, lng: 28.4640, complaintsCount: 5, timeAgo: '8 хв тому', department: 'Служба дорожнього руху',
  },
  {
    id: 'v5', title: 'Незаконне сміттєзвалище', description: 'У парку виявлено незаконне сміттєзвалище', category: 'ecology', status: 'new', priority: 'high', location: 'Центральний парк', lat: 49.2368, lng: 28.4760, complaintsCount: 7, timeAgo: '20 хв тому', department: 'Екологічна служба',
  },
  {
    id: 'v6', title: 'Вибоїни на дорозі', description: 'Численні глибокі вибоїни на проїжджій частині', category: 'transport', status: 'processing', priority: 'medium', location: 'вул. Київська', lat: 49.2280, lng: 28.4650, complaintsCount: 9, timeAgo: '35 хв тому', department: 'Служба доріг',
  },
  {
    id: 'v7', title: 'Неякісний стан тротуару', description: 'Великі ями на тротуарі, небезпечно для пішоходів', category: 'infrastructure', status: 'new', priority: 'medium', location: 'вул. Подільська', lat: 49.2318, lng: 28.4698, complaintsCount: 3, timeAgo: '3 хв тому', department: 'ЖКГ',
  },
  {
    id: 'v8', title: 'Гілку на вул. Подільській прибрано', description: 'Комунальна служба прибрала аварійне дерево', category: 'ecology', status: 'resolved', priority: 'low', location: 'вул. Подільська', lat: 49.2345, lng: 28.4710, complaintsCount: 1, timeAgo: '10 хв тому', department: 'КП Зеленгосп', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  },
];

// ─── ЖИТОМИР ───────────────────────────────────────────────────────────
const ZHYTOMYR_INCIDENTS: Incident[] = [
  {
    id: 'zh1', title: 'Прорив каналізаційної труби', description: 'Каналізаційні стоки виходять на поверхню дороги', category: 'utility', status: 'processing', priority: 'critical', location: 'вул. Велика Бердичівська', lat: 50.2578, lng: 28.6612, complaintsCount: 15, timeAgo: '3 хв тому', department: 'Житомирводоканал',
  },
  {
    id: 'zh2', title: 'Пошкоджено освітлення на вулиці', description: 'Декілька ліхтарів не працюють, небезпечно вночі', category: 'infrastructure', status: 'new', priority: 'medium', location: 'вул. Київська', lat: 50.2530, lng: 28.6540, complaintsCount: 4, timeAgo: '1 год тому', department: 'КП Міськсвітло',
  },
  {
    id: 'zh3', title: 'Самовільне будівництво у парку', description: 'Незаконне будівництво на території міського парку', category: 'ecology', status: 'new', priority: 'high', location: 'Парк культури', lat: 50.2560, lng: 28.6700, complaintsCount: 22, timeAgo: '2 год тому', department: 'Архітектурний відділ',
  },
  {
    id: 'zh4', title: 'Затор через ремонт дороги', description: 'Дорожній ремонт спричинив великі затори', category: 'transport', status: 'processing', priority: 'medium', location: 'пр. Миру', lat: 50.2510, lng: 28.6580, complaintsCount: 6, timeAgo: '30 хв тому', department: 'Служба доріг',
  },
  {
    id: 'zh5', title: 'Забруднення р. Тетерів', description: 'Скид відходів у річку Тетерів', category: 'ecology', status: 'processing', priority: 'critical', location: 'р. Тетерів', lat: 50.2490, lng: 28.6450, complaintsCount: 18, timeAgo: '45 хв тому', department: 'Екологічна служба',
  },
  {
    id: 'zh6', title: 'Тріщина в асфальті', description: 'Велика тріщина в дорожньому покритті', category: 'transport', status: 'new', priority: 'low', location: 'вул. Лесі Українки', lat: 50.2600, lng: 28.6620, complaintsCount: 2, timeAgo: '3 год тому', department: 'Служба доріг',
  },
  {
    id: 'zh7', title: 'Відремонтовано тротуар ✅', description: 'Успішно відремонтовано тротуар після скарг', category: 'infrastructure', status: 'resolved', priority: 'low', location: 'вул. Пушкінська', lat: 50.2545, lng: 28.6670, complaintsCount: 3, timeAgo: '5 год тому', department: 'ЖКГ', beforePhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop',
  },
];

// ─── ХМЕЛЬНИЦЬКИЙ ──────────────────────────────────────────────────────
const KHMELNYTSKYI_INCIDENTS: Incident[] = [
  {
    id: 'kh1', title: 'Аварійний стан будівлі', description: 'Стара будівля загрожує обваленням', category: 'critical', status: 'processing', priority: 'critical', location: 'вул. Проскурівська', lat: 49.4250, lng: 26.9990, complaintsCount: 25, timeAgo: '10 хв тому', department: 'ДСНС',
  },
  {
    id: 'kh2', title: 'Відсутність опалення у будинку', description: 'Мешканці будинку без тепла вже 3 дні', category: 'utility', status: 'processing', priority: 'critical', location: 'мкр Озерний', lat: 49.4185, lng: 26.9920, complaintsCount: 40, timeAgo: '2 год тому', department: 'Теплокомуненерго',
  },
  {
    id: 'kh3', title: 'Вирубка дерев у сквері', description: 'Несанкціонована вирубка дерев у міському сквері', category: 'ecology', status: 'new', priority: 'high', location: 'Сквер Перемоги', lat: 49.4230, lng: 27.0020, complaintsCount: 30, timeAgo: '1 год тому', department: 'Екологічна служба',
  },
  {
    id: 'kh4', title: 'Погана розмітка на дорозі', description: 'Дорожня розмітка стерлась, небезпечно для водіїв', category: 'transport', status: 'new', priority: 'medium', location: 'вул. Шевченка', lat: 49.4200, lng: 26.9940, complaintsCount: 8, timeAgo: '4 год тому', department: 'Служба дорожнього руху',
  },
  {
    id: 'kh5', title: 'Зруйновані лавки в парку', description: 'Вандали пошкодили лавки у парку Перемоги', category: 'infrastructure', status: 'new', priority: 'low', location: 'Парк Перемоги', lat: 49.4260, lng: 26.9970, complaintsCount: 5, timeAgo: '6 год тому', department: 'ЖКГ',
  },
  {
    id: 'kh6', title: 'Ліквідовано аварію водопроводу ✅', description: 'Аварія на водопроводі успішно ліквідована', category: 'utility', status: 'resolved', priority: 'low', location: 'вул. Заводська', lat: 49.4170, lng: 26.9900, complaintsCount: 12, timeAgo: '8 год тому', department: 'Хмельниківодоканал', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  },
];

// ─── КИЇВ ──────────────────────────────────────────────────────────────
const KYIV_INCIDENTS: Incident[] = [
  {
    id: 'k1', title: 'Знеструмлення цілого кварталу', description: 'Підстанція вийшла з ладу, знеструмлено 500 квартир', category: 'critical', status: 'processing', priority: 'critical', location: 'Оболонь', lat: 50.5000, lng: 30.4980, complaintsCount: 500, timeAgo: '20 хв тому', department: 'ДТЕК',
  },
  {
    id: 'k2', title: 'Зсув ґрунту на схилі', description: 'Зсув ґрунту загрожує будинкам на схилі', category: 'critical', status: 'processing', priority: 'critical', location: 'Подільський р-н', lat: 50.4650, lng: 30.5150, complaintsCount: 80, timeAgo: '1 год тому', department: 'ДСНС',
  },
  {
    id: 'k3', title: 'Прорив теплотраси', description: 'Гаряча вода затопила вулицю та підвали', category: 'utility', status: 'processing', priority: 'critical', location: 'Печерськ', lat: 50.4380, lng: 30.5280, complaintsCount: 45, timeAgo: '35 хв тому', department: 'Київтеплоенерго',
  },
  {
    id: 'k4', title: 'Незаконне паркування на тротуарі', description: 'Авто заблокували прохід для пішоходів', category: 'transport', status: 'new', priority: 'medium', location: 'вул. Хрещатик', lat: 50.4480, lng: 30.5240, complaintsCount: 15, timeAgo: '2 год тому', department: 'Муніципальна варта',
  },
  {
    id: 'k5', title: 'Пошкоджено фонтан у парку', description: 'Фонтан не працює, води вилилась на доріжки', category: 'infrastructure', status: 'new', priority: 'low', location: 'Гідропарк', lat: 50.4390, lng: 30.5950, complaintsCount: 7, timeAgo: '3 год тому', department: 'КП Київзеленбуд',
  },
  {
    id: 'k6', title: 'Дим з підземного колектора', description: 'З каналізаційного колектора йде дим', category: 'ecology', status: 'processing', priority: 'high', location: 'вул. Саксаганського', lat: 50.4320, lng: 30.5030, complaintsCount: 22, timeAgo: '50 хв тому', department: 'Екологічна служба',
  },
  {
    id: 'k7', title: 'Аварія на Бориспільській трасі', description: 'ДТП заблокувало рух, затор на 5 км', category: 'transport', status: 'processing', priority: 'high', location: 'Бориспільська траса', lat: 50.4200, lng: 30.6200, complaintsCount: 200, timeAgo: '15 хв тому', department: 'Патрульна поліція',
  },
  {
    id: 'k8', title: 'Ліквідовано прорив каналізації ✅', description: 'Аварія успішно ліквідована бригадою', category: 'utility', status: 'resolved', priority: 'low', location: 'Голосіїв', lat: 50.4050, lng: 30.5130, complaintsCount: 18, timeAgo: '6 год тому', department: 'Київводоканал', beforePhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop',
  },
  {
    id: 'k9', title: 'Відновлено освітлення Майдану ✅', description: 'Всі ліхтарі відновлено після планового ремонту', category: 'infrastructure', status: 'resolved', priority: 'low', location: 'Майдан Незалежності', lat: 50.4501, lng: 30.5234, complaintsCount: 5, timeAgo: '12 год тому', department: 'КП Міськсвітло', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  },
];

export const CITY_INCIDENTS: Record<string, Incident[]> = {
  vinnytsia: VINNYTSIA_INCIDENTS,
  zhytomyr: ZHYTOMYR_INCIDENTS,
  khmelnytskyi: KHMELNYTSKYI_INCIDENTS,
  kyiv: KYIV_INCIDENTS,
};

// backward compat
export const INCIDENTS = VINNYTSIA_INCIDENTS;
