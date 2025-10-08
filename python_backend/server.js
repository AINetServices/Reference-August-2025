const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/process-resume', async (req, res) => {
  try {
    const { resume_url, role_name, organization_name, user_id, application_id } = req.body;
    
    console.log('Processing resume:', { resume_url, role_name, organization_name });
    
    // Add your resume processing logic here
    // This could involve:
    // - PDF parsing
    // - AI analysis
    // - Reference extraction
    // - Database updates
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({ 
      success: true, 
      message: 'Resume processed successfully',
      extracted_data: {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '5 years',
        references: 3
      }
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});