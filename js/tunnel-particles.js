class TunnelParticles {
    constructor(scene, particleCount = 5000) {
        this.scene = scene;
        this.particleCount = particleCount;
        this.particles = [];
        this.centerSquareSize = 200; // 중앙 비울 영역 크기 (픽셀) - 살짝 크게
        
        this.init();
    }
    
    init() {
        // 기존 asset.png 텍스처 로드
        this.textureLoader = new THREE.TextureLoader();
        this.particleTexture = this.textureLoader.load('./asset.png');
        
        // 터널 파티클 지오메트리 생성
        this.geometry = new THREE.BufferGeometry();
        
        // 파티클 위치 배열만 사용 (색상은 텍스처에서)
        this.positions = new Float32Array(this.particleCount * 3);
        
        // 파티클 초기화 - 무한 터널을 위해 다양한 Z 위치에 배치
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // 파티클을 중앙 영역을 제외한 곳에 배치
            let x, y, z;
            let attempts = 0;
            
            do {
                // 터널 형태로 파티클 배치 (중앙 영역 제외)
                const angle = Math.random() * Math.PI * 2;
                
                // 무한 터널을 위해 더 넓은 Z 범위 사용
                z = Math.random() * 4000 - 2000; // -2000~2000 범위로 확장
                
                // 중앙 영역을 피하기 위해 최소 반지름 설정
                const minRadius = 80; // 중앙 영역 경계
                const maxRadius = 400; // 터널 외곽
                const radius = Math.random() * (maxRadius - minRadius) + minRadius;
                
                x = Math.cos(angle) * radius;
                y = Math.sin(angle) * radius;
                
                attempts++;
            } while (this.isInCenterSquare(x, y) && attempts < 10);
            
            this.positions[i3] = x;
            this.positions[i3 + 1] = y;
            this.positions[i3 + 2] = z;
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        // 터널 파티클 머티리얼 (원본 이미지 그대로 사용)
        this.material = new THREE.PointsMaterial({
            size: 4,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            map: this.particleTexture,
            sizeAttenuation: true,
            alphaTest: 0.5,
            depthWrite: false,
            premultipliedAlpha: false
        });
        
        this.particleSystem = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particleSystem);
    }
    
    isInCenterSquare(x, y) {
        // 중앙 사각형 영역 체크 (3D 좌표 기준)
        const centerX = 0;
        const centerY = 0;
        const halfSize = this.centerSquareSize / 2;
        
        return Math.abs(x - centerX) < halfSize && Math.abs(y - centerY) < halfSize;
    }
    
    update() {
        const positions = this.geometry.attributes.position.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // 파티클을 앞으로 이동 (무한 터널 착시 효과)
            positions[i3 + 2] += 3; // Z축으로 앞으로 이동
            
            // 파티클이 화면을 지나가면 뒤로 보내기 (무한 반복)
            if (positions[i3 + 2] > 500) {
                positions[i3 + 2] = -2000; // 더 뒤에서 시작
                
                // 새로운 위치에서 시작 (중앙 영역 제외)
                let x, y;
                let attempts = 0;
                
                do {
                    const angle = Math.random() * Math.PI * 2;
                    const minRadius = 80;
                    const maxRadius = 400;
                    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
                    x = Math.cos(angle) * radius;
                    y = Math.sin(angle) * radius;
                    attempts++;
                } while (this.isInCenterSquare(x, y) && attempts < 10);
                
                positions[i3] = x;
                positions[i3 + 1] = y;
            }
        }
        
        this.geometry.attributes.position.needsUpdate = true;
    }
    
    // 파티클 시스템 제거
    dispose() {
        this.scene.remove(this.particleSystem);
        this.geometry.dispose();
        this.material.dispose();
    }
}
