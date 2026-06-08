import { useEffect, useRef, useState } from 'react';
import './SendButton.css';

// Split a string into <span> letters, dropping spaces (the CSS adds an
// explicit gap between "Send" and "Message" via :nth-child(4)).
function letters(word, offset = 0) {
  return word
    .split('')
    .filter(ch => ch !== ' ')
    .map((ch, i) => (
      <span key={i} style={{ '--i': i + offset }}>
        {ch}
      </span>
    ));
}

// How long to keep the "sent" state visible after `submitting` flips
// back to false. The "Sent" letters slide in with a 0.2s-per-letter
// stagger; with 4 letters the last one finishes at ~2.4s, and the
// checkmark "appear" animation ends around 2s. We give it a little
// extra so the user actually reads "Sent" before it disappears.
const SENT_HOLD_MS = 2600;

/**
 * Animated Send button (paper plane + letter wave + Sent state).
 * Drop-in replacement for a `<button type="submit">`.
 *
 * The original styled-components version drove the "Sent" state from the
 * `:focus` selector — but disabling a button strips its focus, which cut
 * the animation. We now drive the same animation from an `.is-sent`
 * class that we hold for SENT_HOLD_MS after the parent stops submitting.
 */
export default function SendButton({
  disabled = false,
  submitting = false,
  label = 'Send Message',
  sentLabel = 'Sent',
  onClick,
  type = 'submit'
}) {
  const [animateSent, setAnimateSent] = useState(false);
  const sentTimerRef = useRef(null);
  const wasSubmittingRef = useRef(submitting);

  useEffect(() => {
    const wasSubmitting = wasSubmittingRef.current;
    wasSubmittingRef.current = submitting;

    if (submitting && !wasSubmitting) {
      // Submission started — show sent state immediately.
      if (sentTimerRef.current) {
        clearTimeout(sentTimerRef.current);
        sentTimerRef.current = null;
      }
      setAnimateSent(true);
    } else if (!submitting && wasSubmitting) {
      // Submission finished — keep sent state visible long enough for
      // the animation to fully play.
      if (sentTimerRef.current) clearTimeout(sentTimerRef.current);
      sentTimerRef.current = setTimeout(() => {
        setAnimateSent(false);
        sentTimerRef.current = null;
      }, SENT_HOLD_MS);
    }
  }, [submitting]);

  useEffect(() => {
    return () => {
      if (sentTimerRef.current) clearTimeout(sentTimerRef.current);
    };
  }, []);

  const classes = ['send-btn'];
  if (animateSent) classes.push('is-sent');
  if (submitting) classes.push('is-loading');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || animateSent}
      className={classes.join(' ')}
    >
      <span className="send-outline" />
      <span className="send-state send-state--default">
        <span className="send-icon" aria-hidden>
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g style={{ filter: 'url(#send-btn-shadow)' }}>
              <path
                d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                fill="currentColor"
              />
              <path
                d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                fill="currentColor"
              />
            </g>
            <defs>
              <filter id="send-btn-shadow">
                <feDropShadow dx={0} dy={1} stdDeviation="0.6" floodOpacity="0.5" />
              </filter>
            </defs>
          </svg>
        </span>
        <p>{letters(label)}</p>
      </span>

      <span className="send-state send-state--sent">
        <p>{letters(sentLabel, 5)}</p>
      </span>
    </button>
  );
}
