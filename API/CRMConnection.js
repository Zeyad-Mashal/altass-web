// Pipedrive CRM API Integration
const PIPEDRIVE_API_TOKEN = 'd98a3da1deb5b34bee761cbd8a6d47f2c10e3f49';
const PIPEDRIVE_API_BASE = 'https://api.pipedrive.com/v1';
const PIPEDRIVE_PERSONS_URL = `${PIPEDRIVE_API_BASE}/persons`;
const PIPEDRIVE_LEADS_URL = `${PIPEDRIVE_API_BASE}/leads`;

/**
 * Send lead data to Pipedrive CRM
 * @param {Object} formData - Form data object
 * @param {string} formData.fullName - Full name of the lead (required)
 * @param {string} formData.phone - Phone number (required)
 * @param {string} formData.carType - Car type/category
 * @param {string} formData.budget - Budget information
 * @returns {Promise<Object>} Response from Pipedrive API
 */
export const sendToPipedrive = async (formData) => {
    try {
        // Validate required fields
        if (!formData.fullName || formData.fullName.trim() === '') {
            throw new Error('Name is required');
        }

        // Format phone number with country code (Egypt +20)
        let phoneNumber = formData.phone ? formData.phone.trim() : '';
        if (phoneNumber && !phoneNumber.startsWith('+')) {
            if (phoneNumber.startsWith('01')) {
                phoneNumber = '+20' + phoneNumber;
            } else if (phoneNumber.startsWith('0')) {
                phoneNumber = '+20' + phoneNumber.substring(1);
            }
        }

        // Step 1: Create Person with all data
        // Pipedrive Leads API requires person_id (not person_name) and doesn't accept notes
        const personData = {
            name: formData.fullName.trim(),
        };

        // Add phone to Person
        if (phoneNumber) {
            personData.phone = [{
                value: phoneNumber,
                primary: true,
                label: 'work'
            }];
        }

        console.log('Step 1: Creating Person with data:', personData);

        const personResponse = await fetch(`${PIPEDRIVE_PERSONS_URL}?api_token=${PIPEDRIVE_API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personData),
        });

        const personResponseData = await personResponse.json().catch(() => ({}));

        if (!personResponse.ok) {
            console.error('Person creation failed:', personResponseData);
            throw new Error(personResponseData.error?.message || 'Failed to create person in Pipedrive');
        }

        const personId = personResponseData.data?.id;
        if (!personId) {
            throw new Error('Person created but no ID returned');
        }

        console.log('Step 1 Success: Person created with ID:', personId);

        // Step 2: Update Person with additional info (carType, budget) using notes
        // We can add notes to the Person, not to the Lead
        if (formData.carType || formData.budget) {
            const personNotes = [];
            if (formData.carType && formData.carType.trim()) {
                personNotes.push(`Car Type: ${formData.carType.trim()}`);
            }
            if (formData.budget && formData.budget.trim()) {
                personNotes.push(`Budget: ${formData.budget.trim()}`);
            }

            if (personNotes.length > 0) {
                const updatePersonData = {
                    notes: personNotes.join('\n')
                };

                console.log('Updating Person with notes:', updatePersonData);

                const updateResponse = await fetch(`${PIPEDRIVE_PERSONS_URL}/${personId}?api_token=${PIPEDRIVE_API_TOKEN}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatePersonData),
                });

                // Don't fail if update fails, person is already created
                if (updateResponse.ok) {
                    console.log('Person notes updated successfully');
                }
            }
        }

        // Step 3: Create Lead with ONLY title and person_id (no notes allowed)
        // Build descriptive title with car type if available
        let leadTitle = formData.fullName.trim();
        if (formData.carType && formData.carType.trim()) {
            leadTitle = `${formData.carType.trim()} - ${leadTitle}`;
        }

        const leadData = {
            title: leadTitle,
            person_id: personId,  // Must be integer, not person_name
        };

        console.log('Step 2: Creating Lead (without notes - API restriction):', leadData);

        const response = await fetch(`${PIPEDRIVE_LEADS_URL}?api_token=${PIPEDRIVE_API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(leadData),
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('Lead creation failed:', responseData);
            const errorMessage = responseData.error?.message
                || JSON.stringify(responseData.error)
                || `HTTP error! status: ${response.status}`;
            throw new Error(`Failed to create lead: ${errorMessage}`);
        }

        // Success response
        console.log('Success! Lead created:', responseData);
        return {
            success: true,
            data: responseData.data,
            message: 'Lead successfully added to Pipedrive CRM'
        };
    } catch (error) {
        console.error('Pipedrive API Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send data to Pipedrive CRM'
        };
    }
};

