class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.backgroundParticles = null;
        this.silhouetteParticles = null;
        this.explosionParticles = null;
        this.cameraController = null;
        
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

        this.camera.position.z = 50; // 파티클을 더 잘 보기 위해 카메라를 뒤로 이동

        // 배경 파티클 시스템 초기화
        this.backgroundParticles = new BackgroundParticles(this.scene);
        
        // 실루엣 파티클 시스템 초기화
        this.silhouetteParticles = new SilhouetteParticles(this.scene, this.camera);
        
        // 폭발 파티클 시스템 초기화
        this.explosionParticles = new ExplosionParticles(this.scene);
        
        // 카메라 컨트롤러 초기화
        this.cameraController = new CameraController(this.camera, this.silhouetteParticles, this.explosionParticles, this.renderer, this.scene);
    }
    
    setupEventListeners() {
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
        
        // 카메라 컨트롤러 업데이트
        this.cameraController.update();
        
        // 렌더링
        this.renderer.render(this.scene, this.camera);
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
