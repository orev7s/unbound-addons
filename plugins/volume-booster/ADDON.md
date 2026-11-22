## :sparkle: What it does

- :volume-up: Raises the volume of voice messages and media audio past the system maximum.
- :headphones: On Android it attaches a `LoudnessEnhancer` to the output audio session and sets the gain you choose.
- :mobile: On iOS it does nothing: the platform has no supported loudness effect, so the boost is skipped.

## :gear: Settings

- **Boost audio** turns the add-on on or off.
- **Boost** is the gain, up to the loudness effect's +10 dB ceiling.
- **Sources** picks whether **Voice messages**, **Media audio** or both get the boost. With both off, no amplification is applied.

## :triangle-warning: Notes

- The gain is clamped to what `LoudnessEnhancer` accepts, so a value past +10 dB still applies +10 dB.
- The exact audio session id is not reachable from JavaScript today, so the boost attaches to the global output mix, which Android marks deprecated.
