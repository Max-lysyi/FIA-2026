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
  // True only for reports whose category/priority/department/description
  // actually came back from a live Aethercode API call (submitted through
  // the report form). Seed/demo incidents don't set this, since they were
  // never really run through the AI pipeline.
  aiProcessed?: boolean;
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
  { id: 'v1', title: 'Зламане дерево перекрило дорогу', description: 'Велике дерево впало та перекрило проїжджу частину', category: 'critical', status: 'processing', priority: 'critical', location: 'вул. Соборна, 43', lat: 49.23372, lng: 28.46812, complaintsCount: 12, timeAgo: '5 хв тому', department: 'КП Зеленгосп', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop' },
  { id: 'v2', title: 'ЖКГ аварія — прорив труби', description: 'Прорив водопровідної труби, вода затопила підвал', category: 'utility', status: 'processing', priority: 'critical', location: 'вул. Хмельницьке шосе, 12', lat: 49.24415, lng: 28.48302, complaintsCount: 8, timeAgo: '15 хв тому', department: 'Вінницяводоканал' },
  { id: 'v3', title: 'Забруднення водойми, запах хімії', description: 'Смердить хімією біля Південного Бугу в районі мосту', category: 'ecology', status: 'processing', priority: 'high', location: 'Пд. Буг, Кемпінг', lat: 49.22103, lng: 28.45184, complaintsCount: 3, timeAgo: '2 хв тому', department: 'Екологічна служба' },
  { id: 'v4', title: 'Не працює світлофор', description: 'Вийшов з ладу світлофор на перехресті вулиць', category: 'transport', status: 'new', priority: 'high', location: 'вул. Грушевського / Хмельницьке шосе', lat: 49.23891, lng: 28.47726, complaintsCount: 5, timeAgo: '8 хв тому', department: 'Служба дорожнього руху' },
  { id: 'v5', title: 'Незаконне сміттєзвалище', description: 'У Центральному парку виявлено незаконне сміттєзвалище', category: 'ecology', status: 'new', priority: 'high', location: 'Центральний міський парк', lat: 49.23015, lng: 28.44638, complaintsCount: 7, timeAgo: '20 хв тому', department: 'Екологічна служба' },
  { id: 'v6', title: 'Вибоїни на дорозі', description: 'Численні глибокі вибоїни на проїжджій частині', category: 'transport', status: 'processing', priority: 'medium', location: 'вул. Київська, 24', lat: 49.25012, lng: 28.49145, complaintsCount: 9, timeAgo: '35 хв тому', department: 'Служба доріг' },
  { id: 'v7', title: 'Неякісний стан тротуару', description: 'Великі ями на тротуарі, небезпечно для пішоходів', category: 'infrastructure', status: 'new', priority: 'medium', location: 'вул. Пирогова, 7', lat: 49.22581, lng: 28.47893, complaintsCount: 3, timeAgo: '3 хв тому', department: 'ЖКГ' },
  { id: 'v8', title: 'Гілку на вул. Порика прибрано', description: 'Комунальна служба прибрала аварійне дерево', category: 'ecology', status: 'resolved', priority: 'low', location: 'вул. Порика, 15', lat: 49.24186, lng: 28.45521, complaintsCount: 1, timeAgo: '10 хв тому', department: 'КП Зеленгосп', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop' },
  { id: 'v9', title: 'Провалля в асфальті на мосту', description: 'На Пироговському мосту утворилась глибока яма', category: 'transport', status: 'new', priority: 'critical', location: 'Пироговський міст', lat: 49.22759, lng: 28.46015, complaintsCount: 14, timeAgo: '25 хв тому', department: 'Служба доріг' },
  { id: 'v10', title: 'Не вивозиться сміття', description: 'Контейнерний майданчик переповнений вже тиждень', category: 'ecology', status: 'processing', priority: 'medium', location: 'вул. Немирівське шосе, 108', lat: 49.20951, lng: 28.49872, complaintsCount: 11, timeAgo: '1 год тому', department: 'КП Спецкомунтранс' },
  { id: 'v11', title: 'Аварійне освітлення у дворі', description: 'Не працюють ліхтарі у дворі багатоповерхівки', category: 'infrastructure', status: 'new', priority: 'low', location: 'вул. Келецька, 55', lat: 49.21634, lng: 28.44219, complaintsCount: 4, timeAgo: '2 год тому', department: 'КП Міськсвітло' },
  { id: 'v12', title: 'Розлив пального на заправці', description: 'На АЗС стався розлив пального, ризик займання', category: 'critical', status: 'processing', priority: 'critical', location: 'вул. 600-річчя, 21', lat: 49.23784, lng: 28.50213, complaintsCount: 6, timeAgo: '12 хв тому', department: 'ДСНС' },
  { id: 'v13', title: 'Не працює вуличне освітлення', description: 'Два ліхтарі не світять на переході ввечері', category: 'infrastructure', status: 'new', priority: 'low', location: 'вул. Театральна, 14', lat: 49.2312, lng: 28.4635, complaintsCount: 2, timeAgo: '10 хв тому', department: 'КП Міськсвітло' },
  { id: 'v14', title: 'Переповнений сміттєвий бак', description: 'Сміття висипається на тротуар біля зупинки транспорту', category: 'ecology', status: 'new', priority: 'medium', location: 'просп. Коцюбинського, 28', lat: 49.2415, lng: 28.4905, complaintsCount: 5, timeAgo: '18 хв тому', department: 'КП Ековін' },
  { id: 'v15', title: 'Яма на перехресті', description: 'Глибока вибоїна, водії змушені виїжджати на зустрічну смугу', category: 'transport', status: 'processing', priority: 'medium', location: 'вул. Стрілецька / Замостянська', lat: 49.2458, lng: 28.4982, complaintsCount: 6, timeAgo: '22 хв тому', department: 'Служба доріг' },
  { id: 'v16', title: 'Зламана спинка паркової лави', description: 'У сквері Козицького пошкоджено спинку дерев\'яної лавки', category: 'infrastructure', status: 'new', priority: 'low', location: 'Сквер Козицького', lat: 49.2345, lng: 28.4665, complaintsCount: 1, timeAgo: '30 хв тому', department: 'КП Зеленбуд' },
  { id: 'v17', title: 'Графіті на історичній будівлі', description: 'Вандали обмалювали історичну будівлю нецензурними написами', category: 'infrastructure', status: 'new', priority: 'low', location: 'вул. Миколи Оводова, 32', lat: 49.2322, lng: 28.4651, complaintsCount: 3, timeAgo: '45 хв тому', department: 'Муніципальна варта' },
  { id: 'v18', title: 'Низький тиск води у квартирах', description: 'У будинку ледь тече холодна вода з крана на верхніх поверхах', category: 'utility', status: 'processing', priority: 'medium', location: 'вул. Келецька, 78', lat: 49.2155, lng: 28.4352, complaintsCount: 4, timeAgo: '1 год тому', department: 'Вінницяводоканал' },
];

// ─── ЖИТОМИР ───────────────────────────────────────────────────────────
const ZHYTOMYR_INCIDENTS: Incident[] = [
  { id: 'zh1', title: 'Прорив каналізаційної труби', description: 'Каналізаційні стоки виходять на поверхню дороги', category: 'utility', status: 'processing', priority: 'critical', location: 'вул. Велика Бердичівська, 40', lat: 50.25781, lng: 28.66124, complaintsCount: 15, timeAgo: '3 хв тому', department: 'Житомирводоканал' },
  { id: 'zh2', title: 'Пошкоджено освітлення на вулиці', description: 'Декілька ліхтарів не працюють, небезпечно вночі', category: 'infrastructure', status: 'new', priority: 'medium', location: 'вул. Київська, 77', lat: 50.24698, lng: 28.65403, complaintsCount: 4, timeAgo: '1 год тому', department: 'КП Міськсвітло' },
  { id: 'zh3', title: 'Самовільне будівництво у парку', description: 'Незаконне будівництво на території міського парку', category: 'ecology', status: 'new', priority: 'high', location: 'Гідропарк ім. Гагаріна', lat: 50.26312, lng: 28.67281, complaintsCount: 22, timeAgo: '2 год тому', department: 'Архітектурний відділ' },
  { id: 'zh4', title: 'Затор через ремонт дороги', description: 'Дорожній ремонт спричинив великі затори', category: 'transport', status: 'processing', priority: 'medium', location: 'пр. Миру, 12', lat: 50.24512, lng: 28.68134, complaintsCount: 6, timeAgo: '30 хв тому', department: 'Служба доріг' },
  { id: 'zh5', title: 'Забруднення р. Тетерів', description: 'Скид відходів у річку Тетерів поблизу мосту', category: 'ecology', status: 'processing', priority: 'critical', location: 'р. Тетерів, Каштановий міст', lat: 50.27015, lng: 28.65891, complaintsCount: 18, timeAgo: '45 хв тому', department: 'Екологічна служба' },
  { id: 'zh6', title: 'Тріщина в асфальті', description: 'Велика тріщина в дорожньому покритті', category: 'transport', status: 'new', priority: 'low', location: 'вул. Лесі Українки, 3', lat: 50.25012, lng: 28.64215, complaintsCount: 2, timeAgo: '3 год тому', department: 'Служба доріг' },
  { id: 'zh7', title: 'Відремонтовано тротуар ✅', description: 'Успішно відремонтовано тротуар після скарг', category: 'infrastructure', status: 'resolved', priority: 'low', location: 'вул. Пушкінська, 21', lat: 50.25893, lng: 28.66782, complaintsCount: 3, timeAgo: '5 год тому', department: 'ЖКГ', beforePhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop' },
  { id: 'zh8', title: 'Провалля тротуару біля школи', description: 'Просів тротуар поруч зі шкільним подвір\'ям', category: 'infrastructure', status: 'new', priority: 'high', location: 'вул. Чуднівська, 89', lat: 50.24215, lng: 28.66592, complaintsCount: 9, timeAgo: '40 хв тому', department: 'ЖКГ' },
  { id: 'zh9', title: 'Задимлення на промзоні', description: 'Сильне задимлення від підприємства в промзоні', category: 'ecology', status: 'processing', priority: 'high', location: 'вул. Промислова, 5', lat: 50.28104, lng: 28.64327, complaintsCount: 13, timeAgo: '55 хв тому', department: 'Екологічна служба' },
  { id: 'zh10', title: 'Не працює пішохідний перехід', description: 'Розбите світло на регульованому переході', category: 'transport', status: 'new', priority: 'medium', location: 'вул. Перемоги, 33', lat: 50.26541, lng: 28.63982, complaintsCount: 7, timeAgo: '1 год тому', department: 'Служба дорожнього руху' },
  { id: 'zh11', title: 'Аварія водопроводу у дворі', description: 'Прорвало трубу у дворі багатоповерхівки', category: 'utility', status: 'processing', priority: 'critical', location: 'мкр Крошня, буд. 14', lat: 50.23621, lng: 28.62894, complaintsCount: 20, timeAgo: '18 хв тому', department: 'Житомирводоканал' },
  { id: 'zh12', title: 'Не працює ліхтар на перехресті', description: 'Перегоріла лампа ліхтаря, темно', category: 'infrastructure', status: 'new', priority: 'low', location: 'вул. Перемоги, 12', lat: 50.2595, lng: 28.6521, complaintsCount: 1, timeAgo: '12 хв тому', department: 'КП Міськсвітло' },
  { id: 'zh13', title: 'Сміття біля дитячого майданчика', description: 'Розкидані пакети та пляшки біля гойдалок', category: 'ecology', status: 'new', priority: 'medium', location: 'вул. Шевченка, 35', lat: 50.2512, lng: 28.6654, complaintsCount: 4, timeAgo: '19 хв тому', department: 'КП ЖУК' },
  { id: 'zh14', title: 'Просідання тротуарної плитки', description: 'Плитка просіла, утворилася велика калюжа', category: 'infrastructure', status: 'processing', priority: 'medium', location: 'майдан Соборний, 2', lat: 50.2541, lng: 28.6552, complaintsCount: 3, timeAgo: '25 хв тому', department: 'КП Експлуатація доріг' },
  { id: 'zh15', title: 'Зламані гойдалки у дворі', description: 'Пошкоджено кріплення дитячої гойдалки', category: 'infrastructure', status: 'new', priority: 'low', location: 'бульвар Новий, 4', lat: 50.2525, lng: 28.6578, complaintsCount: 2, timeAgo: '35 хв тому', department: 'КП Зеленбуд' },
  { id: 'zh16', title: 'Гучна музика з літнього майданчика', description: 'Кафе грає гучну музику після 22:00', category: 'infrastructure', status: 'new', priority: 'low', location: 'вул. Михайлівська, 8', lat: 50.2558, lng: 28.6601, complaintsCount: 5, timeAgo: '40 хв тому', department: 'Муніципальна інспекція' },
  { id: 'zh17', title: 'Сухе гілля загрожує падінням', description: 'Велике сухе гілля висить над пішохідною зоною', category: 'ecology', status: 'processing', priority: 'medium', location: 'парк ім. Гагаріна', lat: 50.2485, lng: 28.6621, complaintsCount: 3, timeAgo: '1 год тому', department: 'КП Зеленбуд' },
];

// ─── ХМЕЛЬНИЦЬКИЙ ──────────────────────────────────────────────────────
const KHMELNYTSKYI_INCIDENTS: Incident[] = [
  { id: 'kh1', title: 'Аварійний стан будівлі', description: 'Стара будівля загрожує обваленням', category: 'critical', status: 'processing', priority: 'critical', location: 'вул. Проскурівська, 58', lat: 49.42497, lng: 26.99873, complaintsCount: 25, timeAgo: '10 хв тому', department: 'ДСНС' },
  { id: 'kh2', title: 'Відсутність опалення у будинку', description: 'Мешканці будинку без тепла вже 3 дні', category: 'utility', status: 'processing', priority: 'critical', location: 'мкр Озерний, буд. 21', lat: 49.41214, lng: 26.98356, complaintsCount: 40, timeAgo: '2 год тому', department: 'Теплокомуненерго' },
  { id: 'kh3', title: 'Вирубка дерев у сквері', description: 'Несанкціонована вирубка дерев у міському сквері', category: 'ecology', status: 'new', priority: 'high', location: 'Сквер Перемоги', lat: 49.43012, lng: 27.00415, complaintsCount: 30, timeAgo: '1 год тому', department: 'Екологічна служба' },
  { id: 'kh4', title: 'Погана розмітка на дорозі', description: 'Дорожня розмітка стерлась, небезпечно для водіїв', category: 'transport', status: 'new', priority: 'medium', location: 'вул. Шевченка, 12', lat: 49.41893, lng: 26.98991, complaintsCount: 8, timeAgo: '4 год тому', department: 'Служба дорожнього руху' },
  { id: 'kh5', title: 'Зруйновані лавки в парку', description: 'Вандали пошкодили лавки у парку Перемоги', category: 'infrastructure', status: 'new', priority: 'low', location: 'Парк Перемоги, алея 2', lat: 49.43241, lng: 27.00892, complaintsCount: 5, timeAgo: '6 год тому', department: 'ЖКГ' },
  { id: 'kh6', title: 'Ліквідовано аварію водопроводу ✅', description: 'Аварія на водопроводі успішно ліквідована', category: 'utility', status: 'resolved', priority: 'low', location: 'вул. Заводська, 9', lat: 49.40782, lng: 26.97215, complaintsCount: 12, timeAgo: '8 год тому', department: 'Хмельниціводоканал', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop' },
  { id: 'kh7', title: 'Провалля дороги після дощів', description: 'Утворилась глибока яма після сильних дощів', category: 'transport', status: 'processing', priority: 'critical', location: 'вул. Кам\'янецька, 33', lat: 49.41562, lng: 27.00634, complaintsCount: 17, timeAgo: '30 хв тому', department: 'Служба доріг' },
  { id: 'kh8', title: 'Забруднення струмка Плоскенька', description: 'Виявлено скид стічних вод у струмок', category: 'ecology', status: 'processing', priority: 'high', location: 'р. Плоскенька, парковий міст', lat: 49.43587, lng: 26.98782, complaintsCount: 10, timeAgo: '50 хв тому', department: 'Екологічна служба' },
  { id: 'kh9', title: 'Не вивозиться сміття у мікрорайоні', description: 'Контейнери переповнені понад тиждень', category: 'ecology', status: 'new', priority: 'medium', location: 'вул. Свободи, 102', lat: 49.42891, lng: 26.98214, complaintsCount: 9, timeAgo: '1 год тому', department: 'КП Спецкомунтранс' },
  { id: 'kh10', title: 'Розбите скло на дитячому майданчику', description: 'Виявлено розбите скло, небезпечно для дітей', category: 'infrastructure', status: 'new', priority: 'high', location: 'вул. Зарічанська, 18', lat: 49.42153, lng: 27.01298, complaintsCount: 6, timeAgo: '15 хв тому', department: 'ЖКГ' },
  { id: 'kh11', title: 'Не працює світлофор на розв\'язці', description: 'Світлофор вимкнено, ускладнений рух транспорту', category: 'transport', status: 'processing', priority: 'high', location: 'вул. Соборна / Театральна', lat: 49.42035, lng: 26.98657, complaintsCount: 11, timeAgo: '22 хв тому', department: 'Служба дорожнього руху' },
  { id: 'kh12', title: 'Несправний світлофор', description: 'Мигає жовтий на жвавому перехресті', category: 'transport', status: 'new', priority: 'medium', location: 'вул. Кам\'янецька / Подільська', lat: 49.4212, lng: 26.9895, complaintsCount: 8, timeAgo: '5 хв тому', department: 'Служба доріг' },
  { id: 'kh13', title: 'Розкидане сміття біля річки', description: 'Купа сміття у парку ім. Чекмана біля берега', category: 'ecology', status: 'new', priority: 'low', location: 'парк ім. Чекмана', lat: 49.4285, lng: 26.9752, complaintsCount: 3, timeAgo: '14 хв тому', department: 'КП Парки міста' },
  { id: 'kh14', title: 'Відкритий каналізаційний люк', description: 'Люк відкритий посеред тротуару, небезпечно', category: 'critical', status: 'processing', priority: 'high', location: 'вул. Шевченка, 42', lat: 49.4255, lng: 27.0105, complaintsCount: 11, timeAgo: '20 хв тому', department: 'Хмельницькводоканал' },
  { id: 'kh15', title: 'Зламана вулична урна', description: 'Пошкоджено урну для сміття біля магазину', category: 'infrastructure', status: 'new', priority: 'low', location: 'вул. Проскурівського Підпілля, 18', lat: 49.4232, lng: 26.9921, complaintsCount: 2, timeAgo: '28 хв тому', department: 'КП Спецкомунтранс' },
  { id: 'kh16', title: 'Графіті на склі зупинки', description: 'Вандали обмалювали зупинку маркерами', category: 'infrastructure', status: 'new', priority: 'low', location: 'зупинка Філармонія', lat: 49.4182, lng: 26.9945, complaintsCount: 4, timeAgo: '33 хв тому', department: 'Муніципальна дружина' },
  { id: 'kh17', title: 'Глибока яма на дорозі', description: 'Яма у правому ряду біля оглядового колодязя', category: 'transport', status: 'processing', priority: 'medium', location: 'вул. Свободи, 88', lat: 49.4325, lng: 27.0092, complaintsCount: 6, timeAgo: '50 хв тому', department: 'Служба доріг' },
];

// ─── КИЇВ ──────────────────────────────────────────────────────────────
const KYIV_INCIDENTS: Incident[] = [
  { id: 'k1', title: 'Знеструмлення цілого кварталу', description: 'Підстанція вийшла з ладу, знеструмлено сотні квартир', category: 'critical', status: 'processing', priority: 'critical', location: 'просп. Оболонський, 45', lat: 50.50124, lng: 30.49812, complaintsCount: 500, timeAgo: '20 хв тому', department: 'ДТЕК' },
  { id: 'k2', title: 'Зсув ґрунту на схилі', description: 'Зсув ґрунту загрожує будинкам на схилі', category: 'critical', status: 'processing', priority: 'critical', location: 'Андріївський узвіз, 15', lat: 50.46102, lng: 30.51843, complaintsCount: 80, timeAgo: '1 год тому', department: 'ДСНС' },
  { id: 'k3', title: 'Прорив теплотраси', description: 'Гаряча вода затопила вулицю та підвали', category: 'utility', status: 'processing', priority: 'critical', location: 'вул. Інститутська, 8', lat: 50.44531, lng: 30.52901, complaintsCount: 45, timeAgo: '35 хв тому', department: 'Київтеплоенерго' },
  { id: 'k4', title: 'Незаконне паркування на тротуарі', description: 'Авто заблокували прохід для пішоходів', category: 'transport', status: 'new', priority: 'medium', location: 'вул. Хрещатик, 22', lat: 50.44802, lng: 30.52389, complaintsCount: 15, timeAgo: '2 год тому', department: 'Муніципальна варта' },
  { id: 'k5', title: 'Пошкоджено фонтан у парку', description: 'Фонтан не працює, вода вилилась на доріжки', category: 'infrastructure', status: 'new', priority: 'low', location: 'Гідропарк, алея 4', lat: 50.44891, lng: 30.57402, complaintsCount: 7, timeAgo: '3 год тому', department: 'КП Київзеленбуд' },
  { id: 'k6', title: 'Дим з підземного колектора', description: 'З каналізаційного колектора йде дим', category: 'ecology', status: 'processing', priority: 'high', location: 'вул. Саксаганського, 61', lat: 50.43792, lng: 30.51287, complaintsCount: 22, timeAgo: '50 хв тому', department: 'Екологічна служба' },
  { id: 'k7', title: 'Аварія на Бориспільській трасі', description: 'ДТП заблокувало рух, затор на кілька кілометрів', category: 'transport', status: 'processing', priority: 'high', location: 'Бориспільське шосе, 24 км', lat: 50.39812, lng: 30.63541, complaintsCount: 200, timeAgo: '15 хв тому', department: 'Патрульна поліція' },
  { id: 'k8', title: 'Ліквідовано прорив каналізації ✅', description: 'Аварія успішно ліквідована бригадою', category: 'utility', status: 'resolved', priority: 'low', location: 'вул. Голосіївська, 7', lat: 50.39876, lng: 30.51982, complaintsCount: 18, timeAgo: '6 год тому', department: 'Київводоканал', beforePhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop' },
  { id: 'k9', title: 'Відновлено освітлення Майдану ✅', description: 'Всі ліхтарі відновлено після планового ремонту', category: 'infrastructure', status: 'resolved', priority: 'low', location: 'Майдан Незалежності', lat: 50.45012, lng: 30.52398, complaintsCount: 5, timeAgo: '12 год тому', department: 'КП Міськсвітло', beforePhoto: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop', afterPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop' },
  { id: 'k10', title: 'Провалля дорожнього покриття', description: 'Утворилась глибока яма на проспекті', category: 'transport', status: 'new', priority: 'critical', location: 'просп. Перемоги, 67', lat: 50.45689, lng: 30.44521, complaintsCount: 28, timeAgo: '10 хв тому', department: 'Служба доріг' },
  { id: 'k11', title: 'Забруднення Дніпра поблизу мосту', description: 'Плівка на воді, підозра на розлив нафтопродуктів', category: 'ecology', status: 'processing', priority: 'critical', location: 'Наб. Дніпровська, Рибальський міст', lat: 50.47123, lng: 30.53421, complaintsCount: 34, timeAgo: '40 хв тому', department: 'Екологічна служба' },
  { id: 'k12', title: 'Не працює ескалатор у переході', description: 'Ескалатор в підземному переході не функціонує', category: 'infrastructure', status: 'new', priority: 'medium', location: 'вул. Богдана Хмельницького, 4', lat: 50.44562, lng: 30.51823, complaintsCount: 9, timeAgo: '1 год тому', department: 'КП Київпастранс' },
  { id: 'k13', title: 'Не світить ліхтар у дворі', description: 'Перегоріла лампа біля першого під\'їзду', category: 'infrastructure', status: 'new', priority: 'low', location: 'просп. Правди, 64', lat: 50.5058, lng: 30.4282, complaintsCount: 2, timeAgo: '9 хв тому', department: 'Київміськсвітло' },
  { id: 'k14', title: 'Сміття на Пейзажній алеї', description: 'Купа порожніх пляшок та пластику на оглядовому майданчику', category: 'ecology', status: 'new', priority: 'low', location: 'Пейзажна алея', lat: 50.4562, lng: 30.5152, complaintsCount: 4, timeAgo: '15 хв тому', department: 'Київзеленбуд' },
  { id: 'k15', title: 'Вибоїна на проїжджій частині мосту', description: 'Глибока вибоїна у середній смузі руху', category: 'transport', status: 'processing', priority: 'medium', location: 'Північний міст', lat: 50.4905, lng: 30.5521, complaintsCount: 7, timeAgo: '24 хв тому', department: 'Київавтодор' },
  { id: 'k16', title: 'Пошкоджено паркувальний стовпчик', description: 'Паркувальний стовпчик вибитий з асфальту, заважає проходу', category: 'infrastructure', status: 'new', priority: 'low', location: 'вул. Ярославів Вал, 18', lat: 50.4512, lng: 30.5098, complaintsCount: 3, timeAgo: '32 хв тому', department: 'Київтранспарксервіс' },
  { id: 'k17', title: 'Будівельний шум у нічний час', description: 'Шум від бетономішалок на сусідньому будівництві після 23:00', category: 'infrastructure', status: 'new', priority: 'medium', location: 'вул. Глибочицька, 43', lat: 50.4615, lng: 30.4852, complaintsCount: 9, timeAgo: '38 хв тому', department: 'Благоустрій КМДА' },
  { id: 'k18', title: 'Зламана велика гілка на газоні', description: 'Велике гілля відчахнулося від вітру та лежить посеред алеї', category: 'ecology', status: 'processing', priority: 'low', location: 'Маріїнський парк', lat: 50.4468, lng: 30.5385, complaintsCount: 2, timeAgo: '55 хв тому', department: 'Київзеленбуд' },
];

export const CITY_INCIDENTS: Record<string, Incident[]> = {
  vinnytsia: VINNYTSIA_INCIDENTS,
  zhytomyr: ZHYTOMYR_INCIDENTS,
  khmelnytskyi: KHMELNYTSKYI_INCIDENTS,
  kyiv: KYIV_INCIDENTS,
};

// backward compat
export const INCIDENTS = VINNYTSIA_INCIDENTS;
