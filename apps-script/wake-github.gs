/**
 * 오늘의 시사 — 아침 깨우기 (구글 타이머 → 깃허브 실행 요청)
 * ------------------------------------------------------------
 * 깃허브 예약 실행은 늦거나 빠지는 날이 있어서, 구글 타이머가 매일 아침 5~6시와 7~8시(예비)에
 * "오늘 학습지가 없으면 만들어 줘"라고 깃허브에 한 번 더 요청합니다.
 * 이미 만들어져 있으면 깃허브가 몇 초 만에 끝내므로 제미나이·유튜브를 더 쓰지 않습니다.
 *
 * 설치 (한 번만)
 * 1. script.google.com → [새 프로젝트] → 이 파일 전체를 붙여 넣고 저장(💾). 이름: 오늘의 시사 깨우기
 * 2. 왼쪽 톱니바퀴 [프로젝트 설정] → 맨 아래 [스크립트 속성 추가]
 *      속성: GH_TOKEN    값: 깃허브에서 만든 토큰 (github_pat_로 시작)
 *    → [스크립트 속성 저장]
 * 3. 위쪽 함수 목록에서 setup 을 고르고 [실행] → 권한 허용
 *    ("확인되지 않은 앱"이 나오면 [고급] → [(안전하지 않음)으로 이동])
 * 4. 함수 목록에서 wakeGithub 를 고르고 [실행] → 아래 실행 로그에 "요청 보냄" 이 나오면 성공
 *
 * 토큰은 이 스크립트 속성에만 두고, 채팅·문서·코드에 붙여 넣지 마세요.
 */

const REPO = 'today-sisa/today-sisa.github.io';
const WORKFLOW = 'daily.yml';

/** 평일 아침에 깃허브에 '없을 때만 만들기' 요청 */
function wakeGithub() {
  const now = new Date();
  const day = Number(Utilities.formatDate(now, 'Asia/Seoul', 'u'));  // 1=월 … 7=일
  if (day > 5) { Logger.log('주말이라 건너뜀'); return; }
  const token = PropertiesService.getScriptProperties().getProperty('GH_TOKEN');
  if (!token) throw new Error('스크립트 속성에 GH_TOKEN 이 없습니다.');
  const res = UrlFetchApp.fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
    payload: JSON.stringify({ ref: 'main', inputs: { mode: '없을 때만 만들기' } }),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code === 204) { Logger.log('요청 보냄 (' + Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm') + ')'); return; }
  throw new Error('깃허브 요청 실패 ' + code + ': ' + res.getContentText().slice(0, 300) +
    (code === 401 ? '\n→ 토큰이 틀렸거나 기한이 지났어요. 새 토큰을 만들어 GH_TOKEN 을 바꿔 주세요.' : ''));
}

/** 처음 한 번 실행: 매일 아침 5~6시, 7~8시(한국) 타이머 두 개 만들기. 여러 번 실행해도 두 개만 남습니다.
 *  7~8시 것은 예비: 오늘 학습지가 이미 있으면 깃허브가 몇 초 만에 끝냅니다. */
function setup() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'wakeGithub').forEach(t => ScriptApp.deleteTrigger(t));
  [5, 7].forEach(h => ScriptApp.newTrigger('wakeGithub').timeBased().everyDays(1).atHour(h).inTimezone('Asia/Seoul').create());
  Logger.log('타이머 설정 완료: 매일 아침 5~6시, 7~8시 (주말은 자동으로 건너뜀)');
}
