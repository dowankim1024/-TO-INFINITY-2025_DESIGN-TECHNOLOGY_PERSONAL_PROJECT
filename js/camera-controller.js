class CameraController {
    constructor(camera, silhouetteParticles, explosionParticles, renderer, scene) {
        this.camera = camera;
        this.silhouetteParticles = silhouetteParticles;
        this.explosionParticles = explosionParticles;
        this.renderer = renderer;
        this.scene = scene;
        
        // 단순한 상태 관리
        this.isMoving = false;
        this.personDetected = false;
        this.detectionTime = 0;
        this.isExploding = false;
        this.isDarkening = false;
        this.isResetting = false;
        this.explosionTriggered = false; // 폭발이 이미 트리거되었는지 확인
        
        // 카메라 위치 설정
        this.initialZ = APP_CONFIG.CAMERA.INITIAL_Z;
        this.targetZ = APP_CONFIG.CAMERA.TARGET_Z;
        
        // 효과 타이밍
        this.explosionStartTime = 0;
        this.darkeningStartTime = 0;
        this.resetStartTime = 0;
        
        // 배경색 저장
        this.originalBackgroundColor = new THREE.Color(0x000000); // 기본 검은색
        
        // 검은 화면 오버레이 생성
        this.blackOverlay = null;
        this.blackScreenElement = null;
        
        this.init();
    }
    
    init() {
        // 초기 카메라 위치 설정
        this.camera.position.set(0, 0, this.initialZ);
        
        // 검은 화면 요소 생성
        this.createBlackScreen();
    }
    
    createBlackScreen() {
        // HTML 요소로 검은 화면 생성
        this.blackScreenElement = document.createElement('div');
        this.blackScreenElement.style.position = 'fixed';
        this.blackScreenElement.style.top = '0';
        this.blackScreenElement.style.left = '0';
        this.blackScreenElement.style.width = '100%';
        this.blackScreenElement.style.height = '100%';
        this.blackScreenElement.style.backgroundColor = 'black';
        this.blackScreenElement.style.zIndex = '9999';
        this.blackScreenElement.style.opacity = '0';
        this.blackScreenElement.style.pointerEvents = 'none';
        this.blackScreenElement.style.display = 'none';
        
        document.body.appendChild(this.blackScreenElement);
    }
    
    update() {
        // 사람 감지 확인
        this.checkPersonDetection();
        
        // 카메라 이동 처리
        if (this.isMoving) {
            this.moveCamera();
        }
        
        // 폭발 효과 처리
        if (this.isExploding) {
            this.explosionParticles.update(); // 폭발 파티클 업데이트
            this.handleExplosion();
        }
        
        // 화면 어두워지는 효과 처리
        if (this.isDarkening) {
            this.handleDarkening();
        }
        
        // 초기화면 복귀 처리
        if (this.isResetting) {
            this.handleReset();
        }
    }
    
    checkPersonDetection() {
        // 이미 다른 상태에 있으면 무시
        if (this.isMoving || this.isExploding || this.isDarkening || this.isResetting) return;
        
        // 사람 감지 확인
        if (this.silhouetteParticles && this.silhouetteParticles.isPersonDetected()) {
            if (!this.personDetected) {
                this.personDetected = true;
                this.detectionTime = Date.now();
            }
            
            // 설정된 시간 후 카메라 이동 시작
            if (Date.now() - this.detectionTime >= APP_CONFIG.PERSON_DETECTION.DELAY_MS) {
                this.isMoving = true;
            }
        } else {
            this.personDetected = false;
        }
    }
    
    moveCamera() {
        // 카메라를 앞으로 이동 (Z축 감소)
        this.camera.position.z -= APP_CONFIG.CAMERA.MOVEMENT_SPEED;
        
        // 카메라 Z 좌표가 설정된 값 이하가 되면 폭발만 시작 (카메라 이동은 계속)
        if (this.camera.position.z <= APP_CONFIG.CAMERA.EXPLOSION_TRIGGER_Z && !this.explosionTriggered) {
            this.explosionTriggered = true;
            this.startExplosion();
            console.log('🚨 카메라 Z 좌표가 0이 되어 폭발 시작');
        }
        
        // 목표 위치에 도달하면 카메라 이동 정지
        if (this.camera.position.z <= this.targetZ) {
            this.isMoving = false;
            console.log('🚨 목표 위치 도달, 카메라 이동 정지');
        }
        
        // 디버깅을 위한 로그
        console.log(`카메라 위치: z=${this.camera.position.z.toFixed(2)}, 폭발 트리거: ${this.explosionTriggered}`);
    }
    
    startExplosion() {
        this.isExploding = true;
        this.explosionStartTime = Date.now();
        
        // 카메라 앞쪽에서 폭발 효과 시작
        const explosionPosition = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z - 20 // 카메라 앞쪽 20 거리
        };
        
        console.log('🚨 폭발 트리거 - 카메라 위치:', this.camera.position);
        this.explosionParticles.explodeAt(explosionPosition); // 카메라 위치에서 폭발
        console.log('💥 폭발 실행 완료 - 폭발 위치:', explosionPosition);
    }
    
    handleExplosion() {
        const elapsed = Date.now() - this.explosionStartTime;
        
        // 설정된 시간 후 화면 어두워지기 시작
        if (elapsed >= APP_CONFIG.EXPLOSION.DURATION_MS) {
            this.isExploding = false;
            // 폭발 파티클은 계속 자연스럽게 사라지도록 함 (isActive는 그대로 유지)
            this.isDarkening = true;
            this.darkeningStartTime = Date.now();
            console.log('화면 어두워지기 시작');
        }
    }
    
    handleDarkening() {
        const elapsed = Date.now() - this.darkeningStartTime;
        
        // 검은 화면을 서서히 나타나게 하기
        if (this.blackScreenElement) {
            this.blackScreenElement.style.display = 'block';
            
            // 서서히 불투명하게 만들기
            const fadeProgress = Math.min(elapsed / APP_CONFIG.SCREEN_EFFECTS.BLACK_SCREEN_FADE_MS, 1);
            this.blackScreenElement.style.opacity = fadeProgress;
        }
        
        // 설정된 시간 후 초기화면으로 복귀
        if (elapsed >= APP_CONFIG.SCREEN_EFFECTS.BLACK_SCREEN_DURATION_MS) {
            this.isDarkening = false;
            this.isResetting = true;
            this.resetStartTime = Date.now();
            console.log('초기화면으로 복귀 시작');
        }
    }
    
    handleReset() {
        const elapsed = Date.now() - this.resetStartTime;
        
        // 설정된 시간 후 시스템 완전 리셋
        if (elapsed >= APP_CONFIG.SCREEN_EFFECTS.RESET_DELAY_MS) {
            this.resetSystem();
        }
    }
    
    resetSystem() {
        // 카메라를 초기 위치로 즉시 리셋
        this.camera.position.set(0, 0, this.initialZ);
        
        // 배경색을 원래대로 복원
        this.renderer.setClearColor(this.originalBackgroundColor, 1.0);
        
        // 검은 화면 숨기기
        if (this.blackScreenElement) {
            this.blackScreenElement.style.display = 'none';
            this.blackScreenElement.style.opacity = '0';
        }
        
        // 모든 상태 리셋
        this.isMoving = false;
        this.isExploding = false;
        this.isDarkening = false;
        this.isResetting = false;
        this.personDetected = false;
        this.explosionTriggered = false;
        
        // 폭발 파티클 완전 리셋
        this.explosionParticles.reset();
        
        // 타이밍 리셋
        this.detectionTime = 0;
        this.explosionStartTime = 0;
        this.darkeningStartTime = 0;
        this.resetStartTime = 0;
        
        console.log('시스템 완전 리셋 완료, 새로운 사이클 준비');
    }
}
