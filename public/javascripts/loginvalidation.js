// Function to validate the email
function validateEmail(email) {
  // Regular expression for email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Function to handle form submission
function handleSubmit(event) {
  // Prevents the form from being submitted

  // Get the email input value
  const emailInput = document.getElementById("typeEmailX");
  const email = emailInput.value;
  // Get the error element
  const emailError = document.getElementById("emailError");

  // Validate the email
  if (email === "") {
    // Email is blank
    emailError.textContent = "Email cannot be blank.";
    event.preventDefault();
    return; // Prevent further execution
  }
  if (validateEmail(email)) {
    // Email is valid
    emailError.textContent = ""; // Clear the error message
    // Perform other form submission actions
  } else {
    // Email is invalid
    emailError.textContent = "Invalid email address!";
    event.preventDefault();
    // Prevent the form from being submitted
  }

  //Validation for password input

  const passwordInput = document.getElementById("typePasswordX");
  const password = passwordInput.value;
  const passwordError = document.getElementById("passwordError");
  if (password === "") {
    passwordError.textContent = "Password cannot be blank";
    event.preventDefault();
    return;
  }
}

// Add event listener to form submit event
const form = document.getElementById("loginform");
form.addEventListener("submit", handleSubmit);
