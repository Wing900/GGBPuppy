export function parseCommands(code) {
  if (!code) {
    return [];
  }

  return code
    .split('\n')
    .map((line) => {
      const commentIndex = line.indexOf('//');
      return (commentIndex === -1 ? line : line.slice(0, commentIndex)).trim();
    })
    .filter((line) => line !== '');
}

export function parseCommandsWithLineIndex(code) {
  if (!code) {
    return [];
  }

  return code
    .split('\n')
    .map((line, index) => {
      const commentIndex = line.indexOf('//');
      const trimmed = (commentIndex === -1 ? line : line.slice(0, commentIndex)).trim();
      return { line: trimmed, index };
    })
    .filter(({ line }) => line !== '');
}

