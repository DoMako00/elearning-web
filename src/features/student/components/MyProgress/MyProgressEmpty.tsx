import mintBackground from './mint-background.svg';
import learningPath from './learning-path.png';
import './MyProgressEmpty.css';

export interface MyProgressEmptyProps {
  className?: string;
}

export function MyProgressEmpty({ className = '' }: MyProgressEmptyProps) {
  return (
    <section
      className={`my-progress-empty ${className}`.trim()}
      aria-label="My Progress: Every journey starts somewhere. Your first lesson is your first step."
      role="region"
    >
      <img
        src={mintBackground}
        alt=""
        aria-hidden="true"
        className="my-progress-empty__bg"
      />

      <div className="my-progress-empty__art" aria-hidden="true">
        <img
          src={learningPath}
          alt=""
          className="my-progress-empty__illustration"
        />
      </div>

      <div className="my-progress-empty__content">
        <div className="my-progress-empty__header">
          <span className="my-progress-empty__pill" aria-hidden="true" />
          <h2 className="my-progress-empty__title">My Progress</h2>
        </div>

        <div className="my-progress-empty__message">
          <h3 className="my-progress-empty__heading">
            Every journey<br />starts somewhere.
          </h3>
          <p className="my-progress-empty__sub">
            Your first lesson is your first step.
          </p>
        </div>
      </div>
    </section>
  );
}
