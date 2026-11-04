import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

export const MAX_VOICE_SECONDS = 120; // the backend takes up to 2 minutes

// a voice, not music: mono AAC at 64 kbit/s, about 1 MB for 2 minutes
const OPTIONS: RecordingOptions = { ...RecordingPresets.LOW_QUALITY, numberOfChannels: 1, bitRate: 64000 };

/**
 * Records one voice message: start(), then finish() hands the file and its length to onDone, cancel() drops it.
 * Stops by itself at 2 minutes. Recordings under 1 second are dropped (a tap by mistake).
 */
export function useVoiceRecorder(onDone: (uri: string, seconds: number) => void) {
  const recorder = useAudioRecorder(OPTIONS);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const stop = async (send: boolean) => {
    if (!startedAt.current) return;
    const length = (Date.now() - startedAt.current) / 1000;
    startedAt.current = 0;
    setRecording(false);
    await recorder.stop();
    // back to normal playback (on iPhone, recording mode plays through the earpiece)
    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    const uri = recorder.uri;
    if (send && uri && length >= 1) onDoneRef.current(uri, Math.min(MAX_VOICE_SECONDS, Math.round(length)));
  };
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });

  // the timer on screen, and the 2-minute limit
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      setSeconds(elapsed);
      if (elapsed >= MAX_VOICE_SECONDS) stopRef.current(true);
    }, 250);
    return () => clearInterval(timer);
  }, [recording]);

  /** false when the microphone is not allowed */
  const start = async (): Promise<boolean> => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return false;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    startedAt.current = Date.now();
    setSeconds(0);
    setRecording(true);
    return true;
  };

  return { recording, seconds, start, finish: () => stop(true), cancel: () => stop(false) };
}
