export async function callElevenLabs(text: string, voice_id: string | null, language: string, apiKey: string): Promise<ArrayBuffer> {
    const voices: Record<string, string> = {
        en: '21m00Tcm4TlvDq8ikWAM',    // Rachel
        es: 'pFZP5JQG7iQjIQuC4Bku',    // multilingual
        pt: 'pFZP5JQG7iQjIQuC4Bku',
        fr: 'pFZP5JQG7iQjIQuC4Bku',
        zh: 'pFZP5JQG7iQjIQuC4Bku'
    }
    const selectedVoice = voice_id || voices[language] || voices.en
    const model = language === 'en' ? 'eleven_monolingual_v1' : 'eleven_multilingual_v2'
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: text.slice(0, 500),
            model_id: model,
            voice_settings: { stability: 0.71, similarity_boost: 0.75 }
        })
    })
    if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`)
    return response.arrayBuffer()
}
