/* eslint-disable react/no-unknown-property */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Canvas, extend, useFrame } from "@react-three/fiber";

import {
  useGLTF,
  useTexture,
  Environment,
  Lightformer,
} from "@react-three/drei";

import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";

import { MeshLineGeometry, MeshLineMaterial } from "meshline";

import cardGLB from "../../assets/card.glb";
import lanyard from "../../assets/lanyard.png";

import * as THREE from "three";

import "./Lanyard.css";

/* =========================================================
   MESHLINE
========================================================= */

extend({
  MeshLineGeometry,
  MeshLineMaterial,
});

/* =========================================================
   TRANSPARENT PIXEL
========================================================= */

const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/* =========================================================
   CARD TEXTURE UV
========================================================= */

const FRONT_UV_RECT = {
  x: 0,
  y: 0,
  w: 0.5,
  h: 0.755,
};

const BACK_UV_RECT = {
  x: 0.5,
  y: 0,
  w: 0.5,
  h: 0.757,
};

/* =========================================================
   LANYARD COMPONENT
========================================================= */

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -30, 0],
  fov = 20,
  transparent = true,

  frontImage = null,
  backImage = null,

  imageFit = "cover",

  lanyardImage = null,

  lanyardWidth = 1,
}) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  /* =========================================================
     RESPONSIVE
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     CANVAS
  ========================================================= */

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{
          position: position,
          fov: fov,
        }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{
          alpha: transparent,
          antialias: true,
        }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        {/* LIGHT */}
        <ambientLight intensity={Math.PI} />

        {/* PHYSICS */}
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
          />
        </Physics>

        {/* ENVIRONMENT */}
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />

          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />

          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />

          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

/* =========================================================
   BAND
========================================================= */

function Band({
  maxSpeed = 50,
  minSpeed = 0,

  isMobile = false,

  frontImage = null,
  backImage = null,

  imageFit = "cover",

  lanyardImage = null,

  lanyardWidth = 1,
}) {
  /* =========================================================
     REFERENCES
  ========================================================= */

  const band = useRef();

  const fixed = useRef();

  const j1 = useRef();

  const j2 = useRef();

  const j3 = useRef();

  const card = useRef();

  /* =========================================================
     TEMPORARY VECTORS
  ========================================================= */

  const vec = new THREE.Vector3();

  const ang = new THREE.Vector3();

  const rot = new THREE.Vector3();

  const dir = new THREE.Vector3();

  /* =========================================================
     PHYSICS SETTINGS
  ========================================================= */

  const segmentProps = {
    type: "dynamic",

    canSleep: true,

    colliders: false,

    angularDamping: 10,

    linearDamping: 4,
  };

  /* =========================================================
     LOAD MODEL
  ========================================================= */

  const { nodes, materials } = useGLTF(cardGLB);

  /* =========================================================
     LOAD TEXTURES
  ========================================================= */

  const texture = useTexture(lanyardImage || lanyard);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  texture.generateMipmaps = true;

  texture.anisotropy = 16;

  texture.needsUpdate = true;

  const frontTex = useTexture(frontImage || BLANK_PIXEL);

  const backTex = useTexture(backImage || BLANK_PIXEL);

  /* =========================================================
     CARD TEXTURE COMPOSITE
  ========================================================= */

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;

    if (!frontImage && !backImage) {
      return baseMap;
    }

    const baseImg = baseMap.image;

    const W = baseImg.width;

    const H = baseImg.height;

    const canvas = document.createElement("canvas");

    canvas.width = W;

    canvas.height = H;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return baseMap;
    }

    /*
     * Preserve original texture
     */
    ctx.drawImage(baseImg, 0, 0, W, H);

    /* =====================================================
       FIT IMAGE
    ===================================================== */

    const drawFitted = (img, rect) => {
      const rx = rect.x * W;

      const ry = rect.y * H;

      const rw = rect.w * W;

      const rh = rect.h * H;

      const pick = imageFit === "contain" ? Math.min : Math.max;

      const scale = pick(rw / img.width, rh / img.height);

      const dw = img.width * scale;

      const dh = img.height * scale;

      const dx = rx + (rw - dw) / 2;

      const dy = ry + (rh - dh) / 2;

      ctx.save();

      ctx.beginPath();

      ctx.rect(rx, ry, rw, rh);

      ctx.clip();

      ctx.drawImage(img, dx, dy, dw, dh);

      ctx.restore();
    };

    /* FRONT */
    if (frontImage && frontTex.image) {
      drawFitted(frontTex.image, FRONT_UV_RECT);
    }

    /* BACK */
    if (backImage && backTex.image) {
      drawFitted(backTex.image, BACK_UV_RECT);
    }

    /* =====================================================
       CREATE TEXTURE
    ===================================================== */

    const composite = new THREE.CanvasTexture(canvas);

    composite.colorSpace = THREE.SRGBColorSpace;

    composite.flipY = baseMap.flipY;

    composite.anisotropy = 16;

    composite.needsUpdate = true;

    return composite;
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);

  /* =========================================================
     CURVE
  ========================================================= */

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );

  /* =========================================================
     DRAG STATE
  ========================================================= */

  const [dragged, drag] = useState(false);

  const [hovered, hover] = useState(false);

  /* =========================================================
     ROPE JOINTS
  =========================================================
     Tali dipendekkan.
  ========================================================= */

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 0.75]);

  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.75]);

  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.75]);

  /* =========================================================
     CARD CONNECTION
  =========================================================
     Titik sambungan dinaikkan agar sesuai dengan
     card berukuran besar.
  */

  useSphericalJoint(j3, card, [
    [0, 0, 0],

    /*
     * Holder / clip attachment point
     */
    [0, 1.5, 0],
  ]);

  /* =========================================================
     CURSOR
  ========================================================= */

  useEffect(() => {
    if (!hovered) {
      return;
    }

    document.body.style.cursor = dragged ? "grabbing" : "grab";

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  /* =========================================================
     FRAME UPDATE
  ========================================================= */

  useFrame((state, delta) => {
    /* =====================================================
         DRAG CARD
      ===================================================== */

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5);

      vec.unproject(state.camera);

      dir.copy(vec).sub(state.camera.position).normalize();

      vec.add(dir.multiplyScalar(state.camera.position.length()));

      [card, j1, j2, j3, fixed].forEach((ref) => {
        ref.current?.wakeUp();
      });

      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,

        y: vec.y - dragged.y,

        z: vec.z - dragged.z,
      });
    }

    /* =====================================================
         ROPE SMOOTHING
      ===================================================== */

    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(
            ref.current.translation(),
          );
        }

        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())),
        );

        ref.current.lerped.lerp(
          ref.current.translation(),

          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
        );
      });

      /* ===================================================
           UPDATE ROPE CURVE
        =================================================== */

      curve.points[0].copy(j3.current.translation());

      curve.points[1].copy(j2.current.lerped);

      curve.points[2].copy(j1.current.lerped);

      curve.points[3].copy(fixed.current.translation());

      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));

      /* ===================================================
           CARD ROTATION
        =================================================== */

      ang.copy(card.current.angvel());

      rot.copy(card.current.rotation());

      card.current.setAngvel({
        x: ang.x,

        y: ang.y - rot.y * 0.25,

        z: ang.z,
      });
    }
  });

  /* =========================================================
     CURVE SETTINGS
  ========================================================= */

  curve.curveType = "chordal";

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  /* =========================================================
     3D OBJECT
  ========================================================= */

  return (
    <>
      {/* =====================================================
          PHYSICS GROUP
      ===================================================== */}

      <group position={[0, 4, 0]}>
        {/* ===================================================
            FIXED HOLDER
        =================================================== */}

        <RigidBody ref={fixed} {...segmentProps} type="fixed" />

        {/* ===================================================
            JOINT 1
        =================================================== */}

        <RigidBody position={[0.4, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        {/* ===================================================
            JOINT 2
        =================================================== */}

        <RigidBody position={[0.8, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        {/* ===================================================
            JOINT 3
        =================================================== */}

        <RigidBody position={[1.2, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        {/* ===================================================
            CARD
        =================================================== */}

        <RigidBody
          position={[1.6, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          {/* =================================================
              CARD COLLIDER
          ================================================= */}

          <CuboidCollider args={[1.05, 1.5, 0.01]} />

          {/* =================================================
              CARD VISUAL
          ================================================= */}

          <group
            scale={2.95}
            /*
             * Dinaikkan sedikit agar holder card
             * lebih dekat dengan attachment point.
             */
            position={[0, -2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              e.target.releasePointerCapture(e.pointerId);

              drag(false);
            }}
            onPointerDown={(e) => {
              e.target.setPointerCapture(e.pointerId);

              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current.translation())),
              );
            }}
          >
            {/* =================================================
                CARD BODY
            ================================================= */}

            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>

            {/* =================================================
                METAL CLIP
            ================================================= */}

            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />

            {/* =================================================
                CLAMP / HOLDER
            ================================================= */}

            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      {/* =====================================================
          LANYARD BAND
      ===================================================== */}

      <mesh ref={band}>
        <meshLineGeometry />

        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1600, 2200] : [1920, 1080]}
          useMap
          map={texture}
          repeat={isMobile ? [-2.8, 1] : [-3.2, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}
