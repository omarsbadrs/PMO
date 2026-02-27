// SERVER-SIDE ONLY
import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const BATCH_SIZE = 20

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI()
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })
    allEmbeddings.push(...response.data.map((d) => d.embedding))
  }

  return allEmbeddings
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text])
  return embedding
}
