'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Locale = 'en' | 'de' | 'ru' | 'uk' | 'be' | 'pl' | 'tr'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'be', label: 'Беларуская', flag: '🇧🇾' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
]

type Messages = {
  loading: string
  signOut: string
  signIn: string
  signUp: string
  email: string
  password: string
  fullName: string
  role: string
  worker: string
  manager: string
  noAccount: string
  haveAccount: string
  createAccount: string
  signingIn: string
  creatingAccount: string
  passwordHint: string
  appTagline: string
  // Manager
  allWorkers: string
  tabActive: string
  tabUpcoming: string
  tabArchive: string
  newShift: string
  refresh: string
  lastUpdated: string
  noShifts: string
  newerFirst: string
  olderFirst: string
  deleteShift: string
  deleteConfirm: string
  deleteDoneError: string
  createShift: string
  cancel: string
  location: string
  date: string
  time: string
  fillAllFields: string
  saving: string
  checkedIn: string
  checkedOut: string
  duration: string
  minutes: string
  photo: string
  voice: string
  scheduled: string
  // Worker
  yourShift: string
  checkIn: string
  checkOut: string
  uploadPhoto: string
  recordVoice: string
  noShiftsToday: string
  today: string
  status: string
  upcoming: string
  active: string
  done: string
  cancelled: string
}

const translations: Record<Locale, Messages> = {
  en: {
    loading: 'Loading...',
    signOut: 'Sign out',
    signIn: 'Sign in',
    signUp: 'Sign up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    role: 'Role',
    worker: 'Worker',
    manager: 'Manager',
    noAccount: 'No account?',
    haveAccount: 'Already have an account?',
    createAccount: 'Create account',
    signingIn: 'Signing in...',
    creatingAccount: 'Creating account...',
    passwordHint: 'Password (min. 6 characters)',
    appTagline: 'Sign in to your account',
    allWorkers: 'All workers, all shifts — real-time overview.',
    tabActive: 'Active',
    tabUpcoming: 'Upcoming',
    tabArchive: 'Archive',
    newShift: 'New Shift',
    refresh: 'Refresh',
    lastUpdated: 'Updated',
    noShifts: 'No shifts',
    newerFirst: 'Newer first',
    olderFirst: 'Older first',
    deleteShift: 'Delete shift',
    deleteConfirm: 'Delete this shift?',
    deleteDoneError: 'Done shifts are kept as archive and cannot be deleted.',
    createShift: 'Create Shift',
    cancel: 'Cancel',
    location: 'Location',
    date: 'Date',
    time: 'Time',
    fillAllFields: 'Please fill in all fields',
    saving: 'Saving...',
    checkedIn: 'Checked in',
    checkedOut: 'Checked out',
    duration: 'Duration',
    minutes: 'min',
    photo: 'Photo',
    voice: 'Voice',
    scheduled: 'Scheduled',
    yourShift: 'Your shift',
    checkIn: 'Check in',
    checkOut: 'Check out',
    uploadPhoto: 'Upload photo',
    recordVoice: 'Record voice',
    noShiftsToday: 'No shifts scheduled',
    today: 'Today',
    status: 'Status',
    upcoming: 'Upcoming',
    active: 'Active',
    done: 'Done',
    cancelled: 'Cancelled',
  },
  de: {
    loading: 'Wird geladen...',
    signOut: 'Abmelden',
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    fullName: 'Vollständiger Name',
    role: 'Rolle',
    worker: 'Mitarbeiter',
    manager: 'Manager',
    noAccount: 'Noch kein Konto?',
    haveAccount: 'Bereits ein Konto?',
    createAccount: 'Konto erstellen',
    signingIn: 'Wird angemeldet...',
    creatingAccount: 'Konto wird erstellt...',
    passwordHint: 'Passwort (min. 6 Zeichen)',
    appTagline: 'Bei Ihrem Konto anmelden',
    allWorkers: 'Alle Mitarbeiter, alle Schichten — Echtzeit-Übersicht.',
    tabActive: 'Aktiv',
    tabUpcoming: 'Geplant',
    tabArchive: 'Archiv',
    newShift: 'Neue Schicht',
    refresh: 'Aktualisieren',
    lastUpdated: 'Aktualisiert',
    noShifts: 'Keine Schichten',
    newerFirst: 'Neueste zuerst',
    olderFirst: 'Älteste zuerst',
    deleteShift: 'Schicht löschen',
    deleteConfirm: 'Diese Schicht löschen?',
    deleteDoneError: 'Abgeschlossene Schichten werden als Archiv gespeichert und können nicht gelöscht werden.',
    createShift: 'Schicht erstellen',
    cancel: 'Abbrechen',
    location: 'Ort',
    date: 'Datum',
    time: 'Uhrzeit',
    fillAllFields: 'Bitte alle Felder ausfüllen',
    saving: 'Wird gespeichert...',
    checkedIn: 'Eingecheckt',
    checkedOut: 'Ausgecheckt',
    duration: 'Dauer',
    minutes: 'Min',
    photo: 'Foto',
    voice: 'Sprachnotiz',
    scheduled: 'Geplant',
    yourShift: 'Ihre Schicht',
    checkIn: 'Einchecken',
    checkOut: 'Auschecken',
    uploadPhoto: 'Foto hochladen',
    recordVoice: 'Sprachnotiz aufnehmen',
    noShiftsToday: 'Keine Schichten geplant',
    today: 'Heute',
    status: 'Status',
    upcoming: 'Geplant',
    active: 'Aktiv',
    done: 'Abgeschlossen',
    cancelled: 'Storniert',
  },
  ru: {
    loading: 'Загрузка...',
    signOut: 'Выйти',
    signIn: 'Войти',
    signUp: 'Регистрация',
    email: 'Эл. почта',
    password: 'Пароль',
    fullName: 'Полное имя',
    role: 'Роль',
    worker: 'Сотрудник',
    manager: 'Менеджер',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    createAccount: 'Создать аккаунт',
    signingIn: 'Вход...',
    creatingAccount: 'Создание аккаунта...',
    passwordHint: 'Пароль (мин. 6 символов)',
    appTagline: 'Войдите в аккаунт',
    allWorkers: 'Все сотрудники, все смены — обзор в реальном времени.',
    tabActive: 'Активные',
    tabUpcoming: 'Предстоящие',
    tabArchive: 'Архив',
    newShift: 'Новая смена',
    refresh: 'Обновить',
    lastUpdated: 'Обновлено',
    noShifts: 'Нет смен',
    newerFirst: 'Сначала новые',
    olderFirst: 'Сначала старые',
    deleteShift: 'Удалить смену',
    deleteConfirm: 'Удалить эту смену?',
    deleteDoneError: 'Завершённые смены хранятся в архиве и не могут быть удалены.',
    createShift: 'Создать смену',
    cancel: 'Отмена',
    location: 'Адрес',
    date: 'Дата',
    time: 'Время',
    fillAllFields: 'Заполните все поля',
    saving: 'Сохранение...',
    checkedIn: 'Начало',
    checkedOut: 'Конец',
    duration: 'Длительность',
    minutes: 'мин',
    photo: 'Фото',
    voice: 'Голос',
    scheduled: 'Запланировано',
    yourShift: 'Ваша смена',
    checkIn: 'Начать смену',
    checkOut: 'Завершить смену',
    uploadPhoto: 'Загрузить фото',
    recordVoice: 'Записать голос',
    noShiftsToday: 'Нет запланированных смен',
    today: 'Сегодня',
    status: 'Статус',
    upcoming: 'Предстоит',
    active: 'Активна',
    done: 'Завершена',
    cancelled: 'Отменена',
  },
  uk: {
    loading: 'Завантаження...',
    signOut: 'Вийти',
    signIn: 'Увійти',
    signUp: 'Реєстрація',
    email: 'Ел. пошта',
    password: 'Пароль',
    fullName: 'Повне ім\'я',
    role: 'Роль',
    worker: 'Працівник',
    manager: 'Менеджер',
    noAccount: 'Немає акаунту?',
    haveAccount: 'Вже є акаунт?',
    createAccount: 'Створити акаунт',
    signingIn: 'Вхід...',
    creatingAccount: 'Створення акаунту...',
    passwordHint: 'Пароль (мін. 6 символів)',
    appTagline: 'Увійдіть до акаунту',
    allWorkers: 'Всі працівники, всі зміни — огляд у реальному часі.',
    tabActive: 'Активні',
    tabUpcoming: 'Заплановані',
    tabArchive: 'Архів',
    newShift: 'Нова зміна',
    refresh: 'Оновити',
    lastUpdated: 'Оновлено',
    noShifts: 'Немає змін',
    newerFirst: 'Спочатку нові',
    olderFirst: 'Спочатку старі',
    deleteShift: 'Видалити зміну',
    deleteConfirm: 'Видалити цю зміну?',
    deleteDoneError: 'Завершені зміни зберігаються в архіві і не можуть бути видалені.',
    createShift: 'Створити зміну',
    cancel: 'Скасувати',
    location: 'Адреса',
    date: 'Дата',
    time: 'Час',
    fillAllFields: 'Заповніть всі поля',
    saving: 'Збереження...',
    checkedIn: 'Початок',
    checkedOut: 'Кінець',
    duration: 'Тривалість',
    minutes: 'хв',
    photo: 'Фото',
    voice: 'Голос',
    scheduled: 'Заплановано',
    yourShift: 'Ваша зміна',
    checkIn: 'Почати зміну',
    checkOut: 'Завершити зміну',
    uploadPhoto: 'Завантажити фото',
    recordVoice: 'Записати голос',
    noShiftsToday: 'Немає запланованих змін',
    today: 'Сьогодні',
    status: 'Статус',
    upcoming: 'Заплановано',
    active: 'Активна',
    done: 'Завершена',
    cancelled: 'Скасована',
  },
  be: {
    loading: 'Загрузка...',
    signOut: 'Выйсці',
    signIn: 'Увайсці',
    signUp: 'Рэгістрацыя',
    email: 'Эл. пошта',
    password: 'Пароль',
    fullName: 'Поўнае імя',
    role: 'Роля',
    worker: 'Супрацоўнік',
    manager: 'Менеджар',
    noAccount: 'Няма акаўнта?',
    haveAccount: 'Ужо ёсць акаўнт?',
    createAccount: 'Стварыць акаўнт',
    signingIn: 'Уваход...',
    creatingAccount: 'Стварэнне акаўнта...',
    passwordHint: 'Пароль (мін. 6 сімвалаў)',
    appTagline: 'Увайдзіце ў акаўнт',
    allWorkers: 'Усе супрацоўнікі, усе змены — агляд у рэальным часе.',
    tabActive: 'Актыўныя',
    tabUpcoming: 'Запланаваныя',
    tabArchive: 'Архіў',
    newShift: 'Новая змена',
    refresh: 'Абнавіць',
    lastUpdated: 'Абноўлена',
    noShifts: 'Няма змен',
    newerFirst: 'Спачатку новыя',
    olderFirst: 'Спачатку старыя',
    deleteShift: 'Выдаліць змену',
    deleteConfirm: 'Выдаліць гэтую змену?',
    deleteDoneError: 'Завершаныя змены захоўваюцца ў архіве і не могуць быць выдалены.',
    createShift: 'Стварыць змену',
    cancel: 'Адмена',
    location: 'Адрас',
    date: 'Дата',
    time: 'Час',
    fillAllFields: 'Запоўніце ўсе палі',
    saving: 'Захаванне...',
    checkedIn: 'Пачатак',
    checkedOut: 'Канец',
    duration: 'Працягласць',
    minutes: 'хв',
    photo: 'Фота',
    voice: 'Голас',
    scheduled: 'Запланавана',
    yourShift: 'Ваша змена',
    checkIn: 'Пачаць змену',
    checkOut: 'Завяршыць змену',
    uploadPhoto: 'Загрузіць фота',
    recordVoice: 'Запісаць голас',
    noShiftsToday: 'Няма запланаваных змен',
    today: 'Сёння',
    status: 'Статус',
    upcoming: 'Запланавана',
    active: 'Актыўная',
    done: 'Завершана',
    cancelled: 'Адменена',
  },
  pl: {
    loading: 'Ładowanie...',
    signOut: 'Wyloguj',
    signIn: 'Zaloguj się',
    signUp: 'Zarejestruj się',
    email: 'E-mail',
    password: 'Hasło',
    fullName: 'Imię i nazwisko',
    role: 'Rola',
    worker: 'Pracownik',
    manager: 'Kierownik',
    noAccount: 'Nie masz konta?',
    haveAccount: 'Masz już konto?',
    createAccount: 'Utwórz konto',
    signingIn: 'Logowanie...',
    creatingAccount: 'Tworzenie konta...',
    passwordHint: 'Hasło (min. 6 znaków)',
    appTagline: 'Zaloguj się do konta',
    allWorkers: 'Wszyscy pracownicy, wszystkie zmiany — przegląd w czasie rzeczywistym.',
    tabActive: 'Aktywne',
    tabUpcoming: 'Nadchodzące',
    tabArchive: 'Archiwum',
    newShift: 'Nowa zmiana',
    refresh: 'Odśwież',
    lastUpdated: 'Zaktualizowano',
    noShifts: 'Brak zmian',
    newerFirst: 'Najpierw nowsze',
    olderFirst: 'Najpierw starsze',
    deleteShift: 'Usuń zmianę',
    deleteConfirm: 'Usunąć tę zmianę?',
    deleteDoneError: 'Zakończone zmiany są przechowywane jako archiwum i nie można ich usunąć.',
    createShift: 'Utwórz zmianę',
    cancel: 'Anuluj',
    location: 'Lokalizacja',
    date: 'Data',
    time: 'Godzina',
    fillAllFields: 'Proszę wypełnić wszystkie pola',
    saving: 'Zapisywanie...',
    checkedIn: 'Zameldowanie',
    checkedOut: 'Wymeldowanie',
    duration: 'Czas trwania',
    minutes: 'min',
    photo: 'Zdjęcie',
    voice: 'Głos',
    scheduled: 'Zaplanowano',
    yourShift: 'Twoja zmiana',
    checkIn: 'Zamelduj się',
    checkOut: 'Wymelduj się',
    uploadPhoto: 'Prześlij zdjęcie',
    recordVoice: 'Nagraj głos',
    noShiftsToday: 'Brak zaplanowanych zmian',
    today: 'Dzisiaj',
    status: 'Status',
    upcoming: 'Nadchodzące',
    active: 'Aktywna',
    done: 'Zakończona',
    cancelled: 'Anulowana',
  },
  tr: {
    loading: 'Yükleniyor...',
    signOut: 'Çıkış yap',
    signIn: 'Giriş yap',
    signUp: 'Kayıt ol',
    email: 'E-posta',
    password: 'Şifre',
    fullName: 'Ad Soyad',
    role: 'Rol',
    worker: 'Çalışan',
    manager: 'Yönetici',
    noAccount: 'Hesabınız yok mu?',
    haveAccount: 'Zaten hesabınız var mı?',
    createAccount: 'Hesap oluştur',
    signingIn: 'Giriş yapılıyor...',
    creatingAccount: 'Hesap oluşturuluyor...',
    passwordHint: 'Şifre (en az 6 karakter)',
    appTagline: 'Hesabınıza giriş yapın',
    allWorkers: 'Tüm çalışanlar, tüm vardiyalar — gerçek zamanlı genel bakış.',
    tabActive: 'Aktif',
    tabUpcoming: 'Yaklaşan',
    tabArchive: 'Arşiv',
    newShift: 'Yeni Vardiya',
    refresh: 'Yenile',
    lastUpdated: 'Güncellendi',
    noShifts: 'Vardiya yok',
    newerFirst: 'Önce yeni',
    olderFirst: 'Önce eski',
    deleteShift: 'Vardiyayı sil',
    deleteConfirm: 'Bu vardiyayı sil?',
    deleteDoneError: 'Tamamlanan vardiyalar arşiv olarak saklanır ve silinemez.',
    createShift: 'Vardiya oluştur',
    cancel: 'İptal',
    location: 'Konum',
    date: 'Tarih',
    time: 'Saat',
    fillAllFields: 'Lütfen tüm alanları doldurun',
    saving: 'Kaydediliyor...',
    checkedIn: 'Giriş',
    checkedOut: 'Çıkış',
    duration: 'Süre',
    minutes: 'dk',
    photo: 'Fotoğraf',
    voice: 'Ses',
    scheduled: 'Planlandı',
    yourShift: 'Vardiyanz',
    checkIn: 'Vardiyaya başla',
    checkOut: 'Vardiyayı bitir',
    uploadPhoto: 'Fotoğraf yükle',
    recordVoice: 'Ses kaydet',
    noShiftsToday: 'Planlanmış vardiya yok',
    today: 'Bugün',
    status: 'Durum',
    upcoming: 'Yaklaşan',
    active: 'Aktif',
    done: 'Tamamlandı',
    cancelled: 'İptal edildi',
  },
}

type LangContext = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Messages
}

const LanguageContext = createContext<LangContext>({
  locale: 'en',
  setLocale: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('blanka_locale') as Locale | null
    if (saved && translations[saved]) setLocaleState(saved)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('blanka_locale', l)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
