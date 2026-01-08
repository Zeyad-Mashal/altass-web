// Pipedrive CRM API Integration
const PIPEDRIVE_API_TOKEN = 'd98a3da1deb5b34bee761cbd8a6d47f2c10e3f49';
const PIPEDRIVE_API_BASE = 'https://api.pipedrive.com/v1';
const PIPEDRIVE_PERSONS_URL = `${PIPEDRIVE_API_BASE}/persons`;
const PIPEDRIVE_LEADS_URL = `${PIPEDRIVE_API_BASE}/leads`;
const PIPEDRIVE_LABELS_URL = `${PIPEDRIVE_API_BASE}/leadLabels`;

/**
 * Get or create "Landing Page" label
 * @returns {Promise<number|null>} Label ID or null if failed
 */
const getOrCreateLandingPageLabel = async () => {
    try {
        // First, try to find existing label
        const searchResponse = await fetch(`${PIPEDRIVE_LABELS_URL}?api_token=${PIPEDRIVE_API_TOKEN}&term=Landing Page`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const searchData = await searchResponse.json().catch(() => ({}));

        if (searchData.success && searchData.data && searchData.data.length > 6) {
            // Use label at index 6 (7th label)
            const labelId = searchData.data[6].id;
            console.log('Found "Landing Page" label at index 6 with ID:', labelId);
            return labelId;
        } else if (searchData.success && searchData.data && searchData.data.length > 0) {
            // Fallback to index 0 if index 6 doesn't exist
            const labelId = searchData.data[0].id;
            console.log('Using label at index 0 (index 6 not available) with ID:', labelId);
            return labelId;
        }

        // Label doesn't exist, create it
        console.log('Creating new "Landing Page" label...');
        const createResponse = await fetch(`${PIPEDRIVE_LABELS_URL}?api_token=${PIPEDRIVE_API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Landing Page',
                color: '#e32a26' // Red color matching your brand
            }),
        });

        const createData = await createResponse.json().catch(() => ({}));

        if (createResponse.ok && createData.success && createData.data) {
            const labelId = createData.data.id;
            console.log('Created "Landing Page" label with ID:', labelId);
            return labelId;
        }

        console.warn('Failed to create label, continuing without label');
        return null;
    } catch (error) {
        console.error('Error getting/creating label:', error);
        return null;
    }
};

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

        // Step 3: Get or create "Landing Page" label
        const landingPageLabelId = await getOrCreateLandingPageLabel();

        // Step 4: Create Lead with title, person_id, and label
        // Build descriptive title with car type if available
        let leadTitle = formData.fullName.trim();
        if (formData.carType && formData.carType.trim()) {
            leadTitle = `${formData.carType.trim()} - ${leadTitle}`;
        }

        const leadData = {
            title: leadTitle,
            person_id: personId,  // Must be integer, not person_name
        };

        // Add label if available
        if (landingPageLabelId) {
            leadData.label_ids = [landingPageLabelId];
        }

        console.log('Step 2: Creating Lead with label:', leadData);

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

