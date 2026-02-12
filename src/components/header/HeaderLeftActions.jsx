import { Github, MessageSquareText } from 'lucide-react';
import IconButton from './IconButton';

const HeaderLeftActions = ({ githubUrl, onOpenPrompt }) => {
  return (
    <div
      className="absolute top-0 flex items-center gap-2"
      style={{ left: '-36px' }}
    >
      <IconButton
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="GitHub"
      >
        <Github size={20} />
      </IconButton>

      <IconButton onClick={onOpenPrompt} title="AI Prompt">
        <MessageSquareText size={20} />
      </IconButton>
    </div>
  );
};

export default HeaderLeftActions;

