(function () {
  // Get the site key, webhook URL, and debug mode from the script's data attributes
  const scriptTag = document.currentScript;
  const siteKey = scriptTag ? scriptTag.getAttribute('data-site-key') : null;
  const webhookURL = scriptTag ? scriptTag.getAttribute('data-action') : null;
  const debugMode = scriptTag.hasAttribute('debug');

  //recaptcha script
  const script = document.createElement("script");
  script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
  document.head.appendChild(script);

  if (debugMode) {
    console.log('Site key obtained:', siteKey);
    console.log('Webhook URL obtained:', webhookURL);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (debugMode) {
      console.log('DOM fully loaded and parsed. Initializing script...');
    }

    try {
      if (!siteKey) {
        console.error('Site key not found in script data-site-key attribute.');
        return;
      }

      if (!webhookURL) {
        console.error('Webhook URL not found in script data-action attribute.');
        return;
      }

      // Load reCAPTCHA script dynamically
      function loadRecaptcha(siteKey) {
        if (debugMode) {
          console.log('Loading reCAPTCHA script...');
        }
        return new Promise((resolve, reject) => {
          if (typeof grecaptcha !== 'undefined') {
            if (debugMode) {
              console.log('reCAPTCHA already loaded.');
            }
            resolve();
          } else {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.onload = () => {
              if (debugMode) {
                console.log('reCAPTCHA script loaded.');
              }
              resolve();
            };
            script.onerror = () => {
              console.error('Failed to load reCAPTCHA script.');
              reject();
            };
            document.head.appendChild(script);
          }
        });
      }

      // Email validation function
      function validateEmails(emailString) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emails = emailString.split(/[,\s]+/).filter(Boolean); // Split on commas or spaces
        const invalidEmails = emails.filter(email => !emailPattern.test(email));
        return { valid: invalidEmails.length === 0, invalidEmails, emails };
      }

      // Find all forms with the data-form-handler attribute
      const forms = document.querySelectorAll('form[data-form-handler]');
      if (debugMode) {
        console.log('Forms found with data-form-handler:', forms.length);
      }

      if (!forms || forms.length === 0) {
        if (debugMode) {
          console.log('No forms found with the data-form-handler attribute.');
        }
        return;
      }

      forms.forEach(function (form, index) {
        try {
          if (debugMode) {
            console.log(`Processing form ${index + 1}...`);
          }

          // Clone the form to remove any existing event listeners
          const formClone = form.cloneNode(true);
          form.parentNode.replaceChild(formClone, form);
          if (debugMode) {
            console.log('Form cloned to remove existing event listeners.');
          }

          // Remove the form's action attribute to prevent default submission
          formClone.removeAttribute('action');
          if (debugMode) {
            console.log('Form action attribute removed.');
          }

          // Override the form's submit method
          formClone.submit = function () {
            if (debugMode) {
              console.log('Form submit method overridden.');
            }
          };

          // Get the custom email from the data-form-handler attribute (if provided)
          const customEmail = formClone.getAttribute('data-form-handler');
          if (customEmail) {
            const { valid, invalidEmails, emails } = validateEmails(customEmail);
            if (valid) {
              if (debugMode) {
                console.log(`Valid emails found: ${emails.join(', ')}`);
              }
            } else {
              console.error(`Invalid emails found: ${invalidEmails.join(', ')}`);
              return;
            }
          } else {
            if (debugMode) {
              console.log('No custom email provided; using default settings.');
            }
          }
          
          // Get the form name (if provided)
          const formName = formClone.getAttribute('name');
          if (debugMode) {
              console.log(`Form name: ${formName}`);
          }   
          else {
              if (debugMode) {
                  console.log('No form name provided; using default settings.');
              }
          }
          // get data-type attribute (if provided)
          const dataType = formClone.getAttribute('data-type');
          if (debugMode) {
              console.log(`Form type: ${dataType}`);
          }
          else {
              if (debugMode) {
                  console.log('No form type provided; using default settings.');
              }
          }

          // Find the submit button and loading text
          const submitButton = formClone.querySelector('input[type="submit"], button[type="submit"]');
          if (!submitButton) {
            if (debugMode) {
              console.log('Submit button not found in form.');
            }
            return;
          }
          if (debugMode) {
            console.log('Submit button found:', submitButton);
          }

          const defaultButtonText = submitButton.value || submitButton.innerText;
          const loadingText = submitButton.getAttribute('data-wait') || 'Please wait...';
          if (debugMode) {
            console.log('Default button text:', defaultButtonText);
            console.log('Loading text:', loadingText);
          }

          // Hide success and error messages initially
          const successMessage = formClone.parentElement.querySelector('.w-form-done');
          const errorMessage = formClone.parentElement.querySelector('.w-form-fail');

          if (successMessage) {
            successMessage.style.display = 'none';
            if (debugMode) {
              console.log('Success message element found and hidden.');
            }
          } else {
            if (debugMode) {
              console.log('Success message element not found.');
            }
          }

          if (errorMessage) {
            errorMessage.style.display = 'none';
            if (debugMode) {
              console.log('Error message element found and hidden.');
            }
          } else {
            if (debugMode) {
              console.log('Error message element not found.');
            }
          }

          // On form submit
          formClone.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (debugMode) {
              console.log('Form submit event triggered.');
            }

            // Set the button text to loading state
            if (submitButton.tagName.toLowerCase() === 'input') {
              submitButton.value = loadingText;
            } else {
              submitButton.innerText = loadingText;
            }
            if (debugMode) {
              console.log('Submit button text set to loading state.');
            }

            // Load reCAPTCHA and execute
            loadRecaptcha(siteKey)
              .then(() => {
                if (debugMode) {
                  console.log('Executing reCAPTCHA...');
                }
                return new Promise((resolve, reject) => {
                  grecaptcha.ready(() => {
                    grecaptcha.execute(siteKey, { action: 'submit' })
                      .then(token => {
                        resolve(token);
                      })
                      .catch(error => {
                        reject(error);
                      });
                  });
                });
              })
              .then(token => {
                if (debugMode) {
                  console.log('reCAPTCHA token obtained:', token);
                }

                // Prepare form data
                const formData = new FormData(formClone);
                formData.append('g-recaptcha-response', token);
                formData.append('site-key', siteKey);

                if (debugMode) {
                  console.log('Form data prepared:', Array.from(formData.entries()));
                }

                // Prepare headers
                const headers = {};
                if (customEmail) {
                  headers['custom-email'] = customEmail;
                  if (debugMode) {
                    console.log('Custom email added to headers:', customEmail);
                  }
                } else {
                  if (debugMode) {
                    console.log('No custom email provided; not adding to headers.');
                  }
                }

                if (formName) {
                  headers['form-name'] = formName;
                  if (debugMode) {
                    console.log('Form name added to headers:', formName);
                  }
                } else {
                  if (debugMode) {
                    console.log('No form name provided; not adding to headers.');
                  }
                }   
                if (dataType) {
                  headers['data-type'] = dataType;
                  if (debugMode) {
                    console.log('Form type added to headers:', dataType);
                  }
                } else {
                  if (debugMode) {
                    console.log('No form type provided; not adding to headers.');
                  }
                }

                // Send the form data via fetch to the webhook URL
                if (debugMode) {
                  console.log('Sending form data to webhook...');
                }
                return fetch(webhookURL, {
                  method: 'POST',
                  body: formData,
                  headers: headers,
                });
              })
              .then(response => {
                if (debugMode) {
                  console.log('Response received from webhook:', response);
                }
                return response.text();
              })
              .then(responseText => {
                if (debugMode) {
                  console.log('Response text:', responseText);
                }
                let data;
                try {
                  data = JSON.parse(responseText);
                } catch (error) {
                  console.error('Error parsing response JSON:', error);
                  data = {};
                }

                if (debugMode) {
                  console.log('Parsed response data:', data);
                }
                if (data.success) {
                  // Handle success
                  if (debugMode) {
                    console.log('Form submission successful.');
                  }
                  if (successMessage) {
                    formClone.style.display = 'none';
                    successMessage.style.display = 'block';
                    if (debugMode) {
                      console.log('Success message displayed, form hidden.');
                    }
                  }
                } else {
                  // Handle failure
                  if (debugMode) {
                    console.log('Form submission failed.');
                  }
                  if (errorMessage) {
                    errorMessage.style.display = 'block';
                    // Reset submit button text
                    if (submitButton.tagName.toLowerCase() === 'input') {
                      submitButton.value = defaultButtonText;
                    } else {
                      submitButton.innerText = defaultButtonText;
                    }
                    if (debugMode) {
                      console.log('Error message displayed, submit button text reset.');
                    }
                    setTimeout(() => {
                      errorMessage.style.display = 'none';
                      if (debugMode) {
                        console.log('Error message hidden after 30 seconds.');
                      }
                    }, 30000);
                  }
                }
              })
              .catch(error => {
                console.error('Error during form submission:', error);
                if (errorMessage) {
                  errorMessage.style.display = 'block';
                  // Reset submit button text
                  if (submitButton.tagName.toLowerCase() === 'input') {
                    submitButton.value = defaultButtonText;
                  } else {
                    submitButton.innerText = defaultButtonText;
                  }
                  if (debugMode) {
                    console.log('Error message displayed due to exception, submit button text reset.');
                  }
                  setTimeout(() => {
                    errorMessage.style.display = 'none';
                    if (debugMode) {
                      console.log('Error message hidden after 30 seconds.');
                    }
                  }, 30000);
                }
              });
          });
          if (debugMode) {
            console.log('Form submit event listener attached.');
          }
        } catch (formError) {
          console.error('Error in form processing:', formError);
        }
      });
    } catch (globalError) {
      console.error('Error initializing script:', globalError);
    }
  });
})();