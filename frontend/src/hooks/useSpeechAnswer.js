import { useEffect, useRef, useState } from 'react';

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function useSpeechAnswer(active) {
  const [answer, setAnswer] = useState('');
  const [interim, setInterim] = useState('');
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [isPureSpeech, setIsPureSpeech] = useState(true);
  const recognition = useRef(null);
  const startedAt = useRef(null);
  const accumulated = useRef(0);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(
      () =>
        setSeconds(
          accumulated.current +
            (startedAt.current ? (performance.now() - startedAt.current) / 1000 : 0),
        ),
      250,
    );
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!active) recognition.current?.stop();
  }, [active]);

  useEffect(
    () => () => {
      if (recognition.current) {
        const current = recognition.current;
        current.onresult = current.onerror = current.onend = current.onaudiostart = null;
        current.abort();
      }
    },
    [],
  );

  function start() {
    if (!Recognition || recognition.current) return;
    setError('');
    setStarting(true);
    const current = new Recognition();
    recognition.current = current;
    current.lang = 'en-US';
    current.continuous = true;
    current.interimResults = true;
    const prefix = answer.trim();
    current.onaudiostart = () => {
      startedAt.current = performance.now();
      setStarting(false);
      setRecording(true);
    };
    current.onresult = (event) => {
      let final = '',
        partial = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += `${event.results[i][0].transcript} `;
        else partial += event.results[i][0].transcript;
      }
      setAnswer([prefix, final.trim()].filter(Boolean).join(' ').slice(0, 12000));
      setInterim(partial);
    };
    current.onerror = (event) => {
      const messages = {
        'not-allowed':
          'Microphone access was denied. You can allow it in your browser or type your answer below.',
        'audio-capture': 'No microphone is available. Connect one or type your answer.',
        network: 'Speech recognition could not connect. You can continue by typing.',
        'no-speech': 'No speech was detected. Try again or type your answer.',
      };
      if (event.error !== 'aborted')
        setError(
          messages[event.error] || 'Voice input stopped. Your transcript is still available below.',
        );
    };
    current.onend = () => {
      if (startedAt.current) accumulated.current += (performance.now() - startedAt.current) / 1000;
      startedAt.current = null;
      setSeconds(accumulated.current);
      recognition.current = null;
      setStarting(false);
      setRecording(false);
      setInterim('');
    };
    try {
      current.start();
    } catch {
      recognition.current = null;
      setStarting(false);
      setError('Voice input could not start. Please type your answer or try again.');
    }
  }

  function edit(value) {
    setAnswer(value);
    setIsPureSpeech(false);
  }

  function reset() {
    recognition.current?.abort();
    accumulated.current = 0;
    startedAt.current = null;
    setAnswer('');
    setInterim('');
    setSeconds(0);
    setIsPureSpeech(true);
    setError('');
  }

  return {
    answer,
    edit,
    reset,
    interim,
    recording,
    starting,
    error,
    seconds,
    supported: Boolean(Recognition),
    start,
    stop: () => recognition.current?.stop(),
    spokenSeconds: isPureSpeech && seconds >= 1 ? Math.min(seconds, 3600) : null,
  };
}
