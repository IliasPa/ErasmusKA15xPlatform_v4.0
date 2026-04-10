document.addEventListener("DOMContentLoaded", function () {
  const platform = window.ErasmusFilters;
  const countries = platform && platform.countries ? platform.countries.slice().sort(function (left, right) {
    return left.localeCompare(right);
  }) : [];
  const form = document.getElementById("projectSubmissionForm");
  const destinationSelect = document.getElementById("submissionDestinationCountry");
  const startDateInput = document.getElementById("submissionStartDate");
  const endDateInput = document.getElementById("submissionEndDate");
  const infopackUrlInput = document.getElementById("submissionInfopackUrl");
  const websiteLinkInput = document.getElementById("submissionWebsiteLink");
  const applicationFormsContainer = document.getElementById("applicationFormsContainer");
  const addApplicationFormButton = document.getElementById("addApplicationFormButton");
  const noApplicationFormsCheckbox = document.getElementById("noApplicationForms");
  const rowTemplate = document.getElementById("applicationFormRowTemplate");
  const formStatus = document.getElementById("formStatus");

  // Configuration - Update this URL after deploying to Vercel
  const API_ENDPOINT = 'https://your-vercel-app.vercel.app/api/submit-project';

  initialize();

  function initialize() {
    populateDestinationCountries();
    addApplicationFormRow();

    addApplicationFormButton.addEventListener("click", function () {
      addApplicationFormRow();
      syncApplicationFormsState();
    });

    noApplicationFormsCheckbox.addEventListener("change", syncApplicationFormsState);
    form.addEventListener("submit", handleSubmit);
    startDateInput.addEventListener("change", validateDateRange);
    endDateInput.addEventListener("change", validateDateRange);
    infopackUrlInput.addEventListener("input", clearStatus);
    websiteLinkInput.addEventListener("input", clearStatus);
    syncApplicationFormsState();
  }

  function populateDestinationCountries() {
    countries.forEach(function (country) {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      destinationSelect.appendChild(option);
    });
  }

  function addApplicationFormRow() {
    const rowFragment = rowTemplate.content.cloneNode(true);
    const rowElement = rowFragment.querySelector(".application-form-row");
    const countrySelect = rowFragment.querySelector(".application-form-country");
    const removeButton = rowFragment.querySelector(".application-form-remove");

    countries.forEach(function (country) {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countrySelect.appendChild(option);
    });

    removeButton.addEventListener("click", function () {
      rowElement.remove();
      if (!noApplicationFormsCheckbox.checked && applicationFormsContainer.children.length === 0) {
        addApplicationFormRow();
      }
      syncApplicationFormsState();
    });

    applicationFormsContainer.appendChild(rowFragment);
  }

  function syncApplicationFormsState() {
    const isDisabled = noApplicationFormsCheckbox.checked;
    const rows = getApplicationFormRows();

    rows.forEach(function (row) {
      row.querySelectorAll("select, input, button").forEach(function (control) {
        if (control.classList.contains("application-form-remove")) {
          control.disabled = isDisabled || rows.length === 1;
          return;
        }

        control.disabled = isDisabled;
      });
    });

    applicationFormsContainer.classList.toggle("is-disabled", isDisabled);
    addApplicationFormButton.disabled = isDisabled;
    clearStatus();
  }

  function getApplicationFormRows() {
    return Array.from(applicationFormsContainer.querySelectorAll(".application-form-row"));
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearStatus();
    clearCustomErrors();

    const validationErrors = [];

    validateDateRange();
    validateOptionalUrl(infopackUrlInput, "Infopack URL must be a valid URL.", validationErrors);
    validateOptionalUrl(websiteLinkInput, "Website / source link must be a valid URL.", validationErrors);
    validateApplicationForms(validationErrors);

    if (!form.checkValidity() || validationErrors.length > 0) {
      formStatus.textContent = validationErrors[0] || "Please review the highlighted fields before submitting.";
      formStatus.className = "form-status is-error";
      form.reportValidity();
      return;
    }

    // Collect form data
    const formData = new FormData(form);
    const data = {
      project_title: formData.get('project_title'),
      project_type: formData.get('project_type'),
      hosting_ngo: formData.get('hosting_ngo'),
      summary: formData.get('summary'),
      location_city: formData.get('location_city'),
      destination_country: formData.get('destination_country'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      infopack_url: formData.get('infopack_url'),
      submitter_ngo_name: formData.get('submitter_ngo_name'),
      contact_person: formData.get('contact_person'),
      contact_email: formData.get('contact_email'),
      no_application_forms_yet: formData.get('no_application_forms_yet')
    };

    // Collect application forms
    const applicationCountries = formData.getAll('application_form_country[]');
    const applicationUrls = formData.getAll('application_form_url[]');

    // Filter out empty entries
    const validApplicationCountries = [];
    const validApplicationUrls = [];

    for (let i = 0; i < applicationCountries.length; i++) {
      if (applicationCountries[i] && applicationUrls[i]) {
        validApplicationCountries.push(applicationCountries[i]);
        validApplicationUrls.push(applicationUrls[i]);
      }
    }

    data.application_form_country = validApplicationCountries;
    data.application_form_url = validApplicationUrls;

    // Disable submit button
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }

    // Send to API
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        form.reset();
        // Reset application forms
        applicationFormsContainer.innerHTML = '';
        addApplicationFormRow();
        syncApplicationFormsState();
        showToast('success', 'Thank you! Your project has been submitted for review.');
      } else {
        showToast('error', result.error || 'Something went wrong. Please try again later.');
      }
    })
    .catch(error => {
      console.error('Submission error:', error);
      showToast('error', 'Something went wrong. Please try again later.');
    })
    .finally(() => {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit for review';
      }
    });
  }

  function validateDateRange() {
    endDateInput.setCustomValidity("");

    if (!startDateInput.value || !endDateInput.value) {
      return;
    }

    if (endDateInput.value < startDateInput.value) {
      endDateInput.setCustomValidity("End date must be on or after the start date.");
    }
  }

  function validateOptionalUrl(inputElement, message, errors) {
    inputElement.setCustomValidity("");

    if (!inputElement.value) {
      return;
    }

    if (!isValidUrl(inputElement.value)) {
      inputElement.setCustomValidity(message);
      errors.push(message);
    }
  }

  function validateApplicationForms(errors) {
    const rows = getApplicationFormRows();

    if (noApplicationFormsCheckbox.checked) {
      return;
    }

    if (rows.length === 0) {
      errors.push("Add at least one application form entry or mark that no country-specific forms are available yet.");
      return;
    }

    rows.forEach(function (row) {
      const countrySelect = row.querySelector(".application-form-country");
      const urlInput = row.querySelector(".application-form-url");

      countrySelect.setCustomValidity("");
      urlInput.setCustomValidity("");

      if (!countrySelect.value || !urlInput.value) {
        const message = "Each application form row must include both a country and a valid URL.";
        if (!countrySelect.value) {
          countrySelect.setCustomValidity(message);
        }
        if (!urlInput.value) {
          urlInput.setCustomValidity(message);
        }
        errors.push(message);
        return;
      }

      if (!isValidUrl(urlInput.value)) {
        const message = "Each application form URL must be a valid URL.";
        urlInput.setCustomValidity(message);
        errors.push(message);
      }
    });
  }

  function clearCustomErrors() {
    endDateInput.setCustomValidity("");
    infopackUrlInput.setCustomValidity("");
    websiteLinkInput.setCustomValidity("");

    getApplicationFormRows().forEach(function (row) {
      row.querySelector(".application-form-country").setCustomValidity("");
      row.querySelector(".application-form-url").setCustomValidity("");
    });
  }

  function clearStatus() {
    formStatus.textContent = "";
    formStatus.className = "form-status";
  }

  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function showToast(type, message) {
    const toast = document.getElementById("toast");
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.remove("toast--success", "toast--error");
    toast.classList.add("toast--feedback", type === "success" ? "toast--success" : "toast--error", "is-visible");

    if (window.toastTimer) {
      window.clearTimeout(window.toastTimer);
    }

    window.toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible", "toast--feedback", "toast--success", "toast--error");
    }, 3000);
  }
});