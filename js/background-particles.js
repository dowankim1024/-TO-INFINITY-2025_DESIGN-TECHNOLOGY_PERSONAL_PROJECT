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

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            // -500 ~ 500 사이의 랜덤한 위치
            this.positions[i3 + 0] = (Math.random() - 0.5) * 1000;
            this.positions[i3 + 1] = (Math.random() - 0.5) * 1000;
            this.positions[i3 + 2] = (Math.random() - 0.5) * 1000;
            
            // 초기 속도는 0으로 설정
            this.velocities[i3 + 0] = 0;
            this.velocities[i3 + 1] = 0;
            this.velocities[i3 + 2] = 0;
        }

        this.particles.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

        // 파티클 외형(Material) 설정
        this.particleMaterial = new THREE.PointsMaterial({
            size: 2, // 이미지가 보이도록 크기를 늘림
            map: this.particleTexture, // 이미지 텍스처 적용
            transparent: true,
            alphaTest: 0.1, // 투명도 처리
            blending: THREE.AdditiveBlending,
        });

        // 파티클 시스템 생성 및 씬에 추가
        this.particleSystem = new THREE.Points(this.particles, this.particleMaterial);
        this.scene.add(this.particleSystem);
    }
    
    update() {
        const time = this.clock.getElapsedTime();
        const positions = this.particleSystem.geometry.attributes.position.array;

        const noiseScale = 0.005; // 노이즈의 공간적 스케일 (Frequency)
        const timeScale = 0.1;   // 노이즈의 시간적 변화 속도
        const forceStrength = 0.8; // 파티클에 가해지는 힘의 세기

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const x = positions[i3 + 0];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];

            // 각 축에 대해 서로 다른 위치에서 4D 노이즈를 샘플링하여 3D 벡터를 만듭니다.
            // 이렇게 하면 더 자연스러운 소용돌이가 생깁니다.
            const noiseX = this.noise.noise4D(x * noiseScale, y * noiseScale, z * noiseScale, time * timeScale) * forceStrength;
            const noiseY = this.noise.noise4D(y * noiseScale, z * noiseScale, x * noiseScale, time * timeScale) * forceStrength;
            const noiseZ = this.noise.noise4D(z * noiseScale, x * noiseScale, y * noiseScale, time * timeScale) * forceStrength;

            // 계산된 힘을 현재 위치에 더해줍니다.
            positions[i3 + 0] += noiseX;
            positions[i3 + 1] += noiseY;
            positions[i3 + 2] += noiseZ;
        }

        // three.js에게 파티클 위치가 변경되었음을 알려줍니다. (매우 중요!)
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
}
