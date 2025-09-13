class SilhouetteParticles {
    constructor(scene, camera, particleCount = 20000) {
        this.scene = scene;
        this.camera = camera;
        this.particleCount = particleCount;
        this.debugMode = false;
        
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
            size: 1.0,
            transparent: true,
            alphaTest: 0.01,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            map: this.particleTexture,
            sizeAttenuation: true // 카메라 거리에 따른 크기 조정 활성화
        });

        this.silhouetteSystem = new THREE.Points(this.silhouetteGeometry, this.silhouetteMaterial);
        this.scene.add(this.silhouetteSystem);
    }
    
    // 카메라 뷰 크기 계산 헬퍼 함수
    getViewSizeAtDepth(camera, depth) {
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * depth;
        const width = height * camera.aspect;
        return { width, height };
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
            
            for (let y = 0; y < this.maskCanvas.height; y += 4) {
                for (let x = 0; x < this.maskCanvas.width; x += 4) {
                    const i = (y * this.maskCanvas.width + x) * 4;
                    if (data[i] > 200 && pIndex < this.particleCount) {
                        let ndcX = (x / this.maskCanvas.width) * 2 - 1;
                        let ndcY = -((y / this.maskCanvas.height) * 2 - 1);
                        
                        // 카메라 뷰 크기에 맞춰 스케일 계산 (높이를 화면에 꽉 맞춤)
                        const viewSize = this.getViewSizeAtDepth(this.camera, this.camera.position.z);
                        const scaleY = viewSize.height * 0.8; // 화면 높이의 80%로 설정
                        const scaleX = scaleY * (this.maskCanvas.width / this.maskCanvas.height); // 비율 유지
                        
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
            
            // 나머지 파티클은 화면 밖으로
            for (let i = pIndex; i < this.particleCount; i++) {
                posAttr[i * 3] = 10000;
                posAttr[i * 3 + 1] = 10000;
                posAttr[i * 3 + 2] = 10000;
            }
            
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
        
        const positions = this.silhouetteGeometry.attributes.position.array;
        let visibleParticleCount = 0;
        
        // 화면 밖으로 보내진 파티클이 아닌 것들의 개수를 세어서 사람 감지 여부 판단
        for (let i = 0; i < this.particleCount; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            
            // 화면 밖으로 보내진 파티클이 아닌 경우 (10000보다 작은 값)
            if (x < 10000 && y < 10000 && z < 10000) {
                visibleParticleCount++;
            }
        }
        
        // 일정 개수 이상의 파티클이 보이면 사람이 감지된 것으로 판단 (매우 민감하게)
        return visibleParticleCount > 20;
    }
}
