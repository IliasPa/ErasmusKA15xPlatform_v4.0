export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      project_title,
      project_type,
      hosting_ngo,
      summary,
      location_city,
      destination_country,
      start_date,
      end_date,
      infopack_url,
      application_form_country = [],
      application_form_url = [],
      submitter_ngo_name,
      contact_person,
      contact_email,
      no_application_forms_yet
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'project_title',
      'project_type',
      'hosting_ngo',
      'destination_country',
      'start_date',
      'end_date',
      'contact_email'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    if (endDate < startDate) {
      return res.status(400).json({ success: false, error: 'End date must be after start date' });
    }

    // Validate URLs if provided
    if (infopack_url && !isValidUrl(infopack_url)) {
      return res.status(400).json({ success: false, error: 'Invalid infopack URL' });
    }

    // Validate application form URLs
    if (!no_application_forms_yet && Array.isArray(application_form_url)) {
      for (const url of application_form_url) {
        if (url && !isValidUrl(url)) {
          return res.status(400).json({ success: false, error: 'Invalid application form URL' });
        }
      }
    }

    // Create project object
    const timestamp = Date.now();
    const project = {
      id: timestamp.toString(),
      title: project_title,
      description: summary || '',
      location: location_city || '',
      country: destination_country,
      startDate: start_date,
      endDate: end_date,
      type: project_type,
      deadline: '', // Not in form, keeping empty
      infopack: infopack_url || '',
      applyLink: no_application_forms_yet === 'yes' ? '' : formatApplicationLinks(application_form_country, application_form_url),
      hostingNgo: hosting_ngo,
      submitterNgoName: submitter_ngo_name || '',
      contactPerson: contact_person || '',
      contactEmail: contact_email,
      createdAt: new Date(timestamp).toISOString()
    };

    // Generate filename
    const filename = `${timestamp}.json`;

    // Get GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('GITHUB_TOKEN environment variable not set');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    // Prepare file content
    const fileContent = JSON.stringify(project, null, 2);
    const base64Content = Buffer.from(fileContent).toString('base64');

    // GitHub API details
    const owner = 'IliasPa';
    const repo = 'ErasmusKA15xPlatform_v4.0';
    const path = `data/${filename}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Create commit message
    const commitMessage = `Add project submission: ${project_title}`;

    // Prepare request body
    const requestBody = {
      message: commitMessage,
      content: base64Content
    };

    // Make request to GitHub API
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Erasmus-Platform-Bot'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub API error:', errorData);
      return res.status(response.status).json({
        success: false,
        error: `Failed to save project: ${errorData.message || 'Unknown error'}`
      });
    }

    // Success
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function formatApplicationLinks(countries, urls) {
  if (!Array.isArray(countries) || !Array.isArray(urls)) {
    return '';
  }

  const links = [];
  for (let i = 0; i < Math.min(countries.length, urls.length); i++) {
    if (countries[i] && urls[i]) {
      links.push(`${countries[i]}: ${urls[i]}`);
    }
  }
  return links.join('; ');
}