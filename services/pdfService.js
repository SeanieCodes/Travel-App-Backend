const htmlPdf = require('html-pdf-node');

exports.generateTripPDF = async (userData, trip) => {
  try {
    const { cityName, dates, activities } = trip;
    
    const formattedDates = dates.map(date => formatDate(date));
    const dateRange = dates.length > 1 
      ? `${formattedDates[0]} - ${formattedDates[dates.length-1]}` 
      : formattedDates[0];
    
    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #ffffff;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background-color: #000000;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #ff69b4;
            }
            h1 {
              color: #ff69b4;
              font-size: 28px;
              margin-bottom: 10px;
              font-weight: bold;
            }
            h2 {
              color: #ff69b4;
              font-size: 22px;
              margin-top: 20px;
              margin-bottom: 10px;
              font-weight: bold;
            }
            h3 {
              color: #ff69b4;
              font-size: 18px;
              margin-top: 15px;
              margin-bottom: 5px;
              padding: 8px;
              background-color: #111111;
              border-radius: 4px;
              font-weight: bold;
            }
            p {
              color: #ffffff;
            }
            .trip-details {
              margin-bottom: 30px;
              padding: 15px;
              background-color: #111111;
              border-radius: 5px;
              border-left: 4px solid #ff69b4;
            }
            .activities {
              margin-left: 20px;
            }
            .activity {
              margin-bottom: 10px;
              padding: 10px;
              border-bottom: 1px solid #333333;
              color: #ffffff;
            }
            .time {
              font-weight: bold;
              color: #ff69b4;
              display: inline-block;
              width: 100px;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #333333;
              font-size: 12px;
              color: #cccccc;
            }
            .no-activities {
              font-style: italic;
              color: #cccccc;
              margin: 10px 0 10px 20px;
            }
            strong {
              color: #ffffff;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Travel Itinerary: ${cityName}</h1>
            <p>Created for: ${userData.displayName || userData.username || userData.email}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="trip-details">
            <h2>${cityName}</h2>
            <p>
              <strong>Dates:</strong> ${dateRange}
              (${dates.length} ${dates.length === 1 ? 'day' : 'days'})
            </p>
          </div>
          
          <div class="day-activities">
            ${dates.map(date => `
              <div class="day">
                <h3>${formatDate(date)}</h3>
                ${activities[date] && activities[date].length > 0 
                  ? `
                    <div class="activities">
                      ${activities[date].map(activity => `
                        <div class="activity">
                          <span class="time">${activity.time}</span> ${activity.description}
                        </div>
                      `).join('')}
                    </div>
                  ` 
                  : '<p class="no-activities">No activities scheduled for this day.</p>'
                }
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Generated by Alcove - Your Smart Travel Companion</p>
          </div>
        </body>
      </html>
    `;
    
    const options = { 
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    };
    const file = { content: htmlContent };
    
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate trip PDF');
  }
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}