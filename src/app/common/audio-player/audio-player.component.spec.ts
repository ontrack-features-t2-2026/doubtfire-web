import {beforeEach, describe, expect, it} from 'vitest';
import {AudioPlayerComponent} from './audio-player.component';

// pausePlay used to call stop() for the pause action, and stop() rewinds the clip
// (currentTime = 0). So pausing a long audio comment threw the student back to the
// start. pause() now leaves currentTime alone; stop() must still rewind because the
// discussion player calls it to reset between tracks.
interface FakeAudio {
  paused: boolean;
  currentTime: number;
  pauseCalled: boolean;
  playCalled: boolean;
  pause(): void;
  play(): void;
}

function makeAudio(paused: boolean, currentTime: number): FakeAudio {
  return {
    paused,
    currentTime,
    pauseCalled: false,
    playCalled: false,
    pause() {
      this.pauseCalled = true;
    },
    play() {
      this.playCalled = true;
    },
  };
}

describe('AudioPlayerComponent playback controls', () => {
  let component: AudioPlayerComponent;

  beforeEach(() => {
    component = new AudioPlayerComponent({} as never, {} as never);
    // pausePlay routes through execWithAudio, which runs the action inline once loaded.
    (component as unknown as {isLoaded: boolean}).isLoaded = true;
  });

  it('pause keeps the playback position', () => {
    const audio = makeAudio(false, 42);
    component.audio = audio as unknown as HTMLAudioElement;
    let emitted: boolean | undefined;
    component.playingChange.subscribe((v) => (emitted = v));

    component.pause();

    expect(audio.pauseCalled).toBe(true);
    expect(audio.currentTime).toBe(42);
    expect(component.isPlaying).toBe(false);
    expect(emitted).toBe(false);
  });

  it('stop still rewinds to the start', () => {
    const audio = makeAudio(false, 42);
    component.audio = audio as unknown as HTMLAudioElement;

    component.stop();

    expect(audio.currentTime).toBe(0);
    expect(component.isPlaying).toBe(false);
  });

  it('pausePlay pauses in place while playing, it does not rewind', () => {
    const audio = makeAudio(false, 42);
    component.audio = audio as unknown as HTMLAudioElement;

    component.pausePlay();

    expect(audio.pauseCalled).toBe(true);
    expect(audio.currentTime).toBe(42);
    expect(component.isPlaying).toBe(false);
  });

  it('pausePlay resumes from the paused position', () => {
    const audio = makeAudio(true, 42);
    component.audio = audio as unknown as HTMLAudioElement;

    component.pausePlay();

    expect(audio.playCalled).toBe(true);
    expect(audio.currentTime).toBe(42);
    expect(component.isPlaying).toBe(true);
  });
});
