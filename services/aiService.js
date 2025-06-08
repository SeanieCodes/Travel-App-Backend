const axios = require('axios');

exports.generateItinerary = async (city, dates, preferences = []) => {
  const prompt = `Create a travel itinerary for ${city} from ${dates[0]} to ${dates[dates.length - 1]}.
The user enjoys: ${preferences.length ? preferences.join(', ') : 'general sightseeing'}.
Please provide the plan in bullet points, with times and descriptions.`;

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are a smart travel planner.' },
        { role: 'user', content: prompt }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
};