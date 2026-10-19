import { nanoid } from '@reduxjs/toolkit'
import { parse, stringify } from 'yaml'
import {
  degToRad,
  isVec3,
  radToDeg,
  roundVec,
  type Vec3,
} from '../shared/lib/vec3.ts'
import type { ObjectType, SceneObject } from '../store/objectsSlice.ts'
import { importPlacementDeltaX } from '../store/pasteOffset.ts'

export const SCENE_FILE_VERSION = 1

/** One object in a saved fragment; `offset` is relative to the file local origin. */
export type SceneFileObject = {
  type: ObjectType
  size: Vec3
  color: string
  offset: Vec3
  /** Euler XYZ in degrees. */
  rotation: Vec3
}

export type SceneFile = {
  version: number
  /** World-space point that maps to local (0,0,0) when the file was saved. */
  origin: Vec3
  objects: SceneFileObject[]
}

function normalizeType(type: unknown): ObjectType | null {
  if (type === 'cube' || type === 'sphere' || type === 'box') return type
  return null
}

/** Local origin = centroid of object positions (centers). */
export function sceneLocalOrigin(objects: SceneObject[]): Vec3 {
  if (objects.length === 0) return { x: 0, y: 0, z: 0 }
  let x = 0
  let y = 0
  let z = 0
  for (const object of objects) {
    x += object.position.x
    y += object.position.y
    z += object.position.z
  }
  const n = objects.length
  return roundVec({ x: x / n, y: y / n, z: z / n })
}

export function buildSceneFile(objects: SceneObject[]): SceneFile {
  const origin = sceneLocalOrigin(objects)
  return {
    version: SCENE_FILE_VERSION,
    origin,
    objects: objects.map((object) => ({
      type: object.type === 'box' ? 'cube' : object.type,
      size: roundVec(object.size),
      color: object.color,
      offset: roundVec({
        x: object.position.x - origin.x,
        y: object.position.y - origin.y,
        z: object.position.z - origin.z,
      }),
      rotation: radToDeg(object.rotation),
    })),
  }
}

export function sceneFileToYaml(file: SceneFile): string {
  return stringify(file, {
    indent: 2,
    lineWidth: 0,
  })
}

export function parseSceneYaml(text: string): SceneFile {
  const raw = parse(text) as unknown
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid scene file: expected an object')
  }
  const doc = raw as Record<string, unknown>
  if (doc.version !== SCENE_FILE_VERSION) {
    throw new Error(`Unsupported scene file version: ${String(doc.version)}`)
  }
  if (!isVec3(doc.origin)) {
    throw new Error('Invalid scene file: missing origin')
  }
  if (!Array.isArray(doc.objects)) {
    throw new Error('Invalid scene file: missing objects')
  }

  const objects: SceneFileObject[] = []
  for (const entry of doc.objects) {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Invalid scene file: bad object entry')
    }
    const item = entry as Record<string, unknown>
    const type = normalizeType(item.type)
    if (!type) throw new Error(`Invalid object type: ${String(item.type)}`)
    if (!isVec3(item.size) || !isVec3(item.offset) || !isVec3(item.rotation)) {
      throw new Error('Invalid object: size/offset/rotation')
    }
    if (typeof item.color !== 'string') {
      throw new Error('Invalid object: color')
    }
    objects.push({
      type,
      size: { ...item.size },
      color: item.color,
      offset: { ...item.offset },
      rotation: { ...item.rotation },
    })
  }

  return {
    version: SCENE_FILE_VERSION,
    origin: { ...doc.origin },
    objects,
  }
}

export function sceneFileToObjects(
  file: SceneFile,
  options: {
    /** World position of the file local origin. */
    anchor: Vec3
    /** Shared group id for all objects, or null. */
    groupId: string | null
  },
): SceneObject[] {
  return file.objects.map((object) => ({
    id: nanoid(),
    type: object.type === 'box' ? 'cube' : object.type,
    size: { ...object.size },
    color: object.color,
    rotation: degToRad(object.rotation),
    position: {
      x: options.anchor.x + object.offset.x,
      y: options.anchor.y + object.offset.y,
      z: options.anchor.z + object.offset.z,
    },
    groupId: options.groupId,
  }))
}

/** Load: place file local origin at world origin. */
export function objectsForLoad(file: SceneFile): SceneObject[] {
  return sceneFileToObjects(file, {
    anchor: { x: 0, y: 0, z: 0 },
    groupId: null,
  })
}

/**
 * Import: place beside existing scene content (or at origin if empty),
 * wrap in a group when there is more than one object.
 */
export function objectsForImport(
  file: SceneFile,
  existing: SceneObject[],
): SceneObject[] {
  const groupId = file.objects.length > 1 ? nanoid() : null
  const placed = sceneFileToObjects(file, {
    anchor: { x: 0, y: 0, z: 0 },
    groupId,
  })
  const deltaX = importPlacementDeltaX(existing, placed)
  if (deltaX === 0) return placed
  return placed.map((object) => ({
    ...object,
    position: {
      ...object.position,
      x: object.position.x + deltaX,
    },
  }))
}

export function downloadSceneYaml(
  objects: SceneObject[],
  filename = 'scene.yaml',
) {
  const yaml = sceneFileToYaml(buildSceneFile(objects))
  const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Open a file picker and parse a scene YAML. Returns null if cancelled. */
export function pickSceneYamlFile(): Promise<SceneFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yaml,.yml,text/yaml,application/x-yaml'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      void file
        .text()
        .then((text) => resolve(parseSceneYaml(text)))
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Failed to read scene file'
          window.alert(message)
          resolve(null)
        })
    }
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}
