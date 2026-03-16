# Web3Star Alpha Test Report

- **테스트 일자:** 2026-02-28
- **테스터:** Code Verification & Debug Agent
- **빌드 상태:** SUCCESS (vite build 915ms)
- **총 발견 이슈:** 19건

> **NOTE (2026-03-01):** 이 리포트는 PRD.md만 기준으로 작성되었으며, 이후 `docs/PLAN.md` 기준으로 재검증한 결과 6건이 이미 수정된 상태임을 확인.
> 정확한 최신 리뷰는 **`docs/REVIEW.md`** 를 참조하세요.

---

## CRITICAL - 반드시 수정 필요 (4건)

### BUG-001. 포인트 조작 가능 (보안 취약점)

- **파일:** `src/app/pages/Home.tsx:82-94`
- **심각도:** CRITICAL
- **분류:** Security

**현상:**
포인트 계산이 클라이언트에서 이루어져 악의적 사용자가 브라우저 DevTools로 요청을 가로채 임의의 포인트를 주입할 수 있음.

**문제 코드:**
```js
const totalReward = MINING_REWARD + adBonus;
await supabase.from('users').update({
  point: (profile?.point ?? 0) + totalReward,
  ...
})
```

**수정 방안:**
Supabase RPC (서버 함수)로 원자적 포인트 증가 처리. 서버에서 쿨다운 검증 + 포인트 계산을 모두 수행해야 함.

```sql
-- 예시: Supabase RPC
create or replace function mine_points(user_id uuid)
returns void as $$
  update users
  set point = point + 10,
      last_mined_at = now()
  where id = user_id
    and (last_mined_at is null or now() - last_mined_at > interval '4 hours');
$$ language sql;
```

---

### BUG-002. 채굴 동시 실행 Race Condition

- **파일:** `src/app/pages/Home.tsx:87-94`
- **심각도:** CRITICAL
- **분류:** Logic

**현상:**
`profile?.point`를 읽어서 더한 뒤 다시 쓰는 read-modify-write 패턴.
빠르게 두 번 클릭하거나 탭 두 개에서 동시에 실행하면 포인트가 누락됨.

**수정 방안:**
BUG-001의 RPC 방식으로 해결. DB 레벨에서 `point = point + N`으로 원자적 처리.

---

### BUG-003. 회원가입 후 추천코드 저장 실패 가능

- **파일:** `src/app/pages/Signup.tsx:39-47`
- **심각도:** CRITICAL
- **분류:** Logic / Timing

**현상:**
`signUp` 직후 `users` 테이블 row가 아직 생성되지 않았을 수 있음 (DB 트리거 타이밍 문제). `update`가 0 rows affected로 조용히 실패.

**문제 코드:**
```js
if (referralCode) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('users')
      .update({ referred_by: referralCode })
      .eq('id', user.id);
  }
}
```

**수정 방안:**
- `signUp`의 `options.data`에 referral_code를 넣고, DB 트리거에서 `auth.users.raw_user_meta_data`를 읽어 `referred_by`를 설정하도록 변경.
- 또는 재시도 로직 추가 (polling with delay).

---

### BUG-004. 추천코드 유효성 검증 없음

- **파일:** `src/app/pages/Signup.tsx:39`
- **심각도:** CRITICAL
- **분류:** Validation

**현상:**
입력된 추천코드가 실제 존재하는 `invite_code`인지 확인하지 않음. 아무 문자열이나 `referred_by`에 저장됨.

**수정 방안:**
회원가입 전에 `users` 테이블에서 `invite_code` 존재 여부를 검증하는 쿼리 추가.

```js
const { data } = await supabase
  .from('users')
  .select('id')
  .eq('invite_code', referralCode)
  .single();

if (!data) {
  setError('Invalid referral code');
  return;
}
```

---

## HIGH - 기능 오류 (6건)

### BUG-005. Activity History가 더미 데이터

- **파일:** `src/app/components/ActivityHistoryModal.tsx:21-83`
- **심각도:** HIGH
- **분류:** Feature Incomplete

**현상:**
`mining_logs` 테이블에서 실제 데이터를 가져오지 않고 하드코딩된 더미 데이터만 표시.

**수정 방안:**
```js
const { data } = await supabase
  .from('mining_logs')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(50);
```

---

### BUG-006. Google OAuth 회원가입 시 닉네임/추천코드 누락

- **파일:** `src/app/pages/Signup.tsx:52-59`
- **심각도:** HIGH
- **분류:** Feature Gap

**현상:**
Google로 가입하면 OAuth 리다이렉트되면서 닉네임, 추천코드 입력 필드를 완전히 건너뜀. `users` 테이블에 `nickname`이 null로 저장됨.

**수정 방안:**
- OAuth 로그인 후 닉네임이 없는 경우 "프로필 완성" 화면으로 리다이렉트.
- 또는 Google 프로필의 `display_name`을 기본값으로 사용.

---

### BUG-007. PRD 위반 - "Ad Boost" 용어 사용

- **파일:** `src/app/components/AdBoostModal.tsx` (파일명), `src/app/components/ActivityHistoryModal.tsx:32`
- **심각도:** HIGH
- **분류:** PRD Compliance

**현상:**
PRD에서 명시적으로 `"Ad Boost" 사용 금지, "Get More Point"로 통일`이라고 했으나, 파일명과 텍스트에서 "Ad Boost"를 사용 중.

**수정 방안:**
- `AdBoostModal.tsx` → `GetMorePointModal.tsx`로 파일명 변경
- 관련 텍스트 모두 "Get More Point"로 통일
- ActivityHistoryModal 내 "Ad Boost Activated" → "Extra Points Earned" 등으로 변경

---

### BUG-008. 광고 보너스 계산 로직이 PRD와 불일치

- **파일:** `src/app/pages/Home.tsx:82`
- **심각도:** HIGH
- **분류:** PRD Compliance

**현상:**
- PRD 기준: 5개 시청 시 채굴 포인트의 5% 보너스 (10 x 0.05 = 0.5)
- 실제 코드: 슬롯당 +1 포인트 고정 (5개 = +5)

**문제 코드:**
```js
const adBonus = activeSlots.length; // +1 per active slot
```

**수정 방안:**
PRD와 맞추려면 퍼센트 기반으로 변경. 단, 0.5포인트 등 소수점이 발생하므로 정책 결정 필요.
```js
const adBonusPercent = activeSlots.length; // 1% per slot
const adBonus = Math.floor(MINING_REWARD * adBonusPercent / 100);
```

---

### BUG-009. 알림 벨 아이콘 미구현

- **파일:** `src/app/components/Layout.tsx:30-33`
- **심각도:** HIGH
- **분류:** Feature Incomplete

**현상:**
빨간 점(dot)이 표시되어 알림이 있는 것처럼 보이지만, 클릭해도 아무 동작도 없음. 사용자 혼란 유발.

**수정 방안:**
- 알림 기능 구현 전이라면 빨간 점 제거
- 또는 클릭 시 "Coming Soon" 모달 표시

---

### BUG-010. "Forgot Password?" 링크 미작동

- **파일:** `src/app/pages/Login.tsx:124`
- **심각도:** HIGH
- **분류:** Feature Incomplete

**현상:**
`href="#"`으로 되어 있어 클릭해도 아무 일도 일어나지 않음.

**수정 방안:**
Supabase의 `resetPasswordForEmail` API 연동 또는 Coming Soon 처리.

---

## MEDIUM - 로직/UX 문제 (6건)

### BUG-011. handleWatchAd에서 setTimeout 내 async 에러 무시

- **파일:** `src/app/pages/Home.tsx:130-149`
- **심각도:** MEDIUM
- **분류:** Error Handling

**현상:**
`setTimeout` 안의 async 콜백 에러는 catch되지 않고 조용히 사라짐. Supabase 호출 실패 시 사용자에게 피드백이 없음.

**문제 코드:**
```js
setTimeout(async () => {
  // 여기서 에러 발생 시 아무 피드백 없음
  await supabase.from('users').update(...);
}, 500);
```

**수정 방안:**
setTimeout 대신 직접 호출하고, try/catch로 에러 핸들링 + 사용자 피드백 추가.

---

### BUG-012. 채굴 성공 후 피드백 없음

- **파일:** `src/app/pages/Home.tsx:75-123`
- **심각도:** MEDIUM
- **분류:** UX

**현상:**
채굴이 완료되어도 "+10 Points!" 같은 토스트/알림이 표시되지 않음. 사용자가 채굴 성공 여부를 인지하기 어려움.

**수정 방안:**
`sonner` 라이브러리가 이미 설치되어 있으므로 toast 활용.
```js
import { toast } from 'sonner';
// 채굴 성공 후
toast.success(`+${totalReward} Points!`);
```

---

### BUG-013. 광고 시청 모달이 center/slot 트리거를 구분하지 않음

- **파일:** `src/app/components/AdBoostModal.tsx`
- **심각도:** MEDIUM
- **분류:** UX

**현상:**
`triggerSource` prop을 받지만 UI는 동일. Center 버튼에서 열릴 때는 "채굴 시작" 맥락인데, 모달 텍스트는 "Watch an ad to earn extra points"로 혼란.

**수정 방안:**
`triggerSource`에 따라 제목과 설명 텍스트를 분기.
- center: "Start Mining - Watch an ad to begin mining"
- slot: "Get More Point - Watch an ad for bonus points"

---

### BUG-014. Contact Support 항목들이 클릭 불가

- **파일:** `src/app/components/ContactSupportModal.tsx:65-84`
- **심각도:** MEDIUM
- **분류:** UX

**현상:**
이메일, 텔레그램, 웹사이트가 텍스트로만 표시되고 `<a>` 태그나 클릭 핸들러가 없어서 탭해서 열 수 없음.

**수정 방안:**
각 항목을 클릭 가능한 링크로 변경.
```jsx
<a href="mailto:support@web3star.com">support@web3star.com</a>
<a href="https://t.me/web3star_support">@web3star_support</a>
```

---

### BUG-015. Login/Signup 변수 섀도잉

- **파일:** `src/app/pages/Login.tsx:19`, `src/app/pages/Signup.tsx:21`
- **심각도:** MEDIUM
- **분류:** Code Quality

**현상:**
상태 변수 `error`와 Supabase 응답의 구조분해 `error`가 같은 이름으로 섀도잉.

**문제 코드:**
```js
const [error, setError] = useState('');
// ...
const { error } = await supabase.auth.signInWithPassword(...);
```

**수정 방안:**
구조분해 변수명 변경: `const { error: authError } = await ...`

---

### BUG-016. Leaderboard 불필요한 재요청

- **파일:** `src/app/pages/Leaderboard.tsx:87`
- **심각도:** MEDIUM
- **분류:** Performance

**현상:**
`useEffect` 의존성이 `[profile]`이므로, 프로필이 바뀔 때마다 (채굴 등) 리더보드 전체를 다시 fetch.

**수정 방안:**
의존성을 `[profile?.point]`로 좁히거나, 수동 새로고침 버튼 방식으로 변경.

---

## LOW - 개선 권장 (3건)

### BUG-017. `<html>` 태그에 `dark` class 없음

- **파일:** `index.html`
- **심각도:** LOW
- **분류:** Styling

**현상:**
`theme.css`에 `.dark` 변형이 정의되어 있지만 `<html>`에 `dark` class가 없음. 현재 UI는 Tailwind 인라인 색상으로 직접 다크 처리 중이라 동작에는 영향 없으나, shadcn/ui 컴포넌트 사용 시 테마 불일치 발생 가능.

**수정 방안:**
`<html lang="en" class="dark">`로 변경.

---

### BUG-018. index.html title이 "Mining App"

- **파일:** `index.html:6`
- **심각도:** LOW
- **분류:** Branding

**현상:**
PRD 기준 앱 이름은 "Web3Star"인데, 브라우저 탭에는 "Mining App"으로 표시.

**수정 방안:**
`<title>Web3Star</title>`로 변경.

---

### BUG-019. Leaderboard Pull-to-Refresh 미구현

- **파일:** `src/app/pages/Leaderboard.tsx`
- **심각도:** LOW
- **분류:** PRD Compliance

**현상:**
PRD에서 Leaderboard에 Pull-to-Refresh를 명시했으나 미구현. 웹앱이라 네이티브 제스처는 어렵지만 대안 필요.

**수정 방안:**
새로고침 버튼 추가 또는 스와이프 라이브러리 적용.

---

## 요약 테이블

| ID       | 심각도   | 분류              | 제목                                       | 파일                        |
|----------|----------|-------------------|--------------------------------------------|------------------------------|
| BUG-001  | CRITICAL | Security          | 포인트 조작 가능                           | Home.tsx:82-94               |
| BUG-002  | CRITICAL | Logic             | 채굴 동시 실행 Race Condition              | Home.tsx:87-94               |
| BUG-003  | CRITICAL | Logic/Timing      | 회원가입 후 추천코드 저장 실패             | Signup.tsx:39-47             |
| BUG-004  | CRITICAL | Validation        | 추천코드 유효성 검증 없음                  | Signup.tsx:39                |
| BUG-005  | HIGH     | Feature           | Activity History 더미 데이터               | ActivityHistoryModal.tsx     |
| BUG-006  | HIGH     | Feature Gap       | Google OAuth 닉네임 누락                   | Signup.tsx:52-59             |
| BUG-007  | HIGH     | PRD Compliance    | "Ad Boost" 용어 사용                       | AdBoostModal.tsx             |
| BUG-008  | HIGH     | PRD Compliance    | 광고 보너스 계산 불일치                    | Home.tsx:82                  |
| BUG-009  | HIGH     | Feature           | 알림 벨 미구현                             | Layout.tsx:30-33             |
| BUG-010  | HIGH     | Feature           | Forgot Password 미작동                     | Login.tsx:124                |
| BUG-011  | MEDIUM   | Error Handling    | setTimeout 내 async 에러 무시              | Home.tsx:130-149             |
| BUG-012  | MEDIUM   | UX                | 채굴 성공 피드백 없음                      | Home.tsx:75-123              |
| BUG-013  | MEDIUM   | UX                | 모달 트리거 구분 없음                      | AdBoostModal.tsx             |
| BUG-014  | MEDIUM   | UX                | Contact Support 클릭 불가                  | ContactSupportModal.tsx      |
| BUG-015  | MEDIUM   | Code Quality      | 변수 섀도잉                                | Login.tsx:19, Signup.tsx:21  |
| BUG-016  | MEDIUM   | Performance       | Leaderboard 불필요한 재요청                | Leaderboard.tsx:87           |
| BUG-017  | LOW      | Styling           | dark class 누락                            | index.html                   |
| BUG-018  | LOW      | Branding          | 타이틀 "Mining App"                        | index.html:6                 |
| BUG-019  | LOW      | PRD Compliance    | Pull-to-Refresh 미구현                     | Leaderboard.tsx              |
