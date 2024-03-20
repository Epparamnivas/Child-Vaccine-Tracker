// Function to add another child input field dynamically
function addAnotherChild() {
    const childDetailsDiv = document.createElement('div');
    childDetailsDiv.classList.add('child-details');
    childDetailsDiv.innerHTML = `
        <div class="form-element">
            <label for="childName">Child's Name:</label>
            <input type="text" class="childName" name="childName[]" required>
        </div>
        <div class="form-element">
            <label for="dob">Date of Birth:</label>
            <input type="date" class="dob" name="dob[]" required>
        </div>
        <div class="form-element">
            <label for="birthplace">Birthplace:</label>
            <input type="text" class="birthplace" name="birthplace[]" required>
        </div>
        <div class="form-element">
            <label for="sex">Sex:</label>
            <select class="sex" name="sex[]" required>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </div>`;
    document.getElementById('childVaccinationForm').insertBefore(childDetailsDiv, document.querySelector('button[type="submit"]'));
};

function calculateAge() {
    // Get the input value
    const dobInput = document.getElementById('dob').value;

    // Create a Date object from the input value
    const dob = new Date(dobInput);

    // Calculate the current date
    const today = new Date();

    // Calculate the age
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    // If the current date is before the birth date
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    // Display the age
    document.getElementById('age').innerText = `Age: ${age}`;
}