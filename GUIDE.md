# Blanka MVP — Полный гайд

## 1. SUPABASE — База данных

**Создать проект:**
- supabase.com → New project → записать URL и anon key

**SQL — создать таблицы** (SQL Editor → вставить → Run):
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('worker', 'manager'))
);

CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES profiles(id),
  location TEXT,
  status TEXT DEFAULT 'upcoming',
  scheduled_start TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  photo_url TEXT,
  voice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
```

**SQL — политики доступа:**
```sql
-- Профили
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Смены (worker)
CREATE POLICY "Workers see own shifts" ON shifts
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Workers can insert own shifts" ON shifts
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can update own shifts" ON shifts
  FOR UPDATE TO authenticated
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

-- Смены (manager)
CREATE POLICY "Managers can view all shifts" ON shifts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager')
  );
```

**SQL — Storage bucket:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('shift-photos', 'shift-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shift-photos');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'shift-photos');
```

**Supabase настройки:**
- Authentication → Settings → выключить "Confirm email"

---

## 2. GITHUB — Репозиторий

**SSH ключ:**
```bash
ssh-keygen -t ed25519 -C "твой@email.com"
cat ~/.ssh/id_ed25519.pub | pbcopy
```
→ GitHub → Settings → SSH keys → New SSH key → вставить

**Проверить:**
```bash
ssh -T git@github.com
# должно: Hi username!
```

**Создать репозиторий на GitHub**, потом:
```bash
git init
git remote add origin git@github.com:username/blanka.git
git push -u origin main
```

---

## 3. NEXT.JS — Проект

**Создать:**
```bash
npx create-next-app@latest blanka --typescript --tailwind --app
cd blanka
```

**Установить пакеты:**
```bash
npm install @supabase/supabase-js @supabase/ssr
npx shadcn@latest init
```

**Файл `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
```bash
echo ".env.local" >> .gitignore
```

---

## 4. СТРУКТУРА ФАЙЛОВ

```
blanka/
├── app/
│   ├── page.tsx          # Landing page
│   ├── login/page.tsx    # Логин
│   ├── signup/page.tsx   # Регистрация
│   ├── worker/page.tsx   # Worker Dashboard
│   └── manager/page.tsx  # Manager Dashboard
├── components/
│   └── BlankaLogo.tsx    # Логотип (Sparkles из lucide)
├── lib/supabase/
│   ├── client.ts         # Browser client
│   └── server.ts         # Server client
├── middleware.ts          # Защита роутов
├── __tests__/
│   └── shifts.test.ts    # Тесты
└── .github/workflows/
    └── ci.yml            # CI/CD
```

**`lib/supabase/client.ts`:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## 5. КЛЮЧЕВАЯ ЛОГИКА

**Signup** → создать пользователя → вставить в `profiles` с ролью

**Login** → проверить роль → редирект на `/worker` или `/manager`

**Check In** → `UPDATE shifts SET status='active', checked_in_at=now()`

**Check Out** → `UPDATE shifts SET status='done', checked_out_at=now()`

**Фото** → `supabase.storage.from('shift-photos').upload(path, file)`

**Голос** → `MediaRecorder` → `ondataavailable` → upload Blob

---

## 6. ТЕСТЫ

**Установить:**
```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

**`jest.config.js`:**
```javascript
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testMatch: ['**/__tests__/**/*.test.ts'],
}
module.exports = config
```

**`package.json`** → добавить скрипт:
```json
"test": "jest"
```

**Запустить:**
```bash
npm test
```

---

## 7. CI/CD — GitHub Actions

**`.github/workflows/ci.yml`:**
```yaml
name: CI
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

**GitHub → репозиторий → Settings → Secrets → Actions:**
- `NEXT_PUBLIC_SUPABASE_URL` = твой URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = твой ключ

**После каждого push** → Actions покажет зелёный ✓ или красный ✗

---

## 8. ЧАСТЫЕ ОШИБКИ

| Ошибка | Решение |
|--------|---------|
| `new row violates RLS` | Выключить "Confirm email" в Supabase Auth |
| `Bucket not found` | Создать bucket в Supabase → Storage |
| `column does not exist` | Запустить `ALTER TABLE ... ADD COLUMN` |
| `permission denied publickey` | Перекопировать SSH ключ через `pbcopy` |
| `ts-node required` | Переименовать `jest.config.ts` → `.js` |
