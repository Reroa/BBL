# Baseball 3D Starter

무료 에셋을 나중에 꽂을 수 있도록 만든 Three.js + Vite 기반 3D 야구 프로토타입입니다.

## 현재 기능
- 3D 야구장 프로토타입
- 투구
- 스윙
- 타이밍 기반 컨택 판정
- 타구 포물선/바운드 물리
- 타구 추적 카메라
- 모바일 SWING/PITCH 버튼
- 키보드 SPACE / R

## 로컬 실행
```bash
npm install
npm run dev
```

## 빌드
```bash
npm run build
```

## 무료 에셋 넣을 위치
- `public/assets/models/` : 선수, 야구장, 배트, 글러브, 공 GLB
- `public/assets/animations/` : 애니메이션 GLB/FBX 변환본
- `public/assets/audio/` : 타격음, 글러브음, 관중음

## 다음 교체 순서
1. placeholder 타자 → rigged player.glb
2. placeholder 투수 → rigged player.glb
3. bat mesh → 무료 배트 GLB
4. field geometry → 무료 야구장 GLB
5. 스윙/투구 → Mixamo 또는 CC0 애니메이션
6. `AnimationMixer`로 애니메이션 재생

Three.js 0.186.1 기준.
