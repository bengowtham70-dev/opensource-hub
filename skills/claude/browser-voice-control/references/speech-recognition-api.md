# SpeechRecognition API — Quick Reference

## Constructor

```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SR();
```

## Properties

| Property           | Type     | Default   | Description                                       |
|--------------------|----------|-----------|---------------------------------------------------|
| `continuous`       | boolean  | `false`   | Keep listening after each result                  |
| `interimResults`   | boolean  | `false`   | Fire events for in-progress (non-final) results   |
| `lang`             | string   | `""`      | BCP 47 language tag (e.g. `"en-US"`, `"es-ES"`)   |
| `maxAlternatives`  | number   | `1`       | Number of hypotheses per result                   |
| `phrases` (New)    | string[] | `[]`      | Contextual biasing (replaces `grammars`)          |
| `processLocally` (New)| boolean | `false`  | Request on-device recognition                     |
| `grammars`         | —        | —         | **Deprecated**. Use `phrases` instead.            |

## Methods

| Method         | Description                                      |
|----------------|--------------------------------------------------|
| `.start()`     | Begin recognition (must be called from user gesture) |
| `.stop()`      | End recognition gracefully; fires `result` first |
| `.abort()`     | End recognition immediately; discards results    |
| `static available(options)` | Returns `Promise<AvailabilityStatus>` (available, downloadable, unavailable) |

## Events

| Event       | When it fires                                   |
|-------------|--------------------------------------------------|
| `start`     | Recognition has begun                            |
| `end`       | Recognition has stopped (for any reason)         |
| `result`    | One or more results available                    |
| `nomatch`   | Recognition finished with no confident match     |
| `error`     | An error occurred (see `event.error`)            |
| `audiostart`| Audio capture has started                        |
| `audioend`  | Audio capture has ended                          |
| `soundstart`| Sound (not necessarily speech) detected          |
| `speechstart` | Speech specifically detected                   |
| `speechend` | Speech has stopped                               |

## Result Event Structure

```js
recognition.onresult = (event) => {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const isFinal = result.isFinal;                  // boolean
    const transcript = result[0].transcript;         // best hypothesis
    const confidence = result[0].confidence;         // 0–1 float (final only)

    // Access alternatives (if maxAlternatives > 1):
    for (let j = 0; j < result.length; j++) {
      console.log(result[j].transcript, result[j].confidence);
    }
  }
};
```

## SpeechSynthesis (Text-to-Speech companion)

```js
const utt = new SpeechSynthesisUtterance('Hello world');
utt.lang   = 'en-US';
utt.rate   = 1.0;    // 0.1 – 10
utt.pitch  = 1.0;    // 0 – 2
utt.volume = 1.0;    // 0 – 1
utt.voice  = speechSynthesis.getVoices().find(v => v.name === 'Google US English');
speechSynthesis.speak(utt);

// Events on utterance:
utt.onstart = () => {};
utt.onend   = () => {};
utt.onerror = (e) => console.error(e.error);
```
