export type Section =
  | "dashboard"
  | "projects"
  | "gantt"
  | "chat"
  | "documents"
  | "photos"
  | "certificates"
  | "finance"
  | "services"
  | "notifications";

export const NAV_ITEMS: { id: Section; label: string; icon: string; badge?: number; roles?: string[] }[] = [
  { id: "dashboard", label: "Главная", icon: "LayoutDashboard" },
  { id: "projects", label: "Проекты", icon: "Building2", roles: ["manager", "head", "admin"] },
  { id: "gantt", label: "График", icon: "GanttChart" },
  { id: "chat", label: "Чат", icon: "MessageSquare", badge: 3 },
  { id: "documents", label: "Документы", icon: "FileText" },
  { id: "photos", label: "Фото", icon: "Camera" },
  { id: "certificates", label: "Сертификаты", icon: "Award" },
  { id: "finance", label: "Финансы", icon: "Wallet" },
  { id: "services", label: "Услуги", icon: "Wrench" },
  { id: "notifications", label: "Уведомления", icon: "Bell", badge: 5 },
];

export const GANTT_STAGES = [
  { id: 1, name: "Фундамент", start: 0, planDuration: 30, factDuration: 32, status: "done", color: "142,80%,50%" },
  { id: 2, name: "Стены и перекрытия", start: 30, planDuration: 45, factDuration: 40, status: "done", color: "142,80%,50%" },
  { id: 3, name: "Кровля", start: 75, planDuration: 20, factDuration: 18, status: "done", color: "142,80%,50%" },
  { id: 4, name: "Окна и двери", start: 90, planDuration: 15, factDuration: 12, status: "in-progress", color: "195,100%,50%" },
  { id: 5, name: "Инженерные сети", start: 100, planDuration: 30, factDuration: 0, status: "planned", color: "265,90%,65%" },
  { id: 6, name: "Отделка", start: 125, planDuration: 40, factDuration: 0, status: "planned", color: "265,90%,65%" },
  { id: 7, name: "Благоустройство", start: 160, planDuration: 20, factDuration: 0, status: "planned", color: "30,100%,55%" },
];

export const PAYMENTS = [
  { id: 1, name: "Фундамент — 1-й транш", amount: 850000, date: "15.01.2025", status: "paid" },
  { id: 2, name: "Фундамент — 2-й транш", amount: 420000, date: "28.02.2025", status: "paid" },
  { id: 3, name: "Стены и перекрытия", amount: 1200000, date: "20.03.2025", status: "paid" },
  { id: 4, name: "Кровля", amount: 680000, date: "05.04.2025", status: "paid" },
  { id: 5, name: "Окна и двери", amount: 320000, date: "30.04.2025", status: "upcoming" },
  { id: 6, name: "Инженерные сети", amount: 760000, date: "25.05.2025", status: "upcoming" },
  { id: 7, name: "Финальный платёж", amount: 1100000, date: "15.08.2025", status: "upcoming" },
];

export const DOCUMENTS = [
  { id: 1, name: "Договор строительного подряда", type: "Договор", date: "10.01.2025", size: "2.4 МБ" },
  { id: 2, name: "Проектная документация", type: "Проект", date: "10.01.2025", size: "18.7 МБ" },
  { id: 3, name: "Смета — Фундамент", type: "Смета", date: "15.01.2025", size: "1.2 МБ" },
  { id: 4, name: "Акт выполненных работ №1", type: "Акт", date: "28.02.2025", size: "0.8 МБ" },
  { id: 5, name: "Смета — Стены и перекрытия", type: "Смета", date: "01.03.2025", size: "1.5 МБ" },
  { id: 6, name: "Акт выполненных работ №2", type: "Акт", date: "20.03.2025", size: "0.9 МБ" },
];

export const CERTS = [
  { id: 1, name: "Цемент М500 — ГОСТ 31108-2020", material: "Цемент", vendor: "ЦемСнаб", date: "18.01.2025" },
  { id: 2, name: "Арматура А500С — ГОСТ 52544", material: "Арматура", vendor: "МеталлПром", date: "18.01.2025" },
  { id: 3, name: "Кирпич М150 — ГОСТ 530-2012", material: "Кирпич", vendor: "КерамзитЮг", date: "05.03.2025" },
  { id: 4, name: "Металлопрофиль Н75", material: "Кровля", vendor: "СтальПрофиль", date: "10.04.2025" },
];

export const NOTIFICATIONS = [
  { id: 1, text: "Завершён монтаж окон на 2-м этаже", time: "2 часа назад", type: "success", read: false },
  { id: 2, text: "Загружен акт выполненных работ №4", time: "5 часов назад", type: "info", read: false },
  { id: 3, text: "Платёж 320 000 ₽ ожидается 30 апреля", time: "1 день назад", type: "warning", read: false },
  { id: 4, text: "Прораб отправил фотоотчёт за неделю", time: "1 день назад", type: "info", read: false },
  { id: 5, text: "Загружены сертификаты на металлопрофиль", time: "2 дня назад", type: "success", read: false },
  { id: 6, text: "Совещание по проекту — 28 апреля в 14:00", time: "3 дня назад", type: "info", read: true },
  { id: 7, text: "Кровля завершена на 100%", time: "5 дней назад", type: "success", read: true },
];

export const SERVICES = [
  {
    stage: "Инженерные сети",
    items: [
      { name: "Тёплый пол — первый этаж", price: 85000, status: "new" },
      { name: "Умный дом базовый пакет", price: 120000, status: "new" },
      { name: "Резервный генератор 10 кВт", price: 95000, status: "accepted" },
    ],
  },
  {
    stage: "Отделка",
    items: [
      { name: "Штукатурка машинная", price: 180000, status: "new" },
      { name: "Шпаклёвка и покраска", price: 140000, status: "new" },
    ],
  },
  {
    stage: "Благоустройство",
    items: [
      { name: "Асфальтирование въезда", price: 65000, status: "new" },
      { name: "Ландшафтный дизайн базовый", price: 110000, status: "new" },
    ],
  },
];

export const CHAT_MESSAGES = [
  { id: 1, author: "Прораб Алексей", role: "foreman", text: "Добрый день! Завершили монтаж окон на первом этаже. Фото загрузил в раздел.", time: "09:15", avatar: "А" },
  { id: 2, author: "Вы", role: "client", text: "Отлично, спасибо! Когда планируете второй этаж?", time: "09:42", avatar: "В" },
  { id: 3, author: "Прораб Алексей", role: "foreman", text: "Второй этаж — завтра с утра. Ещё раз уточним по замерам вечером.", time: "09:45", avatar: "А" },
  { id: 4, author: "Менеджер Ирина", role: "manager", text: "Добавила счёт на оконный блок в документы. Можете ознакомиться.", time: "10:30", avatar: "И" },
  { id: 5, author: "Вы", role: "client", text: "Хорошо, посмотрю. Спасибо!", time: "10:55", avatar: "В" },
];

export function fmt(n: number) {
  return n >= 1000000
    ? `${(n / 1000000).toFixed(2)} млн ₽`
    : `${(n / 1000).toFixed(0)} тыс. ₽`;
}