class ExplosionParticles {
    constructor(scene, particleCount = 1000) {
        this.scene = scene;
        this.particleCount = particleCount * 2; // 파티클 수를 2배로 증가
        this.isActive = false;
        this.explosionPosition = { x: 0, y: 0, z: 0 };
        
        this.init();
    }
    
    init() {
        // 폭발 파티클 생성
        this.textureLoader = new THREE.TextureLoader();
        this.particleTexture = this.textureLoader.load('./asset.png');
        this.explosionGeometry = new THREE.BufferGeometry();
        
        // 위치, 속도, 색상 배열
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);
        this.lifetimes = new Float32Array(this.particleCount);
        
        // 초기값 설정 (모든 파티클을 중앙에 배치)
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            // 중앙에서 시작
            this.positions[i3] = 0;
            this.positions[i3 + 1] = 0;
            this.positions[i3 + 2] = 0;
            
            // 중심을 기준으로 사방으로 균등하게 폭발
            const horizontalAngle = Math.random() * Math.PI * 2; // 수평 방향
            const verticalAngle = Math.random() * Math.PI; // 수직 방향 (0~π)
            const speed = Math.random() * 8 + 3; // 속도를 3-11로 증가
            
            // 3D 구면 좌표계로 균등한 방향 생성
            this.velocities[i3] = Math.sin(verticalAngle) * Math.cos(horizontalAngle) * speed;
            this.velocities[i3 + 1] = Math.cos(verticalAngle) * speed;
            this.velocities[i3 + 2] = Math.sin(verticalAngle) * Math.sin(horizontalAngle) * speed;
            
            // 불꽃놀이 색상 (빨강, 주황, 노랑, 흰색)
            const colorType = Math.random();
            if (colorType < 0.3) {
                this.colors[i3] = 1;     // 빨강
                this.colors[i3 + 1] = 0.2;
                this.colors[i3 + 2] = 0;
            } else if (colorType < 0.6) {
                this.colors[i3] = 1;     // 주황
                this.colors[i3 + 1] = 0.5;
                this.colors[i3 + 2] = 0;
            } else if (colorType < 0.8) {
                this.colors[i3] = 1;     // 노랑
                this.colors[i3 + 1] = 1;
                this.colors[i3 + 2] = 0;
            } else {
                this.colors[i3] = 1;     // 흰색
                this.colors[i3 + 1] = 1;
                this.colors[i3 + 2] = 1;
            }
            
            this.lifetimes[i] = 0;
        }
        
        this.explosionGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.explosionGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        
        // 폭발 파티클 머티리얼 (더 큰 크기)
        this.explosionMaterial = new THREE.PointsMaterial({
            size: 6, // 크기를 2배로 증가
            transparent: true,
            opacity: 0.9,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            map: this.particleTexture,
            sizeAttenuation: true,
            alphaTest: 0.5, // 알파 테스트를 더 높게 설정하여 검은 픽셀 제거
            depthWrite: false, // 깊이 쓰기 비활성화로 블렌딩 개선
            premultipliedAlpha: false // 프리멀티플라이드 알파 비활성화
        });
        
        this.explosionSystem = new THREE.Points(this.explosionGeometry, this.explosionMaterial);
        this.scene.add(this.explosionSystem);
        
        // 초기에는 숨김
        this.explosionSystem.visible = false;
    }
    
    explode() {
        this.explodeAt({ x: 0, y: 0, z: 0 });
    }
    
    explodeAt(position) {
        this.isActive = true;
        this.explosionSystem.visible = true;
        
        // 폭발 위치 저장
        this.explosionPosition = { ...position };
        
        // 모든 파티클을 지정된 위치에서 시작
        const positions = this.explosionGeometry.attributes.position.array;
        const colors = this.explosionGeometry.attributes.color.array;
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // 색상도 함께 설정 (불꽃놀이 색상)
            const colorType = Math.random();
            if (colorType < 0.3) {
                colors[i3] = 1;     // 빨강
                colors[i3 + 1] = 0.2;
                colors[i3 + 2] = 0;
            } else if (colorType < 0.6) {
                colors[i3] = 1;     // 주황
                colors[i3 + 1] = 0.5;
                colors[i3 + 2] = 0;
            } else if (colorType < 0.8) {
                colors[i3] = 1;     // 노랑
                colors[i3 + 1] = 1;
                colors[i3 + 2] = 0;
            } else {
                colors[i3] = 1;     // 흰색
                colors[i3 + 1] = 1;
                colors[i3 + 2] = 1;
            }
            
            // 중심을 기준으로 사방으로 균등하게 폭발
            const horizontalAngle = Math.random() * Math.PI * 2; // 수평 방향
            const verticalAngle = Math.random() * Math.PI; // 수직 방향 (0~π)
            const speed = Math.random() * 8 + 3; // 속도를 3-11로 증가
            
            // 3D 구면 좌표계로 균등한 방향 생성
            this.velocities[i3] = Math.sin(verticalAngle) * Math.cos(horizontalAngle) * speed;
            this.velocities[i3 + 1] = Math.cos(verticalAngle) * speed;
            this.velocities[i3 + 2] = Math.sin(verticalAngle) * Math.sin(horizontalAngle) * speed;
            
            this.lifetimes[i] = 0;
        }
        
        this.explosionGeometry.attributes.position.needsUpdate = true;
        this.explosionGeometry.attributes.color.needsUpdate = true;
        console.log('💥 폭발 시작 - 파티클 수:', this.particleCount);
    }
    
    update() {
        if (!this.isActive) return;
        
        const positions = this.explosionGeometry.attributes.position.array;
        const colors = this.explosionGeometry.attributes.color.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // 파티클 이동 (더 빠르게)
            positions[i3] += this.velocities[i3] * 0.15;
            positions[i3 + 1] += this.velocities[i3 + 1] * 0.15;
            positions[i3 + 2] += this.velocities[i3 + 2] * 0.15;
            
            // 중력 효과 (더 강하게)
            this.velocities[i3 + 1] -= 0.05;
            
            // 수명 증가
            this.lifetimes[i] += 0.01;
            
            // 투명도 감소 (페이드 아웃)
            const alpha = Math.max(0, 1 - this.lifetimes[i] * 0.5);
            colors[i3] *= alpha;
            colors[i3 + 1] *= alpha;
            colors[i3 + 2] *= alpha;
            
            // 파티클이 너무 멀리 가거나 투명해지면 그냥 사라지도록 함 (리셋하지 않음)
            if (this.lifetimes[i] > 3 || alpha <= 0) {
                // 파티클을 화면 밖으로 이동시켜서 보이지 않게 함
                positions[i3] = 1000;
                positions[i3 + 1] = 1000;
                positions[i3 + 2] = 1000;
            }
        }
        
        this.explosionGeometry.attributes.position.needsUpdate = true;
        this.explosionGeometry.attributes.color.needsUpdate = true;
    }
    
    stop() {
        this.isActive = false;
        this.explosionSystem.visible = false;
    }
    
    reset() {
        this.isActive = false;
        this.explosionSystem.visible = false;
        
        // 모든 파티클을 중앙으로 리셋
        const positions = this.explosionGeometry.attributes.position.array;
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;
            this.lifetimes[i] = 0;
        }
        
        this.explosionGeometry.attributes.position.needsUpdate = true;
        console.log('🔄 폭발 파티클 완전 리셋');
    }
}
