import { Link } from 'react-router';

/**
 * Google Play Console「계정 삭제」URL용 공개 페이지. 로그인 없이 열려야 함.
 * 배포 도메인: https://web3star.org/account-deletion (basename 없을 때)
 */
export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-300">
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
            ← Web3Star
          </Link>
          <Link
            to="/privacy"
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Privacy Policy
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 pb-16">
        <h1 className="mb-2 text-3xl font-bold text-white">Web3Star — 계정 및 데이터 삭제</h1>
        <p className="mb-8 text-sm text-gray-500">
          Google Play 스토어 등록정보에 표시되는 계정 삭제 안내 페이지입니다. (데이터 보안·계정 삭제 URL 요건)
        </p>

        <section className="mb-8 rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-4 text-sm leading-relaxed">
          <h2 className="mb-2 text-base font-semibold text-cyan-200">앱 안에 삭제 버튼이 없어도 되나요?</h2>
          <p className="text-gray-300">
            Google Play는 사용자가 <strong className="text-white">계정·관련 데이터 삭제를 요청할 수 있는 눈에 띄는 방법</strong>
            (예: 이 페이지의 이메일 절차)이 있으면 됩니다.{' '}
            <strong className="text-white">앱 설정에 자동 &quot;계정 삭제&quot; 버튼이 있는 것은 필수가 아닙니다.</strong>
            현재 Web3Star는 앱 내 원클릭 삭제 UI 대신, 아래 이메일로 요청하시면 운영팀이 본인 확인 후 서비스 데이터를
            삭제하거나 익명화합니다.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">앱 · 개발자 정보</h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-gray-200">스토어에 표시되는 앱 이름:</strong> Web3Star
            </li>
            <li>
              <strong className="text-gray-200">문의·삭제 처리 연락처:</strong>{' '}
              <span className="font-mono text-cyan-300">support@web3star.org</span> (동일 주체로 요청 접수)
            </li>
            <li>
              <strong className="text-gray-200">가입 방식:</strong> Google 계정으로만 가입·로그인할 수 있습니다.
              (앱 내 이메일/비밀번호 직접 가입 없음)
            </li>
          </ul>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">계정 삭제 요청 방법 (단계)</h2>
          <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed">
            <li>
              이 앱에 로그인한 <strong className="text-gray-200">Google 계정 이메일 주소</strong>를 확인합니다.
            </li>
            <li>
              아래 이메일로 <strong className="text-gray-200">「Web3Star 계정 삭제 요청」</strong>이라는 제목 또는 본문에
              요청이 드러나게 메일을 보냅니다.
              <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-3 font-mono text-cyan-300">
                support@web3star.org
              </div>
            </li>
            <li>
              본인 확인을 위해 <strong className="text-gray-200">로그인에 사용한 Google 이메일</strong>을 반드시
              적어 주세요. 다른 주소에서내면 처리가 지연되거나 거절될 수 있습니다.
            </li>
            <li>
              운영팀이 확인 후, 해당 Google 계정과 연결된 <strong className="text-gray-200">앱 내 프로필·포인트·
              활동 기록(예: 채굴 로그)</strong> 등 서비스 데이터를 삭제하거나 익명화합니다. 처리 결과는 가능한 범위에서
              회신 메일로 안내합니다.
            </li>
          </ol>
          <p className="mt-4 rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-400">
            <strong className="text-gray-200">처리 시점:</strong> 본인 확인이 끝난 뒤 합리적인 기간 안에 삭제 또는
            익명화를 진행합니다. (접수량·확인 절차에 따라 다소 지연될 수 있습니다.)
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">삭제되는 데이터 유형 · 보관되는 데이터 · 기간</h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-gray-200">삭제·익명화 대상(유형):</strong> 해당 Google 로그인과 연결된{' '}
              <strong className="text-gray-200">사용자 프로필</strong>, <strong className="text-gray-200">포인트</strong>,{' '}
              <strong className="text-gray-200">채굴·보상·활동 관련 로그</strong> 등 앱 서비스 DB에 저장된 본인 식별
              가능한 데이터.
            </li>
            <li>
              <strong className="text-gray-200">추가로 보관될 수 있는 데이터:</strong> 세금·분쟁 대응 등{' '}
              <strong className="text-gray-200">관련 법령에 따라 보관 의무가 있는 기록</strong>만 최소한으로 분리
              보관될 수 있습니다.
            </li>
            <li>
              <strong className="text-gray-200">법적 보관 기간:</strong> 해당 항목마다 적용 법령이 정한 기간이며,
              의무가 종료된 뒤에는 삭제 또는 추가 익명화 조치를 취합니다. (구체 기간은 기록 종류·관할에 따라 다릅니다.)
            </li>
            <li>
              <strong className="text-gray-200">Google 계정 자체:</strong> Google 계정의 삭제·해지는 Google
              계정 설정에서 직접 진행해야 하며, 본 앱 운영팀이 Google 계정을 삭제할 수는 없습니다.
            </li>
          </ul>
        </section>

        <section className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 text-xs leading-relaxed text-gray-500">
          <p className="mb-2 font-medium text-gray-400">English (for store reviewers)</p>
          <p>
            <strong>App (store listing name):</strong> Web3Star. <strong>Developer contact:</strong>{' '}
            support@web3star.org. <strong>Sign-in:</strong> Google only.{' '}
            <strong>No in-app self-service delete button</strong>—deletion is requested by email (see steps above).
            We verify your Google login email, then delete or anonymize profile, points, and activity/mining logs tied
            to your account. <strong>Retention:</strong> where law requires retention, minimal records are kept for the
            period required by applicable law; we cannot delete your Google account itself (use Google Account
            settings).
          </p>
        </section>
      </main>
    </div>
  );
}
