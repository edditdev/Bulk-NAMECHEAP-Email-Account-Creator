async function createEmailAccounts() {
    const baseUsername = "bomber";
    const password = "HG171KL1!a@";
    const maxAccounts = 200;
    const delayMs = 8000;
    const maxLoadingRetries = 5;
    const loadingTimeoutMs = 15000;

    const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element && element.offsetParent !== null) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element ${selector} not found or not visible within ${timeout}ms`));
                } else {
                    setTimeout(checkElement, 100);
                }
            };
            checkElement();
        });
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const isLoadingPanelVisible = () => {
        const loadingPanel = document.querySelector('#createLoadingPanel');
        if (!loadingPanel) return false;
        const style = window.getComputedStyle(loadingPanel);
        return style.display !== 'none' || loadingPanel.offsetParent !== null;
    };

    const setAngularValue = (element, value) => {
        element.value = value;
        ['input', 'change', 'blur'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            element.dispatchEvent(event);
        });
        const keyEvent = new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' });
        element.dispatchEvent(keyEvent);
        console.log(`Set ${element.id} to: ${element.value}`);
    };

    const waitForXhrResponse = () => {
        return new Promise(resolve => {
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
                if (url.includes('execute/Email/add_pop')) {
                    this.addEventListener('load', function() {
                        try {
                            const response = JSON.parse(this.responseText);
                            resolve(response);
                        } catch (e) {
                            resolve({ error: 'Failed to parse XHR response' });
                        }
                    });
                }
                originalOpen.apply(this, arguments);
            };
        });
    };

    try {
        for (let i = 1; i <= maxAccounts; i++) {
            const username = `${baseUsername}${i}`;
            console.log(`Attempting to create email account ${i}/${maxAccounts}: ${username}`);

            let retries = 0;
            let formReady = false;

            while (retries < maxLoadingRetries && !formReady) {
                if (isLoadingPanelVisible()) {
                    console.log(`Loading panel is visible. Retry ${retries + 1}/${maxLoadingRetries}...`);
                    retries++;
                    await sleep(2000);
                    if (retries >= maxLoadingRetries) {
                        console.error(`Loading panel still visible after ${maxLoadingRetries} retries for ${username}. Moving to next account.`);
                        break;
                    }
                    continue;
                }

                try {
                    const usernameInput = await waitForElement('#txtUserName', loadingTimeoutMs);
                    const passwordInput = await waitForElement('#txtEmailPassword', loadingTimeoutMs);
                    const createButton = await waitForElement('#btnCreateEmailAccount', loadingTimeoutMs);

                    const warningCallout = document.querySelector('callout[callout-type="warning"]');
                    if (warningCallout && window.getComputedStyle(warningCallout).display !== 'none') {
                        console.error('Maximum number of email accounts reached. Stopping script.');
                        return;
                    }

                    if (usernameInput.value !== '' && usernameInput.value !== username) {
                        console.log(`Form not reset, current username: ${usernameInput.value}. Clearing...`);
                        usernameInput.value = '';
                        await sleep(500);
                    }

                    setAngularValue(usernameInput, username);
                    await sleep(500);
                    setAngularValue(passwordInput, password);
                    await sleep(500);

                    console.log(`Form values before submission: username=${usernameInput.value}, password=${passwordInput.value}`);

                    const stayCheckbox = document.querySelector('#stay');
                    if (stayCheckbox && !stayCheckbox.checked) {
                        stayCheckbox.click();
                        console.log(`Checked "Stay on this page"`);
                    }

                    const xhrPromise = waitForXhrResponse();
                    createButton.click();
                    console.log(`Clicked Create button for ${username}`);

                    const xhrResponse = await Promise.race([
                        xhrPromise,
                        sleep(10000).then(() => ({ error: 'XHR timeout' }))
                    ]);

                    console.log(`XHR response for ${username}:`, xhrResponse);

                    if (xhrResponse && !xhrResponse.error && xhrResponse.status === 1) {
                        console.log(`Successfully created ${username}`);
                    } else {
                        console.error(`Failed to create ${username}:`, xhrResponse.error || 'Unknown error');
                        break;
                    }

                    formReady = true;
                } catch (error) {
                    console.error(`Error accessing form elements for ${username}: ${error.message}`);
                    retries++;
                    if (retries >= maxLoadingRetries) {
                        console.error(`Failed to access form after ${maxLoadingRetries} retries for ${username}. Moving to next account.`);
                        break;
                    }
                    await sleep(2000);
                }
            }

            if (!formReady) {
                console.log(`Skipping ${username} due to persistent loading issues.`);
                continue;
            }

            await sleep(delayMs);

            const errorMessages = document.querySelectorAll('#txtUserNameErrorPanel li:not([style*="display: none"])');
            const criticalErrors = Array.from(errorMessages).filter(err => 
                err.textContent.includes('exists') || err.textContent.includes('invalid')
            );
            if (criticalErrors.length > 0) {
                console.error(`Critical error creating account ${username}:`);
                criticalErrors.forEach(err => console.error(err.textContent));
                break;
            } else {
                console.log(`No critical errors for ${username}, proceeding to next account.`);
            }

            const usernameInput = document.querySelector('#txtUserName');
            if (usernameInput && usernameInput.value !== '') {
                console.log(`Form still not reset, username field contains: ${usernameInput.value}`);
            }
        }

        console.log('Email account creation completed or stopped.');
    } catch (error) {
        console.error('Unexpected error:', error.message);
    } finally {
        if (XMLHttpRequest.prototype.open !== XMLHttpRequest.prototype.open) {
            XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.open;
        }
    }
}

createEmailAccounts();
