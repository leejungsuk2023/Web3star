# Web3Star DApp 요구사항 정리 및 구현 계획

> 기획 에이전트 작성 | 기준일: 2026-03-01
> PRD.md 기반 분석 + 현재 진행 상태 반영

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | Web3Star |
| **플랫폼** | 현재: Web (React + Vite) → 최종: iOS/Android (React Native Expo) |
| **백엔드** | Supabase (Auth, DB, Realtime) |
| **테마** | Dark Theme (`#000000` 배경, `#3B82F6` 포인트 컬러) |
| **핵심 가치** | 4시간 채굴 타이머 + 광고 시청 포인트 적립 + 친구 초대 |

---

## 2. 핵심 요구사항 요약

### 2.1 인증 (Auth)
- [x] 이메일/비밀번호 회원가입 & 로그인 (Supabase Auth)
- [x] 회원가입 시 `invite_code` 자동 생성 (uuid 앞 6자리)
- [x] 추천인 코드 입력 → `referred_by`에 저장
- [ ] **Google OAuth 로그인** (Phase 4 — 미구현)

### 2.2 홈 화면 (채굴 핵심)
- [x] W 로고 채굴 버튼 (`Btn_StartMining`)
- [x] 4시간 타이머 (`last_mined_at` 기반 계산)
- [x] 광고 슬롯 5개 — "Get More Point" 패널
- [x] 슬롯 시청 수 비례 퍼센트 보너스 (1슬롯=1%, 최대 5%)
- [x] 버튼 활성/비활성 상태 UI 구분
- [ ] **실제 광고 연동** (Phase 3 — 미구현, 현재 시뮬레이션)

### 2.3 리더보드
- [x] 포인트 기준 내림차순 TOP 50
- [x] 내 순위 상단 고정 표시
- [x] 1/2/3위 메달 아이콘
- [ ] **새로고침 버튼 / Pull to Refresh** (Phase 5 — 미구현)

### 2.4 프로필
- [x] 내 정보 표시 (이메일, 닉네임, 가입일)
- [x] 초대 코드 복사 기능
- [x] 메뉴 리스트 (Activity History, White Paper, Privacy, Contact, Logout)
- [x] 로그아웃 기능
- [ ] **KYC, 지갑 연결** — MVP 이후 (Coming Soon 처리)

### 2.5 기타
- [x] Splash 화면 (로고 애니메이션)
- [x] Activity History 모달
- [x] DB 스키마 + RLS + 트리거 구성 완료

---

## 3. 현재 진행 상태

```
Phase 1: Supabase 기반 설정        ██████████ 100% ✅
Phase 2: 핵심 기능 보완             ██████████ 100% ✅
Phase 3: 광고 연동 (AdMob)         ░░░░░░░░░░   0% 🔲
Phase 4: Google OAuth              ░░░░░░░░░░   0% 🔲
Phase 5: UX 개선                   ░░░░░░░░░░   0% 🔲
Phase 6: 웹 랜딩 페이지             ░░░░░░░░░░   0% 🔲
Phase 7: React Native 전환         ░░░░░░░░░░   0% 🔲
```

---

## 4. 남은 작업 분해 (Phase 3~7)

### Phase 3: 광고 연동 (AdMob) — 우선순위 MEDIUM

MVP 수익화의 핵심. 실제 광고 없이는 포인트 시스템이 시뮬레이션에 불과함. 단, 웹 환경에서 직접 연동이 어려워 RN 전환 후 진행 권장.

| # | 작업 | 설명 | 선행 조건 |
|---|------|------|-----------|
| 3-1 | AdMob 계정 & 앱 등록 | Google AdMob 콘솔에서 앱 ID 발급 | 외부 설정 |
| 3-2 | 전면 광고 (Interstitial) 연동 | 채굴 버튼 클릭 시 전면 광고 노출 → 완료 후 포인트 +10 | 3-1 |
| 3-3 | 보상형 광고 (Rewarded) 연동 | "Get More Point" 슬롯 클릭 시 보상형 광고 → 완료 후 슬롯 활성화 | 3-1 |
| 3-4 | 광고 로드 실패 Fallback | 네트워크 오류/광고 없음 시 사용자에게 안내 + 재시도 로직 | 3-2, 3-3 |

**참고:** 현재 웹(Vite) 환경에서는 AdMob 직접 연동 불가 → Phase 7 (React Native 전환) 이후 연동하거나, 웹용 광고 SDK(Google AdSense 등) 검토 필요.

---

### Phase 4: Google OAuth — 우선순위 HIGH

사용자 편의를 위한 소셜 로그인. 바로 착수 가능.

> **현재 상태:** 프론트엔드 코드는 이미 완성됨 (`Login.tsx:31-39`, `Signup.tsx:57-65`).
> 남은 작업은 **외부 서비스 설정 + DB 트리거 보완**이 전부.

#### STEP 1. Google Cloud Console 설정 (담당: 프로젝트 오너)

| 순서 | 작업 | 상세 |
|------|------|------|
| 1-1 | Google Cloud Console 접속 | https://console.cloud.google.com |
| 1-2 | 프로젝트 생성 | 이름: `Web3Star` (또는 기존 프로젝트 사용) |
| 1-3 | OAuth 동의 화면 설정 | API 및 서비스 → OAuth 동의 화면 → 사용자 유형: `외부` → 앱 이름: `Web3Star` |
| 1-4 | 승인된 도메인 추가 | `<your-project-ref>.supabase.co` 추가 |
| 1-5 | OAuth 2.0 클라이언트 ID 생성 | API 및 서비스 → 사용자 인증 정보 → `+ 사용자 인증 정보 만들기` → `OAuth 클라이언트 ID` |
| 1-6 | 애플리케이션 유형 선택 | `웹 애플리케이션` |
| 1-7 | 승인된 리다이렉션 URI 입력 | `https://<your-project-ref>.supabase.co/auth/v1/callback` |
| 1-8 | Client ID / Client Secret 복사 | 다음 단계에서 사용 |

#### STEP 2. Supabase Dashboard 설정 (담당: 프로젝트 오너)

| 순서 | 작업 | 상세 |
|------|------|------|
| 2-1 | Supabase 대시보드 접속 | https://supabase.com/dashboard → 해당 프로젝트 |
| 2-2 | Google Provider 활성화 | Authentication → Providers → Google → `Enable` 토글 ON |
| 2-3 | Client ID 입력 | STEP 1에서 복사한 Google Client ID 붙여넣기 |
| 2-4 | Client Secret 입력 | STEP 1에서 복사한 Google Client Secret 붙여넣기 |
| 2-5 | 저장 | `Save` 클릭 |

> STEP 1~2 완료 후 즉시 Google 로그인이 작동함 (프론트 코드는 이미 있으므로).

#### STEP 3. DB 트리거 보완 (담당: 코딩 에이전트)

Google OAuth 유저는 이메일 가입과 **metadata 구조가 다름**. 기존 `handle_new_user` 트리거가 Google 유저를 올바르게 처리하는지 확인 및 수정 필요.

| 항목 | 이메일 가입 | Google OAuth |
|------|-----------|-------------|
| `email` | 직접 입력 | Google 계정 이메일 (자동) |
| `nickname` | 직접 입력 (`raw_user_meta_data.nickname`) | 없음 → `full_name` 또는 `name`으로 대체 |
| `invite_code` | 트리거에서 uuid 앞 6자리 자동 생성 | 동일하게 동작해야 함 (확인 필요) |
| `referred_by` | 가입 시 입력 | OAuth 흐름에서 입력 기회 없음 → 별도 처리 필요 |
| `avatar_url` | 없음 | Google 프로필 사진 URL 제공 |

**트리거 수정 포인트:**
```
- nickname이 없으면 → raw_user_meta_data.full_name 또는 raw_user_meta_data.name 사용
- 그마저도 없으면 → 이메일 앞부분(@ 이전)으로 자동 생성
- invite_code 자동 생성이 정상 동작하는지 확인
```

#### STEP 4. Google OAuth 유저 추천인 코드 처리 (담당: 코딩 에이전트 — 선택)

Google OAuth는 로그인과 동시에 가입이 되므로 **추천인 코드를 입력할 타이밍이 없음**. 처리 방안:

| 방안 | 설명 | 장단점 |
|------|------|--------|
| A. 최초 로그인 후 닉네임/추천인 입력 화면 | OAuth 후 `users` 테이블에 nickname이 없으면 → 온보딩 화면으로 이동 | 가장 깔끔하지만 추가 화면 개발 필요 |
| **✅ B. 프로필에서 추천인 코드 입력 (채택)** | **프로필 화면에 "추천인 코드 입력" 필드 추가 (1회성, `referred_by`가 비어있을 때만 노출)** | **개발 간단, 사용자가 놓칠 수 있음** |
| C. 무시 | Google 가입 유저는 추천인 없이 진행 | MVP에서 가장 빠름 |

> **결정 완료: B안 채택** — 프로필 화면에서 추천인 코드 입력 (1회성)

#### 작업 요약 체크리스트

| # | 작업 | 담당 | 상태 |
|---|------|------|------|
| 4-1 | Google Cloud Console OAuth 설정 | 프로젝트 오너 | 🔲 대기 |
| 4-2 | Supabase Google Provider 활성화 | 프로젝트 오너 | 🔲 대기 |
| 4-3 | 프론트엔드 Google 로그인 버튼 | — | ✅ 이미 완료 |
| 4-4 | `handle_new_user` 트리거 Google 호환 수정 | 코딩 에이전트 | 🔲 대기 (4-1, 4-2 완료 후) |
| 4-5 | 프로필 화면에 추천인 코드 입력 필드 추가 (B안) | 코딩 에이전트 | 🔲 대기 (4-4 완료 후) |
| 4-6 | 테스트: Google 로그인 → 유저 생성 → 홈 진입 | QA | 🔲 대기 (4-4 완료 후) |

---

### Phase 5: UX 개선 — 우선순위 MEDIUM

전반적인 사용자 경험 개선.

| # | 작업 | 설명 | 선행 조건 |
|---|------|------|-----------|
| 5-1 | Leaderboard 새로고침 | 수동 새로고침 버튼 또는 Pull-to-Refresh 제스처 | 없음 |
| 5-2 | Toast 알림 교체 | `alert()` → `sonner` 등 토스트 라이브러리로 전환 | 없음 |
| 5-3 | 에러 핸들링 강화 | 네트워크 에러, Supabase 에러에 대한 통일된 UX 처리 | 없음 |
| 5-4 | 알림 기능 (Bell 아이콘) | Header의 알림 아이콘 연동 — 공지사항 또는 채굴 완료 알림 | 없음 |
| 5-5 | 로딩 상태 UI | 데이터 로딩 중 Skeleton/Spinner 표시 | 없음 |

---

### Phase 6: 웹 랜딩 페이지 — 우선순위 LOW

앱 소개 및 다운로드 유도용 별도 페이지.

| # | 작업 | 설명 | 선행 조건 |
|---|------|------|-----------|
| 6-1 | 히어로 섹션 | 앱 소개 + 앱 스토어 다운로드 버튼 (CTA) | 없음 |
| 6-2 | 기능 소개 섹션 | 채굴, 광고 포인트, 초대 등 핵심 기능 카드형 소개 | 없음 |
| 6-3 | 앱 스크린샷/목업 | 앱 화면 캡처 또는 디바이스 목업 이미지 배치 | 앱 UI 확정 후 |
| 6-4 | FAQ + 백서 링크 | 자주 묻는 질문 아코디언 + 백서 PDF/링크 연결 | 없음 |
| 6-5 | 푸터 | Contact, SNS 링크, Copyright | 없음 |

**기술 스택:** 동일 프로젝트 내 별도 라우트 또는 독립 프로젝트 (클라이언트와 협의 필요)

---

### Phase 7: React Native 전환 — 우선순위 LOW (장기)

최종 목표는 모바일 앱 배포.

| # | 작업 | 설명 | 선행 조건 |
|---|------|------|-----------|
| 7-1 | Expo 프로젝트 초기 세팅 | `npx create-expo-app`, 폴더 구조, 네비게이션 설정 | 없음 |
| 7-2 | UI 컴포넌트 전환 | HTML/CSS → React Native 컴포넌트 (View, Text, StyleSheet) | 7-1 |
| 7-3 | Supabase 연동 이식 | 웹 로직을 RN 환경에 맞게 이식 (AsyncStorage 등) | 7-1 |
| 7-4 | 네이티브 API 연동 | 클립보드, 딥링크, 푸시 알림, AdMob (react-native-google-mobile-ads) | 7-2 |
| 7-5 | 앱 스토어 배포 준비 | 아이콘, 스플래시, 앱 서명, 스토어 메타데이터 | 7-4 |

---

## 5. 권장 실행 순서

```
현재 위치: Phase 1-2 완료
         ↓
    ┌────────────────┐
    │  Phase 4       │  ← Google OAuth (HIGH — 바로 착수 가능)
    │  소셜 로그인    │
    └───────┬────────┘
            ↓
    ┌────────────────┐
    │  Phase 5       │  ← UX 개선 (독립적, 바로 착수 가능)
    │  Toast, 에러,  │
    │  로딩 상태 등   │
    └───────┬────────┘
            ↓
    ┌────────────────┐
    │  Phase 6       │  ← 랜딩 페이지 (앱과 병행 가능)
    │  웹 홈페이지    │
    └───────┬────────┘
            ↓
    ┌────────────────┐
    │  Phase 7       │  ← React Native 전환
    │  모바일 앱 전환  │
    └───────┬────────┘
            ↓
    ┌────────────────┐
    │  Phase 3       │  ← AdMob 광고 (RN 전환 후 연동이 효율적)
    │  광고 수익화     │
    └────────────────┘
```

> **핵심 판단:** Phase 4(Google OAuth)를 최우선으로 착수. Phase 3(AdMob)은 웹 환경에서 직접 연동이 어려우므로 Phase 7(RN 전환) 이후로 미루는 것이 효율적.

---

## 6. DB 스키마 (현재 확정)

```sql
-- users: 유저 정보 + 채굴 상태
users (
  id uuid PK,
  email text,
  nickname text,
  point int8 default 0,
  invite_code text unique,
  referred_by text,
  last_mined_at timestamptz,
  ad_slots_viewed jsonb default '[]',
  created_at timestamptz
)

-- mining_logs: 채굴/포인트 히스토리
mining_logs (
  id bigint PK,
  user_id uuid FK → users,
  amount int,
  type text,        -- 'MINING' | 'AD_POINT' | 'REFERRAL' | 'BONUS'
  slot_number int,  -- 광고 슬롯 1~5, MINING이면 null
  created_at timestamptz
)
```

---

## 7. 기술 스택 요약

| 카테고리 | 현재 (Web MVP) | 최종 목표 (Mobile) |
|----------|---------------|-------------------|
| 프레임워크 | React + Vite | React Native Expo |
| 라우팅 | react-router | React Navigation |
| 인증 | Supabase Auth | Supabase Auth |
| DB | Supabase PostgreSQL | Supabase PostgreSQL |
| UI | Tailwind CSS + Radix UI + shadcn | RN StyleSheet + 커스텀 |
| 광고 | 시뮬레이션 (미연동) | Google AdMob |
| 차트/데이터 | recharts, d3 | react-native-chart-kit 등 |
| 상태관리 | React Context | React Context |

---

## 8. 미결 사항 (클라이언트 확인 필요)

| # | 질문 | 영향 범위 |
|---|------|-----------|
| 1 | 웹 랜딩 페이지를 동일 프로젝트에 포함할지, 별도 프로젝트로 분리할지? | Phase 6 구조 |
| 2 | 광고 슬롯 리셋 정책: 4시간마다 리셋? 24시간마다? 채굴 시마다? | Phase 3 로직 |
| 3 | React Native 전환 시점: 웹 MVP 완료 후? 동시 진행? | Phase 7 일정 |
| 4 | KYC / 지갑 연결 구체적 요구사항 (MVP 이후 범위) | 장기 로드맵 |
| 5 | 알림(Notification) 범위: 인앱만? 푸시 알림 포함? | Phase 5-4 |

---

_기획 에이전트 작성 완료. 코드 작성은 코딩 에이전트에게 위임._
