import ElevenLabs from 'elevenlabs-node';

const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

export async function synthesizeSpeech(text: string): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const audio = await elevenlabs.textToSpeechStream({
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel's Voice ID
      textInput: text,
      modelId: 'eleven_multilingual_v2',
    });
    return audio;
  } catch (error) {
    console.error('ElevenLabs API Error:', error instanceof Error ? error.message : JSON.stringify(error));
    return null;
  }
}
