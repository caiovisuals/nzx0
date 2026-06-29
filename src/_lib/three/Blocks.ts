import * as THREE from "three"

/** PRNG determinístico (mulberry32) para gerar blocos reproduzíveis por seed. */
function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** Primitivas internas — cada projeto/bloco recebe uma forma diferente. */
function innerGeometry(index: number): THREE.BufferGeometry {
    switch (index % 6) {
        case 0:
            return new THREE.TorusKnotGeometry(0.42, 0.14, 160, 24)
        case 1:
            return new THREE.OctahedronGeometry(0.7, 0)
        case 2:
            return new THREE.IcosahedronGeometry(0.66, 0)
        case 3:
            return new THREE.TorusGeometry(0.5, 0.18, 24, 80)
        case 4:
            return new THREE.DodecahedronGeometry(0.66, 0)
        default:
            return new THREE.ConeGeometry(0.6, 1.1, 6)
    }
}

/**
 * Constrói uma casca de gelo cristalina deslocando os vértices de um
 * icosaedro ao longo das normais com ruído determinístico — imita o
 * "crescimento" facetado do cristal sem depender de assets externos.
 */
function buildShellGeometry(seed: number): THREE.BufferGeometry {
    const rand = mulberry32(seed)
    // IcosahedronGeometry já é não-indexado → cada face tem vértices próprios (facetas planas)
    const geo = new THREE.IcosahedronGeometry(1, 3)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()

    // ruído por vértice baseado na posição arredondada (vértices coincidentes
    // recebem o mesmo deslocamento → facetas contínuas)
    const cache = new Map<string, number>()
    const noiseAt = (x: number, y: number, z: number) => {
        const key = `${x.toFixed(2)}:${y.toFixed(2)}:${z.toFixed(2)}`
        let n = cache.get(key)
        if (n === undefined) {
            n = 0.78 + rand() * 0.42
            cache.set(key, n)
        }
        return n
    }

    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        const f = noiseAt(v.x, v.y, v.z)
        v.multiplyScalar(f)
        pos.setXYZ(i, v.x, v.y, v.z)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
}

export interface Block {
    group: THREE.Group
    inner: THREE.Mesh
    shell: THREE.Mesh
    dispose: () => void
}

/**
 * Bloco de gelo: casca transmissiva facetada + objeto interno emissivo.
 * O matiz varia por índice para diferenciar cada "projeto".
 */
export function createBlocks(index: number): Block {
    const group = new THREE.Group()

    const shellGeo = buildShellGeometry(index * 1973 + 7)
    const shellMat = new THREE.MeshPhysicalMaterial({
        transmission: 1,
        thickness: 1.5,
        roughness: 0.12,
        ior: 1.31, // índice de refração do gelo
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
        color: new THREE.Color().setHSL((index * 0.11) % 1, 0.25, 0.9),
        attenuationColor: new THREE.Color().setHSL((index * 0.11 + 0.55) % 1, 0.6, 0.6),
        attenuationDistance: 2.4,
        flatShading: true,
        transparent: true,
    })
    const shell = new THREE.Mesh(shellGeo, shellMat)
    shell.scale.setScalar(1.35)

    const innerGeo = innerGeometry(index)
    const innerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL((index * 0.17 + 0.5) % 1, 0.7, 0.55),
        emissive: new THREE.Color().setHSL((index * 0.17 + 0.5) % 1, 0.8, 0.5),
        emissiveIntensity: 0.75,
        roughness: 0.35,
        metalness: 0.2,
    })
    const inner = new THREE.Mesh(innerGeo, innerMat)

    group.add(inner, shell)

    return {
        group,
        inner,
        shell,
        dispose() {
            shellGeo.dispose()
            shellMat.dispose()
            innerGeo.dispose()
            innerMat.dispose()
        },
    }
}