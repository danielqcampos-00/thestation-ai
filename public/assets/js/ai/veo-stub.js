// Stub para integração futura com Google VEO 3
// TODO (Fase 6+): Implementar usando a Google VEO API
// Docs: https://deepmind.google/technologies/veo/

/**
 * Gera um vídeo/animação de capa para o post.
 * @param {string} prompt - Descrição visual para gerar o vídeo
 * @returns {Promise<string|null>} URL do vídeo gerado
 */
export async function generateCoverVideo(prompt) {
  // TODO: implementar com VEO 3 API
  // const response = await fetch('https://veo.googleapis.com/v1/videos:generate', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${API_KEY}` },
  //   body: JSON.stringify({ prompt, duration: 5, aspectRatio: '16:9' }),
  // });
  // const { videoUrl } = await response.json();
  // return videoUrl;
  return null;
}
