export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://iliaspa.github.io',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();

      // Extract form fields
      const project = {
        title: formData.get('project_title'),
        ka_action: formData.get('project_type'),
        hosting_ngo: formData.get('hosting_ngo'),
        summary: formData.get('summary'),
        location_city: formData.get('location_city'),
        destination_country: formData.get('destination_country'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        infopack_url: formData.get('infopack_url'),
      };

      // Build application_forms
      let application_forms = {};
      if (!formData.get('no_application_forms_yet')) {
        const countries = formData.getAll('application_form_country[]');
        const urls = formData.getAll('application_form_url[]');
        for (let i = 0; i < countries.length; i++) {
          if (countries[i] && urls[i]) {
            application_forms[countries[i]] = urls[i];
          }
        }
      }

      project.application_forms = application_forms;

      // Fetch current projects
      const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.GITHUB_FILE_PATH}`;
      const headers = {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare Worker',
      };

      const getResponse = await fetch(apiUrl, { headers });
      if (!getResponse.ok) {
        throw new Error(`Failed to fetch projects: ${getResponse.status}`);
      }

      const fileData = await getResponse.json();
      const currentContent = JSON.parse(atob(fileData.content));
      const sha = fileData.sha;

      // Generate new id
      const maxId = currentContent.reduce((max, p) => {
        const num = parseInt((p.id || '').replace('proj-', '')) || 0;
        return num > max ? num : max;
      }, 0);
      project.id = `proj-${String(maxId + 1).padStart(3, '0')}`;

      // Append new project
      currentContent.push(project);

      // Encode new content
      const newContent = btoa(JSON.stringify(currentContent, null, 2));

      // Commit
      const putResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add new project: ${project.title}`,
          content: newContent,
          sha: sha,
          branch: env.GITHUB_BRANCH, 
        }),
      });

      if (!putResponse.ok) {
        throw new Error(`Failed to commit: ${putResponse.status}`);
      }

      return new Response(JSON.stringify({ success: true, id: project.id }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://iliaspa.github.io',
        },
      });

    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://iliaspa.github.io',
        },
      });
    }
  }
};