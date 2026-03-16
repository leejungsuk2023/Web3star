# CHANGELOG

> 디버그 에이전트가 `docs/REVIEW.md` 기반으로 수정한 내역

---

## 2026-03-01 — 디버그 에이전트 수정 (v0.0.2)

### Critical Fixes

#### 1. 변수 섀도잉 수정 (BUG-006)
- **파일:** `src/app/pages/Login.tsx`, `src/app/pages/Signup.tsx`
- **문제:** `const { error }` 구조 분해가 `useState`의 `error` 상태 변수를 섀도잉
- **수정:** `error` → `authError` / `oauthError`로 이름 변경
- **이유:** 향후 함수 내부에서 상태 error 참조 시 의도치 않은 동작 방지

#### 2. 채굴 포인트 레이스 컨디션 완화 (BUG-001)
- **파일:** `src/app/pages/Home.tsx:87-100`
- **문제:** `(profile?.point ?? 0) + totalReward`로 캐시된 클라이언트 값 사용. 동시 접속 시 포인트 손실 가능
- **수정:** 채굴 직전 DB에서 최신 `point` 값을 재조회한 후 업데이트
- **이유:** 클라이언트 캐시값 대신 DB 최신값을 기반으로 계산하여 데이터 손실 최소화
- **추가 권장:** Supabase RPC로 `point = point + N` 원자적 증가 구현 필요 (서버 측)

#### 3. setTimeout + async 제거 (SEC-004 관련)
- **파일:** `src/app/pages/Home.tsx:135-155`
- **문제:** `handleWatchAd`에서 `setTimeout(async () => {...}, 500)` 패턴 사용. 비동기 에러 미처리, 컴포넌트 언마운트 후 상태 업데이트 가능
- **수정:** `setTimeout` 제거, 직접 `async/await` 호출로 변경
- **이유:** 메모리 누수 방지, 에러 전파 정상화

---

### Medium Fixes

#### 4. 환경변수 검증 추가 (새 항목)
- **파일:** `src/lib/supabase.ts`
- **문제:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 누락 시 불명확한 에러
- **수정:** `if (!supabaseUrl || !supabaseAnonKey) throw new Error(...)` 가드 추가
- **이유:** 개발 온보딩 시 명확한 에러 메시지 제공

#### 5. Leaderboard 불필요 재요청 수정 (PERF-001)
- **파일:** `src/app/pages/Leaderboard.tsx:87`
- **문제:** `useEffect` 의존성이 `[profile]` 객체 참조. 프로필 필드 하나라도 바뀌면 리더보드 전체 재요청
- **수정:** 의존성을 `[myPoint, !!profile]`로 변경 (포인트 변경 또는 로그인 상태 변경 시에만 재요청)
- **이유:** 불필요한 네트워크 요청 감소

#### 6. 404 catch-all 라우트 추가 (새 항목)
- **파일:** `src/app/routes.ts`
- **문제:** 알 수 없는 URL 접근 시 빈 화면
- **수정:** `{ path: "*", loader: () => redirect("/") }` 추가
- **이유:** 유효하지 않은 URL에서 홈으로 자동 리다이렉트

#### 7. 광고 슬롯 번호 연산 오류 수정 (BUG-004)
- **파일:** `src/app/pages/Home.tsx:143`
- **문제:** `activeSlots.length + 1`로 다음 슬롯 계산. DB에서 비순차 배열 로드 시 중복/오류 발생
- **수정:** `[1,2,3,4,5].find(s => !activeSlots.includes(s))`로 다음 빈 슬롯 탐색
- **이유:** 슬롯 번호의 정확성 보장

#### 8. 채굴 로그 에러 체크 추가 (ERR-001)
- **파일:** `src/app/pages/Home.tsx:112-128`
- **문제:** `mining_logs` insert 에러를 무시. 로그 저장 실패 시 디버깅 불가
- **수정:** `{ error: logError }` 체크 + `console.error` 로깅 추가
- **이유:** 운영 중 로그 누락 문제 추적 가능

---

### Low Fixes

#### 9. 클립보드 에러 핸들링 추가 (SEC-005)
- **파일:** `src/app/pages/Profile.tsx:22-34`
- **문제:** `navigator.clipboard.writeText()`가 HTTP 환경에서 실패하나 에러 처리 없음
- **수정:** `try/catch` + `document.execCommand('copy')` fallback
- **이유:** 비보안 컨텍스트에서도 복사 기능 동작 보장

#### 10. HTML title 수정 (CONV-002)
- **파일:** `index.html`
- **문제:** `<title>Mining App</title>` — PRD 기준 "Web3Star"과 불일치
- **수정:** `<title>Web3Star</title>`
- **이유:** PRD 기획 문서와 일치

#### 11. 접근성(A11y) aria-label 추가 (A11Y-001/002/003/005)
- **파일:** `src/app/pages/Home.tsx`, `src/app/components/Layout.tsx`, `src/app/pages/Login.tsx`, `src/app/pages/Signup.tsx`
- **수정 내용:**
  - 채굴 버튼: `aria-label="Start Mining"` / `"Mining in progress"`
  - 광고 슬롯: `aria-label="Ad slot N (watched)"`
  - 알림 벨: `aria-label="Notifications"`
  - 에러 메시지: `role="alert" aria-live="polite"` 추가
- **이유:** 스크린 리더 사용자 접근성 향상

---

## 2026-03-01 — 디버그 에이전트 2차 수정 (v0.0.3)

### P1 — 기능 정합성 수정

#### 12. 퍼센트 보너스 수학 수정 (ISSUE-001)
- **파일:** `src/app/pages/Home.tsx:81-82`
- **문제:** `Math.round(10 * N/100)` = 슬롯 1~4개 시청 시 보너스 0pt. 5개 전부 시청해야 겨우 +1pt
- **수정:** 고정 보너스 방식으로 변경: 슬롯당 +1pt (1~5개 = +1~5pt)
- **이유:** 사용자 동기부여 — "Get More Point" 기능이 실질적 보상을 제공

#### 13. AdBoostModal → GetMorePointModal 리네임 (CONV-001)
- **파일:** `src/app/components/AdBoostModal.tsx` → `GetMorePointModal.tsx`
- **문제:** PRD에서 "Ad Boost" 용어 사용 금지. "Get More Point"로 통일 지시
- **수정:** 파일명, 컴포넌트명, 인터페이스명, Home.tsx import/주석 전체 변경
- **이유:** PRD 용어 규칙 준수

#### 14. sonner toast 피드백 추가 (ERR-003)
- **파일:** `src/app/App.tsx`, `src/app/pages/Home.tsx`
- **문제:** 채굴 성공/실패, 슬롯 활성화 시 사용자 피드백 없음. `sonner` 패키지 설치됐으나 미사용
- **수정:**
  - App.tsx에 `<Toaster theme="dark" position="top-center" richColors />` 추가
  - 채굴 성공: `toast.success('+N Points earned!')`
  - 채굴 실패: `toast.error('Mining failed.')`
  - 슬롯 활성화: `toast.success('Slot N/5 activated!')`
  - 슬롯 저장 실패: `toast.error('Failed to save progress.')`
- **이유:** 사용자가 동작 결과를 즉시 인지 가능

#### 15. 광고 슬롯 DB 에러 체크 + 롤백 (ERR-002)
- **파일:** `src/app/pages/Home.tsx:152-162`
- **문제:** `ad_slots_viewed` DB 업데이트 에러를 무시. 로컬과 DB 상태 불일치 발생
- **수정:** 에러 체크 + 실패 시 `setActiveSlots(activeSlots)` 롤백 + toast 에러
- **이유:** DB 저장 실패 시 사용자에게 알리고 상태 정합성 유지

#### 16. 추천코드 유효성 검증 추가 (ISSUE-002)
- **파일:** `src/app/pages/Signup.tsx:19-29`
- **문제:** 존재하지 않는 추천코드도 `referred_by`에 저장됨
- **수정:** 가입 전 `users.invite_code` 테이블에서 존재 여부 확인 쿼리 추가
- **이유:** 잘못된 추천 데이터 방지, 추천 보상 로직의 정확성 보장

#### 17. Forgot Password 기능 연동 (ISSUE-003)
- **파일:** `src/app/pages/Login.tsx:122-138`
- **문제:** "Forgot Password?" 링크가 `<a href="#">`으로 동작 없음
- **수정:** Supabase `resetPasswordForEmail` API 연동. 이메일 미입력 시 안내, 성공 시 toast
- **이유:** 비밀번호 분실 시 사용자 셀프서비스 가능

### P2 — UX 개선

#### 18. 알림 벨 Coming Soon 처리 (ISSUE-004)
- **파일:** `src/app/components/Layout.tsx:30-35`
- **문제:** 알림 벨에 빨간 점이 있으나 클릭 핸들러 없음. 사용자 혼란 유발
- **수정:** `onClick` → `toast.info('Notifications coming soon!')` 추가, 빨간 점 제거
- **이유:** 미구현 기능에 대한 명확한 안내

#### 19. Contact Support 링크 클릭 가능화 (ISSUE-005)
- **파일:** `src/app/components/ContactSupportModal.tsx`
- **문제:** 이메일, 텔레그램, 웹사이트가 텍스트로만 표시. 클릭 불가
- **수정:** `<div>` → `<a href="..." target="_blank">` 변경. mailto:, https://t.me/, https:// 링크 추가
- **이유:** 사용자가 바로 연락 수단 사용 가능

#### 20. 모달 ESC 키 닫기 추가 (A11Y-004)
- **파일:** 5개 모달 전체 (GetMorePointModal, ComingSoonModal, PrivacyPolicyModal, ContactSupportModal, ActivityHistoryModal)
- **문제:** 모달이 backdrop 클릭으로만 닫힘. 키보드 사용 불가
- **수정:** `useEffect` + `window.addEventListener('keydown')` 로 ESC 키 핸들러 추가
- **이유:** 키보드 접근성 표준 준수

#### 21. Leaderboard 에러 UI + 새로고침 버튼 (ERR-004)
- **파일:** `src/app/pages/Leaderboard.tsx`
- **문제:** fetch 실패 시 빈 리스트와 에러 상태 구분 불가. 새로고침 수단 없음
- **수정:**
  - `fetchError` 상태 추가 → 에러 시 "Failed to load" + 재시도 버튼 표시
  - 헤더에 `<RefreshCw>` 새로고침 버튼 추가 (로딩 중 스핀 애니메이션)
  - fetch 로직을 `useCallback`으로 분리하여 수동 재호출 가능
- **이유:** 에러 상태를 사용자에게 명확히 전달 + 수동 새로고침 제공

---

### 빌드 검증

| 버전 | 빌드 | JS 번들 | gzip |
|------|------|---------|------|
| v0.0.1 (수정 전) | SUCCESS | 577.94KB | 173.17KB |
| v0.0.2 (1차 수정) | SUCCESS | 578.90KB | 173.54KB |
| v0.0.3 (2차 수정) | SUCCESS | 615.75KB | 183.41KB |

> 번들 증가 (+37KB): sonner toast 라이브러리 포함 + 에러 핸들링/검증 로직 추가

---

### 미수정 — 서버 측 작업 필요

| REVIEW ID | 내용 | 이유 |
|-----------|------|------|
| SEC-001 | Supabase RPC 원자적 포인트 증가 | 서버 측 SQL 함수 생성 필요 |
| SEC-002 | RLS 정책 검증 | Supabase 대시보드 확인 필요 |
| SEC-003 | 서버 측 쿨다운 검증 | RPC 함수 내 구현 필요 |

### 미수정 — 추후 Phase에서 처리

| 항목 | 이유 |
|------|------|
| CONV-003 (Splash 진입점) | 유저 플로우 결정 필요 |
| CONV-004 (ProtectedRoute 폴더) | 리팩토링 범위 확인 필요 |
| DOC-001 (PLAN.md Google OAuth 상태) | 기획 에이전트 영역 |

---

### 수정된 파일 총 목록 (v0.0.2 + v0.0.3)

| # | 파일 | 수정 내용 |
|---|------|-----------|
| 1 | `index.html` | title 변경 |
| 2 | `src/lib/supabase.ts` | 환경변수 검증 |
| 3 | `src/app/App.tsx` | Toaster 추가 |
| 4 | `src/app/routes.ts` | 404 라우트 추가 |
| 5 | `src/app/pages/Home.tsx` | 보너스 수학, 레이스컨디션, setTimeout, toast, 에러체크, aria-label |
| 6 | `src/app/pages/Login.tsx` | 변수 섀도잉, Forgot Password, toast, aria-live |
| 7 | `src/app/pages/Signup.tsx` | 변수 섀도잉, 추천코드 검증, aria-live |
| 8 | `src/app/pages/Profile.tsx` | 클립보드 에러 핸들링 |
| 9 | `src/app/pages/Leaderboard.tsx` | 의존성 최적화, 에러 UI, 새로고침 버튼 |
| 10 | `src/app/components/Layout.tsx` | 알림 벨 Coming Soon + aria-label |
| 11 | `src/app/components/GetMorePointModal.tsx` | 파일명 변경 + ESC 키 |
| 12 | `src/app/components/ComingSoonModal.tsx` | ESC 키 |
| 13 | `src/app/components/PrivacyPolicyModal.tsx` | ESC 키 |
| 14 | `src/app/components/ContactSupportModal.tsx` | 링크 클릭 가능 + ESC 키 |
| 15 | `src/app/components/ActivityHistoryModal.tsx` | ESC 키 |

---

_작성: 디버그 에이전트 (Claude) | 2026-03-01_
