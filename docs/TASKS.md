# TASKS

> 코딩 에이전트가 관리하는 작업 상태 추적 파일

## Phase 1: Supabase 기반 설정 — ✅ 완료

| # | 작업 | 상태 | 파일 |
|---|------|------|------|
| 1-1 | Supabase 클라이언트 초기화 | ✅ 완료 | `src/lib/supabase.ts`, `.env.local` |
| 1-2 | AuthContext + ProtectedRoute | ✅ 완료 | `src/context/AuthContext.tsx`, `src/components/ProtectedRoute.tsx` |
| 1-3 | Login / Signup Supabase 연동 | ✅ 완료 | `src/app/pages/Login.tsx`, `src/app/pages/Signup.tsx` |
| 1-4 | Home 채굴 DB 연동 | ✅ 완료 | `src/app/pages/Home.tsx` |
| 1-5 | Leaderboard DB 연동 | ✅ 완료 | `src/app/pages/Leaderboard.tsx` |
| 1-6 | Profile DB 연동 + 로그아웃 | ✅ 완료 | `src/app/pages/Profile.tsx` |
| 1-7 | Layout 헤더 닉네임/포인트 | ✅ 완료 | `src/app/components/Layout.tsx` |
| 1-8 | DB 스키마 (SQL) | ✅ 완료 | users, mining_logs, RLS, 트리거 |

## Phase 2: 핵심 기능 보완 — ✅ 완료

| # | 작업 | 상태 | 파일 |
|---|------|------|------|
| 2-1 | 광고 슬롯 퍼센트 보너스 로직 | ✅ 완료 | `src/app/pages/Home.tsx` |
| 2-2 | 추천인 보상 시스템 (DB trigger) | ✅ 완료 | SQL trigger + `src/app/pages/Signup.tsx` |
| 2-3 | Activity History DB 연동 | ✅ 완료 | `src/app/components/ActivityHistoryModal.tsx` |
| 2-4 | Splash 화면 | ✅ 완료 | `src/app/pages/Splash.tsx`, `src/app/routes.ts` |

## Phase 3: 광고 연동 (AdMob) — 🔲 대기

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 3-1 | AdMob 계정/앱 등록 | 🔲 대기 | 외부 설정 필요 |
| 3-2 | 전면 광고 (채굴 버튼) 연동 | 🔲 대기 | |
| 3-3 | 보상형 광고 (슬롯) 연동 | 🔲 대기 | |
| 3-4 | 광고 로드 실패 fallback | 🔲 대기 | |

## Phase 4: Google OAuth — 🔲 대기

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 4-1 | Google Cloud Console 설정 | 🔲 대기 | 외부 설정 필요 |
| 4-2 | Supabase Google provider 활성화 | 🔲 대기 | 외부 설정 필요 |

## E2E 테스트 (Playwright) — ✅ 완료

| # | 작업 | 상태 | 파일 |
|---|------|------|------|
| E-1 | Playwright 설치 + 설정 | ✅ 완료 | `playwright.config.ts` |
| E-2 | 회원가입 테스트 (3건) | ✅ 통과 | `e2e/app.spec.ts` |
| E-3 | 로그인 테스트 (3건) | ✅ 통과 | `e2e/app.spec.ts` |
| E-4 | 보호 라우트 리다이렉트 (3건) | ✅ 통과 | `e2e/app.spec.ts` |
| E-5 | Splash 화면 테스트 | ✅ 통과 | `e2e/app.spec.ts` |
| E-6 | 채굴/슬롯/리더보드/로그아웃 (5건) | ✅ 통과 | `e2e/app.spec.ts` |

## Phase 5: UX 개선 — 🔲 대기

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 5-1 | Leaderboard 새로고침 버튼 | ✅ 완료 | 이미 구현됨 (RefreshCw) |
| 5-2 | Toast 알림 (sonner) | ✅ 완료 | 이미 적용됨 |
| 5-3 | 에러 핸들링 강화 | 🔲 대기 | |
| 5-4 | 알림 기능 (Bell 아이콘) | 🔲 대기 | |

## Phase 6: 웹 랜딩 페이지 — 🔲 대기

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 6-1 | 히어로 섹션 | 🔲 대기 | |
| 6-2 | 기능 소개 섹션 | 🔲 대기 | |
| 6-3 | 스크린샷/목업 | 🔲 대기 | |
| 6-4 | FAQ + 푸터 | 🔲 대기 | |

## Phase 7: React Native 전환 — 🔲 대기

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 7-1 | Expo 프로젝트 세팅 | 🔲 대기 | |
| 7-2 | UI 컴포넌트 전환 | 🔲 대기 | |
| 7-3 | 네이티브 API 연동 | 🔲 대기 | |

---

_마지막 업데이트: 2026-03-01_
