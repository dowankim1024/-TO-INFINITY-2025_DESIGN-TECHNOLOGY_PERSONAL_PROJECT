// 1. 기본 씬(Scene) 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 100; // 파티클을 더 잘 보기 위해 카메라를 뒤로 이동

// Perlin Noise 인스턴스 생성
const noise = new SimplexNoise();

// 2. 파티클 생성
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load('./asset.png');
const particleCount = 20000;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
// 각 파티클의 속도를 저장할 배열 추가
const velocities = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // -500 ~ 500 사이의 랜덤한 위치
    positions[i3 + 0] = (Math.random() - 0.5) * 1000;
    positions[i3 + 1] = (Math.random() - 0.5) * 1000;
    positions[i3 + 2] = (Math.random() - 0.5) * 1000;
    
    // 초기 속도는 0으로 설정
    velocities[i3 + 0] = 0;
    velocities[i3 + 1] = 0;
    velocities[i3 + 2] = 0;
}

particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));


// 3. 파티클 외형(Material) 설정
const particleMaterial = new THREE.PointsMaterial({
    size: 2, // 이미지가 보이도록 크기를 늘림
    map: particleTexture, // 이미지 텍스처 적용
    transparent: true,
    alphaTest: 0.1, // 투명도 처리
    blending: THREE.AdditiveBlending,
});

// 4. 파티클 시스템 생성 및 씬에 추가
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);



// 5. 애니메이션 루프 (수정된 최종 버전)
const clock = new THREE.Clock(); // 시간을 추적하기 위한 Clock

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // 파티클의 위치 정보를 담고 있는 배열을 가져옵니다.
    const positions = particleSystem.geometry.attributes.position.array;

    const noiseScale = 0.005; // 노이즈의 공간적 스케일 (Frequency)
    const timeScale = 0.1;   // 노이즈의 시간적 변화 속도
    const forceStrength = 0.8; // 파티클에 가해지는 힘의 세기

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x = positions[i3 + 0];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];

        // 각 축에 대해 서로 다른 위치에서 4D 노이즈를 샘플링하여 3D 벡터를 만듭니다.
        // 이렇게 하면 더 자연스러운 소용돌이가 생깁니다.
        const noiseX = noise.noise4D(x * noiseScale, y * noiseScale, z * noiseScale, time * timeScale) * forceStrength;
        const noiseY = noise.noise4D(y * noiseScale, z * noiseScale, x * noiseScale, time * timeScale) * forceStrength;
        const noiseZ = noise.noise4D(z * noiseScale, x * noiseScale, y * noiseScale, time * timeScale) * forceStrength;

        // 계산된 힘을 현재 위치에 더해줍니다.
        positions[i3 + 0] += noiseX;
        positions[i3 + 1] += noiseY;
        positions[i3 + 2] += noiseZ;
    }

    // three.js에게 파티클 위치가 변경되었음을 알려줍니다. (매우 중요!)
    particleSystem.geometry.attributes.position.needsUpdate = true;
    
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});