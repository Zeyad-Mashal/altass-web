// Pipedrive CRM API Integration
const PIPEDRIVE_API_TOKEN = 'd98a3da1deb5b34bee761cbd8a6d47f2c10e3f49';
const PIPEDRIVE_API_URL = 'https://api.pipedrive.com/v1/persons';

/**
 * Send lead data to Pipedrive CRM
 * @param {Object} formData - Form data object
 * @param {string} formData.fullName - Full name of the lead
 * @param {string} formData.phone - Phone number
 * @param {string} formData.carType - Car type/category
 * @param {string} formData.budget - Budget information
 * @returns {Promise<Object>} Response from Pipedrive API
 */
export const sendToPipedrive = async (formData) => {
    try {
        // Prepare the data for Pipedrive API
        // Format phone number with country code if needed (Egypt +20)
        let phoneNumber = formData.phone || '';
        if (phoneNumber && !phoneNumber.startsWith('+')) {
            // Add Egypt country code if it starts with 01
            if (phoneNumber.startsWith('01')) {
                phoneNumber = '+20' + phoneNumber;
            } else if (phoneNumber.startsWith('0')) {
                phoneNumber = '+20' + phoneNumber.substring(1);
            }
        }

        // Build organization name with car type and budget if available
        let orgName = formData.carType || 'Car Import Lead';
        if (formData.budget) {
            orgName = `${formData.carType} - Budget: ${formData.budget}`;
        }

        const pipedriveData = {
            name: formData.fullName || '',
            phone: phoneNumber,
            org_name: orgName,
        };

        // Add email if provided (optional field)
        if (formData.email) {
            pipedriveData.email = formData.email;
        }

        // Make API call to Pipedrive
        const response = await fetch(`${PIPEDRIVE_API_URL}?api_token=${PIPEDRIVE_API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pipedriveData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: data.data,
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

