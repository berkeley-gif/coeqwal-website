/**
 * Lightweight hierarchical clustering utilities.
 *
 * Designed for small matrices (N ≤ ~100). Uses average-linkage
 * agglomerative clustering with squared-Euclidean distance, with
 * pairwise-complete observations (null entries are skipped in both
 * vectors for that pair). Returns a permutation of row indices that
 * mirrors the dendrogram's leaf order.
 *
 * No external dependencies: the implementation is O(N^3) which is
 * plenty for the heatmap's row counts.
 */

/**
 * Compute pairwise squared-Euclidean distance between two row vectors,
 * skipping positions where either side is null / NaN.
 *
 * Returns `Infinity` when no overlap is available. The caller should
 * treat such pairs as "maximally dissimilar" without crashing.
 */
function pairDistance(
  a: ReadonlyArray<number | null>,
  b: ReadonlyArray<number | null>,
): number {
  const n = Math.min(a.length, b.length)
  let sum = 0
  let count = 0
  for (let i = 0; i < n; i++) {
    const va = a[i]
    const vb = b[i]
    if (va == null || vb == null) continue
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue
    const d = va - vb
    sum += d * d
    count += 1
  }
  if (count === 0) return Infinity
  // Normalize so rows with many NaN's aren't spuriously similar.
  return sum / count
}

interface Cluster {
  members: number[]
  left: Cluster | null
  right: Cluster | null
}

/**
 * Average-linkage agglomerative clustering, returning a leaf permutation.
 *
 * Algorithm:
 *  1. Compute pairwise distances between all rows.
 *  2. Each row starts as its own cluster.
 *  3. Repeatedly merge the two clusters with the lowest average pairwise
 *     distance (average linkage: mean of all cross-cluster pair distances).
 *  4. When merging, we decide the new cluster's leaf order by placing
 *     the cluster with the smaller mean-row-index first. This is a
 *     heuristic but produces stable, deterministic orderings without
 *     the expense of optimal leaf ordering.
 *
 * @param matrix rows × cols value matrix (nullable entries allowed).
 * @returns Permutation of row indices (length = matrix.length).
 */
export function hierarchicalRowOrder(
  matrix: ReadonlyArray<ReadonlyArray<number | null>>,
): number[] {
  const n = matrix.length
  if (n <= 1) return Array.from({ length: n }, (_, i) => i)

  // Pairwise distances
  const dist: number[][] = []
  for (let i = 0; i < n; i++) {
    dist.push(new Array<number>(n).fill(0))
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = pairDistance(matrix[i]!, matrix[j]!)
      dist[i]![j] = d
      dist[j]![i] = d
    }
  }

  const clusters: Cluster[] = matrix.map((_, i) => ({
    members: [i],
    left: null,
    right: null,
  }))

  // Per-cluster "center index" used to decide merge-order (smaller first).
  const centerIndex = (c: Cluster): number => {
    let s = 0
    for (const m of c.members) s += m
    return s / c.members.length
  }

  // Average-linkage distance between two clusters: mean of pairwise row
  // distances (skipping any +Infinity pairs, they contribute nothing).
  const avgLinkage = (a: Cluster, b: Cluster): number => {
    let sum = 0
    let count = 0
    for (const i of a.members) {
      for (const j of b.members) {
        const d = dist[i]![j]!
        if (Number.isFinite(d)) {
          sum += d
          count += 1
        }
      }
    }
    return count > 0 ? sum / count : Infinity
  }

  while (clusters.length > 1) {
    let bestI = 0
    let bestJ = 1
    let bestD = Infinity
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = avgLinkage(clusters[i]!, clusters[j]!)
        if (d < bestD) {
          bestD = d
          bestI = i
          bestJ = j
        }
      }
    }
    // If all remaining pairs are non-finite, fall back to merging the
    // first two clusters so the loop terminates deterministically.
    const a = clusters[bestI]!
    const b = clusters[bestJ]!
    const left = centerIndex(a) <= centerIndex(b) ? a : b
    const right = left === a ? b : a
    const merged: Cluster = {
      members: [...left.members, ...right.members],
      left,
      right,
    }
    // Remove the later index first to keep indices valid.
    const hi = Math.max(bestI, bestJ)
    const lo = Math.min(bestI, bestJ)
    clusters.splice(hi, 1)
    clusters.splice(lo, 1)
    clusters.push(merged)
  }

  return clusters[0]!.members
}
