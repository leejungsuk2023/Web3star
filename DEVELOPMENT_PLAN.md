# Web3Star 개발 계획

## 현재 완료된 항목 (Phase 1)

- [x] Supabase 연동 (클라이언트 초기화, .env.local)
- [x] 인증 시스템 (이메일 가입/로그인, AuthContext, ProtectedRoute)
- [x] Google OAuth UI (버튼 구현됨, Supabase provider 설정 필요)
- [x] Home 화면 DB 연동 (채굴 +10pt, last_mined_at 타이머, ad_slots_viewed)
- [x] Leaderboard DB 연동 (TOP 50 조회, 내 순위 계산)
- [x] Profile DB 연동 (유저 정보, 초대코드, 로그아웃)
- [x] Layout 헤더 (닉네임, 포인트 실시간 반영)
- [x] DB 스키마 (users, mining_logs 테이블 + RLS + 트리거)

---

## Phase 2: 핵심 기능 보완

### 2-1. 광고 슬롯 보너스 로직 수정
- **현재**: 슬롯당 +1pt 고정 보너스
- **PRD 기준**: 채굴 포인트의 퍼센트 보너스 (5개 전부 시청 시 5%, 부분 시청 시 비례)
- 채굴 시점에 `ad_slots_viewed` 개수에 따라 보너스 계산
- 예: 기본 10pt + (10 * 슬롯수/100) → 슬롯 5개면 10 + 0.5 = 10.5pt (반올림 적용)
- **대안**: 퍼센트가 너무 작으므로 슬롯당 +1pt 유지할지 결정 필요

### 2-2. 추천인(Referral) 보상 시스템
- 회원가입 시 referral_code 입력 → `referred_by`에 저장 (완료)
- **미구현**: 추천인에게 보상 포인트 지급
- 구현 방안:
  - Supabase Edge Function 또는 DB trigger로 처리
  - 새 유저 가입 시 `referred_by` 코드로 추천인 조회 → 추천인에게 +50pt (또는 설정값)
  - mining_logs에 type='REFERRAL' 기록

### 2-3. Activity History 실제 데이터 연동
- **현재**: ActivityHistoryModal에 하드코딩된 샘플 데이터
- **변경**: mining_logs 테이블에서 본인 기록 조회
- 타입별 아이콘/색상 매핑 (MINING, AD_POINT, REFERRAL, BONUS)
- 최신순 정렬, 페이지네이션 또는 무한스크롤

### 2-4. Splash 화면
- PRD: 로고 애니메이션이 있는 스플래시 화면
- 앱 로딩 시 1~2초간 로고 표시 후 인증 상태에 따라 라우팅
- motion 라이브러리 활용 (이미 설치됨)

---

## Phase 3: 광고 연동 (AdMob)

### 3-1. AdMob 설정
- Google AdMob 계정 생성 및 앱 등록
- 광고 단위 ID 발급:
  - 전면 광고 (Interstitial) — W 로고 채굴 버튼용
  - 보상형 광고 (Rewarded) — Get More Point 슬롯용
- 웹 환경에서는 AdSense 또는 테스트 모드로 대체

### 3-2. 광고 Flow 구현
- W 버튼 클릭 → 전면 광고 재생 → 완료 콜백에서 채굴 실행
- 슬롯 클릭 → 보상형 광고 재생 → 완료 콜백에서 슬롯 활성화
- 광고 로드 실패 시 fallback 처리 (재시도 또는 스킵)

---

## Phase 4: Google OAuth 활성화

### 4-1. Google Cloud Console 설정
- OAuth 2.0 클라이언트 ID 생성
- 승인된 리디렉션 URI 설정: `https://imlmvqpbjuznvprwhkkz.supabase.co/auth/v1/callback`

### 4-2. Supabase 대시보드 설정
- Authentication → Providers → Google 활성화
- Client ID / Client Secret 입력

---

## Phase 5: UX 개선

### 5-1. Pull to Refresh (Leaderboard)
- PRD: 리더보드에서 당겨서 새로고침
- 웹에서는 새로고침 버튼 또는 자동 갱신 간격 설정

### 5-2. Toast 알림
- 현재 alert() 사용 → sonner 라이브러리로 교체 (이미 설치됨)
- 채굴 성공, 광고 보상, 초대코드 복사 등에 적용

### 5-3. 에러 핸들링 강화
- 네트워크 오류 시 사용자 친화적 메시지
- Supabase 요청 실패 시 재시도 로직

### 5-4. 알림 기능 (Bell 아이콘)
- 현재 UI만 존재
- 향후: 공지사항, 채굴 가능 알림 등

---

## Phase 6: 웹 랜딩 페이지

- PRD 섹션 6 기준
- 히어로 섹션 (앱 소개 + 다운로드 버튼)
- 주요 기능 소개
- 앱 스크린샷/목업
- FAQ 또는 백서 링크
- 푸터 (Contact, SNS 링크)
- 별도 라우트 `/landing` 또는 서브도메인

---

## Phase 7: React Native 전환 (추후)

- PRD 원래 목표: React Native Expo
- 현재: React (Vite) 웹앱으로 구현
- 전환 시 고려사항:
  - expo-router로 라우팅 전환
  - react-native 컴포넌트로 UI 전환
  - expo-ads-admob으로 광고 연동
  - expo-clipboard, expo-linking 등 네이티브 API

---

## 우선순위 요약

| 순위 | 항목 | 난이도 | 영향도 |
|------|------|--------|--------|
| 1 | Phase 2-1: 광고 보너스 로직 확정 | 낮음 | 높음 |
| 2 | Phase 2-2: 추천인 보상 시스템 | 중간 | 높음 |
| 3 | Phase 2-3: Activity History 연동 | 낮음 | 중간 |
| 4 | Phase 2-4: Splash 화면 | 낮음 | 중간 |
| 5 | Phase 4: Google OAuth | 중간 | 중간 |
| 6 | Phase 5: UX 개선 (Toast 등) | 낮음 | 중간 |
| 7 | Phase 3: AdMob 연동 | 높음 | 높음 |
| 8 | Phase 6: 랜딩 페이지 | 중간 | 낮음 |
| 9 | Phase 7: React Native 전환 | 높음 | 높음 |
