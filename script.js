document.addEventListener('DOMContentLoaded', function() {
    // 고객님의 배포된 웹 앱 URL을 아래 YOUR_DEPLOYED_WEB_APP_URL_HERE 부분에 정확히 붙여넣으세요.
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbyg7IXdiIqTrnr1qPCys5kOaf-GvSztcerl-D3IWTiVBipclr0b1_SA2D21nPZgXQs1/exec'; 

    const form = document.getElementById('vehicleReservationForm');
    const messageDiv = document.getElementById('message');

    // 새로운 날짜/시간 입력 필드 참조
    const departureDateInput = document.getElementById('departureDate');
    const departureHourSelect = document.getElementById('departureHour');
    const departureMinuteSelect = document.getElementById('departureMinute');
    const departureDateTimeHidden = document.getElementById('departureDateTime'); // 숨겨진 필드

    const arrivalDateInput = document.getElementById('arrivalDate');
    const arrivalHourSelect = document.getElementById('arrivalHour');
    const arrivalMinuteSelect = document.getElementById('arrivalMinute');
    const arrivalDateTimeHidden = document.getElementById('arrivalDateTime'); // 숨겨진 필드

    // Function to populate hour dropdowns (00 to 23)
    function populateHours(selectElement) {
        for (let i = 0; i < 24; i++) {
            const option = document.createElement('option');
            const hour = String(i).padStart(2, '0'); // Ensures '0' for single digits
            option.value = hour;
            option.textContent = hour + '시';
            selectElement.appendChild(option);
        }
        // Set a default value to the current hour
        const currentHour = new Date().getHours();
        selectElement.value = String(currentHour).padStart(2, '0');
    }

    // Populate hour dropdowns on page load
    populateHours(departureHourSelect);
    populateHours(arrivalHourSelect);

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    departureDateInput.value = today;
    arrivalDateInput.value = today;

    // Set default minutes to '00'
    departureMinuteSelect.value = '00';
    arrivalMinuteSelect.value = '00';


    form.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent default form submission

        messageDiv.textContent = ''; // Clear previous messages
        messageDiv.className = 'message'; // Reset styling to hide

        // Check agreement checkbox
        const agreementCheckbox = document.getElementById('agreement');
        if (!agreementCheckbox.checked) {
            messageDiv.textContent = '안내사항에 동의해야 신청할 수 있습니다.';
            messageDiv.classList.add('error');
            messageDiv.style.display = 'block';
            return; // Stop the submission
        }


        // Combine date and time inputs for departure
        const departureDate = departureDateInput.value;
        const departureHour = departureHourSelect.value;
        const departureMinute = departureMinuteSelect.value;
        // Format: YYYY-MM-DDTHH:MM:SS (e.g., 2023-10-26T09:30:00) - Apps Script expects this
        departureDateTimeHidden.value = `${departureDate}T${departureHour}:${departureMinute}:00`;

        // Combine date and time inputs for arrival
        const arrivalDate = arrivalDateInput.value;
        const arrivalHour = arrivalHourSelect.value;
        const arrivalMinute = arrivalMinuteSelect.value;
        // Format: YYYY-MM-DDTHH:MM:SS
        arrivalDateTimeHidden.value = `${arrivalDate}T${arrivalHour}:${arrivalMinute}:00`;


        // Collect form data using the form itself
        const formData = new FormData(form);
        const data = {};
        // FormData includes the hidden inputs now
        for (const [key, value] of formData.entries()) {
             // Skip the visible date/hour/minute selects, send only the combined hidden value
            if (key !== 'departureDate' && key !== 'departureHour' && key !== 'departureMinute' &&
                key !== 'arrivalDate' && key !== 'arrivalHour' && key !== 'arrivalMinute' &&
                key !== 'agreement') { // Also skip agreement checkbox data
                data[key] = value;
            }
        }


        try {
            // Send data to Apps Script Web App
            const response = await fetch(webAppUrl, { // Use the constant webAppUrl
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data).toString(),
            });

            const result = await response.json();
            messageDiv.style.display = 'block'; // Show the message div

            if (response.ok) { // Check if the HTTP status is OK (200-299)
                 if (result.status === 'success') {
                    messageDiv.textContent = result.message;
                    messageDiv.classList.add('success');
                    form.reset(); // Clear the form

                    // Reset default dates and times after form reset()
                    departureDateInput.value = today;
                    arrivalDateInput.value = today;
                    const currentHour = new Date().getHours();
                    departureHourSelect.value = String(currentHour).padStart(2, '0');
                    arrivalHourSelect.value = String(currentHour).padStart(2, '0');
                    departureMinuteSelect.value = '00';
                    arrivalMinuteSelect.value = '00';

                } else {
                    messageDiv.textContent = '오류: ' + result.message;
                    messageDiv.classList.add('error');
                }
            } else {
                 // Handle HTTP errors (e.g., 404, 500)
                 messageDiv.textContent = `서버 통신 오류: ${response.status} ${response.statusText}`;
                 messageDiv.classList.add('error');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            messageDiv.textContent = '네트워크 오류가 발생했습니다. 다시 시도해주세요.';
            messageDiv.classList.add('error');
            messageDiv.style.display = 'block'; // Show the message div
        }
    });
});