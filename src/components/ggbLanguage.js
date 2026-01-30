import { autocompletion, completeFromList, snippet } from '@codemirror/autocomplete';
import { StreamLanguage } from '@codemirror/language';

const buildSnippet = (syntax) => {
  let index = 1;
  return syntax.replace(/<\s*([^>]+)\s*>/g, (_, name) => {
    const placeholder = '${' + index + ':' + name.trim() + '}';
    index += 1;
    return placeholder;
  });
};

const buildCompletionList = (commands) => {
  const completionList = [];

  commands.forEach((command) => {
    if (!command || typeof command.n !== 'string') return;
    const syntaxes = Array.isArray(command.s) ? command.s : [];

    syntaxes.forEach((syntax) => {
      if (typeof syntax !== 'string') return;
      completionList.push({
        label: command.n,
        detail: syntax,
        type: 'function',
        apply: snippet(buildSnippet(syntax))
      });
    });
  });

  return completionList;
};

const buildCommandSet = (commands) => {
  const commandSet = new Set();

  commands.forEach((command) => {
    if (command && typeof command.n === 'string') {
      commandSet.add(command.n);
    }
  });

  return commandSet;
};

const ggbStreamMode = (commandSet) => ({
  token: (stream) => {
    if (stream.eatSpace()) return null;
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.match(/-?\d+(?:\.\d+)?/)) return 'number';
    if (stream.match(/[()\[\]]/)) return 'bracket';

    const word = stream.match(/[a-zA-Z_][a-zA-Z0-9_]*/);
    if (word && commandSet.has(word[0])) {
      return 'builtin';
    }

    stream.next();
    return null;
  }
});

export const buildGgbExtensions = (commands) => {
  const commandSet = buildCommandSet(commands);
  const completionList = buildCompletionList(commands);

  const ggbHighlight = StreamLanguage.define(ggbStreamMode(commandSet));
  const ggbCompletion = autocompletion({
    override: [completeFromList(completionList)],
    activateOnTyping: true
  });

  return { ggbHighlight, ggbCompletion };
};
