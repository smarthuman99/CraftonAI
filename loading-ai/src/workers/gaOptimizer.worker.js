import { packByChromosome } from '../utils/binPacking.js';

self.onmessage = function (e) {
  const { items, containerType, options = {} } = e.data;
  const {
    generations = 80,
    populationSize = 24,
    mutationRate = 0.15,
    crossoverRate = 0.8,
    supportThreshold = 0.60,
  } = options;

  if (!items || items.length === 0) {
    self.postMessage({ type: 'done', containers: [], unpacked: [] });
    return;
  }

  // Flatten items by quantity to create individual packable units
  // Same flattening as binPacking.js
  let flatItems = [];
  let unitId = 0;
  items.forEach(item => {
    for (let q = 0; q < item.qty; q++) {
      flatItems.push({
        ...item,
        uniqueId: `${item.id || item.sku}-${unitId++}`,
        l: Number(item.l),
        w: Number(item.w),
        h: Number(item.h),
        weight: Number(item.weight || 1),
        stackingGrade: Number(item.stackingGrade || 2),
        allowSide: item.allowSide !== false,
        allowUpsideDown: item.allowUpsideDown !== false,
      });
    }
  });

  const N = flatItems.length;
  if (N === 0) {
    self.postMessage({ type: 'done', containers: [], unpacked: [] });
    return;
  }

  // To support multi-container loading in Max Mode, we optimize one container at a time.
  // We pack the first container using GA, remove packed items, then pack the second container with GA, and so on.
  let remainingItems = [...flatItems];
  const packedContainers = [];
  let containerCount = 0;

  const startTime = Date.now();

  while (remainingItems.length > 0 && containerCount < 10) { // Safety cap of 10 containers
    containerCount++;
    const currentContainerName = `${containerType.name} #${containerCount}`;

    // Run GA to pack as much as possible into this current container
    const bestChromo = runGAForSingleContainer(
      remainingItems,
      containerType,
      generations,
      populationSize,
      mutationRate,
      crossoverRate,
      supportThreshold,
      (progressPercent, bestUtil) => {
        // Send incremental progress back to main thread
        // Calculate total progress including previously completed containers
        const totalProgress = Math.round(
          ((containerCount - 1) / 3 + (progressPercent / 100) / 3) * 100
        );
        self.postMessage({
          type: 'progress',
          containerIndex: containerCount,
          containerName: currentContainerName,
          generationProgress: progressPercent,
          totalProgress: Math.min(99, totalProgress),
          bestUtilization: Number((bestUtil * 100).toFixed(2)),
          elapsedTime: Date.now() - startTime
        });
      }
    );

    const bestPackedItems = bestChromo.packedItems;

    // If GA could not place a single item, we stop to avoid infinite loop
    if (bestPackedItems.length === 0) {
      break;
    }

    // Build the packed container object
    let currentWeight = 0;
    let usedVolume = 0;
    let weightedSumX = 0;
    let weightedSumY = 0;
    let weightedSumZ = 0;

    bestPackedItems.forEach((pi, index) => {
      pi.stepIndex = index + 1; // Correct step order
      currentWeight += pi.weight;
      usedVolume += pi.dx * pi.dy * pi.dz;
      weightedSumX += (pi.x + pi.dx / 2) * pi.weight;
      weightedSumY += (pi.y + pi.dy / 2) * pi.weight;
      weightedSumZ += (pi.z + pi.dz / 2) * pi.weight;
    });

    const cL = containerType.l;
    const cW = containerType.w;
    const cH = containerType.h;
    const totalVolume = cL * cW * cH;

    const containerResult = {
      id: `Container-${containerCount}`,
      type: containerType.id,
      name: currentContainerName,
      l: cL,
      w: cW,
      h: cH,
      maxWeight: containerType.maxWeight,
      items: bestPackedItems,
      stats: {
        utilization: Number(((usedVolume / totalVolume) * 100).toFixed(2)),
        usedVolume,
        totalVolume,
        usedWeight: currentWeight,
        cgX: 0,
        cgY: 0,
        cgZ: 0,
        cgXShift: 0,
        cgYShift: 0,
      }
    };

    if (currentWeight > 0) {
      containerResult.stats.cgX = Number((weightedSumX / currentWeight).toFixed(0));
      containerResult.stats.cgY = Number((weightedSumY / currentWeight).toFixed(0));
      containerResult.stats.cgZ = Number((weightedSumZ / currentWeight).toFixed(0));

      const centerX = cL / 2;
      const centerY = cW / 2;
      containerResult.stats.cgXShift = Number(((containerResult.stats.cgX - centerX) / centerX * 100).toFixed(1));
      containerResult.stats.cgYShift = Number(((containerResult.stats.cgY - centerY) / centerY * 100).toFixed(1));
    }

    packedContainers.push(containerResult);

    // Identify which items were packed and filter them out from remaining list
    const packedUniqueIds = new Set(bestPackedItems.map(pi => pi.uniqueId));
    remainingItems = remainingItems.filter(item => !packedUniqueIds.has(item.uniqueId));
  }

  self.postMessage({
    type: 'done',
    containers: packedContainers,
    unpacked: remainingItems,
    elapsedTime: Date.now() - startTime
  });
};

/**
 * Executes Genetic Algorithm for a single container.
 */
function runGAForSingleContainer(
  items,
  containerType,
  generations,
  popSize,
  mutationRate,
  crossoverRate,
  supportThreshold,
  onProgress
) {
  const N = items.length;

  // Initialize Population
  let population = [];

  // Seed 1: Fast Mode sorting (volume descending) to guarantee GA is at least as good
  const defaultSeq = Array.from({ length: N }, (_, i) => i);
  // Sort defaultSeq based on item volume descending
  defaultSeq.sort((a, b) => {
    const volA = items[a].l * items[a].w * items[a].h;
    const volB = items[b].l * items[b].w * items[b].h;
    return volB - volA;
  });
  const defaultOri = Array.from({ length: N }, () => 0); // Flat orientation
  const defaultResult = packByChromosome(items, defaultSeq, defaultOri, containerType, supportThreshold);
  
  population.push({
    sequence: defaultSeq,
    orientations: defaultOri,
    utilization: defaultResult.utilization,
    packedItems: defaultResult.packedItems,
    fitness: defaultResult.utilization
  });

  // Seed 2: Footprint descending
  const footprintSeq = Array.from({ length: N }, (_, i) => i);
  footprintSeq.sort((a, b) => (items[b].l * items[b].w) - (items[a].l * items[a].w));
  const fpResult = packByChromosome(items, footprintSeq, defaultOri, containerType, supportThreshold);
  population.push({
    sequence: footprintSeq,
    orientations: defaultOri,
    utilization: fpResult.utilization,
    packedItems: fpResult.packedItems,
    fitness: fpResult.utilization
  });

  // Create remaining population randomly
  for (let i = population.length; i < popSize; i++) {
    const seq = shuffleArray(Array.from({ length: N }, (_, i) => i));
    const ori = Array.from({ length: N }, () => Math.floor(Math.random() * 6));
    const evalResult = packByChromosome(items, seq, ori, containerType, supportThreshold);
    population.push({
      sequence: seq,
      orientations: ori,
      utilization: evalResult.utilization,
      packedItems: evalResult.packedItems,
      fitness: evalResult.utilization
    });
  }

  let bestIndividual = getBestIndividual(population);

  // GA Iterations Loop
  for (let gen = 1; gen <= generations; gen++) {
    // Selection (Roulette wheel or Tournament selection)
    // We will use Tournament Selection of size 3 (highly robust)
    const nextGeneration = [];

    // Keep the best elite
    nextGeneration.push(JSON.parse(JSON.stringify(bestIndividual)));

    while (nextGeneration.length < popSize) {
      // Parent 1
      const parent1 = tournamentSelect(population, 3);
      // Parent 2
      const parent2 = tournamentSelect(population, 3);

      let childSeq = parent1.sequence;
      let childOri = parent1.orientations;

      // Crossover
      if (Math.random() < crossoverRate) {
        childSeq = orderCrossover(parent1.sequence, parent2.sequence);
        childOri = uniformCrossover(parent1.orientations, parent2.orientations);
      }

      // Mutation
      if (Math.random() < mutationRate) {
        childSeq = mutateSequence(childSeq);
        childOri = mutateOrientations(childOri);
      }

      // Evaluate child
      const evalResult = packByChromosome(items, childSeq, childOri, containerType, supportThreshold);
      
      nextGeneration.push({
        sequence: childSeq,
        orientations: childOri,
        utilization: evalResult.utilization,
        packedItems: evalResult.packedItems,
        fitness: evalResult.utilization
      });
    }

    population = nextGeneration;
    const genBest = getBestIndividual(population);
    if (genBest.fitness > bestIndividual.fitness) {
      bestIndividual = genBest;
    }

    // Call progress callback
    if (gen % 5 === 0 || gen === generations) {
      const progressPercent = Math.round((gen / generations) * 100);
      onProgress(progressPercent, bestIndividual.fitness);
    }
  }

  return bestIndividual;
}

/**
 * Tournament Selection
 */
function tournamentSelect(population, size) {
  let best = null;
  for (let i = 0; i < size; i++) {
    const ind = population[Math.floor(Math.random() * population.length)];
    if (!best || ind.fitness > best.fitness) {
      best = ind;
    }
  }
  return best;
}

/**
 * Order Crossover (OX) for Permutations
 */
function orderCrossover(parent1, parent2) {
  const size = parent1.length;
  const child = Array(size).fill(-1);

  // Pick two random cut points
  let start = Math.floor(Math.random() * size);
  let end = Math.floor(Math.random() * size);
  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  // Copy segment from Parent 1
  for (let i = start; i <= end; i++) {
    child[i] = parent1[i];
  }

  // Fill remaining elements from Parent 2 in order
  let currentChildIdx = (end + 1) % size;
  let currentParent2Idx = (end + 1) % size;

  for (let i = 0; i < size; i++) {
    const item = parent2[currentParent2Idx];
    if (!child.includes(item)) {
      child[currentChildIdx] = item;
      currentChildIdx = (currentChildIdx + 1) % size;
    }
    currentParent2Idx = (currentParent2Idx + 1) % size;
  }

  return child;
}

/**
 * Uniform Crossover for Orientation Genes
 */
function uniformCrossover(parent1, parent2) {
  return parent1.map((val, idx) => {
    return Math.random() < 0.5 ? val : parent2[idx];
  });
}

/**
 * Swaps two random elements in sequence
 */
function mutateSequence(seq) {
  const res = [...seq];
  const idx1 = Math.floor(Math.random() * res.length);
  const idx2 = Math.floor(Math.random() * res.length);
  const temp = res[idx1];
  res[idx1] = res[idx2];
  res[idx2] = temp;
  return res;
}

/**
 * Randomly modifies some orientation genes (rotations 0 to 5)
 */
function mutateOrientations(ori) {
  return ori.map(val => {
    return Math.random() < 0.15 ? Math.floor(Math.random() * 6) : val;
  });
}

/**
 * Helper: shuffle array
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Get index of best individual
 */
function getBestIndividual(population) {
  let best = population[0];
  for (let i = 1; i < population.length; i++) {
    if (population[i].fitness > best.fitness) {
      best = population[i];
    }
  }
  return best;
}
