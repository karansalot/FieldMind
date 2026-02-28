export async function callElevenLabs(text: string, voice_id: string | null, language: string, apiKey: string): Promise<ArrayBuffer> {
    const voices: Record<string, string> = {
        rachel: '21m00Tcm4TlvDq8ikWAM',
        adam: 'pNInz6obpgDQGcFmaJgB',
        multilingual: 'pFZP5JQG7iQjIQuC4Bku'
    }
    const selectedVoice = voice_id || (language === 'en' ? voices.rachel : voices.multilingual)
    const model = language === 'en' ? 'eleven_monolingual_v1' : 'eleven_multilingual_v2'

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: model, voice_settings: { stability: 0.71, similarity_boost: 0.75 } })
    })
    return response.arrayBuffer()
}
