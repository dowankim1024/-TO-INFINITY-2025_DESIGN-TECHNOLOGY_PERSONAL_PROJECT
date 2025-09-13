// 애플리케이션 전체 설정 상수들
const APP_CONFIG = {
    // 카메라 설정
    CAMERA: {
        INITIAL_Z: 50,           // 초기 카메라 위치 (배경 파티클 보기)
        TARGET_Z: -10,          // 목표 위치 (사람을 통과한 후)
        MOVEMENT_SPEED: 0.1,   // 카메라 이동 속도 (천천히 이동)
        EXPLOSION_TRIGGER_Z: 0.3 // 폭발 트리거 Z 좌표
    },
    
    // 사람 감지 설정
    PERSON_DETECTION: {
        DELAY_MS: 2000,         // 사람 감지 후 대기 시간 (밀리초)
        THRESHOLD: 20          // 사람 감지 임계값 (파티클 개수)
    },
    
    // 폭발 효과 설정
    EXPLOSION: {
        PARTICLE_COUNT: 2000,   // 폭발 파티클 개수
        PARTICLE_SIZE: 6,       // 파티클 크기
        PARTICLE_OPACITY: 0.9,  // 파티클 투명도
        SPEED_MIN: 3,          // 최소 폭발 속도
        SPEED_MAX: 11,         // 최대 폭발 속도
        MOVEMENT_SPEED: 0.15,   // 파티클 이동 속도
        GRAVITY: 0.05,         // 중력 효과
        LIFETIME_MAX: 3,       // 파티클 최대 수명 (초)
        FADE_SPEED: 0.5,       // 페이드 아웃 속도
        DURATION_MS: 5000      // 폭발 지속 시간 (밀리초)
    },
    
    // 화면 효과 설정
    SCREEN_EFFECTS: {
        BLACK_SCREEN_DURATION_MS: 10000,  // 검은 화면 지속 시간 (밀리초)
        BLACK_SCREEN_FADE_MS: 1000,      // 검은 화면 페이드 시간 (밀리초)
        RESET_DELAY_MS: 3000             // 리셋 대기 시간 (밀리초)
    },
    
    // 배경 파티클 설정
    BACKGROUND_PARTICLES: {
        COUNT: 20000,           // 배경 파티클 개수
        SIZE: 2,               // 배경 파티클 크기
        NOISE_SCALE: 0.005,    // 노이즈 공간적 스케일
        TIME_SCALE: 0.1,       // 노이즈 시간적 변화 속도
        FORCE_STRENGTH: 0.8    // 파티클에 가해지는 힘의 세기
    },
    
    // 실루엣 파티클 설정
    SILHOUETTE_PARTICLES: {
        COUNT: 20000,          // 실루엣 파티클 개수
        SIZE: 1.0,            // 실루엣 파티클 크기
        OPACITY: 0.8,         // 실루엣 파티클 투명도
        ALPHA_TEST: 0.01      // 알파 테스트 값
    }
};

// 색상 팔레트
const COLOR_PALETTE = {
    EXPLOSION: {
        RED: { r: 1, g: 0.2, b: 0 },      // 빨강
        ORANGE: { r: 1, g: 0.5, b: 0 },   // 주황
        YELLOW: { r: 1, g: 1, b: 0 },     // 노랑
        WHITE: { r: 1, g: 1, b: 1 }       // 흰색
    },
    BACKGROUND: {
        PRIMARY: 0x000000      // 배경색
    }
};

// 색상 확률 설정
const COLOR_PROBABILITY = {
    RED: 0.3,      // 빨강 확률
    ORANGE: 0.3,   // 주황 확률 (누적: 0.6)
    YELLOW: 0.2,   // 노랑 확률 (누적: 0.8)
    WHITE: 0.2     // 흰색 확률 (누적: 1.0)
};
