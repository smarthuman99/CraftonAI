// A polling interval must not claim another batch while this worker is still
// processing the previous one. Other worker processes can claim independently.
export function exclusiveTask(task) {
  let running = null;
  return () => {
    if (running) return running;
    running = Promise.resolve()
      .then(task)
      .finally(() => {
        running = null;
      });
    return running;
  };
}
