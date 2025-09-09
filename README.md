# To Infinity - Interactive Particle Universe

## 2025 부산대학교 디자인앤테크놀로지전공 졸업전시 개인작품 - 김도완 

## 프로젝트 개요
- 클로즈업을 한다는 행위는, 사실상 그 본질을 명확히 파악하려는 시도가 아닌, 해석이 불가능한 것에 대한 무한한 탐구이다.
- 삶도 마찬가지이다. 목적이 있고 이를 향해 달려가는 듯해 보이지만, 실상 목적 달성 이후 삶이 끝나는 것이 아니다. 사실상 목표가 있는 척하지만 이와 별개로 무한한 확대, 달려가는것이 살아간다는 것이다. 이는 목적을 망각한채 무한한 탐구만을 남긴다는 점에서 클로즈업과 유사하다.
- 이 프로젝트는 **Three.js**와 **MediaPipe**를 사용하여 실시간으로 사람을 인식하고, 그 실루엣에 파티클을 생성하는 인터랙티브 웹 애플리케이션이다. 배경에는 Perlin 노이즈를 사용한 자연스러운 파티클 애니메이션이 있고, 사용자가 웹캠 앞에 서면 실루엣 모양으로 파티클이 생성됩니다. 이후 확대가 진행되고, 그 끝에는 다시 처음의 무한한 우주만이 남아있다.

## 파일 구조

```
/Users/dowankim/Documents/personal/
├── index.html                    # 메인 HTML 파일
├── style.css                     # CSS 스타일시트
├── asset.png                     # 파티클에 사용되는 텍스처 이미지
├── js/                          # JavaScript 모듈 디렉토리
│   ├── background-particles.js   # 배경 파티클 시스템
│   ├── silhouette-particles.js   # 실루엣 파티클 시스템 (MediaPipe)
│   └── app.js                   # 메인 애플리케이션
└── README.md                    # 프로젝트 설명서
```

## 📁 파일별 상세 설명

### 1. `index.html` - 메인 HTML 파일

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Particle Universe</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- 웹캠 비디오 (숨김 처리) -->
    <video id="webcam" autoplay muted playsinline style="display:none;"></video>
    
    <!-- MediaPipe 마스크 처리를 위한 캔버스 (숨김 처리) -->
    <canvas id="maskCanvas" style="display:none; visibility:hidden;"></canvas>
    
    <!-- 디버그용 캔버스 (사람 인식 영역을 빨간색으로 표시) -->
    <canvas id="debugCanvas" style="position:fixed; top:0; left:0; z-index:10;"></canvas>
    
    <!-- 외부 라이브러리들 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/simplex-noise/2.4.0/simplex-noise.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
    
    <!-- 우리가 만든 모듈들 -->
    <script src="js/background-particles.js"></script>
    <script src="js/silhouette-particles.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

**역할:**
- 웹페이지의 기본 구조를 정의
- 웹캠, 마스크 캔버스, 디버그 캔버스 등 필요한 DOM 요소들을 생성
- Three.js, SimplexNoise, MediaPipe 등 외부 라이브러리를 로드
- 우리가 만든 JavaScript 모듈들을 순서대로 로드

**사용된 기능:**
- `autoplay muted playsinline`: 웹캠 자동 재생 (음소거, 인라인 재생)
- `display:none`: 요소를 화면에서 숨김
- `visibility:hidden`: 요소를 완전히 숨김 (레이아웃에 영향 없음)
- `position:fixed`: 디버그 캔버스를 화면 고정 위치에 배치

### 2. `style.css` - CSS 스타일시트

```css
body {
    margin: 0;
    overflow: hidden;
    background-color: #000000;
}

canvas {
    display: block;
}

#maskCanvas {
    display: none !important;
    visibility: hidden !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
}
```

**역할:**
- 웹페이지의 기본 스타일을 정의
- 배경을 검은색으로 설정하여 파티클이 잘 보이도록 함
- 마스크 캔버스를 완전히 숨김 처리

**사용된 기능:**
- `margin: 0`: 기본 여백 제거
- `overflow: hidden`: 스크롤바 숨김
- `display: block`: 캔버스를 블록 요소로 설정
- `!important`: CSS 우선순위 강제 적용

### 3. `asset.png` - 파티클 텍스처 이미지

**역할:**
- 배경 파티클에 적용되는 텍스처 이미지
- 파티클의 모양과 색상을 결정
- 투명한 PNG 형식으로 배경과 자연스럽게 블렌딩

### 4. `js/background-particles.js` - 배경 파티클 시스템

```javascript
class BackgroundParticles {
    constructor(scene, particleCount = 20000) {
        this.scene = scene;
        this.particleCount = particleCount;
        this.noise = new SimplexNoise();
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    init() {
        // 파티클 생성
        this.textureLoader = new THREE.TextureLoader();
        this.particleTexture = this.textureLoader.load('./asset.png');
        this.particles = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);

        // 파티클 위치 초기화
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            this.positions[i3 + 0] = (Math.random() - 0.5) * 1000; // X축
            this.positions[i3 + 1] = (Math.random() - 0.5) * 1000; // Y축
            this.positions[i3 + 2] = (Math.random() - 0.5) * 1000; // Z축
            
            this.velocities[i3 + 0] = 0; // X축 속도
            this.velocities[i3 + 1] = 0; // Y축 속도
            this.velocities[i3 + 2] = 0; // Z축 속도
        }

        this.particles.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

        // 파티클 재질 설정
        this.particleMaterial = new THREE.PointsMaterial({
            size: 2,                    // 파티클 크기
            map: this.particleTexture,  // 텍스처 이미지
            transparent: true,          // 투명도 사용
            alphaTest: 0.1,            // 투명도 임계값
            blending: THREE.AdditiveBlending, // 블렌딩 모드
        });

        // 파티클 시스템 생성 및 씬에 추가
        this.particleSystem = new THREE.Points(this.particles, this.particleMaterial);
        this.scene.add(this.particleSystem);
    }
    
    update() {
        const time = this.clock.getElapsedTime();
        const positions = this.particleSystem.geometry.attributes.position.array;

        const noiseScale = 0.005;    // 노이즈의 공간적 스케일
        const timeScale = 0.1;       // 노이즈의 시간적 변화 속도
        const forceStrength = 0.8;   // 파티클에 가해지는 힘의 세기

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const x = positions[i3 + 0];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];

            // 4D Perlin 노이즈를 사용하여 자연스러운 움직임 생성
            const noiseX = this.noise.noise4D(x * noiseScale, y * noiseScale, z * noiseScale, time * timeScale) * forceStrength;
            const noiseY = this.noise.noise4D(y * noiseScale, z * noiseScale, x * noiseScale, time * timeScale) * forceStrength;
            const noiseZ = this.noise.noise4D(z * noiseScale, x * noiseScale, y * noiseScale, time * timeScale) * forceStrength;

            // 계산된 힘을 현재 위치에 더해줍니다
            positions[i3 + 0] += noiseX;
            positions[i3 + 1] += noiseY;
            positions[i3 + 2] += noiseZ;
        }

        // Three.js에게 파티클 위치가 변경되었음을 알려줍니다
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
}
```

**역할:**
- 배경에 표시되는 20,000개의 파티클을 관리
- Perlin 노이즈를 사용하여 자연스러운 파티클 애니메이션 생성
- 텍스처 이미지를 파티클에 적용

**사용된 기능:**
- `THREE.BufferGeometry`: 대량의 파티클을 효율적으로 처리
- `THREE.PointsMaterial`: 파티클의 외형과 재질 설정
- `THREE.Points`: 파티클 시스템 생성
- `SimplexNoise`: 자연스러운 랜덤 움직임 생성
- `THREE.Clock`: 시간 기반 애니메이션
- `AdditiveBlending`: 파티클들이 겹칠 때 밝게 블렌딩

**핵심 개념:**
- **BufferGeometry**: GPU에서 효율적으로 처리할 수 있는 형식으로 기하학적 데이터 저장
- **Perlin Noise**: 자연스러운 랜덤 패턴을 생성하는 알고리즘
- **4D Noise**: 3D 공간 + 시간을 사용하여 시간에 따라 변화하는 패턴 생성

### 5. `js/silhouette-particles.js` - 실루엣 파티클 시스템

```javascript
class SilhouetteParticles {
    constructor(scene, camera, particleCount = 20000) {
        this.scene = scene;
        this.camera = camera;
        this.particleCount = particleCount;
        this.debugMode = true;
        
        this.init();
        this.setupMediaPipe();
    }
    
    init() {
        // DOM 요소들 가져오기
        this.video = document.getElementById('webcam');
        this.maskCanvas = document.getElementById('maskCanvas');
        this.debugCanvas = document.getElementById('debugCanvas');
        this.maskCtx = this.maskCanvas.getContext('2d');
        this.debugCtx = this.debugCanvas.getContext('2d');

        // 캔버스 크기 설정
        this.maskCanvas.width = 640;
        this.maskCanvas.height = 480;
        this.debugCanvas.width = 640;
        this.debugCanvas.height = 480;

        // 실루엣 파티클을 위한 별도 시스템
        this.silhouetteGeometry = new THREE.BufferGeometry();
        this.silhouettePositions = new Float32Array(this.particleCount * 3);
        
        // 모든 파티클을 초기 위치(0,0,0)로 설정
        for (let i = 0; i < this.particleCount; i++) {
            this.silhouettePositions[i * 3] = 0;     // X축
            this.silhouettePositions[i * 3 + 1] = 0; // Y축
            this.silhouettePositions[i * 3 + 2] = 0; // Z축
        }
        
        this.silhouetteGeometry.setAttribute('position', new THREE.BufferAttribute(this.silhouettePositions, 3));

        // 실루엣 파티클 재질 설정
        this.silhouetteMaterial = new THREE.PointsMaterial({
            color: 0xffffff,                    // 흰색
            size: 1.0,                          // 파티클 크기
            transparent: true,                  // 투명도 사용
            alphaTest: 0.01,                    // 투명도 임계값
            opacity: 0.8,                       // 투명도
            depthWrite: false,                  // 깊이 쓰기 비활성화
            blending: THREE.AdditiveBlending    // 블렌딩 모드
        });

        // 실루엣 파티클 시스템 생성 및 씬에 추가
        this.silhouetteSystem = new THREE.Points(this.silhouetteGeometry, this.silhouetteMaterial);
        this.scene.add(this.silhouetteSystem);
    }
    
    // 카메라 뷰 크기 계산 헬퍼 함수
    getViewSizeAtDepth(camera, depth) {
        const vFOV = THREE.MathUtils.degToRad(camera.fov);  // 수직 시야각을 라디안으로 변환
        const height = 2 * Math.tan(vFOV / 2) * depth;      // 깊이에서의 높이 계산
        const width = height * camera.aspect;               // 가로세로 비율에 따른 너비 계산
        return { width, height };
    }
    
    setupMediaPipe() {
        // MediaPipe SelfieSegmentation 설정
        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        this.selfieSegmentation.setOptions({ modelSelection: 1 });

        // MediaPipe 결과 처리 함수
        this.selfieSegmentation.onResults((results) => {
            // 마스크 캔버스 초기화
            this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            
            // MediaPipe에서 받은 분할 마스크를 캔버스에 그리기
            this.maskCtx.drawImage(results.segmentationMask, 0, 0, this.maskCanvas.width, this.maskCanvas.height);
            
            // 캔버스에서 픽셀 데이터 추출
            const imageData = this.maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            const data = imageData.data;

            // 디버그 모드일 때 디버그 캔버스 초기화
            if (this.debugMode) {
                this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
            }

            const posAttr = this.silhouetteGeometry.attributes.position.array;
            let pIndex = 0;
            
            // 마스크 데이터를 4픽셀 간격으로 샘플링
            for (let y = 0; y < this.maskCanvas.height; y += 4) {
                for (let x = 0; x < this.maskCanvas.width; x += 4) {
                    const i = (y * this.maskCanvas.width + x) * 4; // RGBA 데이터 인덱스
                    
                    // 사람 영역인지 확인 (알파값이 200 이상)
                    if (data[i] > 200 && pIndex < this.particleCount) {
                        // 2D 픽셀 좌표를 NDC(Normalized Device Coordinates)로 변환
                        let ndcX = (x / this.maskCanvas.width) * 2 - 1;   // -1 ~ 1 범위
                        let ndcY = -((y / this.maskCanvas.height) * 2 - 1); // -1 ~ 1 범위 (Y축 뒤집기)
                        
                        // 카메라 뷰 크기에 맞춰 스케일 계산
                        const viewSize = this.getViewSizeAtDepth(this.camera, this.camera.position.z);
                        const scaleY = viewSize.height * 0.8; // 화면 높이의 80%
                        const scaleX = scaleY * (this.maskCanvas.width / this.maskCanvas.height); // 비율 유지
                        
                        // NDC를 3D 월드 좌표로 변환
                        posAttr[pIndex * 3] = ndcX * scaleX;     // X축
                        posAttr[pIndex * 3 + 1] = ndcY * scaleY; // Y축
                        posAttr[pIndex * 3 + 2] = 0;             // Z축 고정
                        
                        // 디버그 모드일 때 빨간색 점으로 표시
                        if (this.debugMode) {
                            this.debugCtx.fillStyle = 'red';
                            this.debugCtx.fillRect(x, y, 1, 1);
                        }
                        pIndex++;
                    }
                }
            }
            
            // 사용되지 않은 파티클들을 화면 밖으로 이동
            for (let i = pIndex; i < this.particleCount; i++) {
                posAttr[i * 3] = 10000;     // X축
                posAttr[i * 3 + 1] = 10000; // Y축
                posAttr[i * 3 + 2] = 10000; // Z축
            }
            
            // Three.js에게 파티클 위치가 변경되었음을 알려줍니다
            this.silhouetteGeometry.attributes.position.needsUpdate = true;
        });

        // 카메라 유틸리티 설정
        this.cameraUtils = new Camera(this.video, {
            onFrame: async () => { 
                await this.selfieSegmentation.send({ image: this.video }); 
            },
            width: 640,
            height: 480
        });
        this.cameraUtils.start();
    }
    
    // 디버그 모드 설정
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}
```

**역할:**
- MediaPipe를 사용하여 실시간으로 사람을 인식
- 인식된 사람의 실루엣에 파티클을 생성
- 디버그 모드로 사람 인식 영역을 시각적으로 표시

**사용된 기능:**
- **MediaPipe SelfieSegmentation**: 실시간 사람 분할
- **Canvas API**: 마스크 데이터 처리 및 디버그 시각화
- **THREE.BufferGeometry**: 실루엣 파티클 관리
- **좌표 변환**: 2D 픽셀 좌표 → NDC → 3D 월드 좌표

**핵심 개념:**
- **Image Segmentation**: 이미지에서 특정 객체(사람)를 분리하는 기술
- **NDC (Normalized Device Coordinates)**: -1 ~ 1 범위의 정규화된 좌표계
- **좌표 변환**: 2D 화면 좌표를 3D 공간 좌표로 변환하는 과정
- **픽셀 샘플링**: 마스크 데이터를 일정 간격으로 읽어서 파티클 위치 결정

### 6. `js/app.js` - 메인 애플리케이션

```javascript
class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.backgroundParticles = null;
        this.silhouetteParticles = null;
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Three.js 기본 설정
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.z = 100; // 파티클을 더 잘 보기 위해 카메라를 뒤로 이동

        // 배경 파티클 시스템 초기화
        this.backgroundParticles = new BackgroundParticles(this.scene);
        
        // 실루엣 파티클 시스템 초기화
        this.silhouetteParticles = new SilhouetteParticles(this.scene, this.camera);
    }
    
    setupEventListeners() {
        // 윈도우 리사이즈 이벤트 처리
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 배경 파티클 업데이트
        this.backgroundParticles.update();
        
        // 렌더링
        this.renderer.render(this.scene, this.camera);
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
```

**역할:**
- 전체 애플리케이션의 진입점
- Three.js 기본 설정 (Scene, Camera, Renderer)
- 다른 모듈들을 초기화하고 연결
- 애니메이션 루프 관리
- 이벤트 리스너 설정

**사용된 기능:**
- `THREE.Scene`: 3D 장면 관리
- `THREE.PerspectiveCamera`: 원근 투영 카메라
- `THREE.WebGLRenderer`: WebGL 기반 렌더러
- `requestAnimationFrame`: 부드러운 애니메이션을 위한 브라우저 API
- `DOMContentLoaded`: DOM이 완전히 로드된 후 실행

**핵심 개념:**
- **Scene Graph**: 3D 객체들의 계층 구조
- **Camera**: 3D 공간을 2D 화면으로 투영하는 시점
- **Renderer**: 3D 장면을 실제로 화면에 그리는 엔진
- **Animation Loop**: 매 프레임마다 실행되는 업데이트 루프

## 라이브러리

### 1. Three.js (r128)
- **역할**: 3D 그래픽스 라이브러리
- **주요 기능**: 
  - 3D 장면, 카메라, 렌더러 관리
  - 파티클 시스템
  - 기하학적 객체 생성
  - 재질과 텍스처 처리

### 2. SimplexNoise (2.4.0)
- **역할**: 자연스러운 랜덤 패턴 생성
- **주요 기능**:
  - Perlin 노이즈 알고리즘
  - 4D 노이즈 지원 (3D 공간 + 시간)
  - 부드럽고 자연스러운 랜덤 값 생성

### 3. MediaPipe SelfieSegmentation
- **역할**: 실시간 사람 분할
- **주요 기능**:
  - 웹캠 영상에서 사람 영역 자동 인식
  - 실시간 마스크 생성
  - 높은 정확도와 빠른 처리 속도

### 4. MediaPipe Camera Utils
- **역할**: 웹캠 관리
- **주요 기능**:
  - 웹캠 스트림 처리
  - 프레임별 콜백 처리
  - 카메라 설정 관리

## 사용법

1. **웹페이지 로드**: 자동으로 배경 파티클이 시작됩니다
2. **웹캠 앞에 서기**: 사람이 인식되면 실루엣 파티클이 생성됩니다
3. **디버그 모드**: 빨간색 점으로 사람 인식 영역을 확인할 수 있습니다
4. **움직이기**: 사람이 움직이면 실루엣 파티클도 따라 움직입니다

## 설정 옵션

### 배경 파티클 설정
```javascript
// js/background-particles.js에서 수정 가능
const particleCount = 20000;        // 파티클 개수
const noiseScale = 0.005;          // 노이즈 스케일
const timeScale = 0.1;             // 시간 변화 속도
const forceStrength = 0.8;         // 움직임 강도
```

### 실루엣 파티클 설정
```javascript
// js/silhouette-particles.js에서 수정 가능
const particleCount = 20000;        // 파티클 개수
const debugMode = true;            // 디버그 모드
const scaleY = viewSize.height * 0.8; // 실루엣 크기
```

## 문제 해결

### 1. 웹캠이 작동하지 않는 경우
- HTTPS 또는 localhost에서만 실행
- 브라우저에서 웹캠 권한 확인
- 다른 애플리케이션에서 웹캠 사용 중인지 확인

### 2. 파티클이 보이지 않는 경우
- 웹 서버를 통해 실행하고 있는지 확인
- 브라우저 콘솔에서 오류 메시지 확인
- asset.png 파일이 올바른 위치에 있는지 확인

### 3. 성능이 느린 경우
- 파티클 개수를 줄이기 (particleCount 값 감소)
- 브라우저 하드웨어 가속 확인
- 다른 탭이나 애플리케이션 종료

## 확장

1. **파티클 효과 추가**: 색상 변화, 크기 변화, 회전 효과
2. **사운드 반응형**: 음악에 반응하는 파티클
3. **다중 인식**: 여러 사람 동시 인식
4. **AR 효과**: 얼굴 필터, 가상 객체 추가
5. **인터랙션**: 마우스/터치로 파티클 조작

## 📚 학습 자료

- [Three.js 공식 문서](https://threejs.org/docs/)
- [MediaPipe 공식 문서](https://mediapipe.dev/)
- [WebGL 기초](https://webglfundamentals.org/)
- [Canvas API 문서](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---
