const querystring = require('querystring');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://iliaspa.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the body
    const body = typeof req.body === 'string' ? req.body : '';
    const data = querystring.parse(body);

    // Extract fields
    const title = data.project_title || '';
    const ka_action = data.project_type || '';
    const location_city = data.location_city || '';
    const destination_country = data.destination_country || '';
    const start_date = data.start_date || '';
    const end_date = data.end_date || '';
    const hosting_ngo = data.hosting_ngo || '';
    const infopack_url = data.infopack_url || '';
    const summary = data.summary || '';

    // Handle application forms
    const application_forms = {};
    const countries = data['application_form_country[]'];
    const urls = data['application_form_url[]'];
    if (Array.isArray(countries) && Array.isArray(urls)) {
      for (let i = 0; i < countries.length; i++) {
        if (countries[i] && urls[i]) {
          application_forms[countries[i]] = urls[i];
        }
      }
    }

    // GitHub API details
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const filePath = process.env.GITHUB_FILE;
    const branch = process.env.GITHUB_BRANCH;
    const token = process.env.GITHUB_TOKEN;

    if (!token || !owner || !repo || !filePath || !branch) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Fetch current projects.json
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Vercel-Serverless-Function'
      }
    });

    if (!getResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch projects data' });
    }

    const fileData = await getResponse.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const projects = JSON.parse(content);

    // Find the highest ID
    const ids = projects.map(p => {
      const match = p.id.match(/^proj-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const newId = `proj-${String(maxId + 1).padStart(3, '0')}`;

    // Create new project object
    const newProject = {
      id: newId,
      title,
      ka_action,
      location_city,
      destination_country,
      start_date,
      end_date,
      hosting_ngo,
      infopack_url,
      summary,
      application_forms
    };

    // Append to projects
    projects.push(newProject);

    // Encode back to base64
    const newContent = Buffer.from(JSON.stringify(projects, null, 2)).toString('base64');

    // Commit back
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Vercel-Serverless-Function',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add new project submission: ${newId}`,
        content: newContent,
        sha: fileData.sha,
        branch
      })
    });

    if (!putResponse.ok) {
      const errorData = await putResponse.json();
      return res.status(500).json({ error: 'Failed to commit changes', details: errorData });
    }

    // Success
    res.status(200).json({ success: true, id: newId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}