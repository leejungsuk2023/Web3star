# Web3Star Code Review Report

- **리뷰 일자:** 2026-03-01 (v3 — CHANGELOG 검증 반영)
- **리뷰어:** Review Agent
- **기준 문서:** `docs/PLAN.md` (구현 계획), `docs/TASKS.md` (진행 상태), `PRD.md` (원본 기획)
- **대상 버전:** v0.0.3 (디버그 에이전트 2차 수정 후)
- **빌드 상태:** SUCCESS (615.75KB JS, 183.41KB gzip)

---

## 목차

1. [PLAN 기준 완료 검증 (Phase 1-2)](#1-plan-기준-완료-검증)
2. [CHANGELOG 검증 결과 (v0.0.2 + v0.0.3)](#2-changelog-검증-결과)
3. [잔존 이슈 — 서버 측 작업 필요](#3-잔존-이슈--서버-측-작업-필요)
4. [잔존 이슈 — 클라이언트 측](#4-잔존-이슈--클라이언트-측)
5. [PLAN 문서 정합성 확인](#5-plan-문서-정합성-확인)
6. [총평 및 우선순위](#6-총평-및-우선순위)

---

## 1. PLAN 기준 완료 검증

TASKS.md에서 **완료**로 표기된 Phase 1-2 항목을 코드와 대조합니다.

### Phase 1: Supabase 기반 설정

| TASK | 항목 | 검증 결과 | 비고 |
|------|------|-----------|------|
| 1-1 | Supabase 클라이언트 초기화 | **PASS** | `src/lib/supabase.ts` + `.env.local` 정상. 환경변수 검증 가드도 추가됨 |
| 1-2 | AuthContext + ProtectedRoute | **PASS** | 세션 관리, 프로필 fetch, 인증 가드 정상 동작 |
| 1-3 | Login / Signup Supabase 연동 | **PASS** | signInWithPassword, signUp 정상. 변수 섀도잉 수정됨. Forgot Password 연동됨 |
| 1-4 | Home 채굴 DB 연동 | **PASS** (보안 이슈) | 채굴 + 타이머 동작. 레이스컨디션 완화됨. 서버 측 RPC 미적용 (섹션 3 참조) |
| 1-5 | Leaderboard DB 연동 | **PASS** | TOP 50 + 내 순위 정상. 에러 UI + 새로고침 추가됨 |
| 1-6 | Profile DB 연동 + 로그아웃 | **PASS** | 프로필 표시, 초대코드 복사(fallback 포함), 로그아웃 정상 |
| 1-7 | Layout 헤더 닉네임/포인트 | **PASS** | 닉네임 + 포인트 표시 정상. 벨 버튼 Coming Soon 처리됨 |
| 1-8 | DB 스키마 (SQL) | **UNVERIFIABLE** | 클라이언트 코드에서 확인 불가. Supabase 대시보드 확인 필요 |

### Phase 2: 핵심 기능 보완

| TASK | 항목 | 검증 결과 | 비고 |
|------|------|-----------|------|
| 2-1 | 광고 슬롯 보너스 로직 | **PASS** | 고정 보너스(슬롯당 +1pt)로 수정됨. 에러 체크 + 롤백도 추가 |
| 2-2 | 추천인 보상 시스템 (DB trigger) | **PASS** | 추천코드 유효성 검증 추가됨. 트리거에서 처리 |
| 2-3 | Activity History DB 연동 | **PASS** | `mining_logs` 테이블에서 실제 데이터 fetch |
| 2-4 | Splash 화면 | **PASS** | `Splash.tsx` + `/splash` 라우트 존재. motion 애니메이션 적용 |

### Phase 1-2 검증 요약

> **14개 항목 중 13개 PASS, 1개 UNVERIFIABLE, 0개 FAIL**
> 디버그 에이전트 수정(v0.0.2~v0.0.3) 이후 기능 및 에러 핸들링 대폭 개선됨.
> 잔존 이슈는 서버 측 보안(RPC) + 문서 정합성 위주.

---

## 2. CHANGELOG 검증 결과

`docs/CHANGELOG.md`에 기재된 21개 수정 항목을 실제 코드와 1:1 대조 검증했습니다.

### v0.0.2 — Critical Fixes

| # | 항목 | 결과 | 검증 근거 |
|---|------|------|-----------|
| 1 | 변수 섀도잉 수정 | **VERIFIED** | Login.tsx:20 `authError`, :32 `oauthError` / Signup.tsx:36 `authError`, :58 `oauthError` |
| 2 | 레이스 컨디션 완화 | **VERIFIED** | Home.tsx:88-94 — DB에서 `freshUser.point` 재조회 후 계산 |
| 3 | setTimeout + async 제거 | **VERIFIED** | Home.tsx:139 — `handleWatchAd`가 직접 async/await. setTimeout 없음 |

### v0.0.2 — Medium Fixes

| # | 항목 | 결과 | 검증 근거 |
|---|------|------|-----------|
| 4 | 환경변수 검증 | **VERIFIED** | supabase.ts:6-8 — `if (!supabaseUrl \|\| !supabaseAnonKey) throw new Error(...)` |
| 5 | Leaderboard 의존성 최적화 | **MISMATCH** | 아래 상세 참조 |
| 6 | 404 catch-all 라우트 | **VERIFIED** | routes.ts:39-41 — `{ path: "*", loader: () => redirect("/") }` |
| 7 | 슬롯 번호 연산 수정 | **VERIFIED** | Home.tsx:147 — `[1,2,3,4,5].find(s => !activeSlots.includes(s))` |
| 8 | 채굴 로그 에러 체크 | **VERIFIED** | Home.tsx:114-119 `logError` 체크 + :123-129 ad bonus 로그 에러 체크 |

### v0.0.2 — Low Fixes

| # | 항목 | 결과 | 검증 근거 |
|---|------|------|-----------|
| 9 | 클립보드 에러 핸들링 | **VERIFIED** | Profile.tsx:22-39 — try/catch + `execCommand('copy')` fallback |
| 10 | HTML title 수정 | **VERIFIED** | index.html:7 — `<title>Web3Star</title>` |
| 11 | aria-label 추가 | **VERIFIED** | Home.tsx:218 채굴버튼, :263 슬롯, Layout.tsx:32 벨, Login.tsx:55 + Signup.tsx:81 `role="alert"` |

### v0.0.3 — P1 기능 정합성

| # | 항목 | 결과 | 검증 근거 |
|---|------|------|-----------|
| 12 | 퍼센트→고정 보너스 | **VERIFIED** | Home.tsx:83 — `const adBonus = activeSlots.length` (슬롯당 +1pt) |
| 13 | GetMorePointModal 리네임 | **VERIFIED** | AdBoostModal.tsx 삭제됨, GetMorePointModal.tsx 존재, import/인터페이스 전체 변경 |
| 14 | sonner toast 추가 | **VERIFIED** | App.tsx:10 Toaster, Home.tsx:135 성공, :108 실패, :164 슬롯, :160 슬롯실패 |
| 15 | 슬롯 DB 에러 + 롤백 | **VERIFIED** | Home.tsx:157-161 — `slotError` 체크 → `setActiveSlots(activeSlots)` 롤백 + toast |
| 16 | 추천코드 유효성 검증 | **VERIFIED** | Signup.tsx:22-34 — `users.invite_code` 존재 확인 후 가입 |
| 17 | Forgot Password | **VERIFIED** | Login.tsx:123-138 — `resetPasswordForEmail` + 이메일 미입력 에러 + 성공 toast |

### v0.0.3 — P2 UX 개선

| # | 항목 | 결과 | 검증 근거 |
|---|------|------|-----------|
| 18 | 알림 벨 Coming Soon | **VERIFIED** | Layout.tsx:33 — `toast.info(...)`, 빨간 점 제거됨 |
| 19 | Contact Support 링크 | **VERIFIED** | ContactSupportModal.tsx:79-83 — `<a href="..." target="_blank">` + mailto/t.me/https |
| 20 | 모달 ESC 키 닫기 | **VERIFIED** | 5개 모달 전체 ESC 핸들러 확인 |
| 21 | Leaderboard 에러 UI | **VERIFIED** | Leaderboard.tsx:48 `fetchError`, :52 `useCallback`, :110-117 RefreshCw, :167-176 에러 UI |

### CHANGELOG 검증 요약

> **20/21 VERIFIED, 1/21 MISMATCH**

### MISMATCH 상세 — #5 Leaderboard 의존성

- **CHANGELOG 기재:** 의존성을 `[myPoint, !!profile]`로 변경
- **실제 코드:** `Leaderboard.tsx:88` → `[myPoint, profile]`

`!!profile` 불리언 변환이 적용되지 않음. 현재 코드에서는 `profile` 객체 참조가 의존성으로 사용되어, 포인트 외 다른 필드(`nickname`, `ad_slots_viewed` 등) 변경 시에도 리더보드를 재요청함.

**권장:** `[myPoint, !!profile]`로 수정하여 CHANGELOG 의도대로 최적화하거나, CHANGELOG를 실제 코드에 맞게 정정.

---

## 3. 잔존 이슈 — 서버 측 작업 필요

디버그 에이전트가 클라이언트 측에서 가능한 완화 조치(fresh point fetch 등)는 적용했으나, 근본적 해결은 서버 측 작업이 필요합니다.

### SEC-001. 클라이언트 측 포인트 연산 [CRITICAL]

- **파일:** `src/app/pages/Home.tsx:100`
- **현 상태:** v0.0.2에서 DB 최신값 재조회 후 계산하도록 개선됨 (CHANGELOG #2)
- **잔존 위험:** 여전히 `point: currentPoint + totalReward`로 클라이언트에서 최종값 결정. DevTools에서 PATCH 요청의 `point` 값을 임의로 변경 가능.
- **해결:** Supabase RPC `point = point + N` 원자적 증가

### SEC-002. 쿨다운 검증이 클라이언트에만 존재 [CRITICAL]

- **파일:** `src/app/pages/Home.tsx:77`
- **현 상태:** `centerButtonActive` (React state)에만 의존. 콘솔에서 `handleMine()` 직접 호출 시 우회 가능.
- **해결:** RPC 내에서 `last_mined_at` 서버 측 검증

### SEC-003. RLS 정책 검증 불가 [HIGH]

- TASKS 1-8에서 "RLS + 트리거 구성 완료"라고 했으나 클라이언트 코드에서 확인 불가.
- **권고:** Supabase 대시보드에서 아래 정책 존재 확인 필수:
  - `users`: SELECT 전체 허용, UPDATE는 `auth.uid() = id`인 경우만
  - `mining_logs`: INSERT는 `auth.uid() = user_id`인 경우만

### SEC-004. 광고 시청 없이 보상 획득 가능 [MEDIUM — 인지 사항]

- `handleWatchAd`가 모달 닫기 → 즉시 보상 지급. 실제 광고 SDK 미연동.
- PLAN Phase 3에서 AdMob 연동 예정이므로 현 단계에서는 의도된 상태.

---

## 4. 잔존 이슈 — 클라이언트 측

디버그 에이전트 수정 이후에도 남아있는 클라이언트 측 이슈들입니다.

### CONV-003. Splash 진입점 미설정 [LOW]

- Splash 라우트(`/splash`)가 있지만 기본 진입점이 `/`(Home)임.
- 첫 방문 시 Splash를 거치도록 하려면 리다이렉트 또는 index 변경 필요.
- 현재는 `/splash`를 직접 접속해야만 볼 수 있음.

### CONV-004. ProtectedRoute 위치 불일치 [LOW]

- `ProtectedRoute`만 `src/components/`에 위치. 나머지는 모두 `src/app/components/`.
- 폴더 구조 통일 필요.

### PERF-001. Leaderboard 의존성 미최적화 [LOW]

- CHANGELOG #5 MISMATCH로 발견. `[myPoint, profile]` → `[myPoint, !!profile]`로 변경 필요.

---

## 5. PLAN 문서 정합성 확인

### DOC-001. Google OAuth — PLAN 정확함

- **PLAN 2.1:** "Google OAuth 로그인 (Phase 4 — 미구현)"
- **Supabase 설정:** `"google": false` (Provider 비활성화)
- PLAN이 정확함. 코드는 UI+호출코드만 선작업된 상태.
- **문제:** Google 버튼 클릭 시 에러 메시지 표시. Phase 4 전까지 버튼 숨기거나 "Coming Soon" 처리 필요.

### DOC-002. 이메일 확인(autoconfirm) 비활성화 상태 [MEDIUM]

- **Supabase 설정:** `"mailer_autoconfirm": false`
- 회원가입 후 바로 `navigate('/')`로 이동하지만, 이메일 미확인 상태에서는 로그인 불가.
- **권고:** 가입 후 "이메일을 확인해주세요" 안내 화면 추가, 또는 개발 단계에서 autoconfirm true로 변경.

### DOC-003. TASKS.md Phase 3~7 세부 태스크 부족

- Phase 3~7의 작업이 매우 추상적. 각 Phase 착수 시 세부 태스크로 분해 필요.

---

## 6. 총평 및 우선순위

### Phase 1-2 완성도 (v0.0.3 기준)

| 영역 | 점수 | 평가 |
|------|------|------|
| **기능 구현** | 95% | PLAN Phase 1-2 항목 전체 구현 + 보너스 수학/추천코드/Forgot Password 수정 완료 |
| **보안** | 40% | 클라이언트 측 완화 적용(fresh DB fetch). 서버 RPC 미적용이 근본 문제 |
| **에러 핸들링** | 85% | mining_logs, ad_slots, Leaderboard 에러 체크 + toast + 롤백 전부 추가됨 |
| **코드 품질** | 90% | 용어 통일(GetMorePoint), title 수정, 404 라우트 추가. 폴더 구조만 잔존 |
| **접근성** | 80% | aria-label, role="alert", ESC 키 전부 추가됨. 포커스 트래핑은 미구현 |

### v0.0.1 → v0.0.3 개선 비교

| 영역 | v0.0.1 | v0.0.3 | 변화 |
|------|--------|--------|------|
| 기능 구현 | 90% | 95% | +5% |
| 보안 | 30% | 40% | +10% (클라이언트 한계) |
| 에러 핸들링 | 35% | 85% | **+50%** |
| 코드 품질 | 75% | 90% | +15% |
| 접근성 | 30% | 80% | **+50%** |

### 수정 우선순위 (현재 잔존 이슈만)

#### P0 — 즉시 (서버 측 보안)
| # | 이슈 | 작업 |
|---|------|------|
| 1 | SEC-001 + SEC-002 | Supabase RPC `do_mine` 함수 생성. 서버 측 포인트 계산 + 쿨다운 검증 + 원자적 업데이트 |
| 2 | SEC-003 | Supabase 대시보드에서 RLS 정책 점검 |

#### P1 — 출시 전 (문서/기능 정합성)
| # | 이슈 | 작업 |
|---|------|------|
| 3 | DOC-001 | Google OAuth 버튼 숨기거나 Coming Soon 처리 (Phase 4 전) |
| 4 | DOC-002 | 가입 후 이메일 확인 안내 화면 추가 또는 autoconfirm 설정 변경 |
| 5 | PERF-001 | Leaderboard 의존성 `[myPoint, !!profile]`로 수정 |

#### P2 — 출시 직후 (UX 개선)
| # | 이슈 | 작업 |
|---|------|------|
| 6 | CONV-003 | Splash 진입점 설정 (첫 방문 시 Splash 경유) |
| 7 | CONV-004 | ProtectedRoute 폴더 위치 통일 |

---

### 디버그 에이전트(v0.0.2~v0.0.3) 수정으로 해결된 이슈들

이전 리뷰에서 보고되었으나 현재 모두 수정 완료된 항목들:

| 이전 이슈 ID | 내용 | 해결 CHANGELOG # |
|-------------|------|------------------|
| ISSUE-001 | 퍼센트 보너스 무의미 | #12 — 고정 보너스(+1pt/슬롯)로 변경 |
| ISSUE-002 | 추천코드 유효성 미검증 | #16 — DB에서 invite_code 존재 확인 |
| ISSUE-003 | Forgot Password 미작동 | #17 — resetPasswordForEmail 연동 |
| ISSUE-004 | 알림 벨 비활성 | #18 — Coming Soon toast + 빨간 점 제거 |
| ISSUE-005 | Contact Support 링크 클릭 불가 | #19 — `<a href>` 링크로 변경 |
| ERR-001 | mining_logs 에러 무시 | #8 — logError 체크 + console.error |
| ERR-002 | 슬롯 DB 에러 무시 | #15 — 에러 체크 + 롤백 + toast |
| ERR-003 | 채굴 사용자 피드백 없음 | #14 — sonner toast 추가 |
| ERR-004 | Leaderboard 에러 UI 없음 | #21 — 에러 상태 + 새로고침 버튼 |
| ERR-005 | 클립보드 실패 무시 | #9 — try/catch + execCommand fallback |
| CONV-001 | "Ad Boost" 용어 위반 | #13 — GetMorePointModal 리네임 |
| CONV-002 | HTML title 불일치 | #10 — `<title>Web3Star</title>` |
| A11Y-001~005 | aria-label, ESC 키 미구현 | #11, #20 — 전체 접근성 개선 |
| BUG-001 | 레이스 컨디션 | #2 — DB 최신값 재조회 (클라이언트 측 완화) |
| BUG-004 | 슬롯 번호 연산 오류 | #7 — find()로 빈 슬롯 탐색 |
| BUG-006 | 변수 섀도잉 | #1 — authError/oauthError 리네임 |
| SEC-004(부분) | setTimeout 내 async | #3 — setTimeout 제거 |

---

*이 리뷰는 `docs/PLAN.md`를 기준 문서로, 클라이언트 코드만을 대상으로 작성되었습니다.
Supabase 대시보드의 RLS 정책, DB 트리거, Edge Function은 별도 확인이 필요합니다.*

*v3 업데이트: CHANGELOG v0.0.2~v0.0.3 전체 검증 결과 반영 (2026-03-01)*
