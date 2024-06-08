import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

let container: HTMLDivElement;

let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;
let group: THREE.Group, raycaster: THREE.Raycaster, mouse: THREE.Vector2;
const images: string[] = [
    "src/img/image1.png",
    "src/img/image2.png",
    "src/img/image.png"
];

let touchStartX = 0;
let touchEndX = 0;
let moved = false;
const DEPTH = 10;
const MAIN_DEPTH = 5;
const SPACE_BETWEEN = 4;
init();

function init() {

    container = document.createElement('div');
    container.className = "container"
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    scene = new THREE.Scene();

    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; 
    plane.position.y = -2.3; 
    plane.receiveShadow = true;
    scene.add(plane);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, MAIN_DEPTH);
    light.castShadow = true; 
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.2;
    light.shadow.camera.far = 50
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = -10;
    light.shadow.camera.bottom = 10;
    light.shadow.bias = -0.07;

    scene.add(light);

    group = new THREE.Group();

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const circleGeometry = new THREE.CircleGeometry(1, 32);

    const loader = new THREE.TextureLoader();
    images.forEach((imageSrc, i) => {
        const texture = loader.load(imageSrc);

        // Create the sphere
        const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;

        const circleMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.z = 0;  

        const mergedGroup = new THREE.Group();
        mergedGroup.add(sphere);
        mergedGroup.add(circle);

        mergedGroup.position.x = (-1 + i) * SPACE_BETWEEN;
        mergedGroup.position.y = 0;
        mergedGroup.position.z = i === Math.floor(images.length / 2) ? -MAIN_DEPTH : -DEPTH;

        group.add(mergedGroup);
    });

    scene.add(group);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    // Adding touch event listeners
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, false);
    renderer.domElement.addEventListener('touchend', onTouchEnd, false);

    // Adding click event listener
    renderer.domElement.addEventListener('click', onClick, false);

    animate();
}

function onWindowResize(): void {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function animate(): void {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}

function onTouchStart(event: TouchEvent): void {
    touchStartX = event.changedTouches[0].screenX;
    moved = false;
}

function onTouchMove(event: TouchEvent): void {
    touchEndX = event.changedTouches[0].screenX;
    moved = true;
}

function onTouchEnd(_: TouchEvent): void {
    if (moved) {
        if (touchEndX < touchStartX - 50) {
            swipeLeft();
        }
        if (touchEndX > touchStartX + 50) {
            swipeRight();
        }
    }
}

function onClick(event: MouseEvent): void {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(group.children, true); 

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object as THREE.Mesh;
        centerCube(clickedObject);
    }
}

function swipeLeft(): void {
    const firstGroup = group.children.shift() as THREE.Group;
    group.children.push(firstGroup);
    animateSwipe();
}

function swipeRight(): void {
    const lastGroup = group.children.pop() as THREE.Group;
    group.children.unshift(lastGroup);
    animateSwipe();
}

function animateSwipe(): void {
    group.children.forEach((groupChild, i) => {
        const mergedGroup = groupChild as THREE.Group;
        const targetX = (-1 + i) * SPACE_BETWEEN;
        const targetZ = i === Math.floor(images.length / 2) ? -MAIN_DEPTH : -DEPTH; 

        new TWEEN.Tween(mergedGroup.position)
            .to({ x: targetX, z: targetZ }, 500)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
    });
}

function centerCube(object: THREE.Object3D): void {
    const parentGroup = object.parent as THREE.Group;
    const groupIndex = group.children.indexOf(parentGroup);

    if (groupIndex === Math.floor(group.children.length / 2)) {
        return; 
    }

    const middleIndex = Math.floor(group.children.length / 2);

    if (groupIndex > middleIndex) {
        for (let i = groupIndex; i > middleIndex; i--) {
            const firstGroup = group.children.shift() as THREE.Group;
            group.children.push(firstGroup);
        }
    } else {
        for (let i = groupIndex; i < middleIndex; i++) {
            const lastGroup = group.children.pop() as THREE.Group;
            group.children.unshift(lastGroup);
        }
    }
    animateSwipe();
}
