class SilhouetteParticles {
    constructor(scene, camera, particleCount = APP_CONFIG.SILHOUETTE_PARTICLES.COUNT) {
        this.scene = scene;
        this.camera = camera;
        this.particleCount = particleCount;
        this.debugMode = false;
        this.visibleParticleCount = 0;
        
        this.init();
        this.setupMediaPipe();
    }
    
    init() {
        // DOM 요소들
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
        this.textureLoader = new THREE.TextureLoader();
        this.particleTexture = this.textureLoader.load('./asset.png');
        this.silhouetteGeometry = new THREE.BufferGeometry();
        this.silhouettePositions = new Float32Array(this.particleCount * 3);
        for (let i = 0; i < this.particleCount; i++) {
            this.silhouettePositions[i * 3] = 0;
            this.silhouettePositions[i * 3 + 1] = 0;
            this.silhouettePositions[i * 3 + 2] = 0;
        }
        this.silhouetteGeometry.setAttribute('position', new THREE.BufferAttribute(this.silhouettePositions, 3));

        this.silhouetteMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: APP_CONFIG.SILHOUETTE_PARTICLES.SIZE,
            transparent: true,
            alphaTest: APP_CONFIG.SILHOUETTE_PARTICLES.ALPHA_TEST,
            opacity: APP_CONFIG.SILHOUETTE_PARTICLES.OPACITY,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            map: this.particleTexture,
            sizeAttenuation: true // 카메라 거리에 따른 크기 조정 활성화
        });

        this.silhouetteSystem = new THREE.Points(this.silhouetteGeometry, this.silhouetteMaterial);
        this.silhouetteGeometry.setDrawRange(0, 0);
        this.scene.add(this.silhouetteSystem);
    }
    
    // 카메라 뷰 크기 계산 헬퍼 함수
    getViewSizeAtDepth(camera, depth) {
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * depth;
        const width = height * camera.aspect;
        return { width, height };
    }

    getSamplingStep() {
        const { REDUCTION_START_Z, FULL_REDUCTION_Z, BASE_SAMPLE_STEP, MAX_SAMPLE_STEP } = APP_CONFIG.SILHOUETTE_PARTICLES;
        const zoomRange = Math.max(REDUCTION_START_Z - FULL_REDUCTION_Z, 0.0001);
        const rawProgress = THREE.MathUtils.clamp((REDUCTION_START_Z - this.camera.position.z) / zoomRange, 0, 1);
        const zoomProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);
        return Math.round(THREE.MathUtils.lerp(BASE_SAMPLE_STEP, MAX_SAMPLE_STEP, zoomProgress));
    }
    
    setupMediaPipe() {
        // MediaPipe 설정
        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        this.selfieSegmentation.setOptions({ modelSelection: 1 });

        this.selfieSegmentation.onResults((results) => {
            this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            this.maskCtx.drawImage(results.segmentationMask, 0, 0, this.maskCanvas.width, this.maskCanvas.height);
            const imageData = this.maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            const data = imageData.data;

            if (this.debugMode) {
                this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
            }

            const posAttr = this.silhouetteGeometry.attributes.position.array;
            let pIndex = 0;
            const samplingStep = this.getSamplingStep();
            const viewSize = this.getViewSizeAtDepth(this.camera, Math.max(this.camera.position.z, 0.1));
            const scaleY = viewSize.height * 0.8; // 화면 높이의 80%로 설정
            const scaleX = scaleY * (this.maskCanvas.width / this.maskCanvas.height); // 비율 유지
            
            for (let y = 0; y < this.maskCanvas.height && pIndex < this.particleCount; y += samplingStep) {
                for (let x = 0; x < this.maskCanvas.width && pIndex < this.particleCount; x += samplingStep) {
                    const i = (y * this.maskCanvas.width + x) * 4;
                    if (data[i] > 200 && pIndex < this.particleCount) {
                        let ndcX = (x / this.maskCanvas.width) * 2 - 1;
                        let ndcY = -((y / this.maskCanvas.height) * 2 - 1);

                        posAttr[pIndex * 3] = -ndcX * scaleX;
                        posAttr[pIndex * 3 + 1] = ndcY * scaleY;
                        posAttr[pIndex * 3 + 2] = 0; // Z축 고정
                        
                        if (this.debugMode) {
                            this.debugCtx.fillStyle = 'red';
                            this.debugCtx.fillRect(x, y, 1, 1);
                        }
                        pIndex++;
                    }
                }
            }

            this.visibleParticleCount = pIndex;
            this.silhouetteGeometry.setDrawRange(0, pIndex);
            this.silhouetteGeometry.attributes.position.needsUpdate = true;
        });

        this.cameraUtils = new Camera(this.video, {
            onFrame: async () => { 
                await this.selfieSegmentation.send({ image: this.video }); 
            },
            width: 640,
            height: 480
        });
        this.cameraUtils.start();
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    // 사람 감지 여부 확인 메서드
    isPersonDetected() {
        if (!this.silhouetteGeometry || !this.silhouetteGeometry.attributes.position) {
            return false;
        }

        // 일정 개수 이상의 파티클이 보이면 사람이 감지된 것으로 판단 (매우 민감하게)
        return this.visibleParticleCount > APP_CONFIG.PERSON_DETECTION.THRESHOLD;
    }
}
