// 키 → 사운드 파일. 파일 추가/교체는 여기만 수정.
const SOUNDS = {
    1: 'clips/쥐랄쥐랄.wav',
    2: 'clips/요이.wav',
    3: 'clips/아니요아니요.wav',
    4: 'clips/줴줴이야.wav',
    q: 'clips/엄.wav',
    w: 'clips/예.wav',
};
const KEYS = '1234qwerasdfzxcv'; // 런치패드 4x4 배열 순서

// --- YouTube ---
yt.onsubmit = (e) => {
    e.preventDefault();
    const input = yt.querySelector('input');
    const id = input.value.match(
        /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/,
    )?.[1];
    if (id) player.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    input.blur();
};

// --- Launchpad (Web Audio: 미리 디코딩해두고 버퍼 재생 → 지연 없음) ---
const ctx = new AudioContext({ latencyHint: 'interactive' });
const buffers = {},
    padEl = {},
    playing = {};

for (const k of KEYS) {
    const b = document.createElement('button');
    b.className = 'pad';
    b.innerHTML = `<span>${k.toUpperCase()}</span><small>${
        SOUNDS[k]
            ?.split('/')
            .pop()
            .replace(/\.\w+$/, '') ?? ''
    }</small>`;
    b.onpointerdown = () => press(k);
    b.onpointerup = b.onpointerleave = () => release(k);
    pads.append(b);
    padEl[k] = b;
    if (SOUNDS[k])
        fetch(SOUNDS[k])
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
            .then((a) => ctx.decodeAudioData(a))
            .then((buf) => {
                buffers[k] = buf;
                b.classList.add('ready');
            })
            .catch((err) => console.warn('로드 실패', SOUNDS[k], err));
}

function press(k) {
    if (!buffers[k]) return;
    if (ctx.state !== 'running') ctx.resume();
    playing[k]?.stop(); // 같은 패드 다시 누르면 이전 소리 끊기
    const src = (playing[k] = ctx.createBufferSource());
    src.buffer = buffers[k];
    src.connect(ctx.destination);
    src.start();
    padEl[k].classList.add('active');
}
const release = (k) => padEl[k]?.classList.remove('active');

// e.code 사용 → 한글 IME 상태여도 동작
const keyOf = (e) => e.code.replace(/^(Key|Digit)/, '').toLowerCase();
addEventListener('keydown', (e) => {
    if (!e.repeat && e.target.tagName !== 'INPUT') press(keyOf(e));
});
addEventListener('keyup', (e) => release(keyOf(e)));

// 유튜브 iframe이 포커스를 가져가면 키보드가 안 먹음 → 클릭은 전달되고 포커스만 되찾아옴
addEventListener('blur', () =>
    setTimeout(() => {
        if (document.activeElement?.tagName === 'IFRAME') {
            document.activeElement.blur();
            window.focus();
        }
    }),
);
