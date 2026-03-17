# 에뮬레이터 Google 로그인 – 당신이 할 일 (자세한 순서)

아래 순서대로 **한 번만** 하면 됩니다. 이미 되어 있는 것은 건너뛰고, 없는 것만 하면 됩니다.

---

## 1. GitHub에 코드 푸시

1. 터미널(또는 Cursor 터미널)을 연다.
2. 프로젝트 폴더로 이동:
   ```bash
   cd c:\Users\MSI\Desktop\Web3star-1
   ```
3. 변경사항 스테이징:
   ```bash
   git add .
   ```
4. 커밋:
   ```bash
   git commit -m "Add OAuth callback and GitHub Pages workflow"
   ```
5. GitHub에 푸시 (원격 이름/브랜치가 다르면 해당 이름으로):
   ```bash
   git push origin main
   ```
   - 브랜치가 `master`면: `git push origin master`
   - 처음 푸시면 `git push -u origin main` 해도 됨.

---

## 2. GitHub Pages 켜기 (Source를 GitHub Actions로)

1. 브라우저에서 **https://github.com/leejungsuk2023/Web3star** 로 간다.
2. 저장소 페이지에서 위쪽 메뉴 **Settings** 를 클릭한다.
3. 왼쪽 사이드바에서 **Pages** 를 클릭한다. (Code and automation 아래)
4. **Build and deployment** 섹션에서:
   - **Source** 드롭다운을 클릭한다.
   - 목록에서 **GitHub Actions** 를 선택한다.
5. 별도로 **Save** 버튼이 있으면 눌러 저장한다.
   - (이미 GitHub Actions로 되어 있으면 그대로 둔다.)

---

## 3. OAuth 콜백 페이지 배포 (워크플로 실행)

1. 같은 저장소에서 위쪽 메뉴 **Actions** 를 클릭한다.
2. 왼쪽에서 **Deploy OAuth callback to GitHub Pages** 워크플로를 클릭한다.
3. 오른쪽 **Run workflow** 버튼을 클릭한다.
4. **Run workflow** 드롭다운이 다시 나오면 한 번 더 클릭해서 실행한다.
5. 맨 위에 “Workflow run”이 생기면 클릭해서 들어간다.
6. **deploy** 잡이 녹색 체크로 끝날 때까지 기다린다 (1~2분 정도).
7. 배포가 끝나면 아래 주소로 접속했을 때 “로그인 중…” 같은 글이 보여야 한다:
   - **https://leejungsuk2023.github.io/Web3star/oauth-callback.html**
   - 브라우저에서 위 주소 열어서 확인한다.

---

## 4. .env.local 확인 (이미 되어 있으면 스킵)

1. 프로젝트 루트의 **`.env.local`** 파일을 연다.
2. 아래 줄이 **정확히** 있는지 확인한다 (앞에 `#` 없이):
   ```
   VITE_OAUTH_CALLBACK_URL=https://leejungsuk2023.github.io/Web3star/oauth-callback.html
   ```
3. 없으면 파일 맨 아래에 한 줄로 붙여넣고 저장한다.
4. 이미 있으면 수정하지 않는다.

---

## 5. Supabase Redirect URL 추가

1. 브라우저에서 **https://supabase.com/dashboard** 로 간다.
2. 로그인한 뒤, 사용 중인 프로젝트(예: imlmvqpbjuznvprwhkkz)를 클릭해 연다.
3. 왼쪽 메뉴에서 **Authentication** 을 클릭한다.
4. **Authentication** 아래에서 **URL Configuration** 을 클릭한다.
5. **Redirect URLs** 섹션을 찾는다.
6. **Add URL** 또는 입력 칸에 아래 주소를 **그대로** 붙여넣는다:
   ```
   https://leejungsuk2023.github.io/Web3star/oauth-callback.html
   ```
7. **Save** 버튼이 있으면 눌러 저장한다.
8. 목록에 위 URL이 보이면 완료.

---

## 6. 앱 빌드·동기화 (이미 했으면 스킵)

1. 터미널에서 프로젝트 폴더로 이동:
   ```bash
   cd c:\Users\MSI\Desktop\Web3star-1
   ```
2. 웹 빌드:
   ```bash
   npm run build
   ```
3. Android에 반영:
   ```bash
   npx cap sync
   ```
4. 에러 없이 끝나면 다음 단계로.

---

## 7. 에뮬레이터에서 앱 실행 및 Google 로그인 테스트

1. **Android Studio**를 연다.
2. **File → Open** 에서 **`c:\Users\MSI\Desktop\Web3star-1\android`** 폴더를 선택해 연다.
   - 반드시 **Web3star-1\android** 이어야 하고, 상위 Web3star-1만 열면 안 됨.
3. 에뮬레이터를 선택한 뒤 **Run (▶)** 버튼으로 앱을 실행한다.
4. 앱에서 **Google 로그인** 버튼을 누른다.
5. 앱 안 WebView에서 Google 계정 선택·로그인까지 진행한다.
6. 로그인 후:
   - **https://leejungsuk2023.github.io/Web3star/oauth-callback.html** 로 리다이렉트되고
   - 곧바로 앱으로 돌아와 로그인된 화면이 보이면 성공.

---

## 정리 체크리스트

- [ ] 1. `git add .` → `git commit` → `git push origin main` (또는 사용 중인 브랜치)
- [ ] 2. GitHub 저장소 **Settings → Pages** → Source: **GitHub Actions**
- [ ] 3. **Actions** → **Deploy OAuth callback to GitHub Pages** → **Run workflow** → 완료될 때까지 대기
- [ ] 4. `.env.local` 에 `VITE_OAUTH_CALLBACK_URL=https://leejungsuk2023.github.io/Web3star/oauth-callback.html` 있는지 확인
- [ ] 5. Supabase **Authentication → URL Configuration → Redirect URLs** 에 위 URL 추가 후 저장
- [ ] 6. `npm run build` → `npx cap sync` (필요할 때만)
- [ ] 7. Android Studio에서 **android** 폴더 열고 에뮬레이터 Run → 앱에서 Google 로그인 테스트

위 순서대로 하면 에뮬레이터에서도 Google 로그인이 동작합니다.
