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

async function msTranslate ({ message, target = '英语' }) {
  let result = ''
  const messages = [
    {
      role: 'system',
      content: `你是一个翻译家，你会根据我提供的文本，将其翻译成${target}，你只需直接给我返回翻译结果，无需其他过多说明，现在请你帮忙翻译的第一段文本是：`
    },
    {
      role: 'user',
      content: message
    }
  ]
  try {
    result = await moonShotChat(messages)
  } catch (error) {
    console.log("🚀 ~ msTranslate ~ error:", error)

  }
  return result
}
module.exports = {
  msTranslate
}
