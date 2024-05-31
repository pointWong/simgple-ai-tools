// 
const apiKey = require('../.moonshot-config')
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.moonshot.cn/v1",
});

async function moonShotChat (messages) {
  const completion = await client.chat.completions.create({
    model: "moonshot-v1-8k",
    messages,
    temperature: 0.3
  });
  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content
}

async function translateViaMs ({ message, lang = "中文", target = '英语' }) {
  let result = ''
  const messages = [
    {
      role: 'system',
      content: `你现在是个翻译家，你将会精确翻译我提供给你的文本，我需要你将${lang || "中文"}翻译成${target || "英文"},你仅仅告诉我翻译结果就行，无需其他描述，现在需要你翻译的第一段文本是`
    },
    {
      role: 'user',
      content: message
    }
  ]
  try {
    result = await moonShotChat(messages)
  } catch (error) {
    console.log("🚀 ~ translateViaMs ~ error:", error)

  }
  return result
}

async function extractMainContentViaMs ({ message }) {
  let result = ''
  const messages = [
    {
      role: 'system',
      content: `你是一个文案整理高手，你将会根据我提供的杂乱的文本中整理出主要内容并详细列举出来，然后告诉我结果，现在我需要你整理的第一段文本是：`
    },
    {
      role: 'user',
      content: message
    }
  ]
  try {
    result = await moonShotChat(messages)
  } catch (error) {
    console.log("🚀 ~ extractMainContentViaMs ~ error:", error)
  }
  return result
}

async function answerFromMs ({ message }) {
  let result = ''
  const messages = [
    {
      role: 'system',
      content: `你是一个问答机器人，你会根据我提供的问题，回答我，你只需直接给我返回回答，无需其他过多说明，现在请你帮忙回答的第一段问题是：`
    },
    {
      role: 'user',
      content: message
    }
  ]
  try {
    result = await moonShotChat(messages)
  } catch (error) {
    console.log("🚀 ~ answerFromMs ~ error:", error)
  }
  return result
}

module.exports = {
  translateViaMs,
  extractMainContentViaMs,
  answerFromMs
}
