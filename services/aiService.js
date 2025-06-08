const axios = require('axios');

exports.generateItinerary = async (city, dates, preferences = []) => {
  const prompt = `Create a travel itinerary for ${city} for ${
    dates.length > 1
      ? `${dates[0]} to ${dates[dates.length - 1]}`
      : dates[0]
  }. The user enjoys: ${
    preferences.length ? preferences.join(', ') : 'general sightseeing'
  }. Provide bullet points with times and descriptions.`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mistral-saba-24b',            
        messages: [
          { role: 'system', content: 'You are a helpful travel itinerary planner.' },
          { role: 'user',   content: prompt }
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
  } catch (error) {
    console.error(
      'Groq API error:',
      error.response?.status,
      error.response?.data || error.message
    );
    throw new Error('Failed to generate itinerary suggestions');
  }
};