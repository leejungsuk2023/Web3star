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
          Google Play 데이터 보안(D Data safety) 및 계정 삭제 정책 안내용 페이지입니다.
        </p>

        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">앱 정보</h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-gray-200">앱 이름:</strong> Web3Star
            </li>
            <li>
              <strong className="text-gray-200">가입 방식:</strong> Google 계정으로만 가입·로그인할 수 있습니다.
              (앱 내 이메일/비밀번호 직접 가입 없음)
            </li>
          </ul>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">계정 삭제 요청 방법</h2>
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
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-white">삭제되는 데이터 · 보관</h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-gray-200">삭제 대상(예시):</strong> 앱 사용자 프로필, 포인트, 채굴·보상
              관련 로그 등 서비스 DB에 저장된 해당 계정 데이터.
            </li>
            <li>
              <strong className="text-gray-200">법적 보관:</strong> 관련 법령에 따라 일정 기간 보관이 필요한
              기록은 별도로 분리·최소 보관될 수 있습니다.
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
            <strong>App:</strong> Web3Star. <strong>Sign-in:</strong> Google only. To delete your in-app account
            and related data, email <strong className="text-cyan-600">support@web3star.org</strong> from or clearly
            stating your Google login email with subject or body indicating account deletion. We will verify and
            remove or anonymize your service data; legal retention may apply to minimal records. We cannot delete your
            Google account itself—that must be done in Google Account settings.
          </p>
        </section>
      </main>
    </div>
  );
}
