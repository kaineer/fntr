type GroupedItem = {
  id: string
  groupId: string | null
}

/** Ids of the clicked object plus every member of its group (clicked id last = primary). */
export function expandWithGroup(items: GroupedItem[], id: string): string[] {
  const item = items.find((entry) => entry.id === id)
  if (!item) return []
  if (!item.groupId) return [id]
  const members = items
    .filter((entry) => entry.groupId === item.groupId)
    .map((entry) => entry.id)
  return [...members.filter((memberId) => memberId !== id), id]
}

export function primarySelectedId(selectedIds: string[]): string | null {
  return selectedIds.length > 0 ? selectedIds[selectedIds.length - 1]! : null
}

/** True when selection is exactly one group (shared groupId, ≥2 members). */
export function isGroupSelection(
  items: GroupedItem[],
  selectedIds: string[],
): boolean {
  if (selectedIds.length < 2) return false
  const selected = items.filter((item) => selectedIds.includes(item.id))
  if (selected.length !== selectedIds.length) return false
  const groupId = selected[0]?.groupId
  if (!groupId) return false
  if (!selected.every((item) => item.groupId === groupId)) return false
  const memberCount = items.filter((item) => item.groupId === groupId).length
  return memberCount === selectedIds.length
}
