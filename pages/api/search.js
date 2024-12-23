import OpenAI from 'openai';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Kimi 请求函数封装
async function getKimiAnswer(kimiClient, question) {
  const completion = await kimiClient.chat.completions.create({
    model: 'kimi-search',
    messages: [
      {
        role: 'system',
        content: `你会在网上搜索给你的问题的答案，然后进行回答，并给出能够支撑答案的原始文本和来源，最后按照格式要求返回答案。格式：
        {
          "answer": "选择题选项/判断题、填空题答案",
          "supporting_text": "完整的支撑答案的原文，用**标注答案",
          "source": "[来源](链接)"
        }`
      },
      { role: 'user', content: question }
    ],
    extra_body: { use_search: true }
  });

  return completion.choices[0].message.content;
}

// JSON提取函数
function extractJsonString(text) {
  try {
    text = text.replace(/\[\^\d+\^\]/g, '');
    const match = text.match(/\{[^\{\}]*\}/);
    return match ? match[0] : null;
  } catch (error) {
    console.error('JSON提取错误:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, mode } = req.body;

  try {
    const kimiClient = new OpenAI({
      baseURL: process.env.KIMI_BASE_URL,
      apiKey: process.env.KIMI_API_KEY,
      defaultHeaders: {
        'Authorization': `Bearer ${process.env.KIMI_REFRESH_TOKEN}`
      }
    });

    // 重试逻辑实现
    let kimiAnswer = null;
    let retryCount = 0;

    while (!kimiAnswer && retryCount < MAX_RETRIES) {
      try {
        console.log(`尝试获取答案 - 第${retryCount + 1}次`);
        const rawAnswer = await getKimiAnswer(kimiClient, question);
        console.log('原始答案:', rawAnswer);
        kimiAnswer = extractJsonString(rawAnswer);
        
        if (!kimiAnswer) {
          console.log(`第${retryCount + 1}次尝试未获得有效答案，准备重试`);
          retryCount++;
          if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      } catch (error) {
        console.error(`第${retryCount + 1}次尝试失败:`, error);
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error('多次尝试获取答案失败');
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (!kimiAnswer) {
      throw new Error('无法获取有效答案，请稍后重试');
    }

    // 快速模式直接返回
    if (mode === 'fast') {
      return res.status(200).json(JSON.parse(kimiAnswer));
    }

    // 精确模式使用OpenAI验证
    const openaiClient = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY
    });

    const openaiCompletion = await openaiClient.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        {
          role: 'system',
          content: `验证并优化前序答案。严格遵循以下要求：
1. 验证答案正确性和选项匹配度，且验证答案必须是原文中的内容，不要自行解释和推断。
2. 标注关键证据：用**将答案在原文中标出，支持多处标注。
3. 格式要求：{"answer":"答案","supporting_text":"证据原文","source":"[来源](链接)"}
4. 只输出JSON，不要其他内容`
        },
        { role: 'user', content: `问题：${question}\n待验证答案：${kimiAnswer}` }
      ]
    });

    const openaiAnswer = openaiCompletion.choices[0].message.content;
    const answer = JSON.parse(extractJsonString(openaiAnswer));

    res.status(200).json(answer);
  } catch (error) {
    console.error('搜索API错误:', error);
    res.status(500).json({ 
      error: error.message || '搜索过程中发生错误，请稍后重试' 
    });
  }
}