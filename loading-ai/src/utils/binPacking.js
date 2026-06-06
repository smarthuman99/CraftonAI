/**
 * 3D Bin Packing Core Algorithm (Extreme Points Heuristic & Evaluation)
 * Supported features:
 * - Multi-container packing (overflow items roll over to subsequent containers)
 * - SKU-specific constraints: allowSide, allowUpsideDown
 * - Stacking/Load-bearing constraints: Heavy (3), Medium (2), Light (1) cannot stack on lighter
 * - Gravity support constraints (at least 60% of bottom area supported by floor or boxes)
 * - Container weight limit
 * - Center of Gravity calculations
 */

// Container Presets
export const STANDARD_CONTAINERS = [
  { id: '20GP', name: '20GP (标准箱)', l: 5890, w: 2350, h: 2390, maxWeight: 21800 },
  { id: '40GP', name: '40GP (平柜)', l: 12030, w: 2350, h: 2390, maxWeight: 26600 },
  { id: '40HQ', name: '40HQ (高柜)', l: 12030, w: 2350, h: 2690, maxWeight: 26500 },
];

/**
 * Packs a list of items into one or more containers of a selected type.
 * @param {Array} inputItems - Array of items to pack.
 * @param {Object} containerType - The container type selection (e.g. 20GP, 40HQ).
 * @param {Object} options - Packing options.
 * @returns {Array} List of packed containers.
 */
export function packContainers(inputItems, containerType, options = {}) {
  const {
    supportThreshold = 0.60, // 60% bottom area support required
    sortingStrategy = 'volume' // volume, footprint, height, weight
  } = options;

  // Flatten items by quantity to create individual packable units
  let flatItems = [];
  let unitId = 0;
  inputItems.forEach(item => {
    for (let q = 0; q < item.qty; q++) {
      flatItems.push({
        ...item,
        uniqueId: `${item.id || item.sku}-${unitId++}`,
        l: Number(item.l),
        w: Number(item.w),
        h: Number(item.h),
        weight: Number(item.weight || 1),
        stackingGrade: Number(item.stackingGrade || 2), // Default Medium
        allowSide: item.allowSide !== false,
        allowUpsideDown: item.allowUpsideDown !== false,
      });
    }
  });

  // Sort items based on strategy
  sortItems(flatItems, sortingStrategy);

  const packedContainers = [];
  let remainingItems = [...flatItems];

  // Continue opening containers until all items are packed or no progress is made
  while (remainingItems.length > 0) {
    const container = {
      id: `Container-${packedContainers.length + 1}`,
      type: containerType.id,
      name: `${containerType.name} #${packedContainers.length + 1}`,
      l: containerType.l,
      w: containerType.w,
      h: containerType.h,
      maxWeight: containerType.maxWeight,
      items: [],
      stats: {
        utilization: 0,
        usedVolume: 0,
        totalVolume: containerType.l * containerType.w * containerType.h,
        usedWeight: 0,
        totalWeight: 0,
        cgX: 0, // Center of gravity X
        cgY: 0, // Center of gravity Y
        cgZ: 0, // Center of gravity Z
        cgXShift: 0, // Percentage shift from center
        cgYShift: 0,
      }
    };

    const result = packSingleContainer(remainingItems, container, supportThreshold);
    
    // If we could not pack even a single item, break to avoid infinite loop
    if (result.packedCount === 0) {
      // Pack the rest in a virtual/failed container or just break and list them as unpacked
      break;
    }

    packedContainers.push(container);
    remainingItems = result.unpackedItems;
  }

  return {
    containers: packedContainers,
    unpacked: remainingItems,
  };
}

/**
 * Sorts items based on specified strategy
 */
function sortItems(items, strategy) {
  if (strategy === 'volume') {
    // Volume descending
    items.sort((a, b) => (b.l * b.w * b.h) - (a.l * a.w * a.h));
  } else if (strategy === 'footprint') {
    // Footprint (L * W) descending
    items.sort((a, b) => (b.l * b.w) - (a.l * a.w));
  } else if (strategy === 'height') {
    // Height descending
    items.sort((a, b) => b.h - a.h);
  } else if (strategy === 'weight') {
    // Weight descending (heavy items first)
    items.sort((a, b) => b.weight - a.weight);
  } else {
    // Default to volume descending
    items.sort((a, b) => (b.l * b.w * b.h) - (a.l * a.w * a.h));
  }
}

/**
 * Gets all valid 3D rotations/orientations of a box based on constraints.
 */
export function getValidOrientations(item) {
  const { l, w, h, allowSide, allowUpsideDown } = item;
  
  // A box orientation is defined by (dx, dy, dz) where dx = length, dy = width, dz = height in space
  const orientations = [];

  // If upside down or side orientation is restricted, height must remain height.
  // Swapping L and W is always allowed (yaw rotation of 90 degrees is standard).
  if (!allowSide || !allowUpsideDown) {
    orientations.push({ dx: l, dy: w, dz: h });
    if (l !== w) {
      orientations.push({ dx: w, dy: l, dz: h });
    }
  } else {
    // 6 possible orientations in 3D
    const permutations = [
      { dx: l, dy: w, dz: h },
      { dx: w, dy: l, dz: h },
      { dx: l, dy: h, dz: w },
      { dx: h, dy: l, dz: w },
      { dx: w, dy: h, dz: l },
      { dx: h, dy: w, dz: l }
    ];

    // Filter out duplicate dimensions (e.g. for cubes)
    const seen = new Set();
    permutations.forEach(p => {
      const key = `${p.dx}-${p.dy}-${p.dz}`;
      if (!seen.has(key)) {
        seen.add(key);
        orientations.push(p);
      }
    });
  }

  return orientations;
}

/**
 * Packs items into a single container using Extreme Points rule and Heuristics
 */
function packSingleContainer(items, container, supportThreshold) {
  const { l: cL, w: cW, h: cH, maxWeight } = container;
  const packedItems = [];
  const unpackedItems = [];
  
  // Extreme Points list, starts with (0,0,0)
  // Each EP is an object { x, y, z }
  let extremePoints = [{ x: 0, y: 0, z: 0 }];
  let currentWeight = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Check if adding this item exceeds weight capacity
    if (currentWeight + item.weight > maxWeight) {
      unpackedItems.push(item);
      continue;
    }

    // Find the best extreme point and orientation for this item
    let bestPlacement = null;
    let bestScore = -Infinity; // Larger score is better

    // Sort extreme points to prioritize back, bottom, left (small x, then z, then y)
    // In container loading, packing from back-to-front (x is length), floor-upwards (z is height) is standard.
    extremePoints.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      if (a.z !== b.z) return a.z - b.z;
      return a.y - b.y;
    });

    const orientations = getValidOrientations(item);

    for (const ep of extremePoints) {
      for (const ori of orientations) {
        const { dx, dy, dz } = ori;

        // 1. Boundaries Check
        if (ep.x + dx > cL || ep.y + dy > cW || ep.z + dz > cH) {
          continue;
        }

        // 2. Overlap Check
        let overlaps = false;
        for (const pi of packedItems) {
          if (
            ep.x + dx > pi.x && ep.x < pi.x + pi.dx &&
            ep.y + dy > pi.y && ep.y < pi.y + pi.dy &&
            ep.z + dz > pi.z && ep.z < pi.z + pi.dz
          ) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) continue;

        // 3. Bottom Support Check
        if (ep.z > 0) {
          let supportedArea = 0;
          let stackingViolation = false;

          for (const pi of packedItems) {
            // Check if pi is directly underneath the candidate box
            if (Math.abs((pi.z + pi.dz) - ep.z) < 1) {
              // Calculate overlap in XY projection
              const overlapX = Math.max(0, Math.min(ep.x + dx, pi.x + pi.dx) - Math.max(ep.x, pi.x));
              const overlapY = Math.max(0, Math.min(ep.y + dy, pi.y + pi.dy) - Math.max(ep.y, pi.y));
              const area = overlapX * overlapY;
              
              if (area > 0) {
                supportedArea += area;
                
                // Weight class stacking constraint check
                // Heavy (3) cannot stack on Medium (2) or Light (1)
                // Medium (2) cannot stack on Light (1)
                if (item.stackingGrade > pi.stackingGrade) {
                  stackingViolation = true;
                  break;
                }
              }
            }
          }

          if (stackingViolation) continue;

          const requiredArea = dx * dy * supportThreshold;
          if (supportedArea < requiredArea) {
            continue; // Not enough support
          }
        }

        // 4. Stacking Order Constraint for EP.z === 0 (Floor placement is always stable)
        // If everything is fine, evaluate placement score.
        // We prefer positions that keep the packing tight and low.
        // Heuristic score: Minimize X (back of container), minimize Z (keep load low), minimize Y (flush with side).
        // Score = - (ep.x + dx/2) - (ep.z + dz/2) * 2 - (ep.y + dy/2)
        // We can tweak this score. To pack densely back-to-front, we penalize X heavily.
        const score = -(ep.x * 1.5) - (ep.z * 1.2) - ep.y;

        if (score > bestScore) {
          bestScore = score;
          bestPlacement = {
            ep,
            dx,
            dy,
            dz,
            score
          };
        }
      }
    }

    if (bestPlacement) {
      // Place the item!
      const { ep, dx, dy, dz } = bestPlacement;
      const placedItem = {
        uniqueId: item.uniqueId,
        sku: item.sku,
        name: item.sku,
        x: ep.x,
        y: ep.y,
        z: ep.z,
        dx,
        dy,
        dz,
        weight: item.weight,
        stackingGrade: item.stackingGrade,
        color: item.color || '#8b5cf6',
        stepIndex: packedItems.length + 1
      };

      packedItems.push(placedItem);
      currentWeight += item.weight;

      // Update Extreme Points
      // Remove the used extreme point
      extremePoints = extremePoints.filter(p => p.x !== ep.x || p.y !== ep.y || p.z !== ep.z);

      // Generate 3 new extreme points from the placed box corners
      const newPoints = [
        { x: ep.x + dx, y: ep.y, z: ep.z },
        { x: ep.x, y: ep.y + dy, z: ep.z },
        { x: ep.x, y: ep.y, z: ep.z + dz }
      ];

      // Insert new EPs if they are inside container boundaries and not inside any placed boxes
      newPoints.forEach(np => {
        if (np.x < cL && np.y < cW && np.z < cH) {
          // Check if np is inside any placed box
          let inside = false;
          for (const pi of packedItems) {
            if (
              np.x >= pi.x && np.x < pi.x + pi.dx &&
              np.y >= pi.y && np.y < pi.y + pi.dy &&
              np.z >= pi.z && np.z < pi.z + pi.dz
            ) {
              inside = true;
              break;
            }
          }
          if (!inside) {
            // Also avoid duplicate points
            const duplicate = extremePoints.some(p => p.x === np.x && p.y === np.y && p.z === np.z);
            if (!duplicate) {
              extremePoints.push(np);
            }
          }
        }
      });

      // Optional: Prune dominated extreme points to optimize EP list size
      pruneExtremePoints(extremePoints, packedItems, cL, cW, cH);

    } else {
      // Could not pack this item in this container, save for subsequent containers
      unpackedItems.push(item);
    }
  }

  // Calculate statistics for the packed container
  let usedVolume = 0;
  let weightedSumX = 0;
  let weightedSumY = 0;
  let weightedSumZ = 0;
  let totalWeightInContainer = currentWeight;

  packedItems.forEach(pi => {
    usedVolume += pi.dx * pi.dy * pi.dz;
    const itemWeight = pi.weight;
    weightedSumX += (pi.x + pi.dx / 2) * itemWeight;
    weightedSumY += (pi.y + pi.dy / 2) * itemWeight;
    weightedSumZ += (pi.z + pi.dz / 2) * itemWeight;
  });

  const totalVolume = cL * cW * cH;
  container.items = packedItems;
  container.stats.usedVolume = usedVolume;
  container.stats.utilization = Number(((usedVolume / totalVolume) * 100).toFixed(2));
  container.stats.usedWeight = currentWeight;

  if (totalWeightInContainer > 0) {
    container.stats.cgX = Number((weightedSumX / totalWeightInContainer).toFixed(0));
    container.stats.cgY = Number((weightedSumY / totalWeightInContainer).toFixed(0));
    container.stats.cgZ = Number((weightedSumZ / totalWeightInContainer).toFixed(0));

    // Shift percentage calculation: (CG - Center) / Center * 100%
    const centerX = cL / 2;
    const centerY = cW / 2;
    container.stats.cgXShift = Number(((container.stats.cgX - centerX) / centerX * 100).toFixed(1));
    container.stats.cgYShift = Number(((container.stats.cgY - centerY) / centerY * 100).toFixed(1));
  }

  return {
    packedCount: packedItems.length,
    unpackedItems,
  };
}

/**
 * Prunes dominated or blocked extreme points to maintain efficiency.
 */
function pruneExtremePoints(eps, packedItems, cL, cW, cH) {
  // If an EP is enclosed/covered by already packed items, it is useless and should be removed.
  for (let i = eps.length - 1; i >= 0; i--) {
    const ep = eps[i];
    
    // Check if the point is within the boundaries of any packed item
    let covered = false;
    for (const pi of packedItems) {
      if (
        ep.x >= pi.x && ep.x < pi.x + pi.dx &&
        ep.y >= pi.y && ep.y < pi.y + pi.dy &&
        ep.z >= pi.z && ep.z < pi.z + pi.dz
      ) {
        covered = true;
        break;
      }
    }

    // Also check if the EP is structurally blocked in all directions (cannot fit even the smallest item)
    // (We keep this simple to maintain super-fast speed)
    if (covered || ep.x >= cL || ep.y >= cW || ep.z >= cH) {
      eps.splice(i, 1);
    }
  }
}

/**
 * Packs a specific order of items according to a sequence chromosome and orientation gene.
 * This is used inside the Genetic Algorithm in Max Mode.
 * @param {Array} originalItems - Flattened items.
 * @param {Array} sequenceGenes - Array of indices representing packing order.
 * @param {Array} orientationGenes - Array of integers (0-5) representing orientation preference.
 * @param {Object} containerType - Selected container.
 * @param {number} supportThreshold - Bottom support threshold.
 * @returns {Object} Packed results.
 */
export function packByChromosome(originalItems, sequenceGenes, orientationGenes, containerType, supportThreshold = 0.60) {
  // Sort originalItems based on sequenceGenes order
  const orderedItems = [];
  for (let idx of sequenceGenes) {
    orderedItems.push(originalItems[idx]);
  }

  // Set the rotation index preference for each item
  const itemsWithRotationGene = orderedItems.map((item, idx) => {
    const orientations = getValidOrientations(item);
    const geneVal = orientationGenes[idx] % orientations.length;
    const selectedOri = orientations[geneVal] || orientations[0];
    
    return {
      ...item,
      // Override dimensions with the chosen orientation
      l: selectedOri.dx,
      w: selectedOri.dy,
      h: selectedOri.dz,
    };
  });

  // Pack them using the standard single container packing logic, but without changing the order or dimensions
  // (We pack as many as possible into one container, and returns the packed items)
  const container = {
    id: 'GA-Eval-Container',
    type: containerType.id,
    name: containerType.name,
    l: containerType.l,
    w: containerType.w,
    h: containerType.h,
    maxWeight: containerType.maxWeight,
    items: [],
    stats: {
      utilization: 0,
      usedVolume: 0,
      totalVolume: containerType.l * containerType.w * containerType.h,
      usedWeight: 0,
      totalWeight: 0,
    }
  };

  // Perform single container packing with preset orientations (no search over multiple orientations, just pack the preset one!)
  const packedItems = [];
  let extremePoints = [{ x: 0, y: 0, z: 0 }];
  let currentWeight = 0;

  for (let i = 0; i < itemsWithRotationGene.length; i++) {
    const item = itemsWithRotationGene[i];

    if (currentWeight + item.weight > container.maxWeight) {
      continue;
    }

    extremePoints.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      if (a.z !== b.z) return a.z - b.z;
      return a.y - b.y;
    });

    for (const ep of extremePoints) {
      const dx = item.l;
      const dy = item.w;
      const dz = item.h;

      // 1. Boundary
      if (ep.x + dx > container.l || ep.y + dy > container.w || ep.z + dz > container.h) {
        continue;
      }

      // 2. Overlap
      let overlaps = false;
      for (const pi of packedItems) {
        if (
          ep.x + dx > pi.x && ep.x < pi.x + pi.dx &&
          ep.y + dy > pi.y && ep.y < pi.y + pi.dy &&
          ep.z + dz > pi.z && ep.z < pi.z + pi.dz
        ) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      // 3. Bottom Support
      if (ep.z > 0) {
        let supportedArea = 0;
        let stackingViolation = false;

        for (const pi of packedItems) {
          if (Math.abs((pi.z + pi.dz) - ep.z) < 1) {
            const overlapX = Math.max(0, Math.min(ep.x + dx, pi.x + pi.dx) - Math.max(ep.x, pi.x));
            const overlapY = Math.max(0, Math.min(ep.y + dy, pi.y + pi.dy) - Math.max(ep.y, pi.y));
            const area = overlapX * overlapY;
            
            if (area > 0) {
              supportedArea += area;
              if (item.stackingGrade > pi.stackingGrade) {
                stackingViolation = true;
                break;
              }
            }
          }
        }

        if (stackingViolation) continue;

        const requiredArea = dx * dy * supportThreshold;
        if (supportedArea < requiredArea) {
          continue;
        }
      }

      // If fits, place it
      const placedItem = {
        uniqueId: item.uniqueId,
        sku: item.sku,
        name: item.sku,
        x: ep.x,
        y: ep.y,
        z: ep.z,
        dx,
        dy,
        dz,
        weight: item.weight,
        stackingGrade: item.stackingGrade,
        color: item.color || '#8b5cf6',
        stepIndex: packedItems.length + 1
      };

      packedItems.push(placedItem);
      currentWeight += item.weight;

      // Update Extreme Points
      extremePoints = extremePoints.filter(p => p.x !== ep.x || p.y !== ep.y || p.z !== ep.z);
      const newPoints = [
        { x: ep.x + dx, y: ep.y, z: ep.z },
        { x: ep.x, y: ep.y + dy, z: ep.z },
        { x: ep.x, y: ep.y, z: ep.z + dz }
      ];

      newPoints.forEach(np => {
        if (np.x < container.l && np.y < container.w && np.z < container.h) {
          let inside = false;
          for (const pi of packedItems) {
            if (
              np.x >= pi.x && np.x < pi.x + pi.dx &&
              np.y >= pi.y && np.y < pi.y + pi.dy &&
              np.z >= pi.z && np.z < pi.z + pi.dz
            ) {
              inside = true;
              break;
            }
          }
          if (!inside) {
            const duplicate = extremePoints.some(p => p.x === np.x && p.y === np.y && p.z === np.z);
            if (!duplicate) {
              extremePoints.push(np);
            }
          }
        }
      });

      pruneExtremePoints(extremePoints, packedItems, container.l, container.w, container.h);
      break; // Move to the next item
    }
  }

  let usedVolume = 0;
  packedItems.forEach(pi => {
    usedVolume += pi.dx * pi.dy * pi.dz;
  });

  const totalVolume = container.l * container.w * container.h;
  const utilization = usedVolume / totalVolume;

  return {
    utilization,
    usedVolume,
    usedWeight: currentWeight,
    packedItems
  };
}
